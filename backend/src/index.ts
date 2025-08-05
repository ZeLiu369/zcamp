import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import locationRoutes from './locationRoutes'; 
import authRoutes from './authRoutes';
import apiRoutes from './apiRoutes';

const app = express();
const port = 3002;

// --- Middlewares ---
// Enable Cross-Origin Resource Sharing so your frontend can call the backend
app.use(cors()); 

// Middleware to parse JSON bodies (though we don't need it for GET requests, it's good practice)
app.use(express.json());

// --- API Routes ---
// Tell the app to use our new router for any URL that starts with /api
app.use('/api', locationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// --- Server Startup ---
app.listen(port, () => {
  console.log(`Backend server is running at http://localhost:${port}`);
});