import { Router, Request,Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '#app/middlewares/authMiddleware.js';
import bcrypt from 'bcryptjs';

const router = Router();
// const pool = new Pool({
//     user: 'postgres',     
//     password: 'postgres',  
//     host: 'localhost',
//     port: 5432,
//     database: 'nationparkyelp',
//     ssl: process.env.NODE_ENV === 'production' ? {
//         rejectUnauthorized: false
//     } : false
// });


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false
    });

    
    
// GET /api/profile/me - Get the logged-in user's profile data
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<any> => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated.' });
    }

    console.log("====================================");
    console.log("SERVER-SIDE SESSION DATA:");
    console.dir(req.session, { depth: null }); // 使用 console.dir 可以更好地显示对象结构
    console.log("====================================");

    try {
        const client = await pool.connect();
        try {
            // A query to get user details, their created locations, and their reviews
            const query = `
                SELECT
                    u.id,
                    u.username,
                    u.email,
                    u.created_at,
                    u.role,
                    (
                        SELECT COALESCE(json_agg(l.*), '[]')
                        FROM locations l
                        WHERE l.created_by_user_id = u.id
                    ) as created_locations,
                    (
                        SELECT COALESCE(json_agg(r.*), '[]')
                        FROM reviews r
                        WHERE r.user_id = u.id
                    ) as user_reviews
                FROM
                    users u
                WHERE
                    u.id = $1
                GROUP BY
                    u.id;
            `;
            const result = await client.query(query, [userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found.' });
            }

            res.status(200).json(result.rows[0]);

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// In backend/src/profileRoutes.ts

// ... other imports and the GET /me route ...

// DELETE /api/profile/me - Delete the logged-in user's account
router.delete('/me', authMiddleware, async (req: Request, res: Response): Promise<any> => {
    const userId = req.user?.id;
    const { password } = req.body; // The user must provide their password to confirm

    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated.' });
    }
    if (!password) {
        return res.status(400).json({ error: 'Password is required for account deletion.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Fetch the user's current password hash from the database
        const userResult = await client.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found.' });
        }
        const storedHash = userResult.rows[0].password_hash;

        // 2. Verify the provided password against the stored hash
        const isMatch = await bcrypt.compare(password, storedHash);
        if (!isMatch) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Incorrect password.' });
        }

        // 3. If password is correct, delete the user from the 'users' table
        // Our CASCADE rules will handle deleting their reviews and images automatically.
        await client.query('DELETE FROM users WHERE id = $1', [userId]);

        await client.query('COMMIT');

        // 4. Clear the authentication cookie
        res.cookie('authToken', '', {
            httpOnly: true,
            expires: new Date(0),
        });

        res.status(200).json({ message: 'Account deleted successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

export default router;