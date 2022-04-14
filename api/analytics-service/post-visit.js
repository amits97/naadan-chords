import * as dynamoDbLib from "../libs/dynamodb-lib";
import { success, failure } from "../libs/response-lib";

function lessThanOneHourAgo(date) {
  date = parseInt(date);
  const HOUR = 1000 * 60 * 60;
  const anHourAgo = Date.now() - HOUR;
  return date > anHourAgo;
}

export async function main(event) {
  // Request body is passed in as a JSON encoded string in 'event.body'
  const data = JSON.parse(event.body);
  const ipAddress = event.requestContext?.identity?.sourceIp;

  if (!data.postId) {
    return failure('Post ID not present!');
  }

  if (!ipAddress) {
    return failure('No IP address present!');
  }

  const historyParams = {
    TableName: "NaadanChordsAnalytics",
    IndexName: "ipAddress-postId-index",
    KeyConditionExpression: "ipAddress = :ipAddress AND postId = :postId",
    ExpressionAttributeValues: {
      ":ipAddress": ipAddress,
      ":postId": data.postId
    },
  };

  let historyResult = [];
  try {
    let result = await dynamoDbLib.call("query", historyParams);
    historyResult = historyResult.concat(result.Items);
    while(result.hasOwnProperty("LastEvaluatedKey")) {
      historyParams.ExclusiveStartKey = result.LastEvaluatedKey;
      result = await dynamoDbLib.call("query", historyParams);
      historyResult = historyResult.concat(result.Items);
    }

    if (historyResult.length > 0) {
      const recentVisit = Math.max(...historyResult.map(history => history.timestamp));
      if (lessThanOneHourAgo(recentVisit)) {
        return success('Already visited within last hour');
      }
    }
  } catch (e) {
    return failure({ status: false, error: e });
  }

  const params = {
    TableName: "NaadanChordsAnalytics",
    Item: {
      timestamp: Date.now(),
      postId: data.postId,
      ipAddress
    }
  };

  try {
    await dynamoDbLib.call("put", params);
    return success(params.Item);
  } catch (e) {
    return failure({ status: false });
  }
}
