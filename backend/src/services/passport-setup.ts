// In backend/src/passport-setup.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as TwitterStrategy } from '@superfaceai/passport-twitter-oauth2'
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
 });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    callbackURL: "/api/auth/google/callback",
    state : true,
    pkce: true,
},
async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
    const client = await pool.connect();
    try {
        // Check if user already exists with this Google ID
        let userResult = await client.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);
        
        if (userResult.rows.length > 0) {
            return done(null, userResult.rows[0]);
        }

        // If not, check if they exist by email
        const emailObj = profile.emails?.[0];
        const email = emailObj?.value?.toLowerCase();
        const verified = emailObj?.verified === true;
        if (email && verified) {
            userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
            if (userResult.rows.length > 0) {
                // If user exists by email, link their Google ID
                const existingUser = userResult.rows[0];
                await client.query('UPDATE users SET google_id = $1 WHERE email = $2', [profile.id, email]);
                return done(null, existingUser);
            }
        }
        
        // If user doesn't exist at all, create a new user
        let username = profile.displayName || `google_${profile.id.slice(-6)}`;
        
        // Ensure username is unique by checking and modifying if necessary
        let counter = 1;
        let originalUsername = username;
        while (true) {
          const existingUser = await client.query('SELECT * FROM users WHERE username = $1', [username]);
          if (existingUser.rows.length === 0) {
            break; // Username is available
          }
          username = `${originalUsername}_${counter}`;
          counter++;
        }
        
        const newUserResult = await client.query(
            'INSERT INTO users (username, email, google_id) VALUES ($1, $2, $3) RETURNING *',
            [username, email, profile.id]
        );
        return done(null, newUserResult.rows[0]);

    } catch (err) {
        return done(err, false);
    } finally {
        client.release();
    }
}));


passport.use(new TwitterStrategy(
  {
    clientID: process.env.TWITTER_CLIENT_ID as string,
    clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
    callbackURL: "/api/auth/twitter/callback", // absolute URL
    state: true,                  // prevent CSRF
    clientType: 'confidential', 
    scope: ['users.read']         // only the minimum set for login; need to add 'offline.access' for refresh token
  },
  async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
    const client = await pool.connect();
    try {
      // 1) first hit by twitter_id
      let userResult = await client.query('SELECT * FROM users WHERE twitter_id = $1', [profile.id]);
      if (userResult.rows.length > 0) {
        return done(null, userResult.rows[0]);
      }

      // 2) email is optional, may not exist; if exists, can be used as a secondary match
      const email = profile.emails?.[0]?.value?.toLowerCase() || null;

      if (email) {
        userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length > 0) {
          const existing = userResult.rows[0];
          await client.query('UPDATE users SET twitter_id = $1 WHERE id = $2 AND twitter_id IS NULL', [profile.id, existing.id]);
          return done(null, existing);
        }
      }

      if (email) {
        userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length) {
          const u = userResult.rows[0];
          await client.query('UPDATE users SET twitter_id = $1 WHERE id = $2 AND twitter_id IS NULL', [profile.id, u.id]);
          return done(null, u);
        }
      }
  

      // 3) if not, create a new user
      let username =
      profile.displayName ||
      profile.username || 
      `tw_${profile.id.slice(-6)}`;

      // Ensure username is unique by checking and modifying if necessary
      let counter = 1;
      let originalUsername = username;
      while (true) {
        const existingUser = await client.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length === 0) {
          break; // Username is available
        }
        username = `${originalUsername}_${counter}`;
        counter++;
      }

      const newUser = await client.query(
        'INSERT INTO users (username, email, twitter_id) VALUES ($1, $2, $3) RETURNING *',
        [username, email, profile.id]
      );
      return done(null, newUser.rows[0]);

    } catch (err) {
      return done(err, false);
    } finally {
      client.release();
    }
  }
));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID as string,
  clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
  callbackURL: "/api/auth/github/callback"
},
async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
  const client = await pool.connect();
  try {
    // Check if user already exists with this GitHub ID
    let userResult = await client.query('SELECT * FROM users WHERE github_id = $1', [profile.id]);
    
    if (userResult.rows.length > 0) {
      return done(null, userResult.rows[0]);
    }

    // If not, check if they exist by email
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (email) {
      userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userResult.rows.length > 0) {
        // If user exists by email, link their GitHub ID
        const existingUser = userResult.rows[0];
        await client.query('UPDATE users SET github_id = $1 WHERE email = $2', [profile.id, email]);
        return done(null, existingUser);
      }
    }
    
    // If user doesn't exist at all, create a new user
    let username = profile.displayName || profile.username || `gh_${profile.id.slice(-6)}`;
    
    // Ensure username is unique by checking and modifying if necessary
    let counter = 1;
    let originalUsername = username;
    while (true) {
      const existingUser = await client.query('SELECT * FROM users WHERE username = $1', [username]);
      if (existingUser.rows.length === 0) {
        break; // Username is available
      }
      username = `${originalUsername}_${counter}`;
      counter++;
    }
    
    const newUserResult = await client.query(
      'INSERT INTO users (username, email, github_id) VALUES ($1, $2, $3) RETURNING *',
      [username, email, profile.id]
    );
    return done(null, newUserResult.rows[0]);

  } catch (err) {
    return done(err, false);
  } finally {
    client.release();
  }
}));


// get user_id by user profile, and then store it in the session
passport.serializeUser((user: any, done) => {
    console.log("====================================");
    console.log("serializeUser:");
    console.dir(user.id, { depth: null }); // 使用 console.dir 可以更好地显示对象结构
    console.log("====================================");
    // the first parameter: error message to display, the second parameter: if success, the result to return
    done(null, user.id);
});

// called when session is existed,if user is logged in, get user profile by user_id
// attach user profile to the req.user object
passport.deserializeUser(async (id: string, done) => {
    const client = await pool.connect();
    try {
        const userResult = await client.query('SELECT * FROM users WHERE id = $1', [id]);
        console.log("====================================");
        console.log("userResult:");
        console.dir(userResult, { depth: null }); // 使用 console.dir 可以更好地显示对象结构
        console.log("====================================");
        done(null, userResult.rows[0]);
    } catch (err) {
        done(err, null);
    } finally { 
        client.release();
    }
});