"use client";

import { useState } from "react";
import { X, Mail, Cloud, AlertTriangle, MapPin, CheckCircle } from "lucide-react";

interface EmailCaptureProps {
  isOpen: boolean;
  type: "save" | "weekly" | "emergency" | null;
  locationName?: string;
  emergencyCondition?: string;
  onSubmit: (email: string) => void;
  onDismiss: () => void;
  isSubmitting: boolean;
  isSuccess: boolean;
}

export default function EmailCapture({
  isOpen,
  type,
  locationName,
  emergencyCondition,
  onSubmit,
  onDismiss,
  isSubmitting,
  isSuccess
}: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  if (!isOpen || !type) return null;

  const content = {
    save: {
      icon: <MapPin size={24} className="text-[var(--accent)]" />,
      title: "Save Your Weather Stations",
      subtitle: `You have multiple locations. Sync them across devices.`,
      cta: "Save Locations",
      value: "Access your weather data from any device. Never lose your saved locations.",
      urgency: false
    },
    weekly: {
      icon: <Cloud size={24} className="text-[var(--accent)]" />,
      title: "Weekly Survival Briefing",
      subtitle: locationName ? `Get Monday alerts for ${locationName}` : "Get weekly alerts for your location",
      cta: "Subscribe Free",
      value: "Fire risk updates, planting windows, livestock stress alerts delivered to your inbox.",
      urgency: false
    },
    emergency: {
      icon: <AlertTriangle size={24} className="text-red-500" />,
      title: `⚠️ ${emergencyCondition || "Weather Alert"}`,
      subtitle: locationName || "Your Location",
      cta: "Get Emergency Alerts",
      value: "Receive instant notifications when conditions change. Stay ahead of extreme weather.",
      urgency: true
    }
  };

  const currentContent = content[type];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && consent) {
      onSubmit(email);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="brutalist-block bg-background-primary max-w-md w-full p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Subscribed!</h3>
          <p className="text-sm opacity-70">
            Check your inbox for a confirmation email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`brutalist-block bg-background-primary max-w-md w-full p-6 relative ${
        currentContent.urgency ? 'border-red-500' : ''
      }`}>
        {/* Close button */}
        <button 
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 hover:bg-background-secondary transition-colors"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {currentContent.icon}
          <div>
            <h3 className="font-bold text-lg">{currentContent.title}</h3>
            <p className="text-xs opacity-70">{currentContent.subtitle}</p>
          </div>
        </div>

        {/* Value proposition */}
        <p className="text-sm mb-4 opacity-80">{currentContent.value}</p>

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
                className="w-full bg-background-secondary border border-border-primary pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                required
              />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
              required
            />
            <label htmlFor="consent" className="text-[10px] opacity-70 leading-tight">
              I agree to receive weather alerts and homesteading tips. 
              Unsubscribe anytime. No spam.
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !consent}
            className={`w-full py-3 font-bold uppercase text-sm transition-all ${
              currentContent.urgency
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-[var(--accent)] text-white hover:brightness-110'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Subscribing...
              </span>
            ) : (
              currentContent.cta
            )}
          </button>
        </form>

        {/* Trust signals */}
        <div className="mt-4 pt-3 border-t border-border-primary/30 text-[10px] opacity-50 text-center">
          <p>🔒 We never share your email. Powered by Homesteader Labs.</p>
        </div>
      </div>
    </div>
  );
}
