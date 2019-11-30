import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as adminCheckLib from "../libs/admincheck-lib";
import * as searchFilterLib from "../libs/searchfilter-lib";
import { success, failure } from "../libs/response-lib";

export async function main(event) {
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(':')[2];

  let isAdminUser = await adminCheckLib.checkIfAdmin(sub);
  if(!isAdminUser) {
    return failure({ status: false, message: "Not authorized" });
  }

  let params = {
    TableName: "NaadanChordsContributions",
    IndexName: "postType-createdAt-index",
    KeyConditionExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":postType": "POST",
    },
    ScanIndexForward: false,
    ProjectionExpression: "postId, #status, createdAt, postType, title",
    ExpressionAttributeNames: {
      "#status": "status"
    },
    Limit: 15
  };

  try {
    let result;
    if(event.queryStringParameters && event.queryStringParameters.s) {
      //search
      params = {
        TableName: "NaadanChordsContributions",
        ProjectionExpression: "postId, #status, createdAt, postType, title",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ...searchFilterLib.getSearchFilter(event.queryStringParameters.s, null, "POST")
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
