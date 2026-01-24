import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminConfirmSignUpCommand,
  AdminLinkProviderForUserCommand,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import config from "../config";
import { generatePassword } from "../libs/utils";

async function createNativeAccountAndLink(cognito, context, event) {
  if (event.request.userAttributes.hasOwnProperty("email")) {
    const generatedUsername = event.request.userAttributes.email.split("@")[0];

    const params = {
      UserPoolId: config.cognito.USER_POOL_ID,
      DesiredDeliveryMediums: [],
      MessageAction: "SUPPRESS",
      Username: generatedUsername,
      UserAttributes: [
        {
          Name: "email",
          Value: event.request.userAttributes.email,
        },
        {
          Name: "name",
          Value: generatedUsername,
        },
      ],
    };

    try {
      await cognito.send(new AdminCreateUserCommand(params));

      let confirmParams = {
        UserPoolId: config.cognito.USER_POOL_ID,
        Password: generatePassword(),
        Username: generatedUsername,
        Permanent: true,
      };
      await cognito.send(new AdminSetUserPasswordCommand(confirmParams));

      let emailConfirmParams = {
        UserPoolId: config.cognito.USER_POOL_ID,
        Username: generatedUsername,
      };
      await cognito.send(new AdminConfirmSignUpCommand(emailConfirmParams));

      let mergeParams = {
        DestinationUser: {
          ProviderAttributeValue: generatedUsername,
          ProviderName: "Cognito",
        },
        SourceUser: {
          ProviderAttributeName: "Cognito_Subject",
          ProviderAttributeValue: event.userName.split("_")[1],
          ProviderName: "Facebook",
        },
        UserPoolId: config.cognito.USER_POOL_ID,
      };
      await cognito.send(new AdminLinkProviderForUserCommand(mergeParams));

      event.response.autoConfirmUser = true;
      context.done(null, event);
    } catch (err) {
      context.done(null, event);
    }
  } else {
    context.done(null, event);
  }
}

exports.handler = (event, context) => {
  try {
    const cognito = new CognitoIdentityProviderClient({
      region: config.cognito.REGION,
    });

    if (event.triggerSource.includes("ExternalProvider")) {
      // Social login
      let params = {
        UserPoolId: config.cognito.USER_POOL_ID,
        AttributesToGet: ["sub", "email"],
        Filter: 'email = "' + event.request.userAttributes.email + '"',
      };

      cognito
        .send(new ListUsersCommand(params))
        .then((data) => {
          if (data != null && data.Users != null && data.Users[0] != null) {
            let mergeParams = {
              DestinationUser: {
                ProviderAttributeValue: data.Users[0].Username,
                ProviderName: "Cognito",
              },
              SourceUser: {
                ProviderAttributeName: "Cognito_Subject",
                ProviderAttributeValue: event.userName.split("_")[1],
                ProviderName: "Facebook",
              },
              UserPoolId: config.cognito.USER_POOL_ID,
            };
            return cognito
              .send(new AdminLinkProviderForUserCommand(mergeParams))
              .then(() => {
                context.done(null, event);
              });
          } else {
            return createNativeAccountAndLink(cognito, context, event);
          }
        })
        .catch((err) => {
          event.listUsersError = err;
          context.done(null, event);
        });
    } else {
      // Normal native account signup. No need to do anything
      context.done(null, event);
    }
  } catch (e) {
    event.error = e;
    context.done(null, event);
  }
};
