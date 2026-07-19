import * as commentsList from "../comments-list";
import * as commentWrite from "../comment-write";
import * as commentDelete from "../comment-delete";
import * as commentLike from "../comment-like";
import * as dynamoDbLib from "../../libs/dynamodb-lib";
import * as userNameLib from "../../libs/username-lib";
import * as emailLib from "../../libs/email-lib";

jest.mock("uuid", () => ({
  v4: () => "mocked-uuid-123"
}));
jest.mock("../../libs/dynamodb-lib");
jest.mock("../../libs/username-lib");
jest.mock("../../libs/email-lib");

describe("Comments Service", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("comments-list", () => {
    it("should fetch comments list using GSI query and comment replies using key query", async () => {
      // Mock main post comments list query
      dynamoDbLib.call.mockResolvedValueOnce({
        Items: [
          {
            commentId: "comment-1",
            userId: "user-1",
            postId: "post-1",
            content: "Top level comment",
            createdAt: 1000,
            replies: ["reply-1"]
          }
        ]
      });

      // Mock fetchReplyComment query
      dynamoDbLib.call.mockResolvedValueOnce({
        Items: [
          {
            commentId: "reply-1",
            userId: "user-2",
            parentCommentId: "comment-1",
            content: "Reply comment",
            createdAt: 1050
          }
        ]
      });

      // Mock user details lookups
      userNameLib.getAuthorAttributes.mockImplementation(async (userId) => {
        if (userId === "user-1") {
          return { authorName: "User One", preferredUsername: "user1", picture: "pic1" };
        }
        return { authorName: "User Two", preferredUsername: "user2", picture: "pic2" };
      });

      const event = {
        queryStringParameters: { postId: "post-1" }
      };

      const response = await commentsList.main(event);
      expect(response.statusCode).toBe(200);

      // Verify DynamoDB calls:
      // 1. First call: List query using postId index
      expect(dynamoDbLib.call).toHaveBeenNthCalledWith(1, "query", expect.objectContaining({
        TableName: "NaadanChordsComments",
        IndexName: "postId-createdAt-index",
        KeyConditionExpression: "postId = :postId"
      }));

      // 2. Second call: Reply query using partition key
      expect(dynamoDbLib.call).toHaveBeenNthCalledWith(2, "query", expect.objectContaining({
        TableName: "NaadanChordsComments",
        KeyConditionExpression: "commentId = :commentId",
        ExpressionAttributeValues: { ":commentId": "reply-1" }
      }));

      const body = JSON.parse(response.body);
      expect(body.Items[0].authorName).toBe("User One");
      expect(body.Items[0].repliesList[0].authorName).toBe("User Two");
    });
  });

  describe("comment-write", () => {
    it("should write new comment successfully and send email notification", async () => {
      // Mock dynamo write call (put)
      dynamoDbLib.call.mockResolvedValueOnce({});
      // Mock fetchPostDetails inside sendEmailToAuthor
      dynamoDbLib.call.mockResolvedValueOnce({
        Item: { title: "Some Post", postId: "post-1", userId: "author-1" }
      });
      // Mock author attributes lookup inside sendEmailToAuthor
      userNameLib.getAuthorEmail.mockResolvedValue("author@example.com");

      // Mock author attributes lookup for the responding comment object
      userNameLib.getAuthorAttributes.mockResolvedValue({
        authorName: "User One",
        preferredUsername: "user1",
        picture: "pic1"
      });

      const event = {
        body: JSON.stringify({
          postId: "post-1",
          content: "Hello world"
        }),
        requestContext: {
          identity: {
            cognitoAuthenticationProvider: "cognito-idp:CognitoSignIn:user-1"
          }
        }
      };

      const response = await commentWrite.main(event);
      expect(response.statusCode).toBe(200);

      // Verify comment was written
      expect(dynamoDbLib.call).toHaveBeenNthCalledWith(1, "put", expect.objectContaining({
        TableName: "NaadanChordsComments"
      }));

      const body = JSON.parse(response.body);
      expect(body.authorName).toBe("User One");
      expect(body.content).toBe("Hello world");
    });

    it("should write reply comment using query to fetch parent", async () => {
      // Mock put call for the reply comment itself
      dynamoDbLib.call.mockResolvedValueOnce({});

      // Mock parent comment fetch (via query) - must contain postId so loop terminates
      dynamoDbLib.call.mockResolvedValueOnce({
        Items: [{ commentId: "parent-1", userId: "user-parent", postId: "post-1", replies: [] }]
      });

      // Mock update to parent comment's replies array
      dynamoDbLib.call.mockResolvedValueOnce({});

      // Mock post lookup inside sendEmailToParentCommentAuthor
      dynamoDbLib.call.mockResolvedValueOnce({
        Item: { title: "Some Post", postId: "post-1", userId: "parent-author" }
      });

      // Mock user email lookup
      userNameLib.getAuthorEmail.mockResolvedValue("parent@example.com");

      // Mock author attributes for return object
      userNameLib.getAuthorAttributes.mockResolvedValue({
        authorName: "User Child",
        preferredUsername: "userchild",
        picture: "picchild"
      });

      const event = {
        body: JSON.stringify({
          parentCommentId: "parent-1",
          content: "Replying"
        }),
        requestContext: {
          identity: {
            cognitoAuthenticationProvider: "cognito-idp:CognitoSignIn:user-child"
          }
        }
      };

      const response = await commentWrite.main(event);
      expect(response.statusCode).toBe(200);

      // Verify dynamo calls:
      // Call 1 is "put"
      expect(dynamoDbLib.call).toHaveBeenNthCalledWith(1, "put", expect.objectContaining({
        TableName: "NaadanChordsComments"
      }));

      // Call 2 is query parent
      expect(dynamoDbLib.call).toHaveBeenNthCalledWith(2, "query", expect.objectContaining({
        TableName: "NaadanChordsComments",
        KeyConditionExpression: "commentId = :commentId",
        ExpressionAttributeValues: { ":commentId": "parent-1" }
      }));

      // Call 3 is update parent
      expect(dynamoDbLib.call).toHaveBeenNthCalledWith(3, "update", expect.objectContaining({
        TableName: "NaadanChordsComments",
        Key: { commentId: "parent-1", userId: "user-parent" }
      }));
    });
  });

  describe("comment-delete", () => {
    it("should delete comment and its replies", async () => {
      // Mock delete authorization check (get comment)
      dynamoDbLib.call.mockResolvedValueOnce({
        Item: { commentId: "comment-1", userId: "user-1", replies: ["reply-1"] }
      });

      // Mock fetchComment query for replies
      dynamoDbLib.call.mockResolvedValueOnce({
        Items: [{ commentId: "reply-1", userId: "user-2", replies: [] }]
      });

      // Mock child delete
      dynamoDbLib.call.mockResolvedValueOnce({});

      // Mock parent delete
      dynamoDbLib.call.mockResolvedValueOnce({});

      const event = {
        pathParameters: { commentId: "comment-1" },
        requestContext: {
          identity: {
            cognitoAuthenticationProvider: "cognito-idp:CognitoSignIn:user-1"
          }
        }
      };

      const response = await commentDelete.main(event);
      expect(response.statusCode).toBe(200);

      // Verifying child fetch was a query
      expect(dynamoDbLib.call).toHaveBeenCalledWith("query", expect.objectContaining({
        TableName: "NaadanChordsComments",
        KeyConditionExpression: "commentId = :commentId",
        ExpressionAttributeValues: { ":commentId": "reply-1" }
      }));
    });
  });

  describe("comment-like", () => {
    it("should like comment using query to fetch comment", async () => {
      // Mock fetch comment (query)
      dynamoDbLib.call.mockResolvedValueOnce({
        Items: [{ commentId: "comment-1", userId: "user-author", likes: [] }]
      });

      // Mock update call
      dynamoDbLib.call.mockResolvedValueOnce({});

      const event = {
        body: JSON.stringify({ commentId: "comment-1" }),
        requestContext: {
          identity: {
            cognitoAuthenticationProvider: "cognito-idp:CognitoSignIn:user-liker"
          }
        }
      };

      const response = await commentLike.main(event);
      expect(response.statusCode).toBe(200);

      // Verify lookup was a query
      expect(dynamoDbLib.call).toHaveBeenNthCalledWith(1, "query", expect.objectContaining({
        TableName: "NaadanChordsComments",
        KeyConditionExpression: "commentId = :commentId",
        ExpressionAttributeValues: { ":commentId": "comment-1" }
      }));
    });
  });
});
