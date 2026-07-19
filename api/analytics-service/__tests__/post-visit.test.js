import { main } from "../post-visit";
import * as dynamoDbLib from "../../libs/dynamodb-lib";

jest.mock("../../libs/dynamodb-lib");

describe("Analytics Service - post-visit", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should successfully record a visit and append the correct TTL (21 days in the future)", async () => {
    // 1. Mock the history query (return no recent visits)
    dynamoDbLib.call.mockResolvedValueOnce({
      Items: []
    });

    // 2. Mock the put call
    dynamoDbLib.call.mockResolvedValueOnce({});

    const event = {
      body: JSON.stringify({ postId: "post-123" }),
      requestContext: {
        identity: {
          sourceIp: "127.0.0.1"
        }
      }
    };

    const response = await main(event);
    expect(response.statusCode).toBe(200);

    // Verify history query
    expect(dynamoDbLib.call).toHaveBeenNthCalledWith(1, "query", expect.objectContaining({
      TableName: "NaadanChordsAnalytics",
      IndexName: "ipAddress-postId-index"
    }));

    // Verify put call includes correct TTL (epoch seconds)
    const expectedTtlMin = Math.floor((Date.now() + 21 * 24 * 60 * 60 * 1000 - 5000) / 1000);
    const expectedTtlMax = Math.floor((Date.now() + 21 * 24 * 60 * 60 * 1000 + 5000) / 1000);

    expect(dynamoDbLib.call).toHaveBeenNthCalledWith(2, "put", expect.objectContaining({
      TableName: "NaadanChordsAnalytics",
      Item: expect.objectContaining({
        postId: "post-123",
        ipAddress: "127.0.0.1",
        ttl: expect.any(Number)
      })
    }));

    const putItem = dynamoDbLib.call.mock.calls[1][1].Item;
    expect(putItem.ttl).toBeGreaterThanOrEqual(expectedTtlMin);
    expect(putItem.ttl).toBeLessThanOrEqual(expectedTtlMax);
  });

  it("should return early without writing if already visited within the last hour", async () => {
    // Mock the history query (returns a visit from 30 minutes ago)
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    dynamoDbLib.call.mockResolvedValueOnce({
      Items: [
        {
          timestamp: thirtyMinutesAgo,
          postId: "post-123",
          ipAddress: "127.0.0.1"
        }
      ]
    });

    const event = {
      body: JSON.stringify({ postId: "post-123" }),
      requestContext: {
        identity: {
          sourceIp: "127.0.0.1"
        }
      }
    };

    const response = await main(event);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body).toBe("Already visited within last hour");

    // Should only query, not put
    expect(dynamoDbLib.call).toHaveBeenCalledTimes(1);
    expect(dynamoDbLib.call).toHaveBeenCalledWith("query", expect.any(Object));
  });
});
