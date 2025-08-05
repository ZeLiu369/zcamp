// In backend/src/apiRoutes.ts

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { Pool } from 'pg';

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
                country: 'US,CA', // Limit results to the US and Canada
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

    if (!longitude || !latitude) {
        return res.status(400).json({ error: 'Longitude and latitude are required.' });
    }

    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
        return res.status(500).json({ error: 'Server configuration error: Mapbox token not found.' });
    }

    // Mapbox 反向地理编码 API 的 URL
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`;

    try {
        const response = await axios.get(url, {
            params: {
                access_token: mapboxToken,
                types: 'address,place', // 我们感兴趣的地址类型
                limit: 1 // 我们只需要最匹配的一个结果
            }
        });

        // 将 Mapbox 返回的第一个结果（最匹配的地址）转发给我们的前端
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


// 新增：获取单个露营地及其评论的终点
// GET /api/locations/:id
apiRoutes.get('/locations/:id', async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params; // 从 URL 中获取 ID
  
    try {
      const client = await pool.connect();
      try {
        // 这是一个更高级的 SQL 查询
        // 它从 locations 表中选择一个露营地
        // 并且使用 LEFT JOIN 来包含所有相关的评论和评论者的用户名
        // COALESCE 和 json_agg 是 PostgreSQL 的强大功能，
        // 它们可以将所有评论聚合成一个 JSON 数组，即使没有评论也是如此
        const query = `
          SELECT
            l.id,
            l.name,
            l.osm_tags,
            ST_AsGeoJSON(l.coordinates) as coordinates,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', r.id,
                  'rating', r.rating,
                  'comment', r.comment,
                  'created_at', r.created_at,
                  'username', u.username
                )
              ) FILTER (WHERE r.id IS NOT NULL),
              '[]'
            ) as reviews
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
        
        // 解析 coordinates 字符串为 JSON 对象
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

export default apiRoutes;