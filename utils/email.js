const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = process.env.EMAIL_FROM;
  }
  newTransport() {
    // should switch to production from development
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  //Send the actual email
  async send(template, subject) {
    //1)render HTML based on a pug template
    //console.log('the dir path is:', __dirname);
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );
    //2)define the email options
    const mailOPtions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.htmlToText(html),

      //html:
    };

    //3) create a transport and send the email

    await this.newTransport().sendMail(mailOPtions);
  }
  async sendWelcom() {
    await this.send('welcom', 'Welcom to the Natours Family');
  }
  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token valid only for 10 minutes',
    );
  }
};
