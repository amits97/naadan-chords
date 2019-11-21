import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as adminCheckLib from "../libs/admincheck-lib";
import { success, failure } from "../libs/response-lib";

export async function main(event, context) {
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(':')[2];

  let isAdminUser = await adminCheckLib.checkIfAdmin(sub);
  if(!isAdminUser) {
    return failure({ status: false, message: "No write permissions" });
  }

  const params = {
    TableName: "NaadanChordsDrafts",
    Key: {
      postId: event.pathParameters.id
    }
  };

  try {
    let result = await dynamoDbLib.call("delete", params);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false });
  }
}