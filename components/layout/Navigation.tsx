"use client";

import { useState } from "react";
import { Box, Sun, Moon, ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import DymoLabel from "@/components/ui/DymoLabel";

export default function Navigation() {
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems, isRequisitionSubmitted } = useCart();

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const requisitionStatus = isRequisitionSubmitted ? "SUBMITTED" : "PENDING";

  return (
    <nav className="border-b-2 border-border-primary bg-background-secondary text-foreground-primary sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight cursor-pointer flex items-center gap-2 group select-none">
          <div className="w-8 h-8 bg-accent text-white flex items-center justify-center group-hover:invert transition-all">
            <Box size={20} />
          </div>
          <span className="hidden sm:inline">HOMESTEADER_LABS</span>
          <span className="sm:hidden">HL_SYS</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-4 text-sm items-center">
          <Link href="/shop/">
            <DymoLabel className="opacity-80 hover:opacity-100 scale-90">SHOP</DymoLabel>
          </Link>
          <Link href="/archive/">
            <DymoLabel className="opacity-80 hover:opacity-100 scale-90">ARCHIVE</DymoLabel>
          </Link>
          <Link href="/tools/planting-calendar/">
            <DymoLabel className="opacity-80 hover:opacity-100 scale-90">PLANTING</DymoLabel>
          </Link>
          <Link href="/tools/fabrication/">
            <DymoLabel className="opacity-80 hover:opacity-100 scale-90">FABRICATION</DymoLabel>
          </Link>
          <Link href="/tools/weather/">
            <DymoLabel className="opacity-80 hover:opacity-100 scale-90">WEATHER</DymoLabel>
          </Link>

          <button
            onClick={toggleDarkMode}
            className="p-2 border border-border-primary hover:bg-accent hover:text-white transition-all ml-4"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Requisition & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <Link 
            href="/requisition/"
            className="flex items-center gap-2 border-2 border-border-primary px-3 py-1 hover:bg-accent hover:text-white transition-colors bg-background-primary/30"
          >
            <ShoppingCart size={14} />
            <span className="text-[10px] hidden lg:inline font-mono">REQ_LOG:</span>
            <span className="font-bold text-xs">{totalItems.toString().padStart(2, "0")}</span>
            <Badge 
              variant="solid" 
              className={`text-[7px] px-1 py-0 leading-tight ${isRequisitionSubmitted ? 'bg-green-600 border-green-600' : 'bg-accent border-accent'}`}
            >
              {requisitionStatus}
            </Badge>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 border border-border-primary"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-border-primary bg-background-secondary p-4 space-y-4 animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/shop/" onClick={() => setMobileMenuOpen(false)}>
              <DymoLabel className="w-full text-center">SHOP</DymoLabel>
            </Link>
            <Link href="/archive/" onClick={() => setMobileMenuOpen(false)}>
              <DymoLabel className="w-full text-center">ARCHIVE</DymoLabel>
            </Link>
            <Link href="/tools/planting-calendar/" onClick={() => setMobileMenuOpen(false)}>
              <DymoLabel className="w-full text-center">PLANTING</DymoLabel>
            </Link>
            <Link href="/tools/fabrication/" onClick={() => setMobileMenuOpen(false)}>
              <DymoLabel className="w-full text-center">FABRICATION</DymoLabel>
            </Link>
            <Link href="/tools/weather/" onClick={() => setMobileMenuOpen(false)}>
              <DymoLabel className="w-full text-center">WEATHER</DymoLabel>
            </Link>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border-primary/20">
            <span className="text-xs font-mono opacity-50 uppercase">System_Theme:</span>
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 px-4 py-1 border border-border-primary text-xs"
            >
              {isDark ? <><Sun size={14} /> LIGHT</> : <><Moon size={14} /> DARK</>}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
