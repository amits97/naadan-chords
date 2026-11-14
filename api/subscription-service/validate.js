import config from "../config";
import { success, failure } from "../libs/response-lib";
import * as cognitoLib from "../libs/cognito-lib";
import * as userNameLib from "../libs/username-lib";
import * as dynamoDbLib from "../libs/dynamodb-lib";
import axios from "axios";

/**
 * Validates Google Play subscription against the Google Play Developer API
 *
 * Request body should contain:
 * {
 *   "purchaseToken": "string (from Cognito custom:gPlayToken)"
 * }
 *
 * Returns:
 * {
 *   "isValid": true/false,
 *   "isPremium": true/false,
 *   "linkedToAnotherAccount": true/false,
 *   "subscriptionState": "ACTIVE|EXPIRED|CANCELED|PENDING",
 *   "message": "string"
 * }
 *
 * A purchase token can unlock only one account: the first account to validate
 * it owns it (SUBSCRIPTIONS_TABLE), and any other account is refused.
 */
const SUBSCRIPTIONS_TABLE = "NaadanChordsSubscriptions";
const SUBSCRIPTION_ATTRIBUTES = [
  "custom:gPlayToken",
  "custom:isPremium",
  "custom:subscriptionState",
  "custom:subValidatedAt",
  "custom:subExpiryTime",
];
export async function main(event) {
  // Get the authenticated user from the request context
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  if (!provider) {
    return failure({
      error: "Unauthorized",
      message: "User is not authenticated",
    });
  }

  const sub = provider.split(":")[2];

  let usernameAttributes;
  try {
    usernameAttributes = await userNameLib.getAuthorAttributes(sub);
  } catch (e) {
    return failure({
      e,
      error: "Validation failed",
      message: "User does not exist.",
    });
  }

  try {
    const data = JSON.parse(event.body);
    const purchaseToken = data.purchaseToken;

    if (!purchaseToken) {
      return failure({
        error: "Missing purchaseToken",
        message: "purchaseToken is required in request body",
      });
    }

    // Get Google Play credentials from environment variables
    const googlePlayPackage = process.env.GOOGLE_PLAY_PACKAGE_NAME;
    const googlePlayCredentials = JSON.parse(
      process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || "{}",
    );

    if (!googlePlayPackage || !googlePlayCredentials.client_email) {
      console.error("Missing Google Play configuration");
      return failure({
        error: "Configuration error",
        message: "Google Play API credentials not configured",
      });
    }

    // Get access token from Google
    const accessToken = await getGoogleAccessToken(googlePlayCredentials);

    // Call Google Play API to validate subscription
    const subscriptionData = await validateSubscriptionWithGoogle(
      googlePlayPackage,
      purchaseToken,
      accessToken,
    );

    // Determine if subscription is valid and active
    // Active states: SUBSCRIPTION_STATE_ACTIVE, SUBSCRIPTION_STATE_IN_GRACE_PERIOD, or SUBSCRIPTION_STATE_CANCELED (if not expired)
    const isStateValid =
      subscriptionData.subscriptionState === "SUBSCRIPTION_STATE_ACTIVE" ||
      subscriptionData.subscriptionState === "SUBSCRIPTION_STATE_CANCELED" ||
      subscriptionData.subscriptionState ===
        "SUBSCRIPTION_STATE_IN_GRACE_PERIOD";

    const isNotExpired =
      !subscriptionData.expiryTime ||
      new Date(subscriptionData.expiryTime).getTime() > Date.now();

    const isValid = isStateValid && isNotExpired;

    if (isStateValid) {
      const linked = await linkPurchaseToUser(
        purchaseToken,
        sub,
        usernameAttributes.userName,
      );
      if (!linked) {
        await clearSubscriptionAttributesIfTokenMatches(
          usernameAttributes.userName,
          purchaseToken,
        );
        return success({
          isValid: false,
          isPremium: false,
          linkedToAnotherAccount: true,
          subscriptionState: subscriptionData.subscriptionState,
          message: "This subscription is already linked to another account",
        });
      }
    } else {
      await clearSubscriptionAttributesIfTokenMatches(
        usernameAttributes.userName,
        purchaseToken,
      );
      return success({
        isValid: false,
        isPremium: false,
        subscriptionState: subscriptionData.subscriptionState,
        message: "Subscription is not active or has expired",
        expiryTime: subscriptionData.expiryTime
          ? new Date(subscriptionData.expiryTime).getTime().toString()
          : null,
      });
    }

    // Subscription is linked to this account - store the subscription data
    const userAttributes = [
      {
        Name: "custom:gPlayToken",
        Value: purchaseToken,
      },
      {
        Name: "custom:isPremium",
        Value: isValid ? "true" : "false",
      },
      {
        Name: "custom:subscriptionState",
        Value: subscriptionData.subscriptionState || "UNKNOWN",
      },
      {
        Name: "custom:subValidatedAt",
        Value: new Date().toISOString(),
      },
    ];

    if (subscriptionData.expiryTime) {
      userAttributes.push({
        Name: "custom:subExpiryTime",
        Value: new Date(subscriptionData.expiryTime).getTime().toString(),
      });
    }

    await cognitoLib.call("adminUpdateUserAttributes", {
      UserPoolId: config.cognito.USER_POOL_ID,
      Username: usernameAttributes.userName,
      UserAttributes: userAttributes,
    });

    return success({
      isValid,
      isPremium: isValid,
      subscriptionState: subscriptionData.subscriptionState,
      message: isValid
        ? "Subscription is active and valid"
        : "Subscription is not active or has expired",
      expiryTime: subscriptionData.expiryTime
        ? new Date(subscriptionData.expiryTime).getTime().toString()
        : null,
    });
  } catch (error) {
    console.error("Error validating subscription:", error);
    return failure({
      error: "Validation failed",
      message:
        error.message || "Failed to validate subscription with Google Play",
    });
  }
}

