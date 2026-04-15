import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('automindz_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            setLoading(true);
            api.get('/auth/me')
                .then(res => setUser(res.data.user))
                .catch(() => { logout(); })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('automindz_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data;
    };

    const register = async (name, email, password) => {
        const res = await api.post('/auth/register', { name, email, password });
        localStorage.setItem('automindz_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data;
    };

    // For Google OAuth — receives JWT token directly
    const setTokenAndUser = (jwtToken) => {
        localStorage.setItem('automindz_token', jwtToken);
        setToken(jwtToken);
    };

    const logout = () => {
        localStorage.removeItem('automindz_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, setTokenAndUser, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}
