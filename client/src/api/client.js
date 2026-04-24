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
api.interceptors.response.use(
    (res) => res,
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
