import * as dynamoDbLib from "../libs/dynamodb-lib";

export async function countReplyComments(commentId) {
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
  if (comment.Items && comment.Items.length === 1) {
    let count = 1;
    let commentItem = comment.Items[0];
    let replies = commentItem.replies || [];
    for (let i = 0; i < replies.length; i++) {
      const replyCommentsCount = await countReplyComments(replies[i]);
      count += replyCommentsCount;
    }
    return count;
  }
  return 0;
}

export async function appendCommentsCount(result) {
  let items = result.Items;
  let filterExpression = "";
  let expressionAttributeValues = {};

  for (let i = 0; i < items.length; i++) {
    let postId = items[i].postId;
    if (filterExpression) {
      filterExpression += ` OR contains(postId, :postId${i})`;
    } else {
      filterExpression = `contains(postId, :postId${i})`;
    }
    expressionAttributeValues[`:postId${i}`] = postId;
  }

  let params = {
    TableName: "NaadanChordsComments",
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  try {
    let commentsResult = await dynamoDbLib.call("scan", params);
    let comments = commentsResult.Items;
    let commentsObject = {};

    for (let i = 0; i < comments.length; i++) {
      let commentItem = comments[i];
      let replies = commentItem.replies || [];
      commentsObject[commentItem.postId] =
        (commentsObject[commentItem.postId] || 0) + 1;
      for (let j = 0; j < replies.length; j++) {
        const replyCommentsCount = await countReplyComments(replies[j]);
        commentsObject[commentItem.postId] += replyCommentsCount;
      }
    }

    for (let i = 0; i < items.length; i++) {
      if (commentsObject.hasOwnProperty(items[i].postId)) {
        items[i].commentsCount = commentsObject[items[i].postId];
      }
    }

    result.Items = items;
  } catch (e) {
    result.commentsError = e;
  }

  return result;
}
