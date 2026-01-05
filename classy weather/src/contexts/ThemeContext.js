/**
 * ThemeContext.js
 *
 * Provides dark/light theme management with system preference sync.
 * Features:
 * - Automatic detection of system color scheme preference
 * - Manual toggle with localStorage persistence
 * - CSS custom property updates for theming
 * - Accessibility-friendly theme switching
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

// Theme constants
const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

const STORAGE_KEY = "weather-app-theme";

// Create context with default values
const ThemeContext = createContext({
  theme: THEMES.LIGHT,
  resolvedTheme: THEMES.LIGHT,
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: false,
});

/**
 * Custom hook to access theme context
 * @returns {Object} Theme context value
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Detects system color scheme preference
 * @returns {string} 'dark' or 'light'
 */
function getSystemTheme() {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? THEMES.DARK
      : THEMES.LIGHT;
  }
  return THEMES.LIGHT;
}

/**
 * Gets stored theme preference from localStorage
 * @returns {string} Stored theme or 'system' as default
 */
function getStoredTheme() {
  if (typeof window !== "undefined") {
    return localStorage.getItem(STORAGE_KEY) || THEMES.SYSTEM;
  }
  return THEMES.SYSTEM;
}

/**
 * Theme Provider Component
 * Wraps the application and provides theme state and controls
 */
export function ThemeProvider({ children }) {
  // User's theme preference (light, dark, or system)
  const [theme, setThemeState] = useState(getStoredTheme);

  // Actual resolved theme (light or dark) after applying system preference
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const stored = getStoredTheme();
    return stored === THEMES.SYSTEM ? getSystemTheme() : stored;
  });

  // Update resolved theme when theme preference changes
  useEffect(() => {
    const resolved = theme === THEMES.SYSTEM ? getSystemTheme() : theme;
    setResolvedTheme(resolved);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== THEMES.SYSTEM) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      setResolvedTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    // Legacy browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [theme]);

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(`theme-${resolvedTheme}`);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        resolvedTheme === THEMES.DARK ? "#1a1a2e" : "#eabfb9"
      );
    }
  }, [resolvedTheme]);

  // Persist theme preference to localStorage
  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  // Toggle between light and dark (skips system)
  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
  }, [resolvedTheme, setTheme]);

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      isDark: resolvedTheme === THEMES.DARK,
      THEMES,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export { THEMES };
export default ThemeContext;
