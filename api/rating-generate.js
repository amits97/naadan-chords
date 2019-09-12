import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";

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

async function saveRatings(ratingMap) {
  let itemsArray = [];
  for(let postId in ratingMap) {
    if(ratingMap.hasOwnProperty(postId)) {
      let item = {
        PutRequest : {
          Item : {
            postId: postId,
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