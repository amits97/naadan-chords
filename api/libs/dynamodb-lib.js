const AWS = require("aws-sdk");
const https = require("https");
const sslAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  rejectUnauthorized: true
});
sslAgent.setMaxListeners(0);

AWS.config.update({
  httpOptions: {
    agent: sslAgent
  }
});

export function call(action, params) {
  const dynamoDb = new AWS.DynamoDB.DocumentClient();

  return dynamoDb[action](params).promise();
}

export function batchCall(params) {
  const dynamoDb = new AWS.DynamoDB.DocumentClient();

  return dynamoDb.batchWrite(params).promise();
}