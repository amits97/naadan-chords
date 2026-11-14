import axios from "axios";
import { main } from "../validate";
import * as dynamoDbLib from "../../libs/dynamodb-lib";
import * as cognitoLib from "../../libs/cognito-lib";
import * as userNameLib from "../../libs/username-lib";

jest.mock("axios");
jest.mock("jsonwebtoken", () => ({ sign: jest.fn(() => "signed-jwt") }));
jest.mock("../../libs/dynamodb-lib");
jest.mock("../../libs/cognito-lib");
jest.mock("../../libs/username-lib");

const TOKEN = "purchase.token-123";

function event(sub, purchaseToken = TOKEN) {
  return {
    requestContext: {
      identity: {
        cognitoAuthenticationProvider: `cognito-idp.ap-south-1.amazonaws.com/pool,cognito-idp.ap-south-1.amazonaws.com/pool:CognitoSignIn:${sub}`,
      },
    },
    body: JSON.stringify({ purchaseToken }),
  };
}

function mockGoogle(subscriptionState, expiryTime = "2099-01-01T00:00:00Z") {
  axios.post.mockResolvedValue({ data: { access_token: "google-token" } });
  axios.get.mockResolvedValue({ data: { subscriptionState, expiryTime } });
}

function conditionalCheckFailed() {
  const error = new Error("The conditional request failed");
  error.name = "ConditionalCheckFailedException";
  return error;
}

function attributeUpdates() {
  return cognitoLib.call.mock.calls
    .filter(([action]) => action === "adminUpdateUserAttributes")
    .map(([, params]) => params);
}

describe("Subscription Service - validate", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.GOOGLE_PLAY_PACKAGE_NAME = "com.amitsn.naadanchords";
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = JSON.stringify({
      client_email: "svc@example.com",
      private_key: "key",
    });
    userNameLib.getAuthorAttributes.mockResolvedValue({ userName: "alice" });
  });

  it("links an unclaimed token to the account and stores it on the account", async () => {
    mockGoogle("SUBSCRIPTION_STATE_ACTIVE");
    dynamoDbLib.call.mockResolvedValue({});

    const response = await main(event("sub-alice"));
    const body = JSON.parse(response.body);

    expect(body).toMatchObject({ isValid: true, isPremium: true });
    expect(dynamoDbLib.call).toHaveBeenCalledWith(
      "update",
      expect.objectContaining({
        TableName: "NaadanChordsSubscriptions",
        Key: { purchaseToken: TOKEN },
        ConditionExpression:
          "attribute_not_exists(purchaseToken) OR userId = :userId",
        ExpressionAttributeValues: expect.objectContaining({
          ":userId": "sub-alice",
        }),
      }),
    );
    const [update] = attributeUpdates();
    expect(update.Username).toBe("alice");
    expect(update.UserAttributes).toEqual(
      expect.arrayContaining([
        { Name: "custom:gPlayToken", Value: TOKEN },
        { Name: "custom:isPremium", Value: "true" },
      ]),
    );
  });

  it("refuses a token linked to another account and clears it from this account", async () => {
    mockGoogle("SUBSCRIPTION_STATE_ACTIVE");
    dynamoDbLib.call.mockRejectedValue(conditionalCheckFailed());
    cognitoLib.call.mockImplementation(async (action) =>
      action === "adminGetUser"
        ? { UserAttributes: [{ Name: "custom:gPlayToken", Value: TOKEN }] }
        : {},
    );

    const response = await main(event("sub-bob"));
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(body).toMatchObject({
      isValid: false,
      isPremium: false,
      linkedToAnotherAccount: true,
    });
    const [update] = attributeUpdates();
    expect(update.UserAttributes).toEqual(
      expect.arrayContaining([
        { Name: "custom:gPlayToken", Value: "" },
        { Name: "custom:isPremium", Value: "" },
      ]),
    );
  });

  it("does not touch an account's own subscription when refusing another token", async () => {
    mockGoogle("SUBSCRIPTION_STATE_ACTIVE");
    dynamoDbLib.call.mockRejectedValue(conditionalCheckFailed());
    cognitoLib.call.mockImplementation(async (action) =>
      action === "adminGetUser"
        ? {
            UserAttributes: [
              { Name: "custom:gPlayToken", Value: "own.token-456" },
            ],
          }
        : {},
    );

    const body = JSON.parse((await main(event("sub-bob"))).body);

    expect(body.linkedToAnotherAccount).toBe(true);
    expect(attributeUpdates()).toHaveLength(0);
  });

  it("clears an expired subscription without linking it", async () => {
    mockGoogle("SUBSCRIPTION_STATE_EXPIRED", "2020-01-01T00:00:00Z");
    cognitoLib.call.mockImplementation(async (action) =>
      action === "adminGetUser"
        ? { UserAttributes: [{ Name: "custom:gPlayToken", Value: TOKEN }] }
        : {},
    );

    const body = JSON.parse((await main(event("sub-alice"))).body);

    expect(body).toMatchObject({ isValid: false, isPremium: false });
    expect(dynamoDbLib.call).not.toHaveBeenCalled();
    expect(attributeUpdates()[0].UserAttributes).toEqual(
      expect.arrayContaining([{ Name: "custom:isPremium", Value: "" }]),
    );
  });
});
