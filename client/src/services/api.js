
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// ─── REQUEST INTERCEPTOR ──────────────────────────────────────
// Runs before EVERY request
// Attaches the access token from localStorage automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── RESPONSE INTERCEPTOR ─────────────────────────────────────
// Runs after EVERY response
// If token expired (401) → automatically gets new token and retries
api.interceptors.response.use(
  (response) => response, // Success — just return response

  async (error) => {
    const original = error.config;

    // If 401 and we haven't already retried
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
          { refreshToken }
        );

        localStorage.setItem('accessToken', res.data.accessToken);

        original.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(original);

      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;