import { success, failure } from "./libs/response-lib";
import * as cognitoLib from "./libs/cognito-lib";

export async function main(event, context) {
  if(event.queryStringParameters && event.queryStringParameters.username) {
    let userName = event.queryStringParameters.username;

    try {
      const userParams = {
        UserPoolId: "ap-south-1_l5klM91tP",
        AttributesToGet: ["sub"],
        Filter: "username=\"" + userName + "\""
      };
    
      let userResults = await cognitoLib.call("listUsers", userParams);
      if(userResults.Users && userResults.Users.length > 0) {
        return success({userExists: true});
      } else {
        userParams.Filter = "preferred_username=\"" + userName + "\"";
        userResults = await cognitoLib.call("listUsers", userParams);
        if(userResults.Users && userResults.Users.length > 0) {
          return success({userExists: true});
        } else {
          return success({userExists: false});
        }
      }
    } catch(e) {
      return failure({ status: false, error: e });
    }
  } else {
    return failure({status: "Invalid request"});
  }
}