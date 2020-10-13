import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import { success, failure } from "../libs/response-lib";

async function appendRating(item) {
  const params = {
    TableName: "NaadanChordsRatings",
    Key: {
      postId: item.postId
    }
  };

  try {
    let ratingResult = await dynamoDbLib.call("get", params);
    if(ratingResult && ratingResult.hasOwnProperty("Item")) {
      item.rating = ratingResult.Item.rating;
      item.ratingCount = ratingResult.Item.count;
    }
  } catch(e) {
    item.ratingError = e;
  }

  return item;
}

function retryLoop(postId) {
  let keywords = postId.split("-");

  if(keywords.length > 1) {
    keywords.pop();
    return retryGet(keywords.join("-"));
  } else {
    return failure({ status: false, error: "Item not found." });
  }
}

async function retryGet(postId) {
  let params = {
    TableName: "NaadanChords",
    ScanFilter: {
      "postId": {
        ComparisonOperator: "CONTAINS",
        AttributeValueList: [postId]
      }
    }
  };

  if(postId.length > 2) {
    try {
      const result = await dynamoDbLib.call("scan", params);
      if(result.Items.length > 0) {
        let finalResult = result.Items[0];
        let userId = finalResult.userId;

        //Get full attributes of author
        let authorAttributes = await userNameLib.getAuthorAttributes(userId);
        finalResult.authorName = authorAttributes.authorName;
        finalResult.userName = authorAttributes.userName;

        //Do not expose userId
        delete(finalResult.userId);

        finalResult = await appendRating(finalResult);
        return success(finalResult);
      } else {
        return retryLoop(postId);
      }
    } catch (e) {
      return failure({ status: false, error: e });
    }
  } else {
    return failure({ status: false, error: "Item not found." });
  }
}

export async function main(event, context) {
  const params = {
    TableName: "NaadanChords",
    Key: {
      postId: event.pathParameters.id
    }
  };

  try {
    const result = await dynamoDbLib.call("get", params);
    if (result.Item) {
      let userId = result.Item.userId;

      //Get full attributes of author
      let authorAttributes = await userNameLib.getAuthorAttributes(userId);
      result.Item.authorName = authorAttributes.authorName;
      result.Item.userName = authorAttributes.userName;

      //Do not expose userId
      delete(result.Item.userId);

      let finalResult = await appendRating(result.Item);
      return success(finalResult);
    } else {
      return retryGet(event.pathParameters.id);
    }
  } catch (e) {
    return failure({ status: false, error: e });
  }
}