import User from '../models/User.js';
import { verifyAccessToken, verifyRefreshToken, buildTokenPayload, signAccessToken } from '../utils/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

/**
 * Protect middleware: verifies access token from cookie or Authorization header,
 * attaches req.user. If access token is expired but a valid refresh token cookie
 * exists, it silently rotates the access token.
 */
export const protect = async (req, res, next) => {
  try {
    // Prefer the Authorization header so that per-tab sessionStorage tokens
    // win over the shared httpOnly cookie (which all tabs of an origin share).
    let token = null;
    let fromHeader = false;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
      fromHeader = true;
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) throw new UnauthorizedError('Authentication required');

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (accessErr) {
      // Cookie-based rotation is only safe when the request came from the
      // shared cookie. A Bearer header belongs to a specific tab's session,
      // so let that tab refresh itself with its own refresh token instead.
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken || fromHeader) throw new UnauthorizedError('Session expired, please log in again');
      const refreshDecoded = verifyRefreshToken(refreshToken);
      const user = await User.findById(refreshDecoded.sub).select('-password');
      if (!user || !user.isActive) throw new UnauthorizedError('Account not found or disabled');
      const newAccessToken = signAccessToken(buildTokenPayload(user));
      res.cookie('accessToken', newAccessToken, { httpOnly: true, sameSite: 'lax', path: '/' });
      decoded = { sub: refreshDecoded.sub, role: refreshDecoded.role };
    }

    const user = await User.findById(decoded.sub).select('-password');
    if (!user || !user.isActive) throw new UnauthorizedError('Account not found or disabled');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/** Optional auth: attaches user if token is valid, but does not fail if missing. */
export const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.sub).select('-password');
      if (user && user.isActive) req.user = user;
    }
    next();
  } catch {
    next();
  }
};

/** Role-based authorization: restrict(...roles). Must be used after protect. */
export const restrict = (...roles) => (req, res, next) => {
  if (!req.user) return next(new UnauthorizedError('Authentication required'));
  if (!roles.includes(req.user.role)) {
    return next(new ForbiddenError(`Access restricted to: ${roles.join(', ')}`));
  }
  next();
};

export const adminOnly = restrict('admin');
export const deliveryOnly = restrict('delivery', 'admin');
export const adminOrDelivery = restrict('admin', 'delivery');

export default { protect, optionalAuth, restrict };
