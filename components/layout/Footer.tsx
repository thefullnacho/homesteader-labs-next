"use client";

import Link from "next/link";
import { Stamp } from "@/components/field/kit";

const indexLinks = [
  { href: "/archive/", label: "Field Notes" },
  { href: "/shop/", label: "Shop" },
  { href: "/tools/fabrication/", label: "Workshop" },
  { href: "/terms-of-fabrication/", label: "Terms" },
  { href: "/warranty/", label: "Warranty" },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-paper mt-auto no-print">
      <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <div>
          <p className="font-display uppercase text-lg mb-2">Homesteader Labs</p>
          <p className="font-serif text-paper/70 text-[0.95rem] max-w-xs">
            Field guides and plain-talk tools for people who build their own
            world. No accounts. No ads.
          </p>
        </div>

        <div className="font-mono text-[0.72rem] uppercase tracking-wider text-paper/70">
          <p className="text-paper mb-2 font-semibold">Index</p>
          <ul className="space-y-1.5">
            {indexLinks.map((l) => (
              <li key={l.href}>
                <Link className="hover:text-marker transition-colors" href={l.href}>
                  — {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="font-mono text-[0.72rem] uppercase tracking-wider text-paper/70">
          <p className="text-paper mb-2 font-semibold">Colophon</p>
          <p>Set in Newsreader, IBM Plex Mono &amp; Caveat.</p>
          <p className="mt-1">© 2026 Homesteader Labs</p>
          <div className="mt-4 flex items-center gap-4">
            <Link href="/privacy/" className="hover:text-marker transition-colors">
              Privacy
            </Link>
            <Link href="/requisition/" className="hover:text-marker transition-colors">
              Cart
            </Link>
          </div>
          <div className="mt-4">
            <Stamp color="text-marker">No account required</Stamp>
          </div>
        </div>
      </div>
    </footer>
  );
}
