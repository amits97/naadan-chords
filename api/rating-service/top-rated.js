import NodeCache from "node-cache";
import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import { success, failure } from "../libs/response-lib";
import { appendRatings } from "../common/post-ratings";
import { appendCommentsCount } from "../common/post-comments";

const cacheTTL = 3600; // 1 hour
const myCache = new NodeCache();

myCache.set("topRatedPosts", undefined, cacheTTL);

async function getPostDetails(postId) {
  const params = {
    TableName: "NaadanChords",
    ProjectionExpression:
      "postId, category, createdAt, updatedAt, postType, title, userId",
    Key: {
      postId,
    },
  };
  let result = await dynamoDbLib.call("get", params);
  return result.Item;
}

export async function main(event) {
  if (event?.queryStringParameters?.clearCache || event?.clearCache) {
    myCache.set("topRatedPosts", undefined);
  }

  if (!myCache.get("topRatedPosts")) {
    let params = {
      TableName: "NaadanChordsRatings",
      IndexName: "postType-weightedRating-index",
      KeyConditionExpression: "postType = :postType",
      ExpressionAttributeValues: {
        ":postType": "POST",
      },
      ScanIndexForward: false,
      Limit: 10,
    };

    try {
      let result = await dynamoDbLib.call("query", params);

      // Fetch post details (title, userId, category, etc.) from NaadanChords
      for (let i = 0; i < result.Items.length; i++) {
        const postDetails = await getPostDetails(result.Items[i].postId);
        if (postDetails) {
          result.Items[i] = {
            ...result.Items[i],
            ...postDetails,
          };
        }
      }

      let users = {};

      for (let i = 0; i < result.Items.length; i++) {
        let userId = result.Items[i].userId;

        if (userId && !users.hasOwnProperty(userId)) {
          users[userId] = {};

          //Get full attributes of author
          let authorAttributes = await userNameLib.getAuthorAttributes(userId);
          users[userId].authorName = authorAttributes.authorName;
          users[userId].userName =
            authorAttributes.preferredUsername ?? authorAttributes.userName;
          users[userId].authorPicture = authorAttributes.picture;
        }

        delete result.Items[i].userId;
        result.Items[i].authorName = users[userId]?.authorName || "";
        result.Items[i].userName = users[userId]?.userName || "";
        result.Items[i].authorPicture = users[userId]?.authorPicture || "";
      }

      //append ratings
      result = await appendRatings(result);

      //append comments count
      result = await appendCommentsCount(result);
      myCache.set("topRatedPosts", result.Items, cacheTTL);
    } catch (e) {
      return failure({ status: false, error: e?.message || e });
    }
  }

  return success(myCache.get("topRatedPosts"));
}
