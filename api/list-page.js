import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as userNameLib from "./libs/username-lib";
import { success, failure } from "./libs/response-lib";

export async function main(event, context, callback) {
  var page = event.pathParameters.page ? event.pathParameters.page : 1;
  page = page - 1;
  var lastEvaluatedKey;

  if(page > 0) {
    let skipParams = {
      TableName: "NaadanChords",
      IndexName: "postType-createdAt-index",
      KeyConditionExpression: "postType = :postType",
      ExpressionAttributeValues: {
        ":postType": "POST",
      },
      ScanIndexForward: false,
      ProjectionExpression: "postId",
      Limit: 15 * page
    };

    if(event.pathParameters.category) {
      //filter by category
      skipParams.IndexName = "category-createdAt-index";
      skipParams.KeyConditionExpression = "category = :category";
      skipParams.ExpressionAttributeValues =  {
        ":category": event.pathParameters.category
      };
    }

    try {
      var skipResult = await dynamoDbLib.call("query", skipParams);
      if(skipResult.hasOwnProperty("LastEvaluatedKey")) {
        lastEvaluatedKey = skipResult.LastEvaluatedKey;
      }
    } catch(e) {
      return failure({ status: false, error: e });
    }
  }

  if(lastEvaluatedKey || page === 0) {
    let params = {
      TableName: "NaadanChords",
      IndexName: "postType-createdAt-index",
      KeyConditionExpression: "postType = :postType",
      ExpressionAttributeValues: {
        ":postType": "POST",
      },
      ScanIndexForward: false,
      ProjectionExpression: "postId, createdAt, postType, title, userId",
      Limit: 15
    };
  
    if(lastEvaluatedKey) {
      //pagination
      params.ExclusiveStartKey = lastEvaluatedKey;
    }
  
    if(event.pathParameters.category) {
      //filter by category
      params.IndexName = "category-createdAt-index";
      params.KeyConditionExpression = "category = :category";
      params.ExpressionAttributeValues =  {
        ":category": event.pathParameters.category
      };
    }
  
    try {
      let result = {};
      result = await dynamoDbLib.call("query", params);
  
      let users = {};
  
      for(let i = 0; i < result.Items.length; i++) {
        let userId = result.Items[i].userId;
  
        if(!users.hasOwnProperty(userId)) {
          let userName = await userNameLib.call(userId);
          users[userId] = userName;
        }
  
        result.Items[i].userName =  users[userId];
      }
  
      return success(result);
    } catch (e) {
      return failure({ status: false, error: e });
    }
  } else {
    return success([]);
  }
}