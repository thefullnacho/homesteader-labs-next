"use client";

import { useState, useEffect, useCallback } from "react";

const DARK_MODE_KEY = "hl_dark_mode";
const TOGGLE_DARK_EVENT = "hl-toggle-dark";

function safeLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage disabled or full — fail silently
  }
}

export function useThemePreferences() {
  const [isDark, setIsDark] = useState(true);
  const [lowFX] = useState(false);

  // Load from localStorage on mount + listen for cross-component sync events
  useEffect(() => {
    const savedDark = safeLocalStorage(DARK_MODE_KEY);
    if (savedDark !== null) {
      try {
        const dark = JSON.parse(savedDark);
        setIsDark(dark);
        document.documentElement.classList.toggle("dark", dark);
      } catch {
        // Invalid JSON — ignore
      }
    }
    // No saved preference: dark mode is the default (set via html class in layout.tsx)

    // Sync when another component toggles
    const handleDarkSync = () => {
      const current = safeLocalStorage(DARK_MODE_KEY);
      if (current) {
        try {
          setIsDark(JSON.parse(current));
        } catch {
          // Invalid JSON — ignore
        }
      }
    };

    window.addEventListener(TOGGLE_DARK_EVENT, handleDarkSync);
    return () => {
      window.removeEventListener(TOGGLE_DARK_EVENT, handleDarkSync);
    };
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDark((prev) => {
      const newValue = !prev;
      document.documentElement.classList.toggle("dark", newValue);
      safeLocalStorageSet(DARK_MODE_KEY, JSON.stringify(newValue));
      window.dispatchEvent(new Event(TOGGLE_DARK_EVENT));
      return newValue;
    });
  }, []);

  return { isDark, lowFX, toggleDarkMode };
}
