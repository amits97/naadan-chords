import { success, failure } from "../libs/response-lib";
import * as cognitoLib from "../libs/cognito-lib";

export async function main(event) {
  // Request body is passed in as a JSON encoded string in 'event.body'
  const data = JSON.parse(event.body);

  try {
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
    } else {
      userParams.Filter = "email=\"" + data.email + "\"";
      let emailUserResults = await cognitoLib.call("listUsers", userParams);

      if (emailUserResults.Users && emailUserResults.Users.length > 0) {
        return failure({
          status: false,
          code: "EmailExistsException",
          message: "Email already exists. Please try a different one."
        });
      }

      const params = {
        ClientId: 'senbvolbdevcqlj220thd1dgo',
        Username: data.username,
        Password: data.password,
        UserAttributes: [{
          Name: 'email',
          Value: data.email
        }, {
          Name: 'name',
          Value: data.name
        }]
      };

      const result = await cognitoLib.call("signUp", params);
      return success( { result });
    }
  } catch (e) {
    return failure({ status: false, ...e });
  }
}
