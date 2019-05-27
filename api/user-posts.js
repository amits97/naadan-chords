import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as userNameLib from "./libs/username-lib";

export async function main(event, context, callback) {
  if(!event.userName) {
    return { status: false, error: "No username specified" };
  }

  let userId = await userNameLib.getUserId(event.userName);

  if(userId === "") {
    return [];
  }

  let params = {
    TableName: "NaadanChords",
    IndexName: "userId-createdAt-index",
    KeyConditionExpression: "userId = :userId",
    FilterExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":userId": userId,
      ":postType": "POST"
    },
    ScanIndexForward: false,
    ProjectionExpression: "postId, createdAt, postType, title, userId",
    Limit: 15
  };

  if(event.exclusiveStartKey) {
    //pagination
    params.ExclusiveStartKey = JSON.parse(decodeURIComponent(event.exclusiveStartKey).replace(/'/g, '"'));
  }

  try {
    let result = {};
    result = await dynamoDbLib.call("query", params);

    //Get full attributes of author
    let authorAttributes = await userNameLib.getAuthorAttributes(userId);

    if(result.Items.length > 0) {
      for(let i = 0; i < result.Items.length; i++) {
        result.Items[i].userName = authorAttributes.userName;
        result.Items[i].authorName = authorAttributes.authorName;
        delete(result.Items[i].userId);
      }
    }
    return result;
  } catch (e) {
    return { status: false, error: e };
  }
}