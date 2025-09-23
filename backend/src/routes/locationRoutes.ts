import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '#app/middlewares/authMiddleware.js'; 

// // Database connection configuration
// const pool = new Pool({
//     user: 'postgres',      
//     password: 'postgres',  
//     host: 'localhost',
//     port: 5432,
//     database: 'nationparkyelp',
//     ssl: process.env.NODE_ENV === 'production' ? {
//       rejectUnauthorized: false
//   } : false
// });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false
      } : false
  });
  

const locationRoutes = Router();

// Define the API endpoint: GET /api/locations
// GET /api/locations - Get all locations with extra preview data
locationRoutes.get('/locations', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  try {
      const client = await pool.connect();
      try {
          // Optimized query with better performance hints
          const query = `
              SELECT
                  l.id,
                  l.name,
                  ST_AsText(l.coordinates) as coords,
                  -- Use LEFT JOIN for better performance than subqueries
                  COALESCE(avg_ratings.avg_rating, NULL) as avg_rating,
                  COALESCE(first_images.image_url, NULL) as image_url
              FROM
                  locations l
              LEFT JOIN (
                  SELECT 
                      location_id, 
                      AVG(rating) as avg_rating
                  FROM reviews 
                  GROUP BY location_id
              ) avg_ratings ON l.id = avg_ratings.location_id
              LEFT JOIN (
                  SELECT DISTINCT ON (location_id)
                      location_id,
                      url as image_url
                  FROM campground_images
                  ORDER BY location_id, created_at ASC
              ) first_images ON l.id = first_images.location_id
              ORDER BY l.name;
          `;
          
          const result = await client.query(query);
          const queryTime = Date.now() - startTime;
          
          console.log(`Locations query completed in ${queryTime}ms, returned ${result.rows.length} locations`);
          
          // Add cache headers for better performance
          res.set({
            'Cache-Control': 'public, max-age=300', // 5 minutes cache
            'X-Query-Time': `${queryTime}ms`
          });
          
          res.status(200).json(result.rows);
      } finally {
          client.release();
      }
  } catch (error) {
      const queryTime = Date.now() - startTime;
      console.error(`Error querying locations after ${queryTime}ms:`, error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch campground locations. Please try again.'
      });
  }
});

locationRoutes.post('/locations', authMiddleware, async (req: Request, res: Response): Promise<any> => {
    const { name, longitude, latitude } = req.body;
    const userId = req.user?.id; // We can get userId from user information attached by middleware
  
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