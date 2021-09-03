import config from "../config";
import { success, failure } from "../libs/response-lib";
import * as cognitoLib from "../libs/cognito-lib";

export async function main(event) {
  if(event.queryStringParameters && event.queryStringParameters.providerAttributeName && event.queryStringParameters.providerAttributeValue && event.queryStringParameters.providerName) {
    let ProviderAttributeName = event.queryStringParameters.providerAttributeName,
        ProviderAttributeValue = event.queryStringParameters.providerAttributeValue,
        ProviderName = event.queryStringParameters.providerName;

    try {
      let params = {
        User: {
          ProviderAttributeName,
          ProviderAttributeValue,
          ProviderName
        },
        UserPoolId: config.cognito.USER_POOL_ID
      };

      let result = await cognitoLib.call("adminDisableProviderForUser", params);

      // Delete unlinked account
      params = {
        Username: `${ProviderName}_${ProviderAttributeValue}`,
        UserPoolId: config.cognito.USER_POOL_ID
      }

      try {
        result.deleteResult = await cognitoLib.call("adminDeleteUser", params);
        return success({ result });
      } catch(e) {
        return failure({ status: false, error: e });
      }
    } catch(e) {
      return failure({ status: false, error: e });
    }
  } else {
    return failure({status: "Invalid request"});
  }
}