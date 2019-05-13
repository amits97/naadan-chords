import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as userNameLib from "./libs/username-lib";
import { success, failure } from "./libs/response-lib";

async function getItemCount() {
  const itemCountParams = {
    TableName: "NaadanChords",
    IndexName: "postType-createdAt-index",
    KeyConditionExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":postType": "POST"
    },
    ProjectionExpression: "postId",
    ScanIndexForward: false
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
        postId: postId
      }
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
    result.userName = await userNameLib.call(userId);
    return success(result);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}