import AWS from "aws-sdk";

exports.handler = (event, context, callback) => {
  try {
    const cognito = new AWS.CognitoIdentityServiceProvider({apiVersion: "2016-04-19", region: "ap-south-1"});

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
          cognito.adminLinkProviderForUser(mergeParams, function(err, data) {
            if (err) {
              context.done(null, event);
            } else {
              // Link successful
              context.done(null, event);
            }
          });
        } else {
          context.done(null, event);
        }
    });
  } catch (e) {
    event.error = e;
    context.done(null, event);
  }
}