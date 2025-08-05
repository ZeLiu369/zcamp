// In backend/src/apiRoutes.ts

import { Router, Request, Response } from 'express';
import axios from 'axios';

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


export default apiRoutes;