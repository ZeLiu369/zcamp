import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Re-using the same pool configuration
const pool = new Pool({
    user: 'postgres',      // <-- PUT YOUR USERNAME HERE
    password: 'postgres',  // <-- PUT YOUR PASSWORD HERE
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
                { expiresIn: '7d' }, // Token expires in 1 hour
                (err, token) => {
                    if (err) throw err;
                    // Step 5: Send the token back to the client
                    res.status(200).json({ token });
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

export default authRoutes;