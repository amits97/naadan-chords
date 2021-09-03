import config from "../config";
import * as cognitoLib from "./cognito-lib";
import * as userNameLib from "./username-lib";

export async function checkIfAdmin(userId) {
  let authorAttributes = await userNameLib.getAuthorAttributes(userId);

  const userParams = {
    UserPoolId: config.cognito.USER_POOL_ID,
    Username: authorAttributes.preferredUsername ?? authorAttributes.userName
  };

  try {
    let groupResults = await cognitoLib.call("adminListGroupsForUser", userParams);

    let groups = groupResults.Groups;
    for(let i = 0; i < groups.length; i++) {
      if(groups[i].GroupName === "admin") {
        return true;
      }
    }

    return false;
  } catch(e) {
    return false;
  }
}