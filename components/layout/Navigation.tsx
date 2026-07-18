"use client";

import { useState } from "react";
import { ShoppingCart, Menu, X } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/app/context/CartContext";
import Link from "next/link";

const navLinks = [
  { href: "/shop/", label: "Shop" },
  { href: "/archive/", label: "Field Notes" },
  { href: "/tools/weather/", label: "Weather" },
  { href: "/tools/planting-calendar/", label: "Planting" },
  { href: "/tools/caloric-security/", label: "Resilience" },
  { href: "/tools/fabrication/", label: "Workshop" },
];

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems, isRequisitionSubmitted } = useCart();

  return (
    <nav className="border-b-2 border-ink bg-kraft grain sticky top-0 z-50 no-print">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center relative z-[2]">
        {/* Wordmark */}
        <Link href="/" className="flex items-baseline gap-3 cursor-pointer group select-none">
          <Image
            src="/images/homesteaderlabs_logo_flask_seedlingv2.jpeg"
            alt="Homesteader Labs"
            width={32}
            height={32}
            className="w-8 h-8 self-center border border-ink/40 group-hover:opacity-80 transition-opacity"
          />
          <span className="hidden sm:inline font-display uppercase text-xl tracking-tight group-hover:text-marker transition-colors">
            Homesteader&nbsp;Labs
          </span>
          <span className="sm:hidden font-display uppercase text-xl tracking-tight">HL</span>
          <span className="hidden lg:inline font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink/60">
            Field guides &amp; tools
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1 font-mono text-[0.72rem] uppercase tracking-wider">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-2 py-1 whitespace-nowrap border border-transparent hover:border-ink hover:bg-paper transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Requisition & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <Link
            href="/requisition/"
            className="flex items-center gap-2 border-2 border-ink bg-paper px-3 py-1 font-mono text-xs uppercase tracking-wider hover:bg-marker hover:border-marker hover:text-paper transition-colors"
          >
            <ShoppingCart size={14} />
            <span className="font-bold">{totalItems.toString().padStart(2, "0")}</span>
            {isRequisitionSubmitted && (
              <span className="font-hand font-bold text-moss text-base leading-none" aria-label="requisition submitted">
                ✓
              </span>
            )}
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 border-2 border-ink bg-paper"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-ink bg-manila p-4 animate-in slide-in-from-top duration-200 relative z-[2]">
          <div className="grid grid-cols-2 gap-2 font-mono text-[0.78rem] uppercase tracking-wider">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="border-2 border-ink bg-paper px-3 py-2 text-center hover:bg-kraft transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
