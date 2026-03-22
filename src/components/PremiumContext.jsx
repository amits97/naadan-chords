import React, { createContext, useContext } from "react";

/**
 * PremiumContext - Global context for managing premium subscription status
 *
 * This context provides access to the user's premium status (isPremium flag)
 * which is synced from the Cognito custom:isPremium attribute.
 *
 * Premium users have the ad-free experience on the web app:
 * - Ads are hidden when isPremium is true
 * - Ads are visible when isPremium is false
 */
export const PremiumContext = createContext({
  isPremium: false,
});

/**
 * Custom hook to access the premium context
 * Usage: const { isPremium } = usePremium();
 */
export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error("usePremium must be used within a PremiumProvider");
  }
  return context;
};

/**
 * PremiumProvider - Wraps the app to provide premium context
 * This component should wrap your app at the top level (in index.jsx or equivalent)
 *
 * Props:
 *   - isPremium: boolean indicating if the user has premium access
 *   - children: React components to be wrapped
 */
export const PremiumProvider = ({ isPremium = false, children }) => {
  const value = {
    isPremium,
  };

  return (
    <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
  );
};

export default PremiumContext;
