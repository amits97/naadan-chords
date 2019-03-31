import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as userNameLib from "./libs/username-lib";

export async function main(event, context, callback) {
  const params = {
    TableName: "NaadanChords",
    IndexName: "postType-createdAt-index",
    KeyConditionExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":postType": event.postType || "POST",
    },
    ScanIndexForward: false,
    ProjectionExpression: "postId, createdAt, postType, title, userId",
    Limit: 10
  };

  if(event.exclusiveStartKey) {
    //pagination
    params.ExclusiveStartKey = JSON.parse(decodeURIComponent(event.exclusiveStartKey).replace(/'/g, '"'));
  }

  if(event.category) {
    //filter by category
    params.IndexName = "category-createdAt-index";
    params.KeyConditionExpression = "category = :category";
    params.ExpressionAttributeValues =  {
      ":category": event.category
    };
  }

  try {
    const result = await dynamoDbLib.call("query", params);
    let users = {};

    for(let i = 0; i < result.Items.length; i++) {
      let userId = result.Items[i].userId;

      if(!users.hasOwnProperty(userId)) {
        let userName = await userNameLib.call(userId);
        users[userId] = userName;
      }

      result.Items[i].userName =  users[userId];
    }

    return result;
  } catch (e) {
    return { status: false, error: e };
  }
}