import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";

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
        return success(result.Items[0]);
      } else {
        return retryLoop(postId);
      }
    } catch (e) {
      return failure({ status: false });
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
    },
  };

  try {
    const result = await dynamoDbLib.call("get", params);
    if (result.Item) {
      // Return the retrieved item
      return success(result.Item);
    } else {
      return retryLoop(event.pathParameters.id);
    }
  } catch (e) {
    return failure({ status: false });
  }
}