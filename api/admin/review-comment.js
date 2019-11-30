import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as adminCheckLib from "../libs/admincheck-lib";
import { success, failure } from "../libs/response-lib";

export async function main(event) {
  const data = JSON.parse(event.body);
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(':')[2];

  let isAdminUser = await adminCheckLib.checkIfAdmin(sub);
  if(!isAdminUser) {
    return failure({ status: false, message: "Not authorized" });
  }

  let params = {
    TableName: "NaadanChordsContributions",
    Key: {
      postId: event.pathParameters.id
    },
    UpdateExpression: "SET #comment = :comment, #status = :status",
    ExpressionAttributeValues: {
      ":comment": data.comment || null,
      ":status": "NEEDS_REVISION"
    },
    ExpressionAttributeNames: {
      "#comment": "comment",
      "#status": "status"
    },
    ReturnValues: "ALL_NEW"
  };

  try {
    await dynamoDbLib.call("update", params);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
