import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import '#/services/passport-setup.js'; // IMPORTANT: Import the setup file

import locationRoutes from '#/routes/locationRoutes.js'; 
import authRoutes from '#/routes/authRoutes.js';
import apiRoutes from '#/routes/apiRoutes.js';
import reviewsRoutes from '#/routes/reviewsRoutes.js';
import profileRoutes from '#/routes/profileRoutes.js';
import imageRoutes from '#/routes/imageRoutes.js';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check for the required environment variable
if (!process.env.SESSION_SECRET) {
  console.error("Fatal Error: SESSION_SECRET is not defined in the environment variables.");
  process.exit(1); // Exit the process with an error code
}

const app = express();
const port = process.env.PORT || 3002;

app.use(helmet());
// --- Middlewares ---
// Enable Cross-Origin Resource Sharing so your frontend can call the backend
app.use(cors({
  origin: 'http://localhost:3000', // The origin of your frontend app
  credentials: true,
}));


app.use(cookieParser()); 
// Middleware to parse JSON bodies 
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

app.use((req, res, next) => {
  // print the current session content when each request arrives
  console.log("====================================");
  console.log(`[${new Date().toLocaleTimeString()}] Request to ${req.path}`);
  console.log("--- Current Session State ---");
  console.dir(req.session, { depth: null });
  console.log("-----------------------------\n");
  next();
});
app.use(passport.initialize());
app.use(passport.session());

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