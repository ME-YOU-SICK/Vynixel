import express from 'express';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  OAUTH_CALLBACK_URL = 'http://localhost:4000/auth/google/callback',
  SESSION_SECRET = 'dev_session_secret_change_me',
  FRONTEND_ORIGIN = 'http://localhost:3000',
  PORT = 4000,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('[auth] GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not set — Google OAuth will not work.');
}

// In-memory user store for demo; replace with DB in production
const usersByGoogleId = new Map();

passport.serializeUser((user, done) => {
  done(null, user.googleId);
});

passport.deserializeUser((id, done) => {
  const user = usersByGoogleId.get(id) || null;
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID || 'missing',
      clientSecret: GOOGLE_CLIENT_SECRET || 'missing',
      callbackURL: OAUTH_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      const googleId = profile.id;
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
      const name = profile.displayName || email || 'User';
      const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

      let user = usersByGoogleId.get(googleId);
      if (!user) {
        user = { googleId, name, email, avatarUrl };
        usersByGoogleId.set(googleId, user);
      }
      return done(null, user);
    }
  )
);

const app = express();

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(
  session({
    name: 'vynixel_session',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      httpOnly: true,
      secure: false, // set true behind HTTPS in production
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/google', (req, res, next) => {
  // Request profile and email scopes
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure', session: true }),
  (req, res) => {
    // On success, redirect back to the SPA
    res.redirect(FRONTEND_ORIGIN);
  }
);

app.get('/auth/failure', (_req, res) => {
  res.status(401).send('Authentication failed');
});

app.post('/auth/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie('vynixel_session');
      res.status(204).end();
    });
  });
});

app.get('/api/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ authenticated: false });
  }
  const { name, email, avatarUrl } = req.user;
  res.json({ authenticated: true, user: { name, email, avatarUrl } });
});

app.listen(Number(PORT), () => {
  console.log(`[server] OAuth server listening on http://localhost:${PORT}`);
});


