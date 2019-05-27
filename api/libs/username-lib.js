import * as cognitoLib from "./cognito-lib";

export async function getAuthorAttributes(userId) {
  const userParams = {
    UserPoolId: "ap-south-1_l5klM91tP",
    AttributesToGet: ["name"],
    Filter: "sub=\"" + userId + "\""
  };

  let userResults = await cognitoLib.call("listUsers", userParams);
  let authorName = userResults.Users[0].Attributes[0].Value;
  let userName = userResults.Users[0].Username;
  return {authorName: authorName, userName: userName};
}

export async function getUserId(userName) {
  const userParams = {
    UserPoolId: "ap-south-1_l5klM91tP",
    AttributesToGet: ["sub"],
    Filter: "username=\"" + userName + "\""
  };

  let userResults = await cognitoLib.call("listUsers", userParams);
  return userResults.Users[0].Attributes[0].Value;
}