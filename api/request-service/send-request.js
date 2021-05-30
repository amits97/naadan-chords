import * as emailLib from "../libs/email-lib";
import * as usernameLib from "../libs/username-lib";
import { success, failure } from "../libs/response-lib";

export async function main(event) {
  // Request body is passed in as a JSON encoded string in 'event.body'
  const data = JSON.parse(event.body);

  try {
    let adminEmails = [];
    const adminUsers = await usernameLib.getAdminUsers();

    const title = `Naadan Chords - Song Request`;
    const message = `
      <p>Hey,</p>
      <p>${data.name} just submitted a new song request.</p>
      <p>The message: <b>${data.message}</b></p>
      <p>Thanks for being an Admin!</p>
    `;
    const textMessage = `Naadan Chords - New song request from ${data.name}`;

    adminUsers.forEach(async (user) => {
      let adminEmail;
      user.Attributes.forEach((attribute) => {
        if(attribute.Name === "email") {
          adminEmail = attribute.Value;
        }
      });
      adminEmails.push(adminEmail);
    });

    await emailLib.sendEmail(title, message, textMessage, adminEmails, [data.email]);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false });
  }
}
