import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import * as emailLib from "../libs/email-lib";
import { success, failure } from "../libs/response-lib";

async function fetchPostDetails(postId) {
  let item;
  const params = {
    TableName: "NaadanChords",
    Key: {
      postId: postId
    }
  };

  try {
    let postResult = await dynamoDbLib.call("get", params);
    item = postResult.Item;
  } catch(e) {
    //do nothing
  }

  return item;
}

async function sendEmailToCommentAuthor(userId, postId, comment) {
  let post = await fetchPostDetails(postId);
  let emailId = await userNameLib.getAuthorEmail(userId);

  const title = `Naadan Chords - Someone liked your comment`;
  const message = `
    <p>Hey,</p>
    <p>Someone just liked your comment on <a href="https://www.naadanchords.com/${post.postId}">${post.title}</a>.</p>
    <p>The comment: <b>${comment}</b></p>
  `;
  const textMessage = `New like on your comment on ${post.title}\n\nComment: ${comment}`;

  await emailLib.sendEmail(title, message, textMessage, emailId);
}

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
    if (!likeRemoved) {
      await sendEmailToCommentAuthor(comment.Items[0].userId, comment.Items[0].postId, comment.Items[0].content);
    }
    return success({ status: true, likeRemoved });
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
