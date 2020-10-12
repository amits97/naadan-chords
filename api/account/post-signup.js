import * as emailLib from "../libs/email-lib";
import { syncRewriteFacebookUsername } from "../libs/username-lib";

exports.handler = (event, context, callback) => {
  try {
    if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
      let email = event.request.userAttributes.email;
  
      const title = `Naadan Chords - Congratulations on your new account`;
      const message = `
        <p>Hey ${event.request.userAttributes.name},</p>
        <p>We are writing to let you know that your account has been created. Congratulations on your new Naadan Chords account.</p>
        <p>Thanks for signing up!</p>
      `;
      const textMessage = `Naadan Chords - Congratulations on your new account`;

      emailLib.syncSendEmail(title, message, textMessage, email, function(status) {
        syncRewriteFacebookUsername(email, () => {
          callback(null, event);
        }, (err) => {
          event.syncRewriteFacebookUsernameError = err;
          callback(null, event);
        });
      });
    } else {
      context.done(null, event);
    }
  } catch (e) {
    event.error = e;
    context.done(null,event);
  }
}
