"use client";

import { useState } from "react";
import { Box, Sun, Moon, ShoppingCart } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function Navigation() {
  const [isDark, setIsDark] = useState(false);
  const { totalItems, isRequisitionSubmitted } = useCart();

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const requisitionStatus = isRequisitionSubmitted ? "SUBMITTED" : "PENDING";

  return (
    <nav className="border-b-2 border-theme-main bg-theme-sub text-theme-main sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="text-xl font-bold tracking-tight cursor-pointer flex items-center gap-2 group select-none">
          <div className="w-8 h-8 bg-[var(--accent)] text-white flex items-center justify-center group-hover:invert transition-all">
            <Box size={20} />
          </div>
          <span className="hidden sm:inline">HOMESTEADER_LABS</span>
          <span className="sm:hidden">HL_SYS</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-6 text-sm items-center">
          <a href="/shop/" className="dymo-label opacity-80 hover:opacity-100">
            SHOP
          </a>
          <a href="/archive/" className="dymo-label opacity-80 hover:opacity-100">
            ARCHIVE
          </a>
          <a href="/tools/planting-calendar/" className="dymo-label opacity-80 hover:opacity-100">
            PLANTING
          </a>
          <a href="/tools/fabrication/" className="dymo-label opacity-80 hover:opacity-100">
            FABRICATION
          </a>
          <a href="/tools/weather/" className="dymo-label opacity-80 hover:opacity-100">
            WEATHER
          </a>

          <button
            onClick={toggleDarkMode}
            className="p-2 border border-theme-main hover:bg-[var(--accent)] hover:text-white transition-all ml-4"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Requisition & Mobile */}
        <div className="flex items-center gap-4">
          <a 
            href="/requisition/"
            className="flex items-center gap-2 border border-theme-main px-3 py-1 hover:bg-[var(--accent)] hover:text-white transition-colors"
          >
            <ShoppingCart size={14} />
            <span className="text-[10px] hidden sm:inline">REQ:</span>
            <span className="font-bold text-xs">{totalItems.toString().padStart(2, "0")}</span>
            <span className={`text-[8px] px-1 ${isRequisitionSubmitted ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>
              {requisitionStatus}
            </span>
          </a>

          <button
            onClick={toggleDarkMode}
            className="md:hidden p-1 border border-theme-main"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex justify-around border-t border-theme-main py-2 text-xs">
        <a href="/shop/" className="text-theme-sub hover:text-theme-main">
          SHOP
        </a>
        <a href="/archive/" className="text-theme-sub hover:text-theme-main">
          ARCHIVE
        </a>
        <a href="/tools/planting-calendar/" className="text-theme-sub hover:text-theme-main">
          PLANT
        </a>
        <a href="/tools/fabrication/" className="text-theme-sub hover:text-theme-main">
          FAB
        </a>
        <a href="/requisition/" className="text-theme-sub hover:text-theme-main flex items-center gap-1">
          <ShoppingCart size={10} />
          {totalItems > 0 && <span>({totalItems})</span>}
        </a>
      </div>
    </nav>
  );
}
