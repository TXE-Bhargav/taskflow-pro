const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendVerificationEmail = async (email, name, token) => {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    await transporter.sendMail({
        from: `"TaskFlow Pro" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify your TaskFlow Pro account',
        html: `
      <h2>Welcome to TaskFlow Pro, ${name}!</h2>
      <p>Click the button below to verify your email address.</p>
      <a href="${verifyUrl}" 
         style="background:#6366f1;color:white;padding:12px 24px;
                border-radius:6px;text-decoration:none;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
    `
    });
};

const sendResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"TaskFlow Pro" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your TaskFlow Pro password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${name}, click below to reset your password.</p>
      <a href="${resetUrl}"
         style="background:#6366f1;color:white;padding:12px 24px;
                border-radius:6px;text-decoration:none;">
        Reset Password
      </a>
      <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `
  });
};

module.exports = {
    sendVerificationEmail,
    sendResetEmail
};