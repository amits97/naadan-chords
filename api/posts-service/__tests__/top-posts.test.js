import { main } from "../top-posts";
import * as dynamoDbLib from "../../libs/dynamodb-lib";
import * as userNameLib from "../../libs/username-lib";
import * as postRatings from "../../common/post-ratings";
import * as postComments from "../../common/post-comments";

jest.mock("../../libs/dynamodb-lib");
jest.mock("../../libs/username-lib");
jest.mock("../../common/post-ratings");
jest.mock("../../common/post-comments");

describe("Posts Service - top-posts", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should query top posts, enrich author, ratings, and comments count", async () => {
    dynamoDbLib.call.mockResolvedValueOnce({
      Items: [
        {
          postId: "test-post",
          title: "Test Post",
          userId: "user-123",
        },
      ],
    });

    userNameLib.getAuthorAttributes.mockResolvedValueOnce({
      authorName: "Author 1",
      preferredUsername: "author1",
      picture: "pic.jpg",
    });

    postRatings.appendRatings.mockImplementation(async (res) => {
      res.Items[0].rating = 4.8;
      res.Items[0].ratingCount = 15;
      return res;
    });

    postComments.appendCommentsCount.mockImplementation(async (res) => {
      res.Items[0].commentsCount = 7;
      return res;
    });

    const response = await main();
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      postId: "test-post",
      title: "Test Post",
      authorName: "Author 1",
      userName: "author1",
      authorPicture: "pic.jpg",
      rating: 4.8,
      ratingCount: 15,
      commentsCount: 7,
    });
    expect(body[0].userId).toBeUndefined();

    expect(postRatings.appendRatings).toHaveBeenCalledTimes(1);
    expect(postComments.appendCommentsCount).toHaveBeenCalledTimes(1);
  });
});
