const REMEMBER_KEY = 'foodhub-remember';

// Where does the active session live right now?
const getSessionLocation = () => {
  if (sessionStorage.getItem('accessToken')) return 'session';
  if (localStorage.getItem('accessToken')) return 'local';
  return null;
};

const pick = (loc) => (loc === 'local' ? localStorage : sessionStorage);

/**
 * Store tokens after login/register/oauth.
 * - rememberMe=true  -> localStorage (persists across browser restarts)
 * - rememberMe=false -> sessionStorage (per-tab, cleared when the tab closes)
 */
export const setTokens = (tokens, rememberMe = false) => {
  const { accessToken, refreshToken } = tokens || {};
  if (rememberMe) {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    localStorage.setItem(REMEMBER_KEY, '1');
  } else {
    if (accessToken) sessionStorage.setItem('accessToken', accessToken);
    if (refreshToken) sessionStorage.setItem('refreshToken', refreshToken);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem(REMEMBER_KEY);
  }
};

export const getTokens = () => {
  const loc = getSessionLocation();
  const storage = pick(loc);
  return {
    accessToken: storage.getItem('accessToken'),
    refreshToken: storage.getItem('refreshToken'),
    location: loc,
  };
};

export const getAccessToken = () => {
  const loc = getSessionLocation();
  return loc ? pick(loc).getItem('accessToken') : null;
};

export const setAccessToken = (token) => {
  const loc = getSessionLocation() || 'session';
  pick(loc).setItem('accessToken', token);
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  localStorage.removeItem(REMEMBER_KEY);
};

export const isRemembered = () => localStorage.getItem(REMEMBER_KEY) === '1';

export default { setTokens, getTokens, getAccessToken, setAccessToken, clearTokens, isRemembered };
