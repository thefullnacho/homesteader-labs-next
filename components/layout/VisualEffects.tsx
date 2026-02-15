"use client";

import React, { useState, useEffect } from 'react';

const VisualEffects = () => {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Initial check
    const saved = localStorage.getItem("hl_ui_low_fx");
    if (saved === "true") setEnabled(false);

    // Listen for custom toggle events
    const handleToggle = () => {
      const isLow = localStorage.getItem("hl_ui_low_fx") === "true";
      setEnabled(!isLow);
    };

    window.addEventListener('hl-toggle-fx', handleToggle);
    return () => window.removeEventListener('hl-toggle-fx', handleToggle);
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Global Grain/Noise Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      {/* Subtle Grit/Texture Layer */}
      <div 
        className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.04] mix-blend-multiply"
        style={{
          backgroundImage: "url('/textures/subtle-concrete-mildev.jpg')",
          backgroundRepeat: 'repeat'
        }}
      />

      {/* CRT Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none z-[9998] opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_4px,3px_100%] transition-opacity" />
    </>
  );
};

export default VisualEffects;
