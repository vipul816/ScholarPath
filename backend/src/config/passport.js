import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/index.js';
import dotenv from 'dotenv';
dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await User.findOne({ where: { email: profile.emails[0].value } });
      
      if (!user) {
        user = await User.create({
          name: profile.displayName || profile.emails[0].value.split('@')[0],
          email: profile.emails[0].value,
          password: 'oauth_generated_password', // Users logging in with Google won't know this
          role: 'student', // Default role
          // googleId column doesn't exist yet natively so we skip it to prevent db error or add it to model
        });
      } else if (!user.googleId) {
        // Link google account to existing email
        user.googleId = profile.id;
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

export default passport;
