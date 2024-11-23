import NodeCache from "node-cache";
import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import { success, failure } from "../libs/response-lib";
import { appendRatings } from "../common/post-ratings";

const cacheTTL = 3600; // 1 hour
const myCache = new NodeCache();

myCache.set("topRatedPosts", undefined, cacheTTL);

export async function main() {
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

      let users = {};

      for (let i = 0; i < result.Items.length; i++) {
        let userId = result.Items[i].userId;

        if (!users.hasOwnProperty(userId)) {
          users[userId] = {};

          //Get full attributes of author
          let authorAttributes = await userNameLib.getAuthorAttributes(userId);
          users[userId].authorName = authorAttributes.authorName;
          users[userId].userName =
            authorAttributes.preferredUsername ?? authorAttributes.userName;
          users[userId].authorPicture = authorAttributes.picture;
        }

        delete result.Items[i].userId;
        result.Items[i].authorName = users[userId].authorName;
        result.Items[i].userName = users[userId].userName;
        result.Items[i].authorPicture = users[userId].authorPicture;
      }

      //append ratings
      result = await appendRatings(result);
      myCache.set("topRatedPosts", result.Items, cacheTTL);
    } catch (e) {
      return failure({ status: false, error: e });
    }
  }

  return success(myCache.get("topRatedPosts"));
}
