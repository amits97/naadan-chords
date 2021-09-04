import AWS from "aws-sdk";
import config from "../config";
import { generatePassword } from "../libs/utils";

function createNativeAccountAndLink(cognito, context, event) {
  if (event.request.userAttributes.hasOwnProperty("email")) {
    const generatedUsername = event.request.userAttributes.email.split("@")[0];

    const params = {
      ClientId: config.cognito.APP_CLIENT_ID,
      Username: generatedUsername,
      Password: generatePassword(),
      UserAttributes: [{
        Name: 'email',
        Value: event.request.userAttributes.email
      }, {
        Name: 'name',
        Value: generatedUsername
      }]
    };

    cognito.signUp(params, (err, data) => {
      if (err) {
        context.done(null, event);
        return;
      } else {
        let confirmParams = {
          UserPoolId: config.cognito.USER_POOL_ID,
          Username: generatedUsername,
          UserAttributes: [{
            Name: 'email_verified',
            Value: 'true'
          }]
        };
        cognito.adminUpdateUserAttributes(confirmParams, function() {
          let emailConfirmParams = {
            UserPoolId: config.cognito.USER_POOL_ID,
            Username: generatedUsername
          };
          cognito.adminConfirmSignUp(emailConfirmParams, function() {
            let mergeParams = {
              DestinationUser: {
                ProviderAttributeValue: generatedUsername,
                ProviderName: 'Cognito'
              },
              SourceUser: {
                ProviderAttributeName: 'Cognito_Subject',
                ProviderAttributeValue: event.userName.split("_")[1],
                ProviderName: 'Facebook'
              },
              UserPoolId: config.cognito.USER_POOL_ID
            };
            cognito.adminLinkProviderForUser(mergeParams, function() {
              event.response.autoConfirmUser = true;
              context.done(null, event);
            });
          });
        });
      }
    });
  } else {
    context.done(null, event);
  }
}

exports.handler = (event, context) => {
  try {
    const cognito = new AWS.CognitoIdentityServiceProvider({
      apiVersion: "2016-04-19",
      region: config.cognito.REGION
    });

    if (event.triggerSource.includes('ExternalProvider')) {
      // Social login
      let params = {
        UserPoolId: config.cognito.USER_POOL_ID,
        AttributesToGet: ['sub', 'email'],
        Filter: "email = \"" + event.request.userAttributes.email + "\""
      };
      cognito.listUsers(params, (err, data) => {
        if (err) {
          event.listUsersError = err;
          context.done(null, event);
        } else if (data != null && data.Users != null && data.Users[0] != null) {
          let mergeParams = {
            DestinationUser: { 
              ProviderAttributeValue: data.Users[0].Username,
              ProviderName: 'Cognito'
            },
            SourceUser: { 
              ProviderAttributeName: 'Cognito_Subject',
              ProviderAttributeValue: event.userName.split("_")[1],
              ProviderName: 'Facebook'
            },
            UserPoolId: config.cognito.USER_POOL_ID
          };
          cognito.adminLinkProviderForUser(mergeParams, function() {
            context.done(null, event);
          });
        } else {
          createNativeAccountAndLink(cognito, context, event);
        }
      });
    } else {
      // Normal native account signup. No need to do anything
      context.done(null, event);
    }
  } catch (e) {
    event.error = e;
    context.done(null, event);
  }
}