import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('automindz_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 — auto logout on expired/invalid token
// BUG FIX #17: Also pick up X-Renewed-Token for sliding session
api.interceptors.response.use(
    (res) => {
        // Silently renew token if server issued a new one
        const renewedToken = res.headers?.['x-renewed-token'];
        if (renewedToken) {
            localStorage.setItem('automindz_token', renewedToken);
        }
        return res;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Don't auto-redirect for Google OAuth token exchange — 
            // GoogleAuthSuccess.jsx handles its own error flow
            const url = error.config?.url || '';
            if (!url.includes('/auth/google/token')) {
                localStorage.removeItem('automindz_token');
                localStorage.removeItem('automindz_user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
