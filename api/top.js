import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";

export async function main(event, context, callback) {
  let params = {
    TableName: "NaadanChordsTop",
    IndexName: "postType-views-index",
    KeyConditionExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":postType": "POST",
    },
    ProjectionExpression: "postId, title, #views",
    ExpressionAttributeNames: {
      "#views": "views"
    },
    ScanIndexForward: false
  };

  try {
    let result = await dynamoDbLib.call("query", params);
    return success(result.Items);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}