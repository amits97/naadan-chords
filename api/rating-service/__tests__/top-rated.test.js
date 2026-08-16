import { main } from "../top-rated";
import * as dynamoDbLib from "../../libs/dynamodb-lib";
import * as userNameLib from "../../libs/username-lib";
import * as postRatings from "../../common/post-ratings";
import * as postComments from "../../common/post-comments";

jest.mock("../../libs/dynamodb-lib");
jest.mock("../../libs/username-lib");
jest.mock("../../common/post-ratings");
jest.mock("../../common/post-comments");

describe("Rating Service - top-rated", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should query top rated posts, enrich author, ratings, and comments count", async () => {
    dynamoDbLib.call
      .mockResolvedValueOnce({
        Items: [
          {
            postId: "rated-post",
          },
        ],
      })
      .mockResolvedValueOnce({
        Item: {
          postId: "rated-post",
          title: "Top Rated Post",
          userId: "user-456",
        },
      });

    userNameLib.getAuthorAttributes.mockResolvedValueOnce({
      authorName: "Author 2",
      preferredUsername: "author2",
      picture: "pic2.jpg",
    });

    postRatings.appendRatings.mockImplementation(async (res) => {
      res.Items[0].rating = 5.0;
      res.Items[0].ratingCount = 25;
      return res;
    });

    postComments.appendCommentsCount.mockImplementation(async (res) => {
      res.Items[0].commentsCount = 12;
      return res;
    });

    const response = await main();
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      postId: "rated-post",
      title: "Top Rated Post",
      authorName: "Author 2",
      userName: "author2",
      authorPicture: "pic2.jpg",
      rating: 5.0,
      ratingCount: 25,
      commentsCount: 12,
    });
    expect(body[0].userId).toBeUndefined();

    expect(postRatings.appendRatings).toHaveBeenCalledTimes(1);
    expect(postComments.appendCommentsCount).toHaveBeenCalledTimes(1);
  });
});
