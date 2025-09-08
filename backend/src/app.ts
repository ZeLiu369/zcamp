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
    origin: 'http://localhost:3000', // The origin of your frontend app
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
      sameSite: 'lax',          // OAuth callback needs; for cross-site deployment, change to 'none' and配合 secure: true
      secure: 'auto',           // Automatically secure under HTTPS
      maxAge: 1000 * 60 * 10    // Session handshake period 10 minutes enough; you can also use 1 day
    }
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
}

bootstrap().catch(err => {
  console.error('Fatal: failed to start app:', err);
  process.exit(1);
});