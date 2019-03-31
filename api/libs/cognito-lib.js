import AWS from "aws-sdk";

export function call(action, params) {
  const cognito = new AWS.CognitoIdentityServiceProvider({apiVersion: "2016-04-19", region: "ap-south-1"});

  return cognito[action](params).promise();
}