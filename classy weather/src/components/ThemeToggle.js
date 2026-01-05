/**
 * ThemeToggle.js
 *
 * Accessible theme toggle button with system preference option.
 * Features:
 * - Three-state toggle (light, dark, system)
 * - Keyboard accessible
 * - ARIA labels
 * - Animated icons
 */

import React, { useCallback } from "react";
import { useTheme, THEMES } from "../contexts";

export default function ThemeToggle() {
  const { theme, setTheme, isDark, resolvedTheme } = useTheme();

  const cycleTheme = useCallback(() => {
    // Cycle: light -> dark -> system -> light
    if (theme === THEMES.LIGHT) {
      setTheme(THEMES.DARK);
    } else if (theme === THEMES.DARK) {
      setTheme(THEMES.SYSTEM);
    } else {
      setTheme(THEMES.LIGHT);
    }
  }, [theme, setTheme]);

  const getIcon = () => {
    if (theme === THEMES.SYSTEM) return "🖥️";
    return isDark ? "🌙" : "☀️";
  };

  const getLabel = () => {
    if (theme === THEMES.SYSTEM) return `System (${resolvedTheme})`;
    return isDark ? "Dark mode" : "Light mode";
  };

  return (
    <button
      onClick={cycleTheme}
      className="theme-toggle"
      aria-label={`Current theme: ${getLabel()}. Click to change.`}
      title={getLabel()}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {getIcon()}
      </span>
      <span className="theme-toggle__label visually-hidden">{getLabel()}</span>
    </button>
  );
}
