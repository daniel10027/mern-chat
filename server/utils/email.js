const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({ host: process.env.EMAIL_HOST || 'smtp.gmail.com', port: 587, secure: false, auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
const sendEmail = async ({ to, subject, html }) => { await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html }); };
const emailTemplates = {
  verifyEmail: (name, url) => ({ subject: 'Verify your email', html: '<p>Hi ' + name + ', <a href=' + url + '>verify your email</a></p>' }),
  resetPassword: (name, url) => ({ subject: 'Reset your password', html: '<p>Hi ' + name + ', <a href=' + url + '>reset your password</a></p>' }),
};
module.exports = { sendEmail, emailTemplates };
