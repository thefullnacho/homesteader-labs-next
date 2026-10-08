"use client";

import { useState, useEffect, useRef, useId } from "react";
import { Send } from "lucide-react";

/** The same monthly list everywhere. `source` tags where a signup came from
 *  (the route only accepts known values), and the copy can be swapped so a
 *  surface speaks to the reader it gets: /builds/ talks to makers. */
interface NewsletterSignupProps {
  source?: "builds";
  kicker?: string;
  heading?: string;
  blurb?: string;
  className?: string;
}

export default function NewsletterSignup({
  source,
  kicker = "The dispatch",
  heading = "Field reports, by mail",
  blurb = "New guides, hardware drops, and what to do outside this month. No spam, no tracking, just signal.",
  className = "mb-16",
}: NewsletterSignupProps = {}) {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "invalid" | "failed">("idle");
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
      setStatus("invalid");
      return;
    }
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "newsletter", source }),
    }).catch(() => null);
    if (res?.ok) {
      setStatus("success");
      setEmail("");
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      statusTimerRef.current = setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus(res?.status === 400 ? "invalid" : "failed");
    }
  };

  return (
    <section className={className}>
      <div className="border-t border-ink/30 bg-kraft p-5 md:p-8 relative">
        <div className="relative z-[2] flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Text */}
          <div className="flex-grow">
            <p className="text-base text-soil mb-2">{kicker}</p>
            <h2 className="font-display text-2xl leading-tight mb-2">{heading}</h2>
            <p className="text-lg text-ink max-w-md leading-snug">{blurb}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full min-w-0 md:w-auto md:max-w-[45%]">
            <div className="flex gap-2">
              <label htmlFor={inputId} className="sr-only">Email address</label>
              <input
                id={inputId}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="min-w-0 w-full flex-grow md:w-64 px-3 py-2 bg-paper border-2 border-ink text-ink placeholder:text-ink/40 focus:outline-none focus:border-marker font-mono text-sm"
              />
              <button
                type="submit"
                aria-label="Join the newsletter"
                className="bg-ink text-paper px-4 py-2 border-2 border-ink text-base hover:bg-marker hover:border-marker transition-colors flex items-center gap-2"
              >
                <Send size={16} aria-hidden="true" />
                <span>Join</span>
              </button>
            </div>

            <div aria-live="polite" aria-atomic="true">
              {status === "success" && (
                <p className="font-hand font-semibold text-moss text-lg mt-2">
                  ✓ you&apos;re on the list
                </p>
              )}
              {status === "invalid" && (
                <p className="font-hand font-semibold text-marker text-lg mt-2">
                  ✎ that email doesn&apos;t look right
                </p>
              )}
              {status === "failed" && (
                <p className="font-hand font-semibold text-marker text-lg mt-2">
                  ✎ couldn&apos;t add you just now, try again
                </p>
              )}
            </div>
            <p className="text-sm text-soil mt-2">
              Monthly. Unsubscribe anytime.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
