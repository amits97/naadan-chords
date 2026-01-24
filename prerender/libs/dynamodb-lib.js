import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamoDb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const commandMap = {
  get: GetCommand,
  put: PutCommand,
};

export async function call(action, params) {
  const CommandClass = commandMap[action];
  if (!CommandClass) {
    throw new Error(`Unknown action: ${action}`);
  }

  const command = new CommandClass(params);
  return dynamoDb.send(command);
}
