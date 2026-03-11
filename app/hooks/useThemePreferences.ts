"use client";

import { useState, useEffect, useCallback } from "react";

const DARK_MODE_KEY = "hl_dark_mode";
const LOW_FX_KEY = "hl_ui_low_fx";
const TOGGLE_FX_EVENT = "hl-toggle-fx";
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
  const [isDark, setIsDark] = useState(false);
  const [lowFX, setLowFX] = useState(false);

  // Load from localStorage on mount + listen for cross-component sync events
  useEffect(() => {
    const savedDark = safeLocalStorage(DARK_MODE_KEY);
    if (savedDark) {
      try {
        const dark = JSON.parse(savedDark);
        setIsDark(dark);
        if (dark) document.documentElement.classList.add("dark");
      } catch {
        // Invalid JSON — ignore
      }
    }

    const savedLowFX = safeLocalStorage(LOW_FX_KEY);
    if (savedLowFX === "true") setLowFX(true);

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

    const handleFXSync = () => {
      const isLow = safeLocalStorage(LOW_FX_KEY) === "true";
      setLowFX(isLow);
    };

    window.addEventListener(TOGGLE_DARK_EVENT, handleDarkSync);
    window.addEventListener(TOGGLE_FX_EVENT, handleFXSync);
    return () => {
      window.removeEventListener(TOGGLE_DARK_EVENT, handleDarkSync);
      window.removeEventListener(TOGGLE_FX_EVENT, handleFXSync);
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

  const toggleLowFX = useCallback(() => {
    setLowFX((prev) => {
      const newValue = !prev;
      safeLocalStorageSet(LOW_FX_KEY, String(newValue));
      window.dispatchEvent(new Event(TOGGLE_FX_EVENT));
      return newValue;
    });
  }, []);

  return { isDark, lowFX, toggleDarkMode, toggleLowFX };
}
