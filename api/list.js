import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as userNameLib from "./libs/username-lib";

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

function lowerCase(text) {
  return text.toLowerCase();
}

function capitalizeFirstLetter(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function titleCase(str) {
  return str.replace(/\w\S*/g, function(txt){
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

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
        FilterExpression: "contains(postId, :postId) OR contains(content, :lowercase) OR contains(content, :capitalize) OR contains(content, :titlecase)",
        ExpressionAttributeValues: {
          ":postId": slugify(event.search),
          ":lowercase": lowerCase(event.search),
          ":capitalize": capitalizeFirstLetter(event.search),
          ":titlecase": titleCase(event.search)
        },
        ProjectionExpression: "postId, createdAt, postType, title, userId"
      };
      if(event.postType) {
        params.FilterExpression = "contains(postId, :postId) AND postType = :postType";
        params.ExpressionAttributeValues = {
          ":postType": event.postType,
          ":postId": slugify(event.search)
        };
      }
      result = await dynamoDbLib.call("scan", params);
    } else {
      result = await dynamoDbLib.call("query", params);
    }

    let users = {};

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