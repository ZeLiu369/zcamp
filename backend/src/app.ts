import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import '#app/services/passport-setup.js'; // IMPORTANT: Import the setup file

import locationRoutes from '#app/routes/locationRoutes.js'; 
import authRoutes from '#app/routes/authRoutes.js';
import apiRoutes from '#app/routes/apiRoutes.js';
import reviewsRoutes from '#app/routes/reviewsRoutes.js';
import profileRoutes from '#app/routes/profileRoutes.js';
import imageRoutes from '#app/routes/imageRoutes.js';
import helmet from 'helmet';

import { createClient as createRedisClient } from 'redis'
import { RedisStore } from "connect-redis";

const sessionSecret = getRequiredEnv('SESSION_SECRET');
const redisUrl = getRequiredEnv('REDIS_URL');
const redisClient = createRedisClient({ url: redisUrl });

redisClient.on('error', (err) => console.error('[redis] error:', err));
process.on('SIGINT', async () => { await redisClient.quit(); process.exit(0); });
process.on('SIGTERM', async () => { await redisClient.quit(); process.exit(0); });

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

async function bootstrap() {
  await redisClient.connect();
  const app = express();
  const port = process.env.PORT || 3002;

  app.use(helmet());

  app.set('trust proxy', 1);
  // --- Middlewares ---
  // Enable Cross-Origin Resource Sharing so your frontend can call the backend

  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : 'http://localhost:3000',
    credentials: true,
  }));


  app.use(cookieParser()); 
  // Middleware to parse JSON bodies 
  app.use(express.json());


  // 2. Initialize RedisStore
  const redisStore = new RedisStore({
    client: redisClient,
    prefix: "zcamp:session:", // The prefix of the key in Redis, for easy management
    disableTouch: true
  });

  app.use(session({
    name: 'sid',                // Custom cookie name, avoid default connect.sid
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,   // Only create session when needed
    store: redisStore, 
    cookie: {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',          // OAuth callback needs; for cross-site deployment, change to 'none' and配合 secure: true
      secure: process.env.NODE_ENV === 'production',           // Automatically secure under HTTPS
      maxAge: 1000 * 60 * 10    // Session handshake period 10 minutes enough; you can also use 1 day
    }
  }));


  // Only log session details in development
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, _res, next) => {
      console.log("====================================");
      console.log(`[${new Date().toLocaleTimeString()}] Request to ${req.path}`);
      console.log("--- Current Session State ---");
      console.dir(req.session, { depth: null });
      console.log("-----------------------------\n");
      next();
    });
  }

  app.use(passport.initialize());
  app.use(passport.session());

  // Health check endpoint to prevent cold starts
  app.get('/health', (_req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

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
    console.log(`Backend server is running! 🚀`);
  });
}

bootstrap().catch(err => {
  console.error('Fatal: failed to start app:', err);
  process.exit(1);
});