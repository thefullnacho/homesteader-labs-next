'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

// ============================================================
// FaqAccordion
//
// Reusable collapsible FAQ list. The FAQPage JSON-LD lives
// alongside this in the page; this component is purely visual.
// Google indexes hidden accordion content, so SEO is unaffected.
//
// Per-page variation comes from `prefix` (e.g. "FAQ", "DATA",
// "FIELD", "PEST", "QUERY") and `numWidth` (2 or 3 digit pad).
// ============================================================

export interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  faqs:        FaqItem[];
  prefix?:     string;   // default "FAQ"
  numWidth?:   2 | 3;    // default 2 → "01"; 3 → "001"
  defaultOpen?: number;  // index pre-opened; -1 = all closed
}

export default function FaqAccordion({
  faqs,
  prefix      = 'FAQ',
  numWidth    = 2,
  defaultOpen = -1,
}: FaqAccordionProps) {
  const [openIdx, setOpenIdx] = useState(defaultOpen);

  return (
    <div className="space-y-1.5">
      {faqs.map((faq, i) => {
        const isOpen = openIdx === i;
        const num    = String(i + 1).padStart(numWidth, '0');
        return (
          <div
            key={faq.q}
            className={`border-2 transition-colors ${
              isOpen
                ? 'border-marker/60 bg-kraft/40'
                : 'border-ink/20 hover:border-ink/50'
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="w-full flex items-start gap-3 p-3 md:p-4 text-left"
            >
              <span
                className={`text-[9px] font-mono uppercase tracking-widest mt-1 shrink-0 ${
                  isOpen ? 'text-marker' : 'text-ink/30'
                }`}
              >
                {prefix}.{num}
              </span>
              <span
                className={`flex-1 text-sm md:text-base font-mono leading-snug ${
                  isOpen ? 'text-ink' : 'text-ink/80'
                }`}
              >
                {faq.q}
              </span>
              <span className={`mt-1 shrink-0 ${isOpen ? 'text-marker' : 'text-ink/30'}`}>
                {isOpen ? <Minus size={14} /> : <Plus size={14} />}
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 md:pl-[72px] text-sm md:text-base text-ink/70 leading-relaxed">
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
