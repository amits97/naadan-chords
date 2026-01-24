import config from "../config";
import * as cognitoLib from "./cognito-lib";

export async function getAuthorAttributes(userId) {
  const userParams = {
    UserPoolId: config.cognito.USER_POOL_ID,
    AttributesToGet: ["name"],
    Filter: 'sub="' + userId + '"',
  };

  let userResults = await cognitoLib.call("listUsers", userParams);
  let authorName = userResults.Users[0].Attributes[0].Value;
  let picture;
  let identities;
  let userName = userResults.Users[0].Username;
  let preferredUsername;
  let userCreateDate = userResults.Users[0].UserCreateDate;

  try {
    userParams.AttributesToGet = ["preferred_username"];
    userResults = await cognitoLib.call("listUsers", userParams);
    preferredUsername = userResults.Users[0].Attributes[0].Value;
  } catch (e) {
    // Ignore, preferred_username does not exist.
  }

  try {
    userParams.AttributesToGet = ["picture"];
    userResults = await cognitoLib.call("listUsers", userParams);
    picture = userResults.Users[0].Attributes[0].Value;
  } catch (e) {
    // Ignore, picture does not exist.
  }

  try {
    userParams.AttributesToGet = ["identities"];
    userResults = await cognitoLib.call("listUsers", userParams);
    identities = userResults.Users[0].Attributes[0].Value;
  } catch (e) {
    // Ignore, identities does not exist.
  }

  return {
    authorName,
    userName,
    preferredUsername,
    picture,
    userCreateDate,
    identities,
  };
}

export async function getAuthorEmail(userId) {
  const userParams = {
    UserPoolId: config.cognito.USER_POOL_ID,
    AttributesToGet: ["email"],
    Filter: 'sub="' + userId + '"',
  };

  let userResults = await cognitoLib.call("listUsers", userParams);
  let email = userResults.Users[0].Attributes[0].Value;
  return email;
}

export async function getUserId(userName) {
  const userParams = {
    UserPoolId: config.cognito.USER_POOL_ID,
    AttributesToGet: ["sub"],
    Filter: 'preferred_username="' + userName + '"',
  };

  let userResults = await cognitoLib.call("listUsers", userParams);
  if (userResults.Users[0]?.Attributes[0]?.Value) {
    return userResults.Users[0].Attributes[0].Value;
  } else {
    userParams.Filter = 'username="' + userName + '"';
    userResults = await cognitoLib.call("listUsers", userParams);
    return userResults.Users[0] ? userResults.Users[0].Attributes[0].Value : "";
  }
}

export async function getAdminUsers() {
  const userParams = {
    UserPoolId: config.cognito.USER_POOL_ID,
    GroupName: "admin",
  };

  let userResults = await cognitoLib.call("listUsersInGroup", userParams);
  return userResults.Users;
}

export async function syncRewriteFacebookUsername(email, callback, error) {
  const {
    CognitoIdentityProviderClient,
    ListUsersCommand,
    AdminUpdateUserAttributesCommand,
  } = await import("@aws-sdk/client-cognito-identity-provider");
  const cognito = new CognitoIdentityProviderClient({ region: "ap-south-1" });

  let allUsersWithEmailParams = {
    UserPoolId: config.cognito.USER_POOL_ID,
    AttributesToGet: ["email"],
    Filter: 'email = "' + email + '"',
  };

  try {
    let data = await cognito.send(
      new ListUsersCommand(allUsersWithEmailParams)
    );
    if (data != null && data.Users != null) {
      if (data.Users.length === 1) {
        let user = data.Users[0];
        if (user.UserStatus === "EXTERNAL_PROVIDER") {
          allUsersWithEmailParams.AttributesToGet = [
            "email",
            "preferred_username",
          ];
          try {
            let data = await cognito.send(
              new ListUsersCommand(allUsersWithEmailParams)
            );
            if (user.Username.includes("Facebook_")) {
              let newUsername = email.split("@")[0];

              let dupUserParams = {
                UserPoolId: config.cognito.USER_POOL_ID,
                AttributesToGet: ["sub"],
                Filter: 'username="' + newUsername + '"',
              };

              let dupData = await cognito.send(
                new ListUsersCommand(dupUserParams)
              );
              if (dupData.Users && dupData.Users.length > 0) {
                newUsername = newUsername + "_" + user.Username.split("_")[1];
              }

              // Fix ugly Facebook_ username
              var params = {
                UserAttributes: [
                  {
                    Name: "preferred_username",
                    Value: newUsername,
                  },
                ],
                UserPoolId: config.cognito.USER_POOL_ID,
                Username: user.Username,
              };

              await cognito.send(new AdminUpdateUserAttributesCommand(params));
              callback();
            } else {
              callback();
            }
          } catch (err) {
            // Preferred_username attribute does not exist
            if (user.Username.includes("Facebook_")) {
              let newUsername = email.split("@")[0];

              let dupUserParams = {
                UserPoolId: config.cognito.USER_POOL_ID,
                AttributesToGet: ["sub"],
                Filter: 'username="' + newUsername + '"',
              };

              try {
                let dupData = await cognito.send(
                  new ListUsersCommand(dupUserParams)
                );
                if (dupData.Users && dupData.Users.length > 0) {
                  newUsername = newUsername + "_" + user.Username.split("_")[1];
                }
              } catch (e) {
                // continue
              }

              // Fix ugly Facebook_ username
              var params = {
                UserAttributes: [
                  {
                    Name: "preferred_username",
                    Value: newUsername,
                  },
                ],
                UserPoolId: config.cognito.USER_POOL_ID,
                Username: user.Username,
              };

              await cognito.send(new AdminUpdateUserAttributesCommand(params));
              callback();
            } else {
              callback();
            }
          }
        } else {
          callback();
        }
      } else {
        callback();
      }
    } else {
      callback();
    }
  } catch (err) {
    error(err);
  }
}
