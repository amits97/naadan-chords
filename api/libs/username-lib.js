import * as cognitoLib from "./cognito-lib";

export async function call(userId) {
  const userParams = {
    UserPoolId: "ap-south-1_VHgbZVoeR",
    AttributesToGet: ["name"],
    Filter: "sub=\"" + userId + "\""
  };

  let userResults = await cognitoLib.call("listUsers", userParams);
  return userResults.Users[0].Attributes[0].Value;
}