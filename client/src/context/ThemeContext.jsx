import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
    const [dark, setDark] = useState(() => {
        const saved = localStorage.getItem('automindz_theme');
        return saved ? saved === 'dark' : false; // Default to light mode to prevent unwanted dark theme on mobile
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
        localStorage.setItem('automindz_theme', dark ? 'dark' : 'light');
    }, [dark]);

    const toggle = () => setDark(d => !d);

    return (
        <ThemeContext.Provider value={{ dark, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}
