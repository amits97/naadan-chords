import { success, failure } from "../libs/response-lib";
import * as cognitoLib from "../libs/cognito-lib";
import * as userNameLib from "../libs/username-lib";

export async function main(event) {
  // Request body is passed in as a JSON encoded string in 'event.body'
  const data = JSON.parse(event.body);
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(':')[2];

  let usernameAttributes = await userNameLib.getAuthorAttributes(sub);
  const username = usernameAttributes.userName;

  try {
    const userAttributes = [];

    if (data.picture) {
      if (data.picture === 'null') {
        // User wants to remove picture
        userAttributes.push({
          Name: "picture",
          Value: ""
        });
      } else {
        userAttributes.push({
          Name: "picture",
          Value: data.picture
        });
      }
    }

    if (data.username) {
      // Check if username with preferred_username exists
      const userParams = {
        UserPoolId: "ap-south-1_l5klM91tP",
        AttributesToGet: ["sub"],
        Filter: "preferred_username=\"" + data.username + "\""
      };
    
      const userResults = await cognitoLib.call("listUsers", userParams);
      if(userResults.Users && userResults.Users.length > 0) {
        return failure({
          status: false,
          code: "UsernameExistsException",
          message: "Username already exists. Please try a different one."
        });
      }

      userAttributes.push({
        Name: "preferred_username",
        Value: data.username
      });
    }

    if (data.name) {
      userAttributes.push({
        Name: "name",
        Value: data.name
      });
    }

    const params = {
      UserPoolId: "ap-south-1_l5klM91tP",
      Username: username,
      UserAttributes: userAttributes
    };
  
    const result = await cognitoLib.call("adminUpdateUserAttributes", params);
    return success( { result });
  } catch (e) {
    return failure({ status: false, ...e });
  }
}
