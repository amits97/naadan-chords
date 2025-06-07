import "./init";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { Amplify } from "aws-amplify";
import config from "./config";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

import "./index.css";

Amplify.configure({
  Auth: {
    Cognito: {
      mandatorySignIn: true,
      region: config.cognito.REGION,
      userPoolId: config.cognito.USER_POOL_ID,
      identityPoolId: config.cognito.IDENTITY_POOL_ID,
      userPoolClientId: config.cognito.APP_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: config.oauth.DOMAIN,
          scopes: [
            "phone",
            "email",
            "profile",
            "openid",
            "aws.cognito.signin.user.admin",
          ],
          redirectSignIn: [config.oauth.REDIRECT_SIGN_IN],
          redirectSignOut: [config.oauth.REDIRECT_SIGN_OUT],
          responseType: "code",
        },
      },
    },
  },
  API: {
    REST: {
      posts: {
        endpoint: config.apiGateway.URL,
        region: config.apiGateway.REGION,
      },
    },
  },
  Storage: {
    S3: {
      bucket: config.storage.BUCKET,
      region: config.storage.REGION,
    },
  },
});

ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
