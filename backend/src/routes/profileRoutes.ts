import { Router, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware, AuthRequest } from '#/middlewares/authMiddleware.js';

const router = Router();
const pool = new Pool({
    user: 'postgres',     
    password: 'postgres',  
    host: 'localhost',
    port: 5432,
    database: 'nationparkyelp',
});

// GET /api/profile/me - Get the logged-in user's profile data
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<any> => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated.' });
    }

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

export default router;