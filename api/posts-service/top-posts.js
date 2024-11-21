import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import { success, failure } from "../libs/response-lib";
import { appendRatings } from "../common/post-ratings";

var lastScanDate = 0;
var result;

export async function main() {
  if (
    lastScanDate === 0 ||
    result === undefined ||
    lastScanDate + 3600000 < new Date().getTime()
  ) {
    lastScanDate = new Date().getTime();

    let params = {
      TableName: "NaadanChordsTop",
      IndexName: "postType-views-index",
      KeyConditionExpression: "postType = :postType",
      ExpressionAttributeValues: {
        ":postType": "POST",
      },
      ProjectionExpression:
        "postId, title, userId, createdAt, updatedAt, popularityTrend, #views",
      ExpressionAttributeNames: {
        "#views": "views",
      },
      ScanIndexForward: false,
    };

    try {
      result = await dynamoDbLib.call("query", params);

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
    } catch (e) {
      return failure({ status: false, error: e });
    }
  }

  return success(result.Items);
}
