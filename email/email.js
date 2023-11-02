const path = require("path");
const pug = require("pug");
const SGmail = require("@sendgrid/mail");

class Email {
  from;
  recipients;
  subject;
  constructor(recipients, subject) {
    SGmail.setApiKey(process.env.SEND_GRID_API_KEY);

    // this.from = "drimmiadolphoisdreyfus@gmail.com";
    this.from = "docease.app@gmail.com";
    this.recipients = recipients;
    this.subject = subject;
  }

  async sendHtml(html, subject) {
    const mailOptions = {
      to: this.recipients,
      from: { email: this.from, name: "Docease" },
      subject: subject,
      html: html,
    };
    try {
      console.log("sending mail");
      await SGmail.send(mailOptions);
      console.log("mail sent");
    } catch (error) {
      console.log("error sending email", error);
    }
  }

  async sendWelcome(name) {
    const html = pug.renderFile(path.join(__dirname, "/views/welcome.pug"), {
      subject: this.subject,
      fullName: name,
    });
    await this.sendHtml(
      html,
      "Welcome to Docease - Your Guide to Nearby Hospitals and Health Facilities!"
    );
  }

  async sendPasswordReset(url, username) {
    console.log("Password reset url: ", url);

    const html = pug.renderFile(
      path.join(__dirname, "/views/resetPassword.pug"),
      {
        subject: "Password Reset",
        userName: username,
        resetURL: url,
      }
    );
    await this.sendHtml(html, "Reset Password");
  }
}

module.exports = { Email };
