"use client";

import { useState } from "react";
import { Sun, Moon, ShoppingCart, Menu, X } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/app/context/CartContext";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import DymoLabel from "@/components/ui/DymoLabel";
import { useThemePreferences } from "@/app/hooks/useThemePreferences";

export default function Navigation() {
  const { isDark, toggleDarkMode } = useThemePreferences();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems, isRequisitionSubmitted } = useCart();

  return (
    <nav className="border-b-2 border-border-primary bg-background-secondary text-foreground-primary sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight cursor-pointer flex items-center gap-2 group select-none">
          <Image
            src="/images/homesteaderlabs_logo_flask_seedlingv2.jpeg"
            alt="Homesteader Labs"
            width={32}
            height={32}
            className="w-8 h-8 group-hover:opacity-80 transition-opacity"
          />
          <span className="hidden sm:inline">Homesteader Labs</span>
          <span className="sm:hidden">HL</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-4 text-sm items-center">
          <Link href="/shop/">
            <DymoLabel className="opacity-80 hover:opacity-100 scale-90">Shop</DymoLabel>
          </Link>
          <Link href="/archive/">
            <DymoLabel className="opacity-80 hover:opacity-100 scale-90">Field Notes</DymoLabel>
          </Link>
          <Link href="/tools/weather/">
            <DymoLabel className="opacity-80 hover:opacity-100 scale-90">Weather</DymoLabel>
          </Link>
          <Link href="/tools/planting-calendar/">
            <DymoLabel className="opacity-80 hover:opacity-100 scale-90">Planting</DymoLabel>
          </Link>
          <Link href="/tools/caloric-security/">
            <DymoLabel className="opacity-80 hover:opacity-100 scale-90">Resilience</DymoLabel>
          </Link>
          <Link href="/tools/fabrication/">
            <DymoLabel className="opacity-80 hover:opacity-100 scale-90">Workshop</DymoLabel>
          </Link>

          <button
            onClick={toggleDarkMode}
            className="p-2 border border-border-primary hover:bg-accent hover:text-white transition-all"
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
            <span className="font-bold text-xs">{totalItems.toString().padStart(2, "0")}</span>
            {isRequisitionSubmitted && (
              <Badge
                variant="solid"
                className="text-[7px] px-1 py-0 leading-tight bg-green-600 border-green-600"
              >
                ✓
              </Badge>
            )}
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 border border-border-primary"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
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
              <DymoLabel className="w-full text-center">Shop</DymoLabel>
            </Link>
            <Link href="/archive/" onClick={() => setMobileMenuOpen(false)}>
              <DymoLabel className="w-full text-center">Field Notes</DymoLabel>
            </Link>
            <Link href="/tools/weather/" onClick={() => setMobileMenuOpen(false)}>
              <DymoLabel className="w-full text-center">Weather</DymoLabel>
            </Link>
            <Link href="/tools/planting-calendar/" onClick={() => setMobileMenuOpen(false)}>
              <DymoLabel className="w-full text-center">Planting</DymoLabel>
            </Link>
            <Link href="/tools/caloric-security/" onClick={() => setMobileMenuOpen(false)}>
              <DymoLabel className="w-full text-center">Resilience</DymoLabel>
            </Link>
            <Link href="/tools/fabrication/" onClick={() => setMobileMenuOpen(false)}>
              <DymoLabel className="w-full text-center">Workshop</DymoLabel>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
