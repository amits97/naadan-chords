import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import { success, failure } from "../libs/response-lib";

async function appendRatings(result) {
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

export async function main() {
  let params = {
    TableName: "NaadanChordsTop",
    IndexName: "postType-views-index",
    KeyConditionExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":postType": "POST",
    },
    ProjectionExpression: "postId, title, userId, createdAt, updatedAt, #views",
    ExpressionAttributeNames: {
      "#views": "views",
    },
    ScanIndexForward: false,
  };

  try {
    let result = await dynamoDbLib.call("query", params);

    let users = {};

    for (let i = 0; i < result.Items.length; i++) {
      let userId = result.Items[i].userId;

      if (!users.hasOwnProperty(userId)) {
        users[userId] = {};

        //Get full attributes of author
        let authorAttributes = await userNameLib.getAuthorAttributes(userId);
        users[userId].authorName = authorAttributes.authorName;
        users[userId].userName =
          authorAttributes.preferredUsername ?? authorAttributes.userName;
        users[userId].authorPicture = authorAttributes.picture;
      }

      delete result.Items[i].userId;
      result.Items[i].authorName = users[userId].authorName;
      result.Items[i].userName = users[userId].userName;
      result.Items[i].authorPicture = users[userId].authorPicture;
    }

    //append ratings
    let finalResult = await appendRatings(result);

    return success(finalResult.Items);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
