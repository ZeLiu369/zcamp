import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { emailService } from '#/services/emailService.js'; 
import passport from 'passport';

// Re-using the same pool configuration
const pool = new Pool({
    user: 'postgres',      
    password: 'postgres',  
    host: 'localhost',
    port: 5432,
    database: 'nationparkyelp',
});
const authRoutes = Router();

// Define the API endpoint: POST /api/auth/register
authRoutes.post('/register', async (req: Request, res: Response): Promise<any> => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    if (password.length > 20) {
        return res.status(400).json({ error: 'Password must be less than 20 characters long.' });
    }

    const client = await pool.connect();
    try {
        // 1. Check if the username is already taken
        const existingUser = await client.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'This username is already taken. Please choose another.' });
        }

        // 2. Check if the email is already registered
        const existingEmail = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingEmail.rows.length > 0) {
            return res.status(409).json({ error: 'This email address is already registered.' });
        }

        await client.query('BEGIN');

        // Step 1: Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Step 2: Generate a verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiresAt = new Date(Date.now() + 24 * 3600000); // Expires in 24 hours

        // Step 3: Save the new user to the database with the token
        const insertQuery = `
            INSERT INTO users (username, email, password_hash, verification_token, verification_token_expires_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, username, email;
        `;
        const values = [username, email, password_hash, verificationToken, verificationTokenExpiresAt];
        const result = await client.query(insertQuery, values);
        const newUser = result.rows[0];

        // Step 4: Send the verification email
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        await emailService.sendEmail({
            to: email,
            subject: 'Verify Your Email for CampFinder',
            html: `<p>Welcome to CampFinder! Please click the link below to verify your email address:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`,
        });

        await client.query('COMMIT');

        // Step 5: Send a success response
        res.status(201).json({ 
            message: 'User created successfully! Please check your email to verify your account.',
            user: newUser 
        });

    } catch (dbError: any) {
        await client.query('ROLLBACK');
        if (dbError.code === '23505') {
            return res.status(409).json({ error: 'Username or email already exists.' });
        }
        console.error('Error during registration:', dbError);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});



authRoutes.post('/login', async (req: Request, res: Response): Promise<any> => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const client = await pool.connect();
        try {
            // Step 1: Find the user by their email
            const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
            const user = result.rows[0];

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials.Either email or password is incorrect.' }); // Use a generic error
            }

            // Step 2: Compare the submitted password with the stored hash
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials.Either email or password is incorrect.' }); // Use a generic error
            }

            // Step 3: If passwords match, create a JWT payload
            const payload = {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role // admin or user
                },
            };
            
            // Step 4: Sign the token with your secret key
            jwt.sign(
                payload,
                process.env.JWT_SECRET as string,
                { expiresIn: '7d' }, // Token expires in 7 days
                    (err, token) => {
                        if (err) throw err;
                        // Set a secure, HttpOnly cookie
                        res.cookie('authToken', token, {
                        httpOnly: true, // Inaccessible to JavaScript
                        secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
                        sameSite: 'lax', // Helps mitigate CSRF attacks
                        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
                    });
                // Send a success response without the token in the body
                res.status(200).json({ message: 'Login successful' });
                }
            );
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

