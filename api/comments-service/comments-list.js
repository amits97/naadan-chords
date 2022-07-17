import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import { success, failure } from "../libs/response-lib";

let users = {};

async function fetchReplyComment(commentId) {
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

async function fetchUserDetails(userId) {
  if (!users.hasOwnProperty(userId)) {
    users[userId] = {};

    //Get full attributes of author
    let authorAttributes = await userNameLib.getAuthorAttributes(userId);
    users[userId].authorName = authorAttributes.authorName;
    users[userId].userName =
      authorAttributes.preferredUsername ?? authorAttributes.userName;
    users[userId].authorPicture = authorAttributes.picture;
  }
}

async function processItems(items) {
  for (let i = 0; i < items.length; i++) {
    let userId = items[i].userId;

    await fetchUserDetails(userId);

    delete items[i].userId;
    items[i].authorName = users[userId].authorName;
    items[i].userName = users[userId].userName;
    items[i].authorPicture = users[userId].authorPicture;

    if (items[i].likes) {
      items[i].likesList = [];
      try {
        await Promise.all(
          items[i].likes.map(async (likedUserId) => {
            await fetchUserDetails(likedUserId);
            items[i].likesList.push({
              userName: users[likedUserId].userName,
              authorName: users[likedUserId].authorName,
            });
          })
        );
      } catch (e) {
        // Ignore
      }
      delete items[i].likes;
    }

    if (items[i].replies) {
      const replyComments = [];
      for (let j = 0; j < items[i].replies.length; j++) {
        const replyCommentId = items[i].replies[j];
        const replyComment = await fetchReplyComment(replyCommentId);
        if (replyComment.Items && replyComment.Items.length === 1) {
          replyComments.push(replyComment.Items[0]);
        }
      }
      items[i].repliesList = await processItems(replyComments);
      delete items[i].replies;
    }
  }
  return items;
}

export async function main(event, context) {
  let postId;

  if (event.queryStringParameters && event.queryStringParameters.postId) {
    postId = event.queryStringParameters.postId;
  } else {
    return failure({ status: "No postId passed" });
  }

  const params = {
    TableName: "NaadanChordsComments",
    IndexName: "postId-createdAt-index",
    KeyConditionExpression: "postId = :postId",
    ExpressionAttributeValues: {
      ":postId": postId,
    },
    ScanIndexForward: false,
    Limit: 10,
  };

  try {
    const result = await dynamoDbLib.call("query", params);

    if (result.Items) {
      const processedItems = await processItems(result.Items);
      result.Items = processedItems;
      return success(result);
    } else {
      //No comment data
      return success([]);
    }
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
