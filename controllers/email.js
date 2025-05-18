// utils/emailService.js
const nodemailer = require('nodemailer');
const RSVP = require('../models/rsvp');
const Event = require('../models/event');


const transporter = nodemailer.createTransport({
  service: 'gmail', // or use SMTP settings
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendMail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
};

module.exports = sendMail;
