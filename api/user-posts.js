import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as userNameLib from "./libs/username-lib";
import * as searchFilterLib from "./libs/searchfilter-lib";

export async function main(event, context, callback) {
  let dynamoDbQueryType = "query";

  if(!event.userName) {
    return { status: false, error: "No username specified" };
  }

  let userId = await userNameLib.getUserId(event.userName);

  if(userId === "") {
    return [];
  }

  var lastEvaluatedKey;
  if(event.page) {
    var page = event.page - 1;

    if(page > 0) {
      let skipParams = {
        TableName: "NaadanChords",
        IndexName: "userId-createdAt-index",
        KeyConditionExpression: "userId = :userId",
        FilterExpression: "postType = :postType",
        ExpressionAttributeValues: {
          ":userId": userId,
          ":postType": event.postType ? event.postType : "POST"
        },
        ScanIndexForward: false,
        ProjectionExpression: "postId",
        Limit: 15 * page
      };

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
    IndexName: "userId-createdAt-index",
    KeyConditionExpression: "userId = :userId",
    FilterExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":userId": userId,
      ":postType": event.postType ? event.postType : "POST"
    },
    ScanIndexForward: false,
    ProjectionExpression: "postId, createdAt, postType, title, userId",
    Limit: 15
  };

  if(event.search) {
    //search
    dynamoDbQueryType = "scan";
    params = {
      TableName: "NaadanChords",
      ProjectionExpression: "postId, createdAt, postType, title, userId",
      ...searchFilterLib.getSearchFilter(event.search, userId, event.postType ? event.postType : "POST")
    };
  }

  if(event.exclusiveStartKey) {
    //pagination
    params.ExclusiveStartKey = JSON.parse(decodeURIComponent(event.exclusiveStartKey).replace(/'/g, '"'));
  }

  if(lastEvaluatedKey) {
    //pagination
    params.ExclusiveStartKey = lastEvaluatedKey;
  }

  try {
    let result = {};
    result = await dynamoDbLib.call(dynamoDbQueryType, params);

    //Get full attributes of author
    let authorAttributes = await userNameLib.getAuthorAttributes(userId);

    if(result.Items.length > 15) {
      result.Items = result.Items.slice(0, 15);
    }

    if(result.Items.length > 0) {
      for(let i = 0; i < result.Items.length; i++) {
        result.Items[i].userName = authorAttributes.userName;
        result.Items[i].authorName = authorAttributes.authorName;
        delete(result.Items[i].userId);
      }
    }
    return result;
  } catch (e) {
    return { status: false, error: e };
  }
}