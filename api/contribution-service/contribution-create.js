import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as usernameLib from "../libs/username-lib";
import * as emailLib from "../libs/email-lib";
import { success, failure } from "../libs/response-lib";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

async function notifyAdmins(data) {
  let adminEmails = [];
  const adminUsers = await usernameLib.getAdminUsers();

  const title = `Naadan Chords - New contribution`;
  const message = `
    <p>Hey,</p>
    <p>Someone just submitted a new contribution - <b>${data.title}</b>.</p>
    <p><a href="https://www.naadanchords.com/admin?tab=review">Click here</a> to moderate the post</p>
    <p>Thanks for being an Admin!</p>
  `;
  const textMessage = `Naadan Chords - New contribution - ${data.title}`;

  adminUsers.forEach(async (user) => {
    let adminEmail;
    user.Attributes.forEach((attribute) => {
      if (attribute.Name === "email") {
        adminEmail = attribute.Value;
      }
    });
    adminEmails.push(adminEmail);
  });

  await emailLib.sendEmail(title, message, textMessage, adminEmails);
}

export async function main(event) {
  // Request body is passed in as a JSON encoded string in 'event.body'
  const data = JSON.parse(event.body);
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(":")[2];

  const params = {
    TableName: "NaadanChordsContributions",
    Item: {
      userId: sub,
      postId: slugify(data.title),
      title: data.title,
      song: data.song || null,
      album: data.album || null,
      singers: data.singers || null,
      lyrics: data.lyrics || null,
      music: data.music || null,
      category: data.category || "MALAYALAM",
      scale: data.scale || null,
      tempo: data.tempo || null,
      timeSignature: data.timeSignature || null,
      content: data.content,
      leadTabs: data.leadTabs || null,
      youtubeId: data.youtubeId || null,
      postType: "POST",
      chordPreferences: data.chordPreferences || null,
      status: "PENDING",
      createdAt: Date.now(),
    },
  };

  try {
    await dynamoDbLib.call("put", params);
    await notifyAdmins(data);
    return success(params.Item);
  } catch (e) {
    return failure({ status: false });
  }
}
