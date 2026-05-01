const Brevo = require('@getbrevo/brevo');

const client = Brevo.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const transactionalApi = new Brevo.TransactionalEmailsApi();

const baseTemplate = (content) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <div style="background:#6366f1;padding:20px;border-radius:8px 8px 0 0;text-align:center">
      <h1 style="color:white;margin:0">TaskFlow Pro</h1>
    </div>
    <div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px">
      ${content}
    </div>
    <p style="color:#9ca3af;text-align:center;font-size:12px;margin-top:20px">
      © 2025 TaskFlow Pro. All rights reserved.
    </p>
  </div>
`;

const buttonStyle = `
  background:#6366f1;color:white;padding:12px 24px;
  border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px
`;

const sendEmail = async (to, subject, html) => {
  const email = new Brevo.SendSmtpEmail();
  email.sender = { name: 'TaskFlow Pro', email: process.env.BREVO_SENDER_EMAIL };
  email.to = [{ email: to }];
  email.subject = subject;
  email.htmlContent = html;
  await transactionalApi.sendTransacEmail(email);
};

const sendVerificationEmail = async (email, name, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await sendEmail(email, 'Verify your TaskFlow Pro account', baseTemplate(`
        <h2>Welcome, ${name}! 👋</h2>
        <p>Thanks for signing up. Please verify your email to get started.</p>
        <a href="${url}" style="${buttonStyle}">Verify Email</a>
        <p style="color:#6b7280;margin-top:16px;font-size:14px">
            This link expires in 24 hours.
        </p>
    `));
};

const sendResetEmail = async (email, name, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail(email, 'Reset your TaskFlow Pro password', baseTemplate(`
        <h2>Password Reset Request</h2>
        <p>Hi ${name}, we received a request to reset your password.</p>
        <a href="${url}" style="${buttonStyle}">Reset Password</a>
        <p style="color:#6b7280;margin-top:16px;font-size:14px">
            This link expires in 1 hour. If you didn't request this, ignore this email.
        </p>
    `));
};

const sendTaskAssignedEmail = async (email, name, taskTitle, projectName, assignedBy) => {
  await sendEmail(email, `You've been assigned a task: ${taskTitle}`, baseTemplate(`
        <h2>New Task Assigned 📋</h2>
        <p>Hi ${name}, <strong>${assignedBy}</strong> assigned you a task.</p>
        <div style="background:white;padding:16px;border-radius:8px;border-left:4px solid #6366f1;margin:16px 0">
            <strong>${taskTitle}</strong>
            <p style="color:#6b7280;margin:4px 0">Project: ${projectName}</p>
        </div>
        <a href="${process.env.CLIENT_URL}/tasks" style="${buttonStyle}">View Task</a>
    `));
};

const sendCommentEmail = async (email, name, taskTitle, commenterName, comment) => {
  await sendEmail(email, `New comment on: ${taskTitle}`, baseTemplate(`
        <h2>New Comment 💬</h2>
        <p>Hi ${name}, <strong>${commenterName}</strong> commented on <strong>${taskTitle}</strong>.</p>
        <div style="background:white;padding:16px;border-radius:8px;border-left:4px solid #6366f1;margin:16px 0">
            <p style="margin:0">${comment}</p>
        </div>
        <a href="${process.env.CLIENT_URL}/tasks" style="${buttonStyle}">View Task</a>
    `));
};

module.exports = {
  sendVerificationEmail,
  sendResetEmail,
  sendTaskAssignedEmail,
  sendCommentEmail
};