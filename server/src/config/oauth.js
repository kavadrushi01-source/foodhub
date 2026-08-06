import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import config from './index.js';
import logger from './logger.js';

export const oauthEnabled = {
  google: Boolean(config.oauth.google.clientID && config.oauth.google.clientSecret),
  facebook: Boolean(config.oauth.facebook.clientID && config.oauth.facebook.clientSecret),
};

/**
 * Build the user from a provider profile. Returns null when the provider did
 * not hand us an email (required to create an account).
 */
const profileToUser = (provider, profile) => {
  const email = profile.emails?.[0]?.value?.trim().toLowerCase() || '';
  if (!email) return null;
  return {
    email,
    name: (profile.displayName || profile.name?.givenName || email.split('@')[0]).trim().slice(0, 60) || 'FoodHub User',
    avatar: profile.photos?.[0]?.value || '',
    provider,
    providerId: profile.id,
  };
};

if (oauthEnabled.google) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.oauth.google.clientID,
        clientSecret: config.oauth.google.clientSecret,
        callbackURL: config.oauth.google.callbackURL,
      },
      (_accessToken, _refreshToken, profile, done) => done(null, profile),
    ),
  );
  logger.info('Google OAuth strategy enabled');
}

if (oauthEnabled.facebook) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: config.oauth.facebook.clientID,
        clientSecret: config.oauth.facebook.clientSecret,
        callbackURL: config.oauth.facebook.callbackURL,
        profileFields: ['id', 'displayName', 'emails', 'picture.type(large)'],
      },
      (_accessToken, _refreshToken, profile, done) => done(null, profile),
    ),
  );
  logger.info('Facebook OAuth strategy enabled');
}

export default passport;
export { profileToUser };
