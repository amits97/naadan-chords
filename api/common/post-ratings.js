import * as dynamoDbLib from "../libs/dynamodb-lib";

export async function appendRatings(result) {
  let items = result.Items;
  let filterExpression = "";
  let expressionAttributeValues = {};

  for (let i = 0; i < items.length; i++) {
    let postId = items[i].postId;
    if (filterExpression) {
      filterExpression += ` OR contains(postId, :postId${i})`;
    } else {
      filterExpression = `contains(postId, :postId${i})`;
    }
    expressionAttributeValues[`:postId${i}`] = postId;
  }

  let params = {
    TableName: "NaadanChordsRatings",
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  try {
    let ratingsResult = await dynamoDbLib.call("scan", params);
    let ratings = ratingsResult.Items;
    let ratingsObject = {};

    for (let i = 0; i < ratings.length; i++) {
      let ratingItem = ratings[i];
      ratingsObject[ratingItem.postId] = {
        rating: ratingItem.rating,
        ratingCount: ratingItem.count,
      };
    }

    for (let i = 0; i < items.length; i++) {
      if (ratingsObject.hasOwnProperty(items[i].postId)) {
        items[i].rating = ratingsObject[items[i].postId].rating;
        items[i].ratingCount = ratingsObject[items[i].postId].ratingCount;
      }
    }

    result.Items = items;
  } catch (e) {
    result.ratingsError = e;
  }

  return result;
}
