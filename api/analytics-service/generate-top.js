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
  return b[1] - a[1];
}

async function appendPostDetails(topPosts) {
  let postIds = [];
  var postId;
  var filterExpression = "";
  var expressionAttributeValues = {};

  let topPostsArray = [];
  for(postId in topPosts) {
    if(topPosts.hasOwnProperty(postId)) {
      topPostsArray.push([postId, topPosts[postId]]);
    }
  }

  topPostsArray.sort(compare);
  topPostsArray = topPostsArray.slice(0, 10);

  topPostsArray.forEach((item) => {
    postIds.push(item[0]);
  });

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
    },
    Limit: 3000
  };

  await clearTable();
  try {
    await clearTable();
    let resultItems = [];
    let result = await dynamoDbLib.call("scan", params);
    resultItems = resultItems.concat(result.Items);
    while(result.hasOwnProperty("LastEvaluatedKey")) {
      params.ExclusiveStartKey = result.LastEvaluatedKey;
      result = await dynamoDbLib.call("scan", params);
      resultItems = resultItems.concat(result.Items);
    }
    return getTop10Posts(resultItems);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}