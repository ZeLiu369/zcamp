// In backend/src/passport-setup.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    callbackURL: "/api/auth/google/callback",
    state : true,
    pkce: true
},
async (accessToken, refreshToken, profile, done) => {
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
        const newUserResult = await client.query(
            'INSERT INTO users (username, email, google_id) VALUES ($1, $2, $3) RETURNING *',
            [profile.displayName, email, profile.id]
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