/**
 * Link a purchase token to a user. Returns false if the token is already
 * linked to a different user.
 */
async function linkPurchaseToUser(purchaseToken, userId, userName) {
  const now = new Date().toISOString();
  try {
    await dynamoDbLib.call("update", {
      TableName: SUBSCRIPTIONS_TABLE,
      Key: { purchaseToken },
      UpdateExpression:
        "SET userId = :userId, userName = :userName, lastValidatedAt = :now, linkedAt = if_not_exists(linkedAt, :now)",
      ConditionExpression:
        "attribute_not_exists(purchaseToken) OR userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":userName": userName,
        ":now": now,
      },
    });
    return true;
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return false;
    }
    throw error;
  }
}

/**
 * Clear the user's subscription attributes, but only if they hold this token,
 * so a token from another device can't wipe the user's own subscription.
 */
async function clearSubscriptionAttributesIfTokenMatches(
  userName,
  purchaseToken,
) {
  const user = await cognitoLib.call("adminGetUser", {
    UserPoolId: config.cognito.USER_POOL_ID,
    Username: userName,
  });
  const storedToken = (user.UserAttributes || []).find(
    (attribute) => attribute.Name === "custom:gPlayToken",
  )?.Value;

  if (storedToken !== purchaseToken) {
    return;
  }

  await cognitoLib.call("adminUpdateUserAttributes", {
    UserPoolId: config.cognito.USER_POOL_ID,
    Username: userName,
    UserAttributes: SUBSCRIPTION_ATTRIBUTES.map((Name) => ({
      Name,
      Value: "",
    })),
  });
}

/**
 * Get OAuth access token from Google Service Account
 */
async function getGoogleAccessToken(serviceAccount) {
  const jwt = require("jsonwebtoken");
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };

  const signedJwt = jwt.sign(payload, serviceAccount.private_key, {
    algorithm: "RS256",
    header: header,
  });

  try {
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    });

    return response.data.access_token;
  } catch (error) {
    throw new Error(`Failed to get Google access token: ${error.message}`);
  }
}

/**
 * Validate subscription with Google Play Developer API
 */
async function validateSubscriptionWithGoogle(
  packageName,
  purchaseToken,
  accessToken,
) {
  // Validate input to prevent SSRF or malformed URLs
  if (!/^[a-zA-Z0-9._]+$/.test(packageName)) {
    throw new Error("Invalid package name format");
  }
  if (!/^[a-zA-Z0-9._:-]+$/.test(purchaseToken)) {
    throw new Error("Invalid purchase token format");
  }

  try {
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("Purchase token not found or invalid");
    }
    throw new Error(`Google Play API error: ${error.message}`);
  }
}
