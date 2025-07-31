import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

// Database connection configuration
const pool = new Pool({
    user: 'postgres',      // <-- PUT YOUR USERNAME HERE
    password: 'postgres',  // <-- PUT YOUR PASSWORD HERE
    host: 'localhost',
    port: 5432,
    database: 'nationparkyelp',
});

const locationRoutes = Router();

// Define the API endpoint: GET /api/locations
locationRoutes.get('/locations', async (req: Request, res: Response) => {
    try {
        const client = await pool.connect();
        try {
            // This query gets all locations from your database
            const result = await client.query('SELECT id, name, ST_AsText(coordinates) as coords FROM locations');
            // Send the results back as a JSON response
            res.status(200).json(result.rows);
        } finally {
            // Release the database client back to the pool
            client.release();
        }
    } catch (error) {
        console.error('Error querying locations', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default locationRoutes;