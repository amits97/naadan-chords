import { v4 as uuidv4 } from 'uuid';

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

async function sendEmailToAuthor(postId, comment) {
  let post = await fetchPostDetails(postId);
  let emailId = await userNameLib.getAuthorEmail(post.userId);

  const title = `Naadan Chords - New comment on ${post.title}`;
  const message = `
    <p>Hey,</p>
    <p>Someone just commented on your post <a href="https://www.naadanchords.com/${post.postId}">${post.title}</a>.</p>
    <p>The comment: <b>${comment}</b></p>
  `;
  const textMessage = `New comment on your post ${post.title}\n\nComment: ${comment}`;

  await emailLib.sendEmail(title, message, textMessage, emailId);
}

export async function main(event) {
  // Request body is passed in as a JSON encoded string in 'event.body'
  const data = JSON.parse(event.body);
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(':')[2];
  const commentId = data.commentId ?? uuidv4();
  const createdAt = data.createdAt ?? Date.now();

  // Basic validation
  const content = data.content;
  if(!content) {
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
      modifiedAt: Date.now()
    }
  };

  try {
    await dynamoDbLib.call("put", params);
    if (!data.commentId) {
      // Send email to author only if new comment
      await sendEmailToAuthor(data.postId, data.content);
    }
    return success(params.Item);
  } catch (e) {
    return failure({ status: false });
  }
}
