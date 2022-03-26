import * as dynamoDbLib from "../libs/dynamodb-lib";
import { success, failure } from "../libs/response-lib";

export async function main(event) {
  const data = JSON.parse(event.body);
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(':')[2];
  let comment;
  let commentLikes;
  let likeRemoved = false;

  // Basic validation
  const commentId = data.commentId;
  if(!commentId) {
    return failure({ status: false, message: "Invalid comment ID" });
  }
  const params = {
    TableName: "NaadanChordsComments",
    ScanFilter: {
      "commentId": {
        ComparisonOperator: "EQ",
        AttributeValueList: [commentId]
      }
    }
  };

  try {
    comment = await dynamoDbLib.call("scan", params);
  } catch (e) {
    return failure({ status: false, error: e });
  }

  if (comment.Items.length === 1) {
    commentLikes = comment.Items[0].likes || [];
    const index = commentLikes.indexOf(sub);
    if (index > -1) {
      commentLikes.splice(index, 1);
      likeRemoved = true;
    } else {
      commentLikes.push(sub);
    }
  } else {
    return failure({ status: false, message: "Invalid comment ID" });
  }

  const updateParams = {
    TableName: "NaadanChordsComments",
    Key: {
      commentId,
      userId: comment.Items[0].userId
    },
    UpdateExpression: "SET likes = :likes",
    ExpressionAttributeValues: {
      ":likes": commentLikes || "[]"
    },
    ReturnValues: "ALL_NEW"
  };

  try {
    await dynamoDbLib.call("update", updateParams);
    return success({ status: true, likeRemoved });
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
