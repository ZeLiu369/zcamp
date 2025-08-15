import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

import locationRoutes from './routes/locationRoutes'; 
import authRoutes from './routes/authRoutes';
import apiRoutes from './routes/apiRoutes';
import reviewsRoutes from './routes/reviewsRoutes';
import profileRoutes from './routes/profileRoutes';
import imageRoutes from './routes/imageRoutes';


const app = express();
const port = process.env.PORT || 3002;
// --- Middlewares ---
// Enable Cross-Origin Resource Sharing so your frontend can call the backend
app.use(cors({
  origin: 'http://localhost:3000', // The origin of your frontend app
  credentials: true,
}));


app.use(cookieParser()); 
// Middleware to parse JSON bodies (though we don't need it for GET requests, it's good practice)
app.use(express.json());

// --- API Routes ---
// Tell the app to use our new router for any URL that starts with /api
app.use('/api', locationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/', imageRoutes);

// --- Server Startup ---
app.listen(port, () => {
  console.log(`Backend server is running at http://localhost:${port}`);
});