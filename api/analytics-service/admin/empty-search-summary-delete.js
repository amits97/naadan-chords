import * as dynamoDbLib from "../../libs/dynamodb-lib";
import * as adminCheckLib from "../../libs/admincheck-lib";
import { success, failure } from "../../libs/response-lib";

export async function main(event) {
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(":")[2];

  let isAdminUser = await adminCheckLib.checkIfAdmin(sub);
  if (!isAdminUser) {
    return failure({ status: false, message: "No write permissions" });
  }

  const params = {
    TableName: "NaadanChordsEmptySearchSummary",
    Key: {
      searchQuery: decodeURI(event.pathParameters.id),
    },
  };

  try {
    await dynamoDbLib.call("delete", params);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false });
  }
}
