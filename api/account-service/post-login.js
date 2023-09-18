import AWS from "aws-sdk";
import config from "../config";
import { syncRewriteFacebookUsername } from "../libs/username-lib";

exports.handler = (event, context, callback) => {
  try {
    const cognito = new AWS.CognitoIdentityServiceProvider({
      apiVersion: "2016-04-19",
      region: "ap-south-1",
    });

    // Get email
    let params = {
      UserPoolId: config.cognito.USER_POOL_ID,
      AttributesToGet: ["email"],
      Filter: 'username = "' + event.userName + '"',
    };
    cognito.listUsers(params, (err, data) => {
      if (err) {
        event.listUsersError = err;
        callback(null, event);
      } else if (data != null && data.Users != null && data.Users[0] != null) {
        const email = data.Users[0].Attributes[0].Value;

        let allUsersWithEmailParams = {
          UserPoolId: config.cognito.USER_POOL_ID,
          AttributesToGet: ["email"],
          Filter: 'email = "' + email + '"',
        };

        cognito.listUsers(allUsersWithEmailParams, (err, data) => {
          if (err) {
            event.innerListUsersError = err;
            callback(null, event);
          } else if (data != null && data.Users != null) {
            if (data.Users.length > 1) {
              // Has connected atleast 1 federal auth provider
              data.Users.forEach((user) => {
                if (user.UserStatus === "CONFIRMED") {
                  /**
                   * Since the user is already email verified and FB attribute mapping
                   * overrides to false this code ensures that email_verified is not
                   * flipped to false.
                   * */
                  var params = {
                    UserAttributes: [
                      {
                        Name: "email_verified",
                        Value: "true",
                      },
                    ],
                    UserPoolId: config.cognito.USER_POOL_ID,
                    Username: user.Username,
                  };

                  cognito.adminUpdateUserAttributes(
                    params,
                    function (err, data) {
                      callback(null, event);
                    }
                  );
                }
              });
            } else if (data.Users.length === 1) {
              // Check if email_verified and retain value
              allUsersWithEmailParams = {
                UserPoolId: config.cognito.USER_POOL_ID,
                AttributesToGet: ["custom:email_valid"],
                Filter: 'email = "' + email + '"',
              };

              cognito.listUsers(allUsersWithEmailParams, (err, data) => {
                if (err) {
                  syncRewriteFacebookUsername(
                    email,
                    () => {
                      callback(null, event);
                    },
                    (err) => {
                      event.syncRewriteFacebookUsernameError = err;
                      callback(null, event);
                    }
                  );
                } else {
                  const email_verified =
                    data.Users[0].Attributes[0].Value || "false";

                  const update_email_verified_params = {
                    UserAttributes: [
                      {
                        Name: "email_verified",
                        Value: email_verified,
                      },
                    ],
                    UserPoolId: config.cognito.USER_POOL_ID,
                    Username: data.Users[0].Username,
                  };

                  cognito.adminUpdateUserAttributes(
                    update_email_verified_params,
                    function (err, data) {
                      syncRewriteFacebookUsername(
                        email,
                        () => {
                          callback(null, event);
                        },
                        (err) => {
                          event.syncRewriteFacebookUsernameError = err;
                          callback(null, event);
                        }
                      );
                    }
                  );
                }
              });
            }
          } else {
            callback(null, event);
          }
        });
      } else {
        callback(null, event);
      }
    });
  } catch (e) {
    event.error = e;
    callback(null, event);
  }
};
