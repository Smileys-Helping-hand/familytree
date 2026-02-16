const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  if (process.env.SENDGRID_API_KEY) {
    // SendGrid
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else {
    // Gmail or other SMTP
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
};

exports.sendEmail = async (options) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@familytree.com',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent:', info.messageId);
  return info;
};

// Template for birthday reminder
exports.sendBirthdayReminder = async (user, member, daysUntil) => {
  const subject = daysUntil === 0 
    ? `🎉 Today is ${member.firstName}'s Birthday!`
    : `🎂 ${member.firstName}'s Birthday in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">${subject}</h1>
      <p>Hi ${user.name},</p>
      <p>This is a friendly reminder that ${member.firstName} ${member.lastName || ''}'s birthday is ${daysUntil === 0 ? 'today' : `in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`}!</p>
      ${member.profilePhoto ? `<img src="${member.profilePhoto}" alt="${member.firstName}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover;">` : ''}
      <p style="margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL}/members/${member._id}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">View Profile</a>
      </p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        You're receiving this because you're a member of the ${member.family.name} family tree.
      </p>
    </div>
  `;

  await this.sendEmail({
    to: user.email,
    subject,
    html
  });
};
