import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware, AuthRequest } from './middleware'; 

// Database connection configuration
const pool = new Pool({
    user: 'postgres',      
    password: 'postgres',  
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

locationRoutes.post('/locations', authMiddleware, async (req: AuthRequest, res: Response): Promise<any> => {
    const { name, longitude, latitude } = req.body;
    const userId = req.user?.id; // 我们可以从中间件附加的用户信息中获取 userId
  
    if (!name || longitude === undefined || latitude === undefined) {
      return res.status(400).json({ error: 'Name and coordinates are required.' });
    }
  
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }
  
    try {
      const client = await pool.connect();
      try {
        const insertQuery = `
          INSERT INTO locations (name, coordinates, is_user_generated, created_by_user_id)
          VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), TRUE, $4)
          RETURNING *;
        `;
        const values = [name, longitude, latitude, userId];
        const result = await client.query(insertQuery, values);
        
        res.status(201).json(result.rows[0]);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error adding new location:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

export default locationRoutes;