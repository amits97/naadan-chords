import * as dynamoDbLib from "../libs/dynamodb-lib";
import { success, failure } from "../libs/response-lib";

export async function main(event, context, callback) {
  let params = {
    TableName: "NaadanChordsRatings",
    IndexName: "postType-weightedRating-index",
    KeyConditionExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":postType": "POST",
    },
    ScanIndexForward: false,
    Limit: 10
  };

  try {
    let result = await dynamoDbLib.call("query", params);
    return success(result.Items);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}