import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  ScanCommand,
  BatchWriteCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamoDb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const commandMap = {
  query: QueryCommand,
  put: PutCommand,
  scan: ScanCommand,
  batchWrite: BatchWriteCommand,
  get: GetCommand,
  delete: DeleteCommand,
  update: UpdateCommand,
};

export async function call(action, params) {
  const CommandClass = commandMap[action];
  if (!CommandClass) {
    throw new Error(`Unknown action: ${action}`);
  }

  const command = new CommandClass(params);
  return dynamoDb.send(command);
}

export async function batchCall(params) {
  const command = new BatchWriteCommand(params);
  return dynamoDb.send(command);
}
