import { Router, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware, AuthRequest } from './middleware';

const reviewRoutes = Router();

const pool = new Pool({
    user: 'postgres',      
    password: 'postgres', 
    host: 'localhost',
    port: 5432,
    database: 'nationparkyelp',
});

// POST /api/reviews - Create a new review
reviewRoutes.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<any> => {
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

reviewRoutes.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<any> => {
    const { id: reviewId } = req.params; // The ID of the review to delete
    const userId = req.user?.id;         // The ID of the user making the request

    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // First, find the review to ensure it exists and get its original author's ID
        const reviewResult = await client.query('SELECT user_id FROM reviews WHERE id = $1', [reviewId]);
        
        if (reviewResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Review not found.' });
        }

        const authorId = reviewResult.rows[0].user_id;

        // SECURITY CHECK: Ensure the person deleting is the person who wrote it
        if (authorId !== userId) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Forbidden: You are not authorized to delete this review.' });
        }

        // If the check passes, delete the review
        await client.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

        await client.query('COMMIT');

        res.status(200).json({ message: 'Review deleted successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

export default reviewRoutes;