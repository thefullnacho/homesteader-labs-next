"use client";

import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Stamp } from "@/components/field/kit";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up status timer on unmount
  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setStatus("error");
      return;
    }
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "newsletter" }),
    });
    if (res.ok) {
      setStatus("success");
      setEmail("");
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      statusTimerRef.current = setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("error");
    }
  };

  return (
    <section className="mb-16">
      <div className="border-2 border-ink bg-kraft grain p-6 md:p-8 relative">
        <div className="relative z-[2] flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Text */}
          <div className="flex-grow">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink/60 mb-2">
              The dispatch
            </p>
            <h2 className="font-display uppercase text-xl leading-tight mb-2">
              Field reports, by mail
            </h2>
            <p className="text-[0.98rem] text-ink/80 max-w-md leading-snug">
              New guides, hardware drops, and what to do outside this month.
              No spam, no tracking, just signal.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-shrink-0 w-full md:w-auto">
            <div className="flex gap-2">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-grow md:w-64 px-3 py-2 bg-paper border-2 border-ink text-ink placeholder:text-ink/40 focus:outline-none focus:border-marker font-mono text-sm"
              />
              <button
                type="submit"
                className="bg-ink text-paper px-4 py-2 border-2 border-ink font-mono text-xs uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors flex items-center gap-2"
              >
                <Send size={14} />
                <span className="hidden sm:inline">Join</span>
              </button>
            </div>

            <div aria-live="polite" aria-atomic="true">
              {status === "success" && (
                <p className="font-hand font-semibold text-moss text-lg mt-2">
                  ✓ you&apos;re on the list
                </p>
              )}
              {status === "error" && (
                <p className="font-hand font-semibold text-marker text-lg mt-2">
                  ✎ that email doesn&apos;t look right
                </p>
              )}
            </div>
            <p className="font-mono text-[0.64rem] uppercase tracking-widest text-ink/50 mt-2">
              Monthly. Unsubscribe anytime.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
