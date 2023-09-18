import config from "../config";
import { success, failure } from "../libs/response-lib";
import * as cognitoLib from "../libs/cognito-lib";
import * as userNameLib from "../libs/username-lib";
import * as s3Lib from "../libs/s3-lib";

export async function main(event) {
  // Request body is passed in as a JSON encoded string in 'event.body'
  const data = JSON.parse(event.body);
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(":")[2];

  let usernameAttributes = await userNameLib.getAuthorAttributes(sub);
  const username = usernameAttributes.userName;

  try {
    const userAttributes = [];

    if (data.picture) {
      if (data.picture === "null") {
        // User wants to remove picture
        userAttributes.push({
          Name: "picture",
          Value: "",
        });

        // Delete picture from s3
        const fileName = `public/${
          usernameAttributes.preferredUsername ?? usernameAttributes.userName
        }.png`;
        const s3Params = {
          Bucket: "naadanchords-avatars",
          Key: fileName,
        };

        await s3Lib.call("deleteObject", s3Params);
      } else {
        userAttributes.push({
          Name: "picture",
          Value: data.picture,
        });
      }
    }

    if (data.username) {
      // Check if username with preferred_username exists
      let userParams = {
        UserPoolId: config.cognito.USER_POOL_ID,
        AttributesToGet: ["sub"],
        Filter: 'preferred_username="' + data.username + '"',
      };

      let userResults = await cognitoLib.call("listUsers", userParams);
      if (userResults.Users && userResults.Users.length > 0) {
        return failure({
          status: false,
          code: "UsernameExistsException",
          message: "Username already exists. Please try a different one.",
        });
      }

      // Check if username exists
      userParams = {
        UserPoolId: config.cognito.USER_POOL_ID,
        AttributesToGet: ["sub"],
        Filter: 'username="' + data.username + '"',
      };

      userResults = await cognitoLib.call("listUsers", userParams);
      let deletePreferredUsername = false;
      if (userResults.Users && userResults.Users.length > 0) {
        if (userResults.Users[0].Attributes[0].Value !== sub) {
          return failure({
            status: false,
            code: "UsernameExistsException",
            message: "Username already exists. Please try a different one.",
          });
        } else {
          deletePreferredUsername = true;
        }
      }

      userAttributes.push({
        Name: "preferred_username",
        Value: deletePreferredUsername ? "" : data.username,
      });
    }

    if (data.name) {
      userAttributes.push({
        Name: "name",
        Value: data.name,
      });
    }

    if (data.email) {
      // Check if user with same email exists
      const userParams = {
        UserPoolId: config.cognito.USER_POOL_ID,
        AttributesToGet: ["email"],
        Filter: 'email="' + data.email + '"',
      };

      const userResults = await cognitoLib.call("listUsers", userParams);
      if (userResults.Users && userResults.Users.length > 0) {
        return failure({
          status: false,
          code: "EmailExistsException",
          message:
            "User with this email already exists. Please use a different email.",
        });
      }

      userAttributes.push({
        Name: "email",
        Value: data.email,
      });
    }

    const params = {
      UserPoolId: config.cognito.USER_POOL_ID,
      Username: username,
      UserAttributes: userAttributes,
    };

    const result = await cognitoLib.call("adminUpdateUserAttributes", params);
    return success({ result });
  } catch (e) {
    return failure({ status: false, ...e });
  }
}
