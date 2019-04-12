import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as userNameLib from "./libs/username-lib";
import { success, failure } from "./libs/response-lib";

function getRandomInt(min, max) {
  //Will return a number inside the given range, inclusive of both minimum and maximum
  //i.e. if min=0, max=20, returns a number from 0-20
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function main(event, context) {
  async function query() {
    var start = 13433472000001; //oldest post timestamp + 1
    var end = new Date().getTime();
    var randomDate = new Date(start + (Math.random()) * (end - start)).getTime();
  
    const params = {
      TableName: "NaadanChords",
      IndexName: "postType-createdAt-index",
      KeyConditionExpression: "postType = :postType AND createdAt < :createdAt",
      ExpressionAttributeValues: {
        ":postType": "POST",
        ":createdAt": randomDate,
      },
      ScanIndexForward: false
    };
  
    let result = await dynamoDbLib.call("query", params);
    let randomIndex = getRandomInt(0, result.Count - 1);
    return result.Items[randomIndex];
  }
  
  async function retryLoop() {
    const result = await query();
  
    if(result) {
      return result;
    } else {
      return retryLoop();
    }
  }  

  try {
    const result = await retryLoop();
    // Return the retrieved item
    let userId = result.userId;
    result.userName = await userNameLib.call(userId);
    return success(result);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}