import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('automindz_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ─── Silent Token Refresh Logic ──────────────────────────────────────
// When JWT expires (401), auto-refresh using the stored refresh token
// so users stay logged in forever without needing Google re-auth.
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Handle responses — auto-refresh on 401, pick up renewed tokens
api.interceptors.response.use(
    (res) => {
        // Silently renew token if server issued a new one (sliding session)
        const renewedToken = res.headers?.['x-renewed-token'];
        if (renewedToken) {
            localStorage.setItem('automindz_token', renewedToken);
        }
        return res;
    },
    async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh for 401 errors on non-auth endpoints
        if (error.response?.status === 401 && !originalRequest._retry) {
            const url = originalRequest?.url || '';
            const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');
            const isAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/register');

            // Don't intercept auth endpoint 401s (e.g., wrong password)
            if (isAuthEndpoint) {
                return Promise.reject(error);
            }

            const refreshToken = localStorage.getItem('automindz_refresh_token');

            // If no refresh token, fall back to logout
            if (!refreshToken) {
                localStorage.removeItem('automindz_token');
                localStorage.removeItem('automindz_refresh_token');
                if (!isAuthPage) {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }

            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call refresh endpoint — NO Google re-auth needed!
                const res = await axios.post(
                    `${api.defaults.baseURL}/auth/refresh`,
                    { refreshToken },
                    { headers: { 'Content-Type': 'application/json' } }
                );

                const { token: newToken, refreshToken: newRefreshToken } = res.data;

                localStorage.setItem('automindz_token', newToken);
                if (newRefreshToken) {
                    localStorage.setItem('automindz_refresh_token', newRefreshToken);
                }

                // Update the default Authorization header
                api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                processQueue(null, newToken);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Refresh failed — token expired or revoked, do full logout
                localStorage.removeItem('automindz_token');
                localStorage.removeItem('automindz_refresh_token');
                if (!isAuthPage) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
