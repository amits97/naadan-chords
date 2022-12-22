import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import { success, failure } from "../libs/response-lib";

async function appendRating(item) {
  const params = {
    TableName: "NaadanChordsRatings",
    Key: {
      postId: item.postId,
    },
  };

  try {
    let ratingResult = await dynamoDbLib.call("get", params);
    if (ratingResult && ratingResult.hasOwnProperty("Item")) {
      item.rating = ratingResult.Item.rating;
      item.ratingCount = ratingResult.Item.count;
    }
  } catch (e) {
    item.ratingError = e;
  }

  return item;
}

async function getItemCount() {
  const itemCountParams = {
    TableName: "NaadanChords",
    IndexName: "postType-createdAt-index",
    KeyConditionExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":postType": "POST",
    },
    ProjectionExpression: "postId",
    ScanIndexForward: false,
  };

  let itemsResult = await dynamoDbLib.call("query", itemCountParams);
  return itemsResult;
}

function getRandomInt(min, max) {
  //Will return a number inside the given range, inclusive of both minimum and maximum
  //i.e. if min=0, max=20, returns a number from 0-20
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function main(event, context) {
  async function getPost(postId) {
    const params = {
      TableName: "NaadanChords",
      Key: {
        postId: postId,
      },
    };

    let result = await dynamoDbLib.call("get", params);
    return result.Item;
  }

  try {
    let itemsResult = await getItemCount();
    let itemCount = itemsResult.Items.length;
    let randomItemNumber = getRandomInt(0, itemCount);

    const result = await getPost(itemsResult.Items[randomItemNumber].postId);
    let userId = result.userId;

    //Get full attributes of author
    let authorAttributes = await userNameLib.getAuthorAttributes(userId);
    result.authorName = authorAttributes.authorName;
    result.userName =
      authorAttributes.preferredUsername ?? authorAttributes.userName;
    result.authorPicture = authorAttributes.picture;

    //Do not expose userId
    delete result.userId;

    //Append rating
    let finalResult = await appendRating(result);

    return success(finalResult);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
