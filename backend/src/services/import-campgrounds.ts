// In src/import-campgrounds.ts

import axios from 'axios';
import { Pool } from 'pg';

// The Overpass query we built and tested
const OVERPASS_QUERY = `
[out:json][timeout:300];
area["name"="Canada"][admin_level=2]->.searchArea;
(
  node["tourism"="camp_site"]["name"]["backcountry"!="yes"](area.searchArea);
  way["tourism"="camp_site"]["name"]["backcountry"!="yes"](area.searchArea);
  relation["tourism"="camp_site"]["name"]["backcountry"!="yes"](area.searchArea);
);
out center;
`;

// Database connection configuration
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

async function importData() {
    console.log("Querying Overpass API for campground data... This may take a moment.");

    try {
        const response = await axios.post("https://overpass-api.de/api/interpreter", OVERPASS_QUERY, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const elements = response.data.elements || [];
        console.log(`Found ${elements.length} potential campgrounds.`);

        const client = await pool.connect();

        try {
            for (const element of elements) {
                if (element.tags && element.tags.name) {
                    const osm_id = element.id;
                    const osm_type = element.type;
                    const name = element.tags.name;
                    const tags = element.tags;

                    let lat, lon;
                    if (element.center) {
                        lat = element.center.lat;
                        lon = element.center.lon;
                    } else {
                        lat = element.lat;
                        lon = element.lon;
                    }

                    if (lat === undefined || lon === undefined) {
                        continue;
                    }

                    // The parameterized SQL query to prevent SQL injection
                    // We use ON CONFLICT to avoid creating duplicate entries
                    const insertQuery = `
                        INSERT INTO locations (osm_id, osm_type, name, coordinates, osm_tags, is_user_generated)
                        VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, FALSE)
                        ON CONFLICT (osm_id, osm_type) DO NOTHING;
                    `;
                    
                    const values = [osm_id, osm_type, name, lon, lat, tags];
                    await client.query(insertQuery, values);
                    console.log(`Processed: ${name}`);
                }
            }
        } finally {
            // Release the client back to the pool
            client.release();
        }

        console.log("\x1b[32m%s\x1b[0m", "Import process complete."); // Green text for success

    } catch (error) {
        console.error("\x1b[31m%s\x1b[0m", "An error occurred during the import process:"); // Red text for error
        if (axios.isAxiosError(error)) {
            console.error("Axios error:", error.message);
            if (error.response) {
                console.error("Response data:", error.response.data);
            }
        } else {
            console.error("Unknown error:", error);
        }
    } finally {
        // Close the database connection pool
        await pool.end();
    }
}

importData();