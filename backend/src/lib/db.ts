import { Pool } from 'pg';

// Create a unique database connection pool instance from environment variables
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // In production, you may also want to configure SSL
    // ssl: {
    //   rejectUnauthorized: false
    // }
});

// Listen for connection pool errors
pool.on('error', (err, client) => {
    console.error('Unexpected error in database connection pool', err);
    process.exit(-1); // Restart the application in case of severe errors
});

console.log('Database connection pool created successfully');