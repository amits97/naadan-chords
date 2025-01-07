import * as dynamoDbLib from "../../libs/dynamodb-lib";
import * as adminCheckLib from "../../libs/admincheck-lib";
import { success, failure } from "../../libs/response-lib";

export async function main(event) {
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(":")[2];

  let isAdminUser = await adminCheckLib.checkIfAdmin(sub);
  if (!isAdminUser) {
    return failure({ status: false, message: "Access denied" });
  }

  let params = {
    TableName: "NaadanChordsEmptySearchSummary",
    IndexName: "type-count-index",
    KeyConditionExpression: "#type = :type",
    ExpressionAttributeValues: {
      ":type": "SEARCH",
    },
    ExpressionAttributeNames: {
      "#type": "type",
    },
    ScanIndexForward: false,
    Limit: 25,
  };

  try {
    let result = await dynamoDbLib.call("query", params);
    return success(result.Items || []);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
