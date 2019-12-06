import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as adminCheckLib from "../libs/admincheck-lib";
import * as usernameLib from "../libs/username-lib";
import * as emailLib from "../libs/email-lib";
import { success, failure } from "../libs/response-lib";

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

async function notifyContributor(item) {
  const email = await usernameLib.getAuthorEmail(item.userId);

  const title = `Naadan Chords - Your contribution was approved`;
  const message = `
    <p>Hey,</p>
    <p>Thank you for your contribution - <b>${item.title}</b>.</p>
    <p>We are thrilled to let you know that your post was approved!</p>
    <p><a href="https://www.naadanchords.com/${slugify(item.title)}">Click here</a> to see your post live on Naadan Chords. Feel free to share the link on social media to let your friends know that you are a Naadan Chords contributor :)</p>
    <p>Thanks for your hard work!</p>
  `;
  const textMessage = `Naadan Chords - Your contribution was approved`;

  await emailLib.sendEmail(title, message, textMessage, email);
}

async function deleteContribution(postId) {
  const params = {
    TableName: "NaadanChordsContributions",
    Key: {
      postId: postId
    }
  };

  try {
    await dynamoDbLib.call("delete", params);
    return true;
  } catch (e) {
    return false;
  }
}

export async function main(event, context, callback) {
  // Request body is passed in as a JSON encoded string in 'event.body'
  const data = JSON.parse(event.body);
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(':')[2];

  let isAdminUser = await adminCheckLib.checkIfAdmin(sub);
  if(!isAdminUser) {
    return failure({ status: false, message: "No write permissions" });
  }

  const params = {
    TableName: "NaadanChords",
    // 'Item' contains the attributes of the item to be created
    // - 'userId': user identities are federated through the
    //             Cognito Identity Pool, we will use the identity id
    //             as the user id of the authenticated user
    // - 'songId': a unique slug for the song
    // - 'content': parsed from request body
    // - 'status': post status
    // - 'createdAt': current Unix timestamp
    Item: {
      userId: data.userId ? data.userId : sub,
      postId: slugify(data.title),
      title: data.title,
      song: data.song || null,
      album: data.album || "PAGE",
      singers: data.singers || null,
      music: data.music || null,
      category: data.category || "MALAYALAM",
      image: data.image || null,
      content: data.content,
      leadTabs: data.leadTabs || null,
      youtubeId: data.youtubeId || null,
      postType: data.postType || "POST",
      createdAt: Date.now()
    }
  };

  try {
    await dynamoDbLib.call("put", params);
    if(data.userId) {
      await deleteContribution(slugify(data.title));
      await notifyContributor(data);
    }
    return success(params.Item);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
