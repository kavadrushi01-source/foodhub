import config from '../config/index.js';

const getCookieOptions = () => {
  // Cross-site deployment (Vercel frontend + Render backend) requires
  // SameSite=None + Secure=true, otherwise browsers silently drop cookies.
  const client = String(config.clientUrl || '');
  const api = String(config.apiUrl || '');
  const crossSite = (() => {
    try {
      const firstHost = new URL(client.split(',')[0].trim()).hostname;
      const apiUrl = api.startsWith('http') ? api : `http://localhost:${config.port}`;
      const apiHost = new URL(apiUrl).hostname;
      return Boolean(firstHost) && Boolean(apiHost) && firstHost !== apiHost;
    } catch {
      return config.isProd;
    }
  })();
  return {
    httpOnly: true,
    secure: crossSite ? true : config.cookie.secure,
    sameSite: crossSite ? 'none' : config.cookie.sameSite,
    path: '/',
  };
};

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  const baseOptions = getCookieOptions();
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
  const baseOptions = getCookieOptions();
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
