import * as dynamoDbLib from "../libs/dynamodb-lib";
import { success, failure } from "../libs/response-lib";

export async function main(event, context) {
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

  const params = {
    TableName: "NaadanChordsDrafts",
    Key: {
      postId: event.pathParameters.id
    }
  };

  try {
    const result = await dynamoDbLib.call("get", params);

    if(result.Item.userId === sub) {
      //Do not expose userId
      delete(result.Item.userId);
      return success(result.Item);
    } else {
      return failure({ status: "Not authorized" });
    }
  } catch (e) {
    return failure({ status: false, error: e });
  }
}