import * as dynamoDbLib from "../libs/dynamodb-lib";
import { success, failure } from "../libs/response-lib";

export async function main(event, context) {
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(':')[2];

  if(!sub) {
    return failure({ status: "Not authorized" });
  }

  const params = {
    TableName: "NaadanChordsContributions",
    Key: {
      postId: event.pathParameters.id
    }
  };

  try {
    const result = await dynamoDbLib.call("get", params);

    if(result.Item.userId === sub) {
      await dynamoDbLib.call("delete", params);
      return success({ status: true });
    } else {
      return failure({ status: "Not authorized" });
    }
  } catch (e) {
    return failure({ status: false });
  }
}