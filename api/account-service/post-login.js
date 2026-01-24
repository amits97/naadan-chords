import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import config from "../config";
import { syncRewriteFacebookUsername } from "../libs/username-lib";

exports.handler = (event, context, callback) => {
  try {
    const cognito = new CognitoIdentityProviderClient({
      region: "ap-south-1",
    });

    // Get email
    let params = {
      UserPoolId: config.cognito.USER_POOL_ID,
      AttributesToGet: ["email"],
      Filter: 'username = "' + event.userName + '"',
    };

    cognito
      .send(new ListUsersCommand(params))
      .then((data) => {
        if (data != null && data.Users != null && data.Users[0] != null) {
          const email = data.Users[0].Attributes[0].Value;

          let allUsersWithEmailParams = {
            UserPoolId: config.cognito.USER_POOL_ID,
            AttributesToGet: ["email"],
            Filter: 'email = "' + email + '"',
          };

          return cognito
            .send(new ListUsersCommand(allUsersWithEmailParams))
            .then((data) => {
              if (data != null && data.Users != null) {
                if (data.Users.length > 1) {
                  // Has connected atleast 1 federal auth provider
                  const updatePromises = data.Users.map((user) => {
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

                      return cognito.send(
                        new AdminUpdateUserAttributesCommand(params)
                      );
                    }
                  }).filter(Boolean);

                  return Promise.all(updatePromises).then(() => {
                    callback(null, event);
                  });
                } else if (data.Users.length === 1) {
                  // Check if email_verified and retain value
                  allUsersWithEmailParams = {
                    UserPoolId: config.cognito.USER_POOL_ID,
                    AttributesToGet: ["custom:email_valid"],
                    Filter: 'email = "' + email + '"',
                  };

                  return cognito
                    .send(new ListUsersCommand(allUsersWithEmailParams))
                    .then((data) => {
                      if (data.Users && data.Users[0]) {
                        const email_verified =
                          data.Users[0].Attributes[0]?.Value || "false";

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

                        return cognito.send(
                          new AdminUpdateUserAttributesCommand(
                            update_email_verified_params
                          )
                        );
                      }
                    })
                    .then(() => {
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
                    })
                    .catch((err) => {
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
                    });
                }
              } else {
                callback(null, event);
              }
            });
        } else {
          callback(null, event);
        }
      })
      .catch((err) => {
        event.listUsersError = err;
        callback(null, event);
      });
  } catch (e) {
    event.error = e;
    callback(null, event);
  }
};
