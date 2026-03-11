"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Terminal } from "lucide-react";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";
import Button from "@/components/ui/Button";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission - in production, this would call an API route
    if (email.includes("@")) {
      setStatus("success");
      setEmail("");
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
      statusTimerRef.current = setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("error");
    }
  };

  return (
    <section className="mb-12">
      <BrutalistBlock className="bg-accent/10 border-accent p-0">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Text */}
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-2">
                <Terminal size={20} className="text-accent" />
                <Typography variant="h3" className="mb-0">Stay_In_The_Loop</Typography>
              </div>
              <Typography variant="small" className="text-foreground-secondary mb-0">
                Get field reports, new hardware drops, and survival tips. 
                No spam. No tracking. Just signal.
              </Typography>
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
                  className="flex-grow md:w-64 px-3 py-2 bg-background-secondary border-2 border-border-primary text-foreground-primary placeholder:text-foreground-secondary/50 focus:outline-none focus:border-accent font-mono text-sm"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="px-4 py-2"
                >
                  <Send size={14} className="mr-2" />
                  <span className="hidden sm:inline">Join</span>
                </Button>
              </div>

              <div aria-live="polite" aria-atomic="true">
                {status === "success" && (
                  <p className="text-xs text-green-600 mt-2">
                    &gt;&gt; SUBSCRIPTION_CONFIRMED
                  </p>
                )}
                {status === "error" && (
                  <p className="text-xs text-accent mt-2">
                    &gt;&gt; ERROR: INVALID_EMAIL_FORMAT
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Decorative terminal footer */}
        <div className="border-t-2 border-accent/30 px-6 py-2 bg-background-secondary/30">
          <p className="text-[10px] font-mono text-foreground-secondary">
            ENCRYPTION: NONE | FREQUENCY: MONTHLY | UNSUBSCRIBE: ANYTIME
          </p>
        </div>
      </BrutalistBlock>
    </section>
  );
}
