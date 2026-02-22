"use client";

import { useState, useCallback, useEffect } from "react";

interface EmailCaptureState {
  email: string;
  locationCount: number;
  isSubscribed: boolean;
  dismissedAt: string | null;
}

const STORAGE_KEY = "homesteader_weather_email_capture";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useWeatherEmailCapture(locationCount: number) {
  const [showCapture, setShowCapture] = useState(false);
  const [captureType, setCaptureType] = useState<"save" | "weekly" | "emergency" | null>(null);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Load state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state: EmailCaptureState = JSON.parse(saved);
      setEmail(state.email);
      
      // Check if dismissed recently
      if (state.dismissedAt) {
        const dismissedTime = new Date(state.dismissedAt).getTime();
        if (Date.now() - dismissedTime < DISMISS_DURATION) {
          return; // Don't show if dismissed within 7 days
        }
      }
      
      // Check if already subscribed
      if (state.isSubscribed) {
        return;
      }
    }
  }, []);

  // Trigger capture prompts based on context
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const state: EmailCaptureState = saved ? JSON.parse(saved) : {
      email: "",
      locationCount: 0,
      isSubscribed: false,
      dismissedAt: null
    };

    // Don't show if recently dismissed or already subscribed
    if (state.dismissedAt) {
      const dismissedTime = new Date(state.dismissedAt).getTime();
      if (Date.now() - dismissedTime < DISMISS_DURATION) return;
    }
    if (state.isSubscribed) return;

    // Show "Save Locations" prompt after adding 2nd location
    if (locationCount >= 2 && state.locationCount < 2) {
      setCaptureType("save");
      setShowCapture(true);
    }

    // Update stored location count
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      locationCount
    }));
  }, [locationCount]);

  // Manual trigger for weekly briefing
  const showWeeklyCapture = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const state: EmailCaptureState = saved ? JSON.parse(saved) : {
      email: "",
      locationCount: 0,
      isSubscribed: false,
      dismissedAt: null
    };

    if (!state.isSubscribed && !state.dismissedAt) {
      setCaptureType("weekly");
      setShowCapture(true);
    }
  }, []);

  // Emergency alert trigger
  const showEmergencyCapture = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const state: EmailCaptureState = saved ? JSON.parse(saved) : {
      email: "",
      locationCount: 0,
      isSubscribed: false,
      dismissedAt: null
    };

    if (!state.isSubscribed) {
      setCaptureType("emergency");
      setShowCapture(true);
    }
  }, []);

  const submitEmail = useCallback(async (emailValue: string, locationName?: string) => {
    setIsSubmitting(true);
    
    // Simulate API call - replace with actual email service
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store subscription
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      email: emailValue,
      locationCount,
      isSubscribed: true,
      dismissedAt: null
    }));
    
    // TODO: Send to email service (ConvertKit, Mailchimp, etc.)
    console.log("Email captured:", emailValue, "Type:", captureType, "Location:", locationName);
    
    setIsSubmitting(false);
    setIsSuccess(true);
    
    // Hide after 3 seconds
    setTimeout(() => {
      setShowCapture(false);
      setIsSuccess(false);
    }, 3000);
  }, [captureType, locationCount]);

  const dismiss = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const state: EmailCaptureState = saved ? JSON.parse(saved) : {
      email: "",
      locationCount: 0,
      isSubscribed: false,
      dismissedAt: null
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      dismissedAt: new Date().toISOString()
    }));

    setShowCapture(false);
  }, []);

  return {
    showCapture,
    captureType,
    email,
    setEmail,
    isSubmitting,
    isSuccess,
    submitEmail,
    dismiss,
    showWeeklyCapture,
    showEmergencyCapture
  };
}

export default useWeatherEmailCapture;
