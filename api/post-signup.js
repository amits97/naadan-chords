import * as emailLib from "./libs/email-lib";

exports.handler = (event, context, callback) => {
  try {
    let email = event.request.userAttributes.email;
  
    const title = `Naadan Chords - Congratulations on your new account`;
    const message = `
      <p>Hey ${event.request.userAttributes.name},</p>
      <p>We are writing to let you know that your account has been created. Congratulations on your new Naadan Chords account.</p>
      <p>Thanks for signing up!</p>
    `;
    const textMessage = `Naadan Chords - Congratulations on your new account`;
  
    emailLib.syncSendEmail(title, message, textMessage, email, function(status) {
      context.done(null, event);
    });
  } catch (e) {
    event.error = e;
    context.done(null,event);
  }
}