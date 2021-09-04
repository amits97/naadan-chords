import config from "../config";
import { success, failure } from "../libs/response-lib";
import * as cognitoLib from "../libs/cognito-lib";
import * as userNameLib from "../libs/username-lib";
import * as s3Lib from "../libs/s3-lib";

export async function main(event) {
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(':')[2];

  let usernameAttributes = await userNameLib.getAuthorAttributes(sub);

  try {
    let params = {
      Username: usernameAttributes.userName,
      UserPoolId: config.cognito.USER_POOL_ID
    };

    await cognitoLib.call("adminDeleteUser", params);

    try {
      const identities = JSON.parse(usernameAttributes.identities)[0];
      const username = `${identities.providerName}_${identities.userId}`;
      params.Username = username;
      await cognitoLib.call("adminDeleteUser", params);
    } catch(e) {
      // Ignore, no FB account linked
    }

    try {
      // Delete picture from s3 if avatar available
      const fileName = `public/${usernameAttributes.preferredUsername ?? usernameAttributes.userName}.png`;
      const s3Params = {
        Bucket: "naadanchords-avatars",
        Key: fileName
      };
      await s3Lib.call("deleteObject", s3Params);
      return success({ result: "Success" });
    } catch(e) {
      // Ignore
      return success({ result });
    }
  } catch(e) {
    return failure({ status: false, error: e });
  }
}
