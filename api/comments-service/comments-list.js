import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import { success, failure } from "../libs/response-lib";

export async function main(event, context) {
  let postId;

  if(event.queryStringParameters && event.queryStringParameters.postId) {
    postId = event.queryStringParameters.postId;
  } else {
    return failure({ status: "No postId passed" });
  }

  const params = {
    TableName: "NaadanChordsComments",
    IndexName: "postId-createdAt-index",
    KeyConditionExpression: "postId = :postId",
    ExpressionAttributeValues: {
      ":postId": postId
    },
    ScanIndexForward: false,
    Limit: 10
  };

  try {
    const result = await dynamoDbLib.call("query", params);

    if(result.Items) {
      let users = {};
      for(let i = 0; i < result.Items.length; i++) {
        let userId = result.Items[i].userId;
  
        if(!users.hasOwnProperty(userId)) {
          users[userId] = {};
  
          //Get full attributes of author
          let authorAttributes = await userNameLib.getAuthorAttributes(userId);
          users[userId].authorName = authorAttributes.authorName;
          users[userId].userName = authorAttributes.preferredUsername ?? authorAttributes.userName;
          users[userId].authorPicture = authorAttributes.picture;
        }
  
        delete(result.Items[i].userId);
        result.Items[i].authorName =  users[userId].authorName;
        result.Items[i].userName =  users[userId].userName;
        result.Items[i].authorPicture = users[userId].authorPicture;
      }
      return success(result);
    } else {
      //No comment data
      return success([]);
    }
  } catch (e) {
    return failure({ status: false, error: e });
  }
}