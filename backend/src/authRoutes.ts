import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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

    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    try {
        // Step 1: Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Step 2: Save the new user to the database
        const client = await pool.connect();
        try {
            const insertQuery = `
                INSERT INTO users (username, email, password_hash)
                VALUES ($1, $2, $3)
                RETURNING id, username, email, created_at;
            `;
            const values = [username, email, password_hash];
            const result = await client.query(insertQuery, values);
            const newUser = result.rows[0];

            // Step 3: Send a success response
            // We don't send the password hash back to the client
            res.status(201).json({ 
                message: 'User created successfully!',
                user: newUser 
            });

        } catch (dbError: any) {
            // Handle potential database errors, like a duplicate username or email
            if (dbError.code === '23505') { // Unique violation error code
                return res.status(409).json({ error: 'Username or email already exists.' });
            }
            throw dbError; // Re-throw other errors
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        
        const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
        
        // Send the email
        await transport.sendMail({
            from: '"CampFinder Support" <support@campfinder.com>',
            to: email,
            subject: 'Your Password Reset Link',
            html: `<p>Please click the following link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
        });

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

export default authRoutes;