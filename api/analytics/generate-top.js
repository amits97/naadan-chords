import * as dynamoDbLib from "../libs/dynamodb-lib";
import { success, failure } from "../libs/response-lib";

async function getTop10Posts(items) {
  let topPosts = {};

  for(let i = 0; i < items.length; i++) {
    if(topPosts.hasOwnProperty(items[i].postId)) {
      topPosts[items[i].postId] = topPosts[items[i].postId] + 1
    } else {
      topPosts[items[i].postId] = 1;
    }
  }

  let topPostsResult = await appendPostDetails(topPosts);
  return topPostsResult;
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
    resultArray = resultArray.slice(0, 10);
    let saveResult = await saveTop10Posts(resultArray);
    return success({ status: true, message: saveResult });
  } catch(e) {
    return failure({ status: false, error: e });
  }
}

async function saveTop10Posts(top10Posts) {
  let itemsArray = [];
  for(let i = 0; i < top10Posts.length; i++) {
    let item = {
      PutRequest : {
        Item : {
          ...top10Posts[i],
          postType: "POST"
        }
      }
    };
    itemsArray.push(item);
  }

  const params = {
    RequestItems: {
      "NaadanChordsTop": itemsArray
    },
    ReturnItemCollectionMetrics: "SIZE",
    ConsumedCapacity: "INDEXES"
  };

  try {
    let result = await dynamoDbLib.batchCall(params);
    return result;
  } catch(e) {
    return e;
  }
}

async function clearTable() {
  let params = {
    TableName: "NaadanChordsTop"
  };

  let result = await dynamoDbLib.call("scan", params);
  let resultArray = result.Items;

  let deleteRequestArray = [];
  for(let i = 0; i < resultArray.length; i++) {
    let deleteItem = {
      DeleteRequest : {
        Key : {
          "postId": resultArray[i].postId
        }
      }
    };
    deleteRequestArray.push(deleteItem);
  }

  if(deleteRequestArray.length > 0) {
    const deleteParams = {
      RequestItems: {
        "NaadanChordsTop": deleteRequestArray
      },
      ReturnItemCollectionMetrics: "SIZE",
      ConsumedCapacity: "INDEXES"
    };
  
    await dynamoDbLib.batchCall(deleteParams);
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
    await clearTable();
    let result = await dynamoDbLib.call("scan", params);
    return getTop10Posts(result.Items);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}