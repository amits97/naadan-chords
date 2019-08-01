import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as userNameLib from "./libs/username-lib";
import * as searchFilterLib from "./libs/searchfilter-lib";

export async function main(event, context, callback) {
  var lastEvaluatedKey;
  if(event.page) {
    var page = event.page - 1;
    
    if(page > 0) {
      let skipParams = {
        TableName: "NaadanChords",
        IndexName: "postType-createdAt-index",
        KeyConditionExpression: "postType = :postType",
        ExpressionAttributeValues: {
          ":postType": event.postType || "POST",
        },
        ScanIndexForward: false,
        ProjectionExpression: "postId",
        Limit: 15 * page
      };
  
      if(event.category) {
        //filter by category
        skipParams.IndexName = "category-createdAt-index";
        skipParams.KeyConditionExpression = "category = :category";
        skipParams.ExpressionAttributeValues =  {
          ":category": event.category
        };
      }
  
      try {
        var skipResult = await dynamoDbLib.call("query", skipParams);
        if(skipResult.hasOwnProperty("LastEvaluatedKey")) {
          lastEvaluatedKey = skipResult.LastEvaluatedKey;
        } else {
          return [];
        }
      } catch(e) {
        return { status: false, error: e };
      }
    } else if(page !== 0) {
      return [];
    }
  }

  let params = {
    TableName: "NaadanChords",
    IndexName: "postType-createdAt-index",
    KeyConditionExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":postType": event.postType || "POST",
    },
    ScanIndexForward: false,
    ProjectionExpression: "postId, createdAt, postType, title, userId",
    Limit: 15
  };

  if(event.exclusiveStartKey) {
    //pagination
    params.ExclusiveStartKey = JSON.parse(decodeURIComponent(event.exclusiveStartKey).replace(/'/g, '"'));
  }
  if(lastEvaluatedKey) {
    //pagination
    params.ExclusiveStartKey = lastEvaluatedKey;
  }

  if(event.category) {
    //filter by category
    params.IndexName = "category-createdAt-index";
    params.KeyConditionExpression = "category = :category";
    params.ExpressionAttributeValues =  {
      ":category": event.category
    };
  }

  try {
    let result = {};
    if(event.search) {
      //search
      params = {
        TableName: "NaadanChords",
        ProjectionExpression: "postId, createdAt, postType, title, userId",
        ...searchFilterLib.getSearchFilter(event.search)
      };
      result = await dynamoDbLib.call("scan", params);
    } else {
      result = await dynamoDbLib.call("query", params);
    }

    let users = {};

    if(result.Items.length > 15) {
      result.Items = result.Items.slice(0, 15);
    }

    for(let i = 0; i < result.Items.length; i++) {
      let userId = result.Items[i].userId;

      if(!users.hasOwnProperty(userId)) {
        users[userId] = {};

        //Get full attributes of author
        let authorAttributes = await userNameLib.getAuthorAttributes(userId);
        users[userId].authorName = authorAttributes.authorName;
        users[userId].userName = authorAttributes.userName;
      }

      delete(result.Items[i].userId);
      result.Items[i].authorName =  users[userId].authorName;
      result.Items[i].userName =  users[userId].userName;
    }

    return result;
  } catch (e) {
    return { status: false, error: e };
  }
}