"use client";

import { useState } from "react";
import { Send, Terminal } from "lucide-react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission - in production, this would call an API route
    if (email.includes("@")) {
      setStatus("success");
      setEmail("");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("error");
    }
  };

  return (
    <section className="mb-12">
      <div className="brutalist-block bg-[var(--accent)]/10 border-[var(--accent)]">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Text */}
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-2">
                <Terminal size={20} className="text-[var(--accent)]" />
                <h2 className="text-xl font-bold uppercase">Stay_In_The_Loop</h2>
              </div>
              <p className="text-sm text-theme-secondary">
                Get field reports, new hardware drops, and survival tips. 
                No spam. No tracking. Just signal.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-shrink-0 w-full md:w-auto">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-grow md:w-64 px-3 py-2 bg-theme-sub border-2 border-theme-main text-theme-main placeholder:text-theme-secondary/50 focus:outline-none focus:border-[var(--accent)] font-mono text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] text-white font-bold text-sm uppercase hover:brightness-110 transition-all flex items-center gap-2"
                >
                  <Send size={14} />
                  <span className="hidden sm:inline">Join</span>
                </button>
              </div>

              {status === "success" && (
                <p className="text-xs text-green-600 mt-2">
                  &gt;&gt; SUBSCRIPTION_CONFIRMED
                </p>
              )}
              {status === "error" && (
                <p className="text-xs text-[var(--accent)] mt-2">
                  &gt;&gt; ERROR: INVALID_EMAIL_FORMAT
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Decorative terminal footer */}
        <div className="border-t-2 border-[var(--accent)]/30 px-6 py-2 bg-theme-sub/30">
          <p className="text-[10px] font-mono text-theme-secondary">
            ENCRYPTION: NONE | FREQUENCY: MONTHLY | UNSUBSCRIBE: ANYTIME
          </p>
        </div>
      </div>
    </section>
  );
}
