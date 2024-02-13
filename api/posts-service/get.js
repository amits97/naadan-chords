import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import { success, failure } from "../libs/response-lib";
import { appendRatings } from "../common/post-ratings";
import { appendCommentsCount } from "../common/post-comments";

function retryLoop(postId) {
  let keywords = postId.split("-");

  if (keywords.length > 1) {
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
      postId: {
        ComparisonOperator: "CONTAINS",
        AttributeValueList: [postId],
      },
    },
  };

  if (postId.length > 2) {
    try {
      const result = await dynamoDbLib.call("scan", params);
      if (result.Items.length > 0) {
        let finalResult = result.Items[0];
        let userId = finalResult.userId;

        //Get full attributes of author
        let authorAttributes = await userNameLib.getAuthorAttributes(userId);
        finalResult.authorName = authorAttributes.authorName;
        finalResult.userName =
          authorAttributes.preferredUsername ?? authorAttributes.userName;
        finalResult.authorPicture = authorAttributes.picture;

        //Do not expose userId
        delete finalResult.userId;

        finalResult = await appendRatings({ Items: [finalResult] });
        finalResult = await appendCommentsCount(finalResult);
        return success(finalResult.Items[0]);
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
      postId: event.pathParameters.id,
    },
  };

  try {
    const result = await dynamoDbLib.call("get", params);
    if (result.Item) {
      let userId = result.Item.userId;

      //Get full attributes of author
      let authorAttributes = await userNameLib.getAuthorAttributes(userId);
      result.Item.authorName = authorAttributes.authorName;
      result.Item.userName =
        authorAttributes.preferredUsername ?? authorAttributes.userName;
      result.Item.authorPicture = authorAttributes.picture;

      //Do not expose userId
      delete result.Item.userId;

      let finalResult = await appendRatings({ Items: [result.Item] });
      finalResult = await appendCommentsCount(finalResult);
      return success(finalResult.Items[0]);
    } else {
      return retryGet(event.pathParameters.id);
    }
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
