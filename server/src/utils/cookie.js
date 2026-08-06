import config from '../config/index.js';

const baseOptions = {
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  path: '/',
};

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie('accessToken', accessToken, {
    ...baseOptions,
    maxAge: parseExpiryToMs(config.jwt.accessExpiresIn),
  });
  res.cookie('refreshToken', refreshToken, {
    ...baseOptions,
    maxAge: parseExpiryToMs(config.jwt.refreshExpiresIn),
  });
};

export const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', baseOptions);
  res.clearCookie('refreshToken', baseOptions);
};

// Convert "15m"/"7d" to milliseconds for cookie maxAge
const parseExpiryToMs = (exp) => {
  const m = /^(\d+)([smhd])$/.exec(exp);
  if (!m) return 15 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  const map = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * map[unit];
};

export default { setAuthCookies, clearAuthCookies };
