import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000;
  } catch { return null; }
};

let isRefreshing = false;
let refreshQueue = [];
let refreshTimerID = null;

const TWO_MIN = 2 * 60 * 1000;

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  refreshQueue = [];
};

const doRefresh = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null') {
    throw new Error('No refresh token');
  }
  const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
    { token: refreshToken }
  );
  const newToken = res.data.accessToken;
  if (!newToken || newToken === 'undefined') throw new Error('No token in response');
  localStorage.setItem('accessToken', newToken);
  console.log('✅ Token refreshed at', new Date().toLocaleTimeString());
  return newToken;
};

// ── Background token refresh timer ──────────────────────────
// Call this after login. Checks every 60s — refreshes if token expires within 2 minutes.
// Uses the same isRefreshing gate as the request interceptor to prevent race conditions.
export const startTokenRefreshTimer = () => {
  if (refreshTimerID) return; // already running

  refreshTimerID = setInterval(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token || token === 'undefined' || token === 'null') return;

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const timeLeft = expiry - Date.now();

    if (timeLeft <= 0) {
      console.warn('⚠️ Token already expired, attempting refresh...');
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await doRefresh();
          processQueue(null, newToken);
        } catch (err) {
          processQueue(err, null);
          stopTokenRefreshTimer();
          localStorage.clear();
          window.location.href = '/login';
        } finally {
          isRefreshing = false;
        }
      }
      return;
    }

    if (timeLeft < TWO_MIN) {
      console.log('⏰ Token expiring soon, refreshing proactively...');
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await doRefresh();
          processQueue(null, newToken);
        } catch (err) {
          console.error('Background refresh failed:', err.message);
          processQueue(err, null);
        } finally {
          isRefreshing = false;
        }
      }
    }
  }, 60 * 1000);
};

export const stopTokenRefreshTimer = () => {
  if (refreshTimerID) {
    clearInterval(refreshTimerID);
    refreshTimerID = null;
  }
};

// ── Request interceptor ──────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const isAuthRoute = config.url?.includes('/auth/');
  if (isAuthRoute) return config;

  let token = localStorage.getItem('accessToken');
  if (!token || token === 'undefined' || token === 'null') token = null;

  if (token) {
    const expiry = getTokenExpiry(token);
    const now = Date.now();

    if (expiry && expiry - now < TWO_MIN) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          token = await doRefresh();
          processQueue(null, token);
        } catch (err) {
          processQueue(err, null);
          stopTokenRefreshTimer();
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      } else {
        token = await new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        });
      }
    }

    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Response interceptor ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (original?.url?.includes('/auth/')) return Promise.reject(error);

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
          });
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        } catch (e) {
          return Promise.reject(e);
        }
      }

      isRefreshing = true;
      try {
        const token = await doRefresh();
        processQueue(null, token);
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        stopTokenRefreshTimer();
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;