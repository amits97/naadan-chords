import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";

function getTop10Posts(items) {
  let topPosts = {};

  for(let i = 0; i < items.length; i++) {
    if(topPosts.hasOwnProperty(items[i].postId)) {
      topPosts[items[i].postId] = topPosts[items[i].postId] + 1
    } else {
      topPosts[items[i].postId] = 1;
    }
  }

  return appendPostDetails(topPosts);
}

function compare(a,b) {
  if (a.views < b.views)
    return 1;
  if (a.views > b.views)
    return -1;
  return 0;
}

async function appendPostDetails(topPosts) {
  let postIds = [];
  var postId;
  var filterExpression = "";
  var expressionAttributeValues = {};

  for(postId in topPosts) {
    if(topPosts.hasOwnProperty(postId)) {
      postIds.push(postId)
    }
  }

  for(let i = 0; i < postIds.length; i++) {
    let postId = postIds[i];
    if(filterExpression) {
      filterExpression += ` OR contains(postId, :postId${i})`;
    } else {
      filterExpression = `contains(postId, :postId${i})`;
    }
    expressionAttributeValues[`:postId${i}`] = postId;
  }

  let params = {
    TableName: "NaadanChords",
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ProjectionExpression: "postId, title"
  };

  try {
    let result = await dynamoDbLib.call("scan", params);
    let resultArray = [];
  
    for(let i = 0; i < result.Items.length; i++) {
      let post = result.Items[i];
      resultArray.push({
        postId: post.postId,
        title: post.title,
        views: topPosts[post.postId]
      });
    }
    
    resultArray.sort(compare);
    return success(resultArray.slice(0, 10));
  } catch(e) {
    return failure({ status: false, error: e });
  }
}

export async function main(event, context, callback) {
  let params = {
    TableName: "NaadanChordsAnalytics",
    FilterExpression: "#timestamp > :timestamp",
    ExpressionAttributeValues: {
      ":timestamp": Date.now() - (60*60*24*7*1000)
    },
    ExpressionAttributeNames: {
      "#timestamp": "timestamp"
    }
  };

  try {
    let result = await dynamoDbLib.call("scan", params);
    return getTop10Posts(result.Items);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}