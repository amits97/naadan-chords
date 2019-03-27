import * as dynamoDbLib from "./libs/dynamodb-lib";

export async function main(event, context) {
  const params = {
    TableName: "NaadanChords",
    IndexName: "postType-createdAt-index",
    KeyConditionExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":postType": event.postType || "POST",
    },
    ScanIndexForward: false,
    ProjectionExpression: "postId, createdAt, postType, title",
    Limit: 10
  };

  if(event.exclusiveStartKey) {
    //pagination
    params.ExclusiveStartKey = JSON.parse(decodeURIComponent(event.exclusiveStartKey).replace(/'/g, '"'));
  }

  try {
    const result = await dynamoDbLib.call("query", params);
    // Return the matching list of items in response body
    return result;
  } catch (e) {
    return { status: false };
  }
}