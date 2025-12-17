"use client";

import { useEffect, useState } from "react";
import { api } from "@/trpc/react";

const DISMISSAL_KEY = "subscription-prompt-dismissed";
const DISMISSAL_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function useSubscriptionPrompt() {
  const [shouldShow, setShouldShow] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  
  const { data: subscriptionAccess, isLoading: accessLoading } = 
    api.billing.getUserSubscriptionAccess.useQuery();
  
  const { data: userInfo, isLoading: userLoading } = 
    api.me.get.useQuery();

  useEffect(() => {
 

    // Don't check until we have the necessary data
    if (accessLoading || userLoading || hasChecked) {
      return;
    }

    // Don't show if user data is not ready
    if (!userInfo) {
      setHasChecked(true);
      return;
    }

    // Don't show if user already has subscription access
    if (subscriptionAccess?.hasAccess) {
      setHasChecked(true);
      return;
    }

    // Check if user recently dismissed the modal
    try {
      const dismissedAt = localStorage.getItem(DISMISSAL_KEY);
      if (dismissedAt) {
        const dismissedTime = parseInt(dismissedAt);
        const now = Date.now();
        
        // If dismissed within the last 24 hours, don't show
        if (!isNaN(dismissedTime) && now - dismissedTime < DISMISSAL_DURATION) {
       
          setHasChecked(true);
          return;
        } else if (!isNaN(dismissedTime)) {
          console.log("Dismissal expired, will show modal");
        }
      }
    } catch (error) {
      // If localStorage is not available or parsing fails, continue
      console.warn("Could not access localStorage for subscription prompt");
    }

    // Check if this is a fresh login/signup session
    try {
      const hasShownThisSession = sessionStorage.getItem("subscription-prompt-shown");
      if (hasShownThisSession) {
        setHasChecked(true);
        return;
      }
    } catch (error) {
      // If sessionStorage is not available, continue but don't prevent showing
      console.warn("Could not access sessionStorage for subscription prompt");
    }

    // Add a small delay to ensure the UI has loaded
    const timer = setTimeout(() => {
      setShouldShow(true);
      setHasChecked(true);
      
      // Mark as shown for this session
      try {
        sessionStorage.setItem("subscription-prompt-shown", "true");
      } catch (error) {
        console.warn("Could not save to sessionStorage");
      }
    }, 1000); // 1 second delay after login

    return () => clearTimeout(timer);
  }, [subscriptionAccess, userInfo, accessLoading, userLoading, hasChecked]);

  const hideModal = () => {
    setShouldShow(false);
  };

  // Debug function to clear storage and force show (for development)
  const forceShow = () => {
    console.log("Forcing modal to show...");
    try {
      localStorage.removeItem(DISMISSAL_KEY);
      sessionStorage.removeItem("subscription-prompt-shown");
    } catch (error) {
      console.warn("Could not clear storage");
    }
    setHasChecked(false);
    setShouldShow(true);
  };

  // Make forceShow available in development
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (window as any).forceShowSubscriptionPrompt = forceShow;
  }

  return {
    shouldShow: shouldShow && !accessLoading && !userLoading,
    hideModal,
    hasAccess: subscriptionAccess?.hasAccess || false,
    forceShow, // Export for debugging
  };
}