import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as adminCheckLib from "../libs/admincheck-lib";
import * as usernameLib from "../libs/username-lib";
import * as emailLib from "../libs/email-lib";
import { success, failure } from "../libs/response-lib";

async function notifyContributor(item) {
  const email = await usernameLib.getAuthorEmail(item.userId);

  const title = `Naadan Chords - Your contribution was rejected`;
  const message = `
    <p>Hey,</p>
    <p>Thank you for your contribution - <b>${item.title}</b>.</p>
    <p>However, we could not approve your post right now. We are not able to provide a reason at this moment, but please keep in mind that Naadan Chords only publishes high quality content. Please don't be disheartened; we are confident that your next post would definitely get featured on Naadan Chords.</p>
    <p>Thanks for being a contributor!</p>
  `;
  const textMessage = `Naadan Chords - Your contribution was rejected`;

  await emailLib.sendEmail(title, message, textMessage, email);
}

export async function main(event) {
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(':')[2];

  let isAdminUser = await adminCheckLib.checkIfAdmin(sub);
  if(!isAdminUser) {
    return failure({ status: false, message: "Not authorized" });
  }

  const params = {
    TableName: "NaadanChordsContributions",
    Key: {
      postId: event.pathParameters.id
    }
  };

  try {
    const result = await dynamoDbLib.call("get", params);
    await dynamoDbLib.call("delete", params);
    await notifyContributor(result.Item);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false });
  }
}