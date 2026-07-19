import { appendRatings } from "../post-ratings";
import { appendCommentsCount } from "../post-comments";
import * as dynamoDbLib from "../../libs/dynamodb-lib";

jest.mock("../../libs/dynamodb-lib");

describe("Common Helpers", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("appendRatings", () => {
    it("should fetch ratings for all items in parallel using get and append them", async () => {
      // Mock get calls for two post IDs
      dynamoDbLib.call
        .mockResolvedValueOnce({
          Item: { postId: "post-1", rating: 4.5, count: 10 }
        })
        .mockResolvedValueOnce({
          Item: { postId: "post-2", rating: 5.0, count: 2 }
        });

      const result = {
        Items: [
          { postId: "post-1", title: "Post One" },
          { postId: "post-2", title: "Post Two" }
        ]
      };

      const finalResult = await appendRatings(result);

      // Verify DynamoDB calls were gets for the specific postIds
      expect(dynamoDbLib.call).toHaveBeenCalledTimes(2);
      expect(dynamoDbLib.call).toHaveBeenNthCalledWith(1, "get", {
        TableName: "NaadanChordsRatings",
        Key: { postId: "post-1" }
      });
      expect(dynamoDbLib.call).toHaveBeenNthCalledWith(2, "get", {
        TableName: "NaadanChordsRatings",
        Key: { postId: "post-2" }
      });

      // Verify ratings mapping
      expect(finalResult.Items[0].rating).toBe(4.5);
      expect(finalResult.Items[0].ratingCount).toBe(10);
      expect(finalResult.Items[1].rating).toBe(5.0);
      expect(finalResult.Items[1].ratingCount).toBe(2);
    });
  });

  describe("appendCommentsCount", () => {
    it("should query GSI index for each post in parallel and recursively calculate count", async () => {
      // Mock GSI query for post-1 (returns 1 top level comment which has 1 reply)
      dynamoDbLib.call.mockResolvedValueOnce({
        Items: [
          {
            commentId: "comment-1",
            postId: "post-1",
            replies: ["reply-1"]
          }
        ]
      });

      // Mock GSI query for post-2 (returns 0 comments)
      dynamoDbLib.call.mockResolvedValueOnce({
        Items: []
      });

      // Mock recursive countReplyComments call for reply-1 (key query)
      dynamoDbLib.call.mockResolvedValueOnce({
        Items: [
          {
            commentId: "reply-1",
            parentCommentId: "comment-1",
            replies: []
          }
        ]
      });

      const result = {
        Items: [
          { postId: "post-1", title: "Post One" },
          { postId: "post-2", title: "Post Two" }
        ]
      };

      const finalResult = await appendCommentsCount(result);

      // Verify calls:
      // First 2 calls: GSI query on post-1 and post-2
      expect(dynamoDbLib.call).toHaveBeenNthCalledWith(1, "query", expect.objectContaining({
        TableName: "NaadanChordsComments",
        IndexName: "postId-createdAt-index",
        KeyConditionExpression: "postId = :postId",
        ExpressionAttributeValues: { ":postId": "post-1" }
      }));

      expect(dynamoDbLib.call).toHaveBeenNthCalledWith(2, "query", expect.objectContaining({
        TableName: "NaadanChordsComments",
        IndexName: "postId-createdAt-index",
        KeyConditionExpression: "postId = :postId",
        ExpressionAttributeValues: { ":postId": "post-2" }
      }));

      // Third call: fetch reply-1 via partition key query
      expect(dynamoDbLib.call).toHaveBeenNthCalledWith(3, "query", expect.objectContaining({
        TableName: "NaadanChordsComments",
        KeyConditionExpression: "commentId = :commentId",
        ExpressionAttributeValues: { ":commentId": "reply-1" }
      }));

      // Verify comment counts:
      // post-1 has 1 top level comment + 1 reply = 2
      expect(finalResult.Items[0].commentsCount).toBe(2);
      // post-2 has 0 comments = undefined or missing
      expect(finalResult.Items[1].commentsCount).toBeUndefined();
    });
  });
});
