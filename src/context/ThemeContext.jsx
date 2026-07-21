import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

// Apply class immediately to avoid FOUC (Flash Of Unstyled Content)
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// Read initial theme synchronously
function getInitialTheme() {
  try {
    const saved = localStorage.getItem('SALKOT_THEME');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (e) {
    // ignore localStorage errors
  }
  return 'light';
}

// Apply immediately on module load (before React hydrates)
const initialTheme = getInitialTheme();
applyTheme(initialTheme);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem('SALKOT_THEME', next);
      } catch (e) {}
      return next;
    });
  };

  // Sync on mount & changes (handles StrictMode double-run correctly)
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem('SALKOT_THEME', theme);
    } catch (e) {}
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
