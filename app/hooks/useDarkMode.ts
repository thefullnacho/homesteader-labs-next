"use client";

import { useState, useEffect } from "react";

export default function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (typeof window === "undefined") return;
    
    try {
      const saved = localStorage.getItem("hl_dark_mode");
      if (saved !== null && saved !== "undefined") {
        const parsed = JSON.parse(saved);
        setIsDark(parsed);
        if (parsed) {
          document.documentElement.classList.add("dark");
        }
      } else {
        // Check system preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setIsDark(prefersDark);
        if (prefersDark) {
          document.documentElement.classList.add("dark");
        }
      }
    } catch (e) {
      console.warn("Failed to parse dark mode preference:", e);
    }
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    localStorage.setItem("hl_dark_mode", JSON.stringify(isDark));
  }, [isDark, mounted]);

  const toggleDarkMode = () => {
    setIsDark((prev) => !prev);
  };

  return { isDark, toggleDarkMode, mounted };
}
