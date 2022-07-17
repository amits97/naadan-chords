import * as dynamoDbLib from "../libs/dynamodb-lib";
import { success, failure } from "../libs/response-lib";

async function fetchComment(commentId) {
  const params = {
    TableName: "NaadanChordsComments",
    ScanFilter: {
      commentId: {
        ComparisonOperator: "EQ",
        AttributeValueList: [commentId],
      },
    },
  };
  const comment = await dynamoDbLib.call("scan", params);
  return comment;
}

async function deleteComment(comment) {
  const params = {
    TableName: "NaadanChordsComments",
    Key: {
      commentId: comment.commentId,
      userId: comment.userId,
    },
  };
  await dynamoDbLib.call("delete", params);
}

async function deleteChildComments(comment) {
  if (comment.replies) {
    for (let i = 0; i < comment.replies.length; i++) {
      const childComment = await fetchComment(comment.replies[i]);
      await deleteChildComments(childComment.Items[0]);
      await deleteComment(childComment.Items[0]);
    }
  }
}

export async function main(event) {
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(":")[2];

  if (!sub) {
    return failure({ status: "Not authorized" });
  }

  const params = {
    TableName: "NaadanChordsComments",
    Key: {
      commentId: event.pathParameters.commentId,
      userId: sub,
    },
  };

  try {
    const result = await dynamoDbLib.call("get", params);

    if (result.Item.userId === sub) {
      let comment = result.Item;

      // Update replies array in parent
      if (comment.parentCommentId) {
        let replies;
        let parentComment = await fetchComment(comment.parentCommentId);
        if (parentComment.Items.length === 1) {
          parentComment = parentComment.Items[0];
          replies = parentComment.replies || [];
          const index = replies.indexOf(comment.commentId);
          if (index > -1) {
            replies.splice(index, 1);
          }

          const updateParams = {
            TableName: "NaadanChordsComments",
            Key: {
              commentId: parentComment.commentId,
              userId: parentComment.userId,
            },
            UpdateExpression: "SET replies = :replies",
            ExpressionAttributeValues: {
              ":replies": replies || "[]",
            },
            ReturnValues: "ALL_NEW",
          };

          try {
            await dynamoDbLib.call("update", updateParams);
          } catch (e) {
            // Ignore
          }
        }
      }

      // Delete all child replies
      await deleteChildComments(comment);

      await dynamoDbLib.call("delete", params);
      return success({ status: true });
    } else {
      return failure({ status: "Not authorized" });
    }
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
