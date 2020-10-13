import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as adminCheckLib from "../libs/admincheck-lib";
import * as userNameLib from "../libs/username-lib";
import { success, failure } from "../libs/response-lib";

export async function main(event) {
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
    TableName: "NaadanChordsContributions",
    Key: {
      postId: event.pathParameters.id
    }
  };

  try {
    const result = await dynamoDbLib.call("get", params);
    const isAdminUser = await adminCheckLib.checkIfAdmin(sub);

    if(result.Item.userId === sub || isAdminUser) {
      let userId = result.Item.userId;

      //Get full attributes of author
      let authorAttributes = await userNameLib.getAuthorAttributes(userId);
      result.Item.authorName = authorAttributes.authorName;
      result.Item.userName = authorAttributes.userName;

      return success(result.Item);
    } else {
      return failure({ status: "Not authorized" });
    }
  } catch (e) {
    return failure({ status: false, error: e });
  }
}