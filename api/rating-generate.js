import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";

async function appendTitles(ratingMap) {
  let filterExpression = "";
  let expressionAttributeValues = {};
  let i = 0;

  for(let postId in ratingMap) {
    if(ratingMap.hasOwnProperty(postId)) {
      if(filterExpression) {
        filterExpression += ` OR contains(postId, :postId${i})`;
      } else {
        filterExpression = `contains(postId, :postId${i})`;
      }
      expressionAttributeValues[`:postId${i}`] = postId;
      i++;
    }
  }

  let params = {
    TableName: "NaadanChords",
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ProjectionExpression: "postId, title"
  };

  try {
    let itemsResult = await dynamoDbLib.call("scan", params);
    let items = itemsResult.Items;
    
    for(let i = 0; i < items.length; i++) {
      ratingMap[items[i].postId].title = items[i].title;
    }
  } catch(e) {
    //Do nothing
  }

  return ratingMap;
}

function constructRatingMap(result) {
  let ratingMap = {};

  for(let i = 0; i < result.Items.length; i++) {
    let item = result.Items[i];
    if(ratingMap.hasOwnProperty(item.postId)) {
      let existingItem = ratingMap[item.postId];
      let newCount = existingItem.count + 1;
      let newRating = ((existingItem.rating * existingItem.count) + item.rating) / newCount;

      ratingMap[item.postId] = {
        rating: newRating,
        count: newCount
      }
    } else {
      ratingMap[item.postId] = {
        rating: item.rating,
        count: 1
      }
    }
  }

  return ratingMap;
}

function calculateWeightedRatings(ratingMap) {
  let totalAverageRating, totalAverage = 0, totalCount = 0;

  for(let postId in ratingMap) {
    if(ratingMap.hasOwnProperty(postId)) {
      let item = ratingMap[postId];
      totalAverage += item.rating;
      totalCount++;
    }
  }

  totalAverageRating = totalAverage / totalCount;

  for(let postId in ratingMap) {
    if(ratingMap.hasOwnProperty(postId)) {
      let averageRating = ratingMap[postId].rating;
      let ratingCount = ratingMap[postId].count;
      let tuneParameter = 25000;

      let weightedRating = (ratingCount / (ratingCount + tuneParameter)) * averageRating + (tuneParameter / (ratingCount + tuneParameter)) * totalAverageRating;
      ratingMap[postId].weightedRating = weightedRating;
    }
  }
  return ratingMap;
}

async function saveRatings(ratingMap) {
  let itemsArray = [];

  ratingMap = calculateWeightedRatings(ratingMap);
  ratingMap = await appendTitles(ratingMap);

  for(let postId in ratingMap) {
    if(ratingMap.hasOwnProperty(postId)) {
      let item = {
        PutRequest : {
          Item : {
            postId: postId,
            postType: "POST",
            ...ratingMap[postId]
          }
        }
      };
      itemsArray.push(item);
    }
  }

  const params = {
    RequestItems: {
      "NaadanChordsRatings": itemsArray
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

export async function main(event, context, callback) {
  let params = {
    TableName: "NaadanChordsRatingsLog",
    ProjectionExpression: "postId, rating"
  };

  try {
    let ratingMap = {};
    let result = await dynamoDbLib.call("scan", params);
    ratingMap = constructRatingMap(result);
    while(result.hasOwnProperty("LastEvaluatedKey")) {
      params.ExclusiveStartKey = result.LastEvaluatedKey;
      result = await dynamoDbLib.call("scan", params);
      ratingMap = constructRatingMap(result);
    }
    let saveRatingsResponse = await saveRatings(ratingMap);
    return success(saveRatingsResponse);
  } catch(e) {
    return failure({ status: false, error: e });
  }
}