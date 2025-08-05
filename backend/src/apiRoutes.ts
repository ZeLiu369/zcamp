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

export default apiRoutes;