import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('automindz_token'));
    const [loading, setLoading] = useState(true);

    // FIX: Race condition - after login/register, we already have the user from API response.
    // Setting token triggers useEffect which calls /auth/me AGAIN (double fetch).
    // During that second async call, loading=true + isAuthenticated=false → AppLayout
    // redirects to /login, cancelling the navigate('/dashboard') call.
    // Solution: use a ref to skip the /auth/me fetch when user is already set.
    const skipMeFetch = useRef(false);

    useEffect(() => {
        if (skipMeFetch.current) {
            // User was set directly in login/register — no need to re-fetch /auth/me
            skipMeFetch.current = false;
            setLoading(false);
            return;
        }
        if (token) {
            setLoading(true);
            api.get('/auth/me')
                .then(res => setUser(res.data.user))
                .catch(() => { logout(); })
                .finally(() => setLoading(false));
        } else {
            setUser(null);
            setLoading(false);
        }
    }, [token]);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        // Set user directly from login response (no need for /auth/me re-fetch)
        skipMeFetch.current = true;
        localStorage.setItem('automindz_token', res.data.token);
        setUser(res.data.user);
        setToken(res.data.token);
        return res.data;
    };

    const register = async (name, email, password) => {
        const res = await api.post('/auth/register', { name, email, password });
        // Set user directly from register response (no need for /auth/me re-fetch)
        skipMeFetch.current = true;
        localStorage.setItem('automindz_token', res.data.token);
        setUser(res.data.user);
        setToken(res.data.token);
        return res.data;
    };

    // For Google OAuth — receives JWT token directly and fetches user profile
    const setTokenAndUser = async (jwtToken) => {
        localStorage.setItem('automindz_token', jwtToken);
        try {
            setLoading(true);
            const res = await api.get('/auth/me');
            setUser(res.data.user);
            skipMeFetch.current = true;
            setToken(jwtToken);
            setLoading(false);
            return res.data;
        } catch (err) {
            logout();
            setLoading(false);
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('automindz_token');
        setToken(null);
        setUser(null);
    };

    const fetchUser = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data.user);
            return res.data.user;
        } catch { logout(); }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, setTokenAndUser, fetchUser, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}
