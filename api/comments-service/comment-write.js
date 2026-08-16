import { randomUUID } from "crypto";

import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import * as emailLib from "../libs/email-lib";
import { success, failure } from "../libs/response-lib";

async function fetchPostDetails(postId) {
  let item;
  const params = {
    TableName: "NaadanChords",
    Key: {
      postId: postId,
    },
  };

  try {
    let postResult = await dynamoDbLib.call("get", params);
    item = postResult.Item;
  } catch (e) {
    //do nothing
  }

  return item;
}

async function fetchParentComment(commentId) {
  const params = {
    TableName: "NaadanChordsComments",
    KeyConditionExpression: "commentId = :commentId",
    ExpressionAttributeValues: {
      ":commentId": commentId,
    },
  };
  const comment = await dynamoDbLib.call("query", params);
  return comment;
}

async function sendEmailToParentCommentAuthor(parentComment, comment, sub) {
  if (sub !== parentComment.userId) {
    try {
      let originalComment = parentComment;
      while (!originalComment.postId) {
        const grandParentCommentId = originalComment.parentCommentId;
        if (!grandParentCommentId) break;
        const grandParentComment = await fetchParentComment(grandParentCommentId);
        if (!grandParentComment.Items || grandParentComment.Items.length === 0) {
          break;
        }
        originalComment = grandParentComment.Items[0];
      }

      if (originalComment.postId) {
        let post = await fetchPostDetails(originalComment.postId);
        if (post && post.userId) {
          let emailId = await userNameLib.getAuthorEmail(parentComment.userId);
          if (emailId) {
            const title = `Naadan Chords - New reply on ${post.title}`;
            const message = `
              <p>Hey,</p>
              <p>Someone just replied to your comment on the post <a href="https://www.naadanchords.com/${post.postId}">${post.title}</a>.</p>
              <p>The reply: <b>${comment.content}</b></p>
            `;
            const textMessage = `New reply on your comment on ${post.title}\n\nReply: ${comment.content}`;

            await emailLib.sendEmail(title, message, textMessage, emailId);
          }
        }
      }
    } catch (e) {
      // Ignore email failure
    }
  }
}

async function sendEmailToAuthor(postId, comment) {
  try {
    let post = await fetchPostDetails(postId);
    if (!post || !post.userId) {
      return;
    }
    let emailId = await userNameLib.getAuthorEmail(post.userId);
    if (!emailId) {
      return;
    }

    const title = `Naadan Chords - New comment on ${post.title}`;
    const message = `
      <p>Hey,</p>
      <p>Someone just commented on your post <a href="https://www.naadanchords.com/${post.postId}">${post.title}</a>.</p>
      <p>The comment: <b>${comment}</b></p>
    `;
    const textMessage = `New comment on your post ${post.title}\n\nComment: ${comment}`;

    await emailLib.sendEmail(title, message, textMessage, emailId);
  } catch (e) {
    // Ignore email failure
  }
}

export async function main(event) {
  // Request body is passed in as a JSON encoded string in 'event.body'
  const data = JSON.parse(event.body);
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(":")[2];
  const commentId = data.commentId ?? randomUUID();
  const createdAt = data.createdAt ?? Date.now();
  const parentCommentId = data.parentCommentId;

  // Basic validation
  const content = data.content;
  if (!content) {
    return failure({ status: false, message: "Invalid comment" });
  }

  const params = {
    TableName: "NaadanChordsComments",
    Item: {
      commentId,
      userId: sub,
      postId: data.postId,
      content,
      createdAt,
      modifiedAt: Date.now(),
    },
  };

  if (parentCommentId) {
    delete params.Item.postId;
    params.Item.parentCommentId = parentCommentId;
  }

  if (data.commentId) {
    try {
      let existingCommentResult = await dynamoDbLib.call("get", {
        TableName: "NaadanChordsComments",
        Key: {
          commentId: data.commentId,
          userId: sub,
        },
      });

      if (existingCommentResult?.Item?.userId === sub) {
        // Comment exists, update
        await dynamoDbLib.call("update", {
          TableName: "NaadanChordsComments",
          Key: {
            commentId: data.commentId,
            userId: existingCommentResult.Item.userId,
          },
          UpdateExpression: "SET content = :content, modifiedAt = :modifiedAt",
          ExpressionAttributeValues: {
            ":content": content,
            ":modifiedAt": Date.now(),
          },
        });
      } else {
        return failure({ status: false, message: "Not authorized" });
      }
    } catch (e) {
      return failure({ status: false, error: e });
    }
  } else {
    try {
      await dynamoDbLib.call("put", params);

      if (parentCommentId) {
        const parentComment = await fetchParentComment(parentCommentId);
        let replies;

        if (parentComment?.Items?.length === 1) {
          replies = parentComment.Items[0].replies || [];
          replies.push(commentId);

          const updateParams = {
            TableName: "NaadanChordsComments",
            Key: {
              commentId: parentCommentId,
              userId: parentComment.Items[0].userId,
            },
            UpdateExpression: "SET replies = :replies",
            ExpressionAttributeValues: {
              ":replies": replies || "[]",
            },
            ReturnValues: "ALL_NEW",
          };

          try {
            await dynamoDbLib.call("update", updateParams);
            // Send email to notify parent comment author
            await sendEmailToParentCommentAuthor(
              parentComment.Items[0],
              data,
              sub
            );
          } catch (e) {
            return failure({ status: false, error: e });
          }
        } else {
          return failure({ status: false, message: "Invalid comment ID" });
        }
      } else {
        // Send email to author only if new comment and not reply
        await sendEmailToAuthor(data.postId, data.content);
      }
    } catch (e) {
      return failure({ status: false });
    }
  }

  const response = params.Item;
  // Get full attributes of author
  try {
    let authorAttributes = await userNameLib.getAuthorAttributes(sub);
    if (authorAttributes) {
      response.authorName = authorAttributes.authorName;
      response.userName =
        authorAttributes.preferredUsername ?? authorAttributes.userName;
      response.authorPicture = authorAttributes.picture;
    }
  } catch (e) {
    // Ignore author attribute errors
  }
  delete response.userId;
  return success(response);
}
