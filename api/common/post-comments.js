import * as dynamoDbLib from "../libs/dynamodb-lib";

export async function countReplyComments(commentId) {
  const params = {
    TableName: "NaadanChordsComments",
    KeyConditionExpression: "commentId = :commentId",
    ExpressionAttributeValues: {
      ":commentId": commentId,
    },
  };
  const comment = await dynamoDbLib.call("query", params);
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
  if (!items || items.length === 0) {
    return result;
  }

  try {
    const commentsQueries = items.map(async (item) => {
      const params = {
        TableName: "NaadanChordsComments",
        IndexName: "postId-createdAt-index",
        KeyConditionExpression: "postId = :postId",
        ExpressionAttributeValues: {
          ":postId": item.postId,
        },
      };
      const queryResult = await dynamoDbLib.call("query", params);
      return { postId: item.postId, items: queryResult.Items || [] };
    });

    const queryResults = await Promise.all(commentsQueries);
    let commentsObject = {};

    for (let i = 0; i < queryResults.length; i++) {
      const { postId, items: commentsList } = queryResults[i];
      if (commentsList.length > 0) {
        commentsObject[postId] = commentsList.length;
        for (let j = 0; j < commentsList.length; j++) {
          let commentItem = commentsList[j];
          let replies = commentItem.replies || [];
          for (let k = 0; k < replies.length; k++) {
            const replyCommentsCount = await countReplyComments(replies[k]);
            commentsObject[postId] += replyCommentsCount;
          }
        }
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
