import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import { success, failure } from "../libs/response-lib";
import { appendRatings } from "../common/post-ratings";

export async function main() {
  let params = {
    TableName: "NaadanChordsTop",
    IndexName: "postType-views-index",
    KeyConditionExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":postType": "POST",
    },
    ProjectionExpression: "postId, title, userId, createdAt, updatedAt, #views",
    ExpressionAttributeNames: {
      "#views": "views",
    },
    ScanIndexForward: false,
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
    let finalResult = await appendRatings(result);

    return success(finalResult.Items);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
