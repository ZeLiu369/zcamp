import { Router, Request, Response } from 'express';
import axios from 'axios';
import { Pool } from 'pg';
import { authMiddleware } from '#/middlewares/authMiddleware.js';

const pool = new Pool({
    user: 'postgres',      
    password: 'postgres', 
    host: 'localhost',
    port: 5432,
    database: 'nationparkyelp',
});

const apiRoutes = Router();

// Define the endpoint: GET /api/geocode
apiRoutes.get('/geocode', async (req: Request, res: Response): Promise<any> => {
    const { query } = req.query; // The address text from the frontend

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'A search query is required.' });
    }

    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
        return res.status(500).json({ error: 'Server configuration error: Mapbox token not found.' });
    }

    // The Mapbox Geocoding API endpoint
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;

    try {
        const response = await axios.get(url, {
            params: {
                access_token: mapboxToken,
                autocomplete: true,
                // country: 'US,CA', // Limit results to the US and Canada
                limit: 5, // Get up to 5 suggestions
            }
        });

        // Forward the features from Mapbox's response to our frontend
        res.status(200).json(response.data.features);

    } catch (error) {
        console.error("Mapbox Geocoding API error:", error);
        res.status(500).json({ error: 'Failed to fetch geocoding results.' });
    }
});


apiRoutes.get('/reverse-geocode', async (req: Request, res: Response): Promise<any> => {
    const { longitude, latitude } = req.query;
    const lon = Array.isArray(longitude) ? longitude[0] : longitude;
    const lat = Array.isArray(latitude) ? latitude[0] : latitude;

    if (!lon || !lat) {
        return res.status(400).json({ error: 'Longitude and latitude are required.' });
    }

    if (typeof lon !== 'string' || typeof lat !== 'string') {
        return res.status(400).json({ error: 'Longitude and latitude must be strings.' });
    }

    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
        return res.status(500).json({ error: 'Server configuration error: Mapbox token not found.' });
    }

    // Mapbox reverse geocoding API URL
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json`;

    try {
        const response = await axios.get(url, {
            params: {
                access_token: mapboxToken,
                types: 'address,place', // Address types we're interested in
                limit: 1 // We only need the most matching result
            }
        });

        // Forward the first result from Mapbox (most matching address) to our frontend
        if (response.data.features && response.data.features.length > 0) {
            res.status(200).json({ place_name: response.data.features[0].place_name });
        } else {
            res.status(404).json({ error: 'No address found for the given coordinates.' });
        }

    } catch (error) {
        console.error("Mapbox Reverse Geocoding API error:", error);
        res.status(500).json({ error: 'Failed to fetch reverse geocoding results.' });
    }
});


// Endpoint to get a single campground and its reviews
// GET /api/locations/:id
apiRoutes.get('/locations/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params; // Get ID from URL
  
    try {
      const client = await pool.connect();
      try {
        // This is a more advanced SQL query
        // It selects a campground from the locations table
        // and uses LEFT JOIN to include all related reviews and reviewer usernames
        // COALESCE and json_agg are powerful PostgreSQL features,
        // they can aggregate all reviews into a JSON array, even if there are no reviews
        const query = `
          SELECT
            l.id,
            l.name,
            l.osm_tags,
            l.created_by_user_id,
            ST_AsGeoJSON(l.coordinates) as coordinates,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', r.id,
                  'rating', r.rating,
                  'comment', r.comment,
                  'created_at', r.created_at,
                  'username', u.username,
                  'user_id', u.id 
                )
              ) FILTER (WHERE r.id IS NOT NULL),
              '[]'
            ) as reviews,
             (
              SELECT COALESCE(json_agg(
                json_build_object('id', i.id, 'url', i.url, 'user_id', i.user_id)
              ), '[]')
              FROM campground_images i
              WHERE i.location_id = l.id
            ) as images
          FROM
            locations l
          LEFT JOIN
            reviews r ON l.id = r.location_id
          LEFT JOIN
            users u ON r.user_id = u.id
          WHERE
            l.id = $1
          GROUP BY
            l.id;
        `;
        
        const result = await client.query(query, [id]);
  
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Location not found.' });
        }
        
        // Parse coordinates string to JSON object
        const location = result.rows[0];
        location.coordinates = JSON.parse(location.coordinates);
  
        res.status(200).json(location);
  
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error fetching location with id ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

apiRoutes.delete('/locations/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    const { id: locationId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated.' });
      return;
    }

    if (!userRole) {
      // Or handle it in a way that makes sense for your app
      res.status(403).json({ error: 'User role is missing, authorization denied.' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const locationResult = await client.query(
        'SELECT created_by_user_id FROM locations WHERE id = $1',
        [locationId]
      );

      if (locationResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: 'Location not found.' });
        return;
      }

      const creatorId = locationResult.rows[0].created_by_user_id;
      if (creatorId !== userId && userRole !== 'admin') {
        await client.query('ROLLBACK');
        res.status(403).json({ error: 'Forbidden: You are not authorized to delete this campground.' });
        return;
      }

      await client.query('DELETE FROM locations WHERE id = $1', [locationId]);
      await client.query('COMMIT');
      res.status(200).json({ message: 'Campground deleted successfully.' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting location:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  });

apiRoutes.put('/locations/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    const { id: locationId } = req.params;
    const { name, latitude, longitude } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!name || latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'Name and coordinates are required.' });
      return;
    }
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated.' });
      return;
    }

    if (!userRole) {
      // Or handle it in a way that makes sense for your app
      res.status(403).json({ error: 'User role is missing, authorization denied.' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const locationResult = await client.query(
        'SELECT created_by_user_id FROM locations WHERE id = $1',
        [locationId]
      );

      if (locationResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: 'Location not found.' });
        return;
      }

      const creatorId = locationResult.rows[0].created_by_user_id;

      if (creatorId !== userId && userRole !== 'admin') {
        await client.query('ROLLBACK');
        res.status(403).json({ error: 'Forbidden: You are not authorized to edit this campground.' });
        return;
      }

      const updateQuery = `
        UPDATE locations 
        SET name = $1, coordinates = ST_SetSRID(ST_MakePoint($2, $3), 4326), updated_at = NOW()
        WHERE id = $4
        RETURNING *;
      `;
      const result = await client.query(updateQuery, [name, longitude, latitude, locationId]);

      await client.query('COMMIT');
      res.status(200).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating location:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  });


export default apiRoutes;