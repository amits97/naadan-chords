import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as userNameLib from "./libs/username-lib";

export async function main(event, context, callback) {
  let params = {
    TableName: "NaadanChords",
    IndexName: "userId-createdAt-index",
    KeyConditionExpression: "userId = :userId",
    FilterExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":userId": event.userId,
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
    
    let userName = await userNameLib.call(event.userId);

    if(result.Items.length > 0) {
      for(let i = 0; i < result.Items.length; i++) {
        result.Items[i].userName =  userName;
      }
    }
    return result;
  } catch (e) {
    return { status: false, error: e };
  }
}