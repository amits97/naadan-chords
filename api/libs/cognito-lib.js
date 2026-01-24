import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersInGroupCommand,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: "ap-south-1" });

// Map action names to command classes
const commandMap = {
  listUsers: ListUsersCommand,
  listUsersInGroup: ListUsersInGroupCommand,
  adminUpdateUserAttributes: AdminUpdateUserAttributesCommand,
};

export async function call(action, params) {
  const CommandClass = commandMap[action];
  if (!CommandClass) {
    throw new Error(`Unknown action: ${action}`);
  }
  const command = new CommandClass(params);
  return await client.send(command);
}
