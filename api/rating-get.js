import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";

export async function main(event, context) {
  let provider, sub, postId;

  if(event.queryStringParameters && event.queryStringParameters.postId) {
    postId = event.queryStringParameters.postId;
  } else {
    return failure({ status: "No postId passed" });
  }

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
    TableName: "NaadanChordsRatingsLog",
    Key: {
      postId: postId,
      userId: sub
    }
  };

  try {
    const result = await dynamoDbLib.call("get", params);

    if(result.Item) {
      //Do not expose userId
      delete(result.Item.userId);
      return success(result.Item);
    } else {
      //No rating data
      return success({});
    }
  } catch (e) {
    return failure({ status: false, error: e });
  }
}