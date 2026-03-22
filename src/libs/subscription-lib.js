import { API } from "./utils";

/**
 * Subscription Validation Library
 *
 * Handles communication with the backend Lambda for validating
 * Google Play subscriptions against the Google Play Developer API
 */

/**
 * Validates a Google Play subscription by calling the backend Lambda
 *
 * @param {string} purchaseToken - Google Play purchase token from Cognito
 * @returns {Promise<Object>} - Validation result with isPremium flag
 *
 * @example
 * const result = await validateSubscription(purchaseToken);
 * if (result.isPremium) {
 *   // Hide ads
 * }
 */
export async function validateSubscription(purchaseToken) {
  try {
    if (!purchaseToken) {
      console.warn("No purchase token provided for subscription validation");
      return {
        isValid: false,
        isPremium: false,
        message: "No purchase token available",
      };
    }

    const response = await API.post("posts", "/subscription/validate", {
      body: {
        purchaseToken,
      },
    });

    if (response && response.isPremium !== undefined) {
      return {
        isValid: response.isValid || false,
        isPremium: response.isPremium || false,
        subscriptionState: response.subscriptionState,
        expiryTime: response.expiryTime,
        message: response.message,
      };
    }

    throw new Error("Invalid response from subscription validation API");
  } catch (error) {
    console.error("Subscription validation error:", error);

    // Log the error but don't fail authentication
    // If validation fails, assume premium = false to be conservative
    return {
      isValid: false,
      isPremium: false,
      error: error.message || "Subscription validation failed",
      message: "Could not validate subscription status",
    };
  }
}

/**
 * Performs a refresh of subscription status
 * This is useful when you want to check if a subscription has expired
 * without requiring a full re-authentication flow
 *
 * @param {string} purchaseToken - Google Play purchase token (from custom:gPlayToken)
 * @returns {Promise<Object>} - Updated premium status
 */
export async function refreshSubscriptionStatus(purchaseToken) {
  return validateSubscription(purchaseToken);
}

/**
 * Should be called on app startup/login to validate subscription
 * Returns the premium status which should be stored in app state
 *
 * @param {string} purchaseToken - Google Play purchase token from user attributes
 * @param {boolean} currentIsPremium - Current isPremium flag from Cognito
 * @returns {Promise<boolean>} - Validated premium status
 */
export async function syncSubscriptionStatus(purchaseToken, currentIsPremium) {
  // If user doesn't have a purchase token, they're not premium
  if (!purchaseToken) {
    return false;
  }

  // If validation endpoint is available, use it to verify
  try {
    const validationResult = await validateSubscription(purchaseToken);

    // Return the validated result
    return validationResult.isPremium;
  } catch (error) {
    console.warn("Failed to validate subscription, using cached value:", error);
    // Fall back to the Cognito value if validation fails
    return currentIsPremium || false;
  }
}

export default {
  validateSubscription,
  refreshSubscriptionStatus,
  syncSubscriptionStatus,
};
