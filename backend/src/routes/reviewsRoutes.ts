import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '#app/middlewares/authMiddleware.js';

const reviewRoutes = Router();

const pool = new Pool({
    user: 'postgres',      
    password: 'postgres', 
    host: 'localhost',
    port: 5432,
    database: 'nationparkyelp',
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

// POST /api/reviews - Create a new review
reviewRoutes.post('/', authMiddleware, async (req: Request, res: Response): Promise<any> => {
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

reviewRoutes.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
    const { id: reviewId } = req.params; // The ID of the review to delete
    const userId = req.user?.id;         // The ID of the user making the request
    const userRole = req.user?.role; 

    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated.' });
    }
    if (!userRole) {
        // Or handle it in a way that makes sense for your app
        return res.status(403).json({ error: 'User role is missing, authorization denied.' });
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
        if (authorId !== userId && userRole !== 'admin') {
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


reviewRoutes.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
    const { id: reviewId } = req.params;      // The ID of the review to edit
    const { rating, comment } = req.body;   // The new data from the form
    const userId = req.user?.id;              // The ID of the user making the request

    if (!rating) {
        return res.status(400).json({ error: 'Rating is required.' });
    }
    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // First, find the review to ensure it exists and was written by this user
        const reviewResult = await client.query('SELECT user_id FROM reviews WHERE id = $1', [reviewId]);
        if (reviewResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Review not found.' });
        }

        // SECURITY CHECK: Ensure the person editing is the original author
        if (reviewResult.rows[0].user_id !== userId) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Forbidden: You are not authorized to edit this review.' });
        }

        // If the check passes, update the review with the new data
        const updateQuery = `
            UPDATE reviews 
            SET rating = $1, comment = $2, updated_at = NOW() 
            WHERE id = $3 
            RETURNING *;
        `;
        const result = await client.query(updateQuery, [rating, comment, reviewId]);

        await client.query('COMMIT');

        res.status(200).json(result.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating review:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

export default reviewRoutes;