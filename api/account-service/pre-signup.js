import AWS from "aws-sdk";

function generatePassword() {
  var length = 8,
      charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      retVal = "";
  for (var i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

function createNativeAccountAndLink(cognito, context, event) {
  if (event.request.userAttributes.hasOwnProperty("email")) {
    const params = {
      ClientId: 'senbvolbdevcqlj220thd1dgo',
      Username: event.request.userAttributes.email.split("@")[0],
      Password: generatePassword(),
      UserAttributes: [{
        Name: 'email',
        Value: event.request.userAttributes.email
      }, {
        Name: 'name',
        Value: event.request.userAttributes.email.split("@")[0]
      }]
    };

    cognito.signUp(params, (err, data) => {
      if (err) {
        context.done(null, event);
        return;
      } else {
        let confirmParams = {
          UserPoolId: 'ap-south-1_l5klM91tP',
          Username: event.request.userAttributes.email.split("@")[0],
          UserAttributes: [{
            Name: 'email_verified',
            Value: 'true'
          }]
        };
        cognito.adminUpdateUserAttributes(confirmParams, function() {
          let emailConfirmParams = {
            UserPoolId: 'ap-south-1_l5klM91tP',
            Username: event.request.userAttributes.email.split("@")[0]
          };
          cognito.adminConfirmSignUp(emailConfirmParams, function() {
            let mergeParams = {
              DestinationUser: {
                ProviderAttributeValue: event.request.userAttributes.email.split("@")[0],
                ProviderName: 'Cognito'
              },
              SourceUser: {
                ProviderAttributeName: 'Cognito_Subject',
                ProviderAttributeValue: event.userName.split("_")[1],
                ProviderName: 'Facebook'
              },
              UserPoolId: 'ap-south-1_l5klM91tP'
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
    const cognito = new AWS.CognitoIdentityServiceProvider({apiVersion: "2016-04-19", region: "ap-south-1"});

    if (event.triggerSource.includes('ExternalProvider')) {
      // Social login
      let params = {
        UserPoolId: 'ap-south-1_l5klM91tP',
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
            UserPoolId: 'ap-south-1_l5klM91tP'
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