import { randomInt } from "crypto";
import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import { success, failure } from "../libs/response-lib";
import { appendRatings } from "../common/post-ratings";
import { appendCommentsCount } from "../common/post-comments";

async function getItemCount() {
  const itemCountParams = {
    TableName: "NaadanChords",
    IndexName: "postType-updatedAt-index",
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
  // Ensure min and max are integers
  const intMin = Math.ceil(min);
  const intMax = Math.floor(max);

  // crypto.randomInt's upper bound is exclusive, so add 1 to make it inclusive.
  return randomInt(intMin, intMax + 1);
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
    let finalResult = await appendRatings({ Items: [result] });
    finalResult = await appendCommentsCount(finalResult);

    return success(finalResult.Items[0]);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
