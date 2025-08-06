import { Router, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware, AuthRequest } from './middleware';

const router = Router();

const pool = new Pool({
    user: 'postgres',      
    password: 'postgres', 
    host: 'localhost',
    port: 5432,
    database: 'nationparkyelp',
});

// POST /api/reviews - Create a new review
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<any> => {
    const { rating, comment, locationId } = req.body;
    const userId = req.user?.id;

    if (!rating || !locationId) {
        return res.status(400).json({ error: 'Rating and locationId are required.' });
    }
    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated.' });
    }

    try {
        const client = await pool.connect();
        try {
            const query = `
                INSERT INTO reviews (rating, comment, user_id, location_id)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;
            const values = [rating, comment, userId, locationId];
            const result = await client.query(query, values);

            res.status(201).json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error: any) {
        // Handle the unique constraint error (user already reviewed this location)
        if (error.code === '23505') {
            return res.status(409).json({ error: 'You have already reviewed this location.' });
        }
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;