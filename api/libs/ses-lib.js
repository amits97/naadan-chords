import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const client = new SESClient({ region: "us-east-1" });

// Map action names to command classes
const commandMap = {
  sendEmail: SendEmailCommand,
};

export async function call(action, params) {
  const CommandClass = commandMap[action];
  if (!CommandClass) {
    throw new Error(`Unknown action: ${action}`);
  }
  const command = new CommandClass(params);
  return await client.send(command);
}
