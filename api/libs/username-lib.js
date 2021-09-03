import AWS from "aws-sdk";
import config from "../config";
import * as cognitoLib from "./cognito-lib";

export async function getAuthorAttributes(userId) {
  const userParams = {
    UserPoolId: config.cognito.USER_POOL_ID,
    AttributesToGet: ["name"],
    Filter: "sub=\"" + userId + "\""
  };

  let userResults = await cognitoLib.call("listUsers", userParams);
  let authorName = userResults.Users[0].Attributes[0].Value;
  let picture;
  let userName = userResults.Users[0].Username;
  let preferredUsername;
  let userCreateDate = userResults.Users[0].UserCreateDate;

  try {
    userParams.AttributesToGet = ["preferred_username"];
    userResults = await cognitoLib.call("listUsers", userParams);
    preferredUsername = userResults.Users[0].Attributes[0].Value;
  } catch(e) {
    // Ignore, preferred_username does not exist.
  }

  try {
    userParams.AttributesToGet = ["picture"];
    userResults = await cognitoLib.call("listUsers", userParams);
    picture = userResults.Users[0].Attributes[0].Value;
  } catch(e) {
    // Ignore, picture does not exist.
  }

  return { authorName, userName, preferredUsername, picture, userCreateDate };
}

export async function getAuthorEmail(userId) {
  const userParams = {
    UserPoolId: config.cognito.USER_POOL_ID,
    AttributesToGet: ["email"],
    Filter: "sub=\"" + userId + "\""
  };

  let userResults = await cognitoLib.call("listUsers", userParams);
  let email = userResults.Users[0].Attributes[0].Value;
  return email;
}

export async function getUserId(userName) {
  const userParams = {
    UserPoolId: config.cognito.USER_POOL_ID,
    AttributesToGet: ["sub"],
    Filter: "preferred_username=\"" + userName + "\""
  };

  let userResults = await cognitoLib.call("listUsers", userParams);
  if (userResults.Users[0]?.Attributes[0]?.Value) {
    return userResults.Users[0].Attributes[0].Value;
  } else {
    userParams.Filter = "username=\"" + userName + "\"";
    userResults = await cognitoLib.call("listUsers", userParams);
    return userResults.Users[0] ? userResults.Users[0].Attributes[0].Value : "";
  }
}

export async function getAdminUsers() {
  const userParams = {
    UserPoolId: config.cognito.USER_POOL_ID,
    GroupName: "admin"
  };

  let userResults = await cognitoLib.call("listUsersInGroup", userParams);
  return userResults.Users;
}

export function syncRewriteFacebookUsername(email, callback, error) {
  const cognito = new AWS.CognitoIdentityServiceProvider({apiVersion: "2016-04-19", region: "ap-south-1"});  
  
  let allUsersWithEmailParams = {
    UserPoolId: config.cognito.USER_POOL_ID,
    AttributesToGet: ['email'],
    Filter: "email = \"" + email + "\""
  };

  cognito.listUsers(allUsersWithEmailParams, (err, data) => {
    if (err) {
      error(err);
    } else if (data != null && data.Users != null) {
      if (data.Users.length === 1) {
        let user = data.Users[0];
        if (user.UserStatus === "EXTERNAL_PROVIDER") {
          allUsersWithEmailParams.AttributesToGet = ['email', 'preferred_username'];
          cognito.listUsers(allUsersWithEmailParams, (err, data) => {
            if (err) {
              // Preferred_username attribute does not exist
              if (user.Username.includes("Facebook_")) {
                let newUsername = email.split('@')[0];

                let dupUserParams = {
                  UserPoolId: config.cognito.USER_POOL_ID,
                  AttributesToGet: ["sub"],
                  Filter: "username=\"" + newUsername + "\""
                };
              
                cognito.listUsers(dupUserParams, (err, data) => {
                  if (data.Users && data.Users.length > 0) {
                    newUsername = newUsername + "_" + user.Username.split('_')[1];
                  }
                  
                  // Fix ugly Facebook_ username
                  var params = {
                    UserAttributes: [{
                      Name: "preferred_username",
                      Value: newUsername
                    }],
                    UserPoolId: config.cognito.USER_POOL_ID,
                    Username: user.Username
                  };

                  cognito.adminUpdateUserAttributes(params, function(err, data) {
                    callback();
                  });
                });          
              } else {
                callback();
              }
            } else {
              callback();
            }
          });
        }
      }
      callback();
    } else {
      callback();
    }
  });
}
