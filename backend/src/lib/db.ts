import { Pool } from 'pg';

// Create a unique database connection pool instance from environment variables
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Enable SSL in production
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

// Listen for connection pool errors
pool.on('error', (err, _client) => {
    console.error('Unexpected error in database connection pool', err);
    process.exit(-1); // Restart the application in case of severe errors
});

console.log('Database connection pool created successfully');