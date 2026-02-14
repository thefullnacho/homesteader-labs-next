"use client";

import { useState } from "react";
import { X, Mail, CheckCircle, Calendar } from "lucide-react";

interface PlantingEmailCaptureProps {
  isOpen: boolean;
  zipCode: string;
  cropCount: number;
  onSubmit: (email: string) => Promise<void>;
  onDismiss: () => void;
  isSubmitting: boolean;
  isSuccess: boolean;
}

export default function PlantingEmailCapture({
  isOpen,
  zipCode,
  cropCount,
  onSubmit,
  onDismiss,
  isSubmitting,
  isSuccess
}: PlantingEmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && consent) {
      await onSubmit(email);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="brutalist-block bg-theme-bg max-w-md w-full p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">You're All Set!</h3>
          <p className="text-sm opacity-70 mb-4">
            Check your inbox for a confirmation email with your planting calendar attached.
          </p>
          <div className="text-xs opacity-50">
            <p>Your first reminder: "What to plant this week"</p>
            <p>Customized for {zipCode} • {cropCount} crops</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="brutalist-block bg-theme-bg max-w-md w-full p-6 relative">
        {/* Close button */}
        <button 
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 hover:bg-theme-sub transition-colors"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[var(--accent)] rounded-full flex items-center justify-center">
            <Calendar size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">🌱 Get Planting Reminders</h3>
            <p className="text-xs opacity-70">Never miss a planting window again</p>
          </div>
        </div>

        {/* Value props */}
        <div className="bg-theme-sub/50 p-3 mb-4 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>"Time to start your tomatoes indoors"</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>"Direct sow lettuce this week"</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>"Last chance to plant fall crops"</span>
          </div>
          <div className="mt-2 pt-2 border-t border-theme-main/30 text-[10px] opacity-60">
            Customized for: {zipCode} • {cropCount} crops • Based on your frost dates
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase opacity-70 mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="homesteader@example.com"
                className="w-full bg-theme-sub border border-theme-main pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                required
              />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="planting-consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
              required
            />
            <label htmlFor="planting-consent" className="text-[10px] opacity-70 leading-tight">
              I want weekly planting reminders customized for my location and crops. 
              Unsubscribe anytime. No spam, ever.
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !consent}
            className="w-full bg-[var(--accent)] text-white py-3 font-bold uppercase text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Subscribing...
              </span>
            ) : (
              'Get My Planting Reminders'
            )}
          </button>
        </form>

        {/* Trust signals */}
        <div className="mt-4 pt-3 border-t border-theme-main/30 text-center">
          <p className="text-[10px] opacity-50">
            🔒 We never share your email • Powered by Homesteader Labs
          </p>
        </div>
      </div>
    </div>
  );
}
