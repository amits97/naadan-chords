import * as dynamoDbLib from "../../libs/dynamodb-lib";
import * as adminCheckLib from "../../libs/admincheck-lib";
import * as usernameLib from "../../libs/username-lib";
import * as emailLib from "../../libs/email-lib";
import { success, failure } from "../../libs/response-lib";

async function notifyContributor(item) {
  const email = await usernameLib.getAuthorEmail(item.userId);

  const title = `Naadan Chords - Your contribution needs changes`;
  const message = `
    <p>Hey,</p>
    <p>Thank you for your contribution - <b>${item.title}</b>.</p>
    <p>However, we could not approve your post right now. Please read the comment provided by the admin, make the required changes and submit again.</p>
    <p><a href="https://www.naadanchords.com/contributions/edit-post/${item.postId}">Click here</a> to update the post.</p>
    <p>Thanks for being a contributor!</p>
  `;
  const textMessage = `Naadan Chords - Your contribution needs changes`;

  await emailLib.sendEmail(title, message, textMessage, email);
}

export async function main(event) {
  const data = JSON.parse(event.body);
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(':')[2];

  let isAdminUser = await adminCheckLib.checkIfAdmin(sub);
  if(!isAdminUser) {
    return failure({ status: false, message: "Not authorized" });
  }

  let params = {
    TableName: "NaadanChordsContributions",
    Key: {
      postId: event.pathParameters.id
    },
    UpdateExpression: "SET #comment = :comment, #status = :status",
    ExpressionAttributeValues: {
      ":comment": data.comment || null,
      ":status": "NEEDS_REVISION"
    },
    ExpressionAttributeNames: {
      "#comment": "comment",
      "#status": "status"
    },
    ReturnValues: "ALL_NEW"
  };

  try {
    let result = await dynamoDbLib.call("update", params);
    await notifyContributor(result.Attributes);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