authRoutes.post('/logout', (req: Request, res: Response):void => {
    // Clear the cookie by setting its expiration date to the past
    res.cookie('authToken', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logout successful.' });
});


authRoutes.post('/forgot-password', async (req: Request, res: Response): Promise<any> => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    const client = await pool.connect();
    try {
        // --- TRANSACTION START ---
        await client.query('BEGIN');

        // Check if user exists
        const userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            // We don't want to reveal if an email exists or not for security reasons
            return res.status(200).json({ message: 'If a user with that email exists, a reset link has been sent.' });
        }

        // Generate a secure token
        const resetToken = crypto.randomBytes(32).toString('hex');
        // Hash the token to store in the database
        const token_hash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expires_at = new Date(Date.now() + 3600000); // Token expires in 1 hour

        // Step 1: Delete any old, unused tokens for this user.
        await client.query('DELETE FROM password_reset_tokens WHERE email = $1', [email]);

        // Store token in the database
        await client.query(
            'INSERT INTO password_reset_tokens (email, token_hash, expires_at) VALUES ($1, $2, $3)',
            [email, token_hash, expires_at]
        );

        await client.query('COMMIT');

        // Configure email transport using Mailtrap credentials from .env
        const transport = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT),
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
        
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        await emailService.sendPasswordResetEmail(email, resetLink);

        res.status(200).json({ message: 'If a user with that email exists, a reset link has been sent.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});


authRoutes.post('/reset-password', async (req: Request, res: Response): Promise<any> => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    if (newPassword.length > 20) {
        return res.status(400).json({ error: 'Password must be less than 20 characters long.' });
    }


    // Hash the incoming token so we can find it in the database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Start transaction

        // Find the token in the database and ensure it has not expired
        const tokenResult = await client.query(
            'SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW()',
            [hashedToken]
        );

        const resetRequest = tokenResult.rows[0];
        if (!resetRequest) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Token is invalid or has expired.' });
        }

        const { email } = resetRequest;

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        // Update the user's password in the main users table
        await client.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2',
            [password_hash, email]
        );

        // Invalidate the token by deleting it so it cannot be used again
        await client.query('DELETE FROM password_reset_tokens WHERE email = $1', [email]);
        
        await client.query('COMMIT'); // Commit all changes

        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

authRoutes.post('/verify-email', async (req: Request, res: Response): Promise<any> => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Verification token is required.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Find a user with a matching, non-expired verification token
        const userResult = await client.query(
            'SELECT * FROM users WHERE verification_token = $1 AND verification_token_expires_at > NOW()',
            [token]
        );

        const user = userResult.rows[0];
        if (!user) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Token is invalid or has expired.' });
        }

        // If token is valid, update the user to be verified and clear the token
        await client.query(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL, verification_token_expires_at = NULL WHERE id = $1',
            [user.id]
        );
        
        await client.query('COMMIT');

        res.status(200).json({ message: 'Email verified successfully. You can now log in.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});


// The route to start the Google authentication process
authRoutes.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// The route Google redirects back to
authRoutes.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    const user = req.user as any;

    console.log('query.state =', req.query.state);
    console.log('session bag =', req.session && req.session['oauth2:state' as keyof typeof req.session]);
    
    // Create a JWT for our user
    const payload = { user: { id: user.id, username: user.username, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });

    // Set the cookie
    res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600000
    });

    req.logout((err) => {
        if (err) {
            console.error("Error logging out from passport session:", err);
        }

        const sidName = process.env.NODE_ENV === 'production' ? '__Host-sid' : 'sid';

        // 2. destroy the entire express-session
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
            }
            res.clearCookie(sidName, {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production'
              });
            // 3. redirect to the frontend after all cleanup is done
            res.redirect(process.env.FRONTEND_URL ||  'http://localhost:3000');
        });
    });
  }
);


// start login (optional: same as Google route)
authRoutes.get('/twitter',
    passport.authenticate('twitter', {
      // only the minimum set for login; need to add 'offline.access' for refresh token
      scope: ['users.read', 'tweet.read']
    })
  );
  
  // same as Google route
  authRoutes.get('/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/login' }),
    (req, res) => {
      // Successful authentication
      const user = req.user as any;
  
      console.log('query.state =', req.query.state);
      console.log('session bag =', req.session && req.session['oauth2:state' as keyof typeof req.session]);
  
      // Create a JWT for our user
      const payload = { user: { id: user.id, username: user.username, role: user.role } };
      const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });
  
      // Set the cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600000
      });
  
      // same as Google route
      req.logout((err) => {
        if (err) {
          console.error('Error logging out from passport session:', err);
        }
  
        const sidName = process.env.NODE_ENV === 'production' ? '__Host-sid' : 'sid';
  
        req.session.destroy((err) => {
          if (err) {
            console.error('Error destroying session:', err);
          }
          res.clearCookie(sidName, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
          });
          res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
        });
      });
    }
  );

// GitHub authentication routes
authRoutes.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

authRoutes.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    const user = req.user as any;

    console.log('GitHub auth successful for user:', user.username);
    
    // Create a JWT for our user
    const payload = { user: { id: user.id, username: user.username, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });

    // Set the cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000
    });

    // Clean up passport session and redirect
    req.logout((err) => {
      if (err) {
        console.error('Error logging out from passport session:', err);
      }

      const sidName = process.env.NODE_ENV === 'production' ? '__Host-sid' : 'sid';

      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
        }
        res.clearCookie(sidName, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        });
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
      });
    });
  }
);
  
export default authRoutes;