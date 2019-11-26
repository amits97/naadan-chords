import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as searchFilterLib from "../libs/searchfilter-lib";
import { success, failure } from "../libs/response-lib";

async function appendPublishedPosts(result, userId, queryStringParameters) {
  let finalResult;
  let params = {
    TableName: "NaadanChords",
    IndexName: "userId-createdAt-index",
    KeyConditionExpression: "userId = :userId",
    FilterExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":userId": userId,
      ":postType": "POST"
    },
    ScanIndexForward: false,
    ProjectionExpression: "postId, createdAt, postType, title, userId",
    Limit: 15
  };

  let publishedResults = [];

  if(queryStringParameters && queryStringParameters.s) {
    //search
    params = {
      TableName: "NaadanChords",
      ProjectionExpression: "postId, createdAt, postType, title, userId",
      ...searchFilterLib.getSearchFilter(queryStringParameters.s, userId, "POST")
    };

    if(queryStringParameters.exclusiveStartKey) {
      //pagination
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(queryStringParameters.exclusiveStartKey).replace(/'/g, '"'));
    }

    publishedResults = await dynamoDbLib.call("scan", params);
  } else {
    if(queryStringParameters && queryStringParameters.exclusiveStartKey) {
      //pagination
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(queryStringParameters.exclusiveStartKey).replace(/'/g, '"'));
    }

    publishedResults = await dynamoDbLib.call("query", params);
  }

  if(publishedResults.Items) {
    finalResult = publishedResults;
    if(!queryStringParameters || !queryStringParameters.exclusiveStartKey) {
      finalResult.Items = result.Items.concat(publishedResults.Items);
    }
  } else {
    finalResult = result;
  }

  return finalResult;
}

export async function main(event) {
  let provider, sub;

  try {
    provider = event.requestContext.identity.cognitoAuthenticationProvider;
    sub = provider.split(':')[2];
  } catch(e) {
    return failure({ status: "Not authorized", error: e });
  }

  if(!sub) {
    return failure({ status: "Not authorized" });
  }

  let params = {
    TableName: "NaadanChordsContributions",
    IndexName: "userId-createdAt-index",
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": sub,
    },
    ScanIndexForward: false,
    ProjectionExpression: "postId, createdAt, postType, title",
    Limit: 15
  };

  try {
    let result;
    if(event.queryStringParameters && event.queryStringParameters.s) {
      //search
      params = {
        TableName: "NaadanChordsContributions",
        ProjectionExpression: "postId, createdAt, postType, title, userId",
        ...searchFilterLib.getSearchFilter(event.queryStringParameters.s, sub, "POST")
      };
      result = await dynamoDbLib.call("scan", params);
    } else {
      result = await dynamoDbLib.call("query", params);
    }

    if(result.Items) {
      result.Items.forEach((item) => {
        item.pending = true
      });
    }

    result = await appendPublishedPosts(result, sub, event.queryStringParameters);

    return success(result);
  } catch(e) {
    return failure({ status: false, error: e });
  }
}
