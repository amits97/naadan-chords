import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as searchFilterLib from "./libs/searchfilter-lib";
import { success, failure } from "./libs/response-lib";

export async function main(event, context, callback) {
  let provider, sub;

  try {
    provider = event.requestContext.identity.cognitoAuthenticationProvider;
    sub = provider.split(':')[2];
  } catch(e) {
    return failure({ status: "Not authorized", error: e });
  }

  if(!sub) {
    return failure({ status: "Not authorized" });
  }

  let params = {
    TableName: "NaadanChordsDrafts",
    IndexName: "userId-createdAt-index",
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": sub,
    },
    ScanIndexForward: false,
    ProjectionExpression: "postId, createdAt, postType, title",
    Limit: 15
  };

  try {
    let result;
    if(event.queryStringParameters && event.queryStringParameters.s) {
      //search
      params = {
        TableName: "NaadanChordsDrafts",
        ProjectionExpression: "postId, createdAt, postType, title, userId",
        ...searchFilterLib.getSearchFilter(event.queryStringParameters.s)
      };
      result = await dynamoDbLib.call("scan", params);
    } else {
      result = await dynamoDbLib.call("query", params);
    }
    return success(result);
  } catch(e) {
    return failure({ status: false, error: e });
  }
}
