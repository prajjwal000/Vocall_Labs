const nodemailer = require('nodemailer');

/**
 * Creates a nodemailer transport from an organization's SMTP config
 */
const createTransporter = (smtpConfig) => {
  if (!smtpConfig || !smtpConfig.isConfigured || !smtpConfig.host) {
    return null;
  }

  const secure = smtpConfig.encryption === 'ssl' || smtpConfig.port === 465;

  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port || 587,
    secure,
    auth: {
      user: smtpConfig.username,
      pass: smtpConfig.password,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });
};

/**
 * Sends an email via the organization's SMTP config, falls back to console.log
 */
const sendEmail = async ({ smtpConfig, to, subject, html }) => {
  const transporter = createTransporter(smtpConfig);

  if (transporter) {
    const fromAddress = smtpConfig.fromEmail || 'noreply@nexus.app';
    const fromName = smtpConfig.fromName || 'Nexus';

    const result = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      html,
    });

    return {
      success: true,
      messageId: result.messageId,
      provider: 'smtp',
    };
  }

  // Fallback: console.log simulation
  console.log('----------------------------------------------------');
  console.log(`[EMAIL SERVICE] Simulated Email to: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
  console.log('----------------------------------------------------');

  return {
    success: true,
    messageId: `simulated-${Date.now()}`,
    provider: 'simulated',
  };
};

/**
 * Tests SMTP connection with the provided config
 */
const testSmtpConnection = async (smtpConfig) => {
  const transporter = createTransporter(smtpConfig);

  if (!transporter) {
    throw new Error('SMTP configuration is incomplete. Please fill in all required fields.');
  }

  await transporter.verify();
  return { success: true, message: 'SMTP connection verified successfully' };
};

/**
 * Sends a test email to verify SMTP configuration
 */
const sendTestEmail = async ({ smtpConfig, to }) => {
  const transporter = createTransporter(smtpConfig);

  if (!transporter) {
    throw new Error('SMTP configuration is incomplete');
  }

  const fromAddress = smtpConfig.fromEmail || 'noreply@nexus.app';
  const fromName = smtpConfig.fromName || 'Nexus';

  const result = await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject: 'Nexus SMTP Configuration Test',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">SMTP Configuration Verified</h2>
        <p>This test email confirms that your organization's SMTP email settings are working correctly.</p>
        <p>You will now receive team invitations and other notifications at this email address.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">Sent from Nexus Workspace</p>
      </div>
    `,
  });

  return {
    success: true,
    messageId: result.messageId,
    message: `Test email sent successfully to ${to}`,
  };
};

/**
 * Authentication & Notification Email Service
 */
const sendPasswordResetEmail = async ({ to, resetToken, firstName, smtpConfig }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  const subject = 'Nexus - Password Reset Request';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4f46e5;">Password Reset Request</h2>
      <p>Hello ${firstName || 'User'},</p>
      <p>You requested a password reset for your Nexus account.</p>
      <p>Click the link below to reset your password (valid for 1 hour):</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
      <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  return sendEmail({ smtpConfig, to, subject, html });
};

/**
 * Sends organization employee invitation email
 */
const sendOrganizationInvitationEmail = async ({
  to,
  organizationName,
  inviterName,
  rawToken,
  expiresAt,
  smtpConfig,
}) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const invitationUrl = `${clientUrl}/accept-invitation/${rawToken}`;

  const subject = `You're invited to join ${organizationName} on Nexus`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4f46e5;">You're Invited!</h2>
      <p>${inviterName ? `<strong>${inviterName}</strong> has` : 'You have been'} invited to join <strong>${organizationName}</strong> on Nexus.</p>
      <p>Click the button below to accept the invitation and create your account:</p>
      <a href="${invitationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept Invitation</a>
      <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">This invitation expires on ${expiresAt ? new Date(expiresAt).toLocaleDateString() : 'in 7 days'}.</p>
      <p style="color: #6b7280; font-size: 12px;">If you weren't expecting this invitation, you can safely ignore this email.</p>
    </div>
  `;

  return sendEmail({ smtpConfig, to, subject, html });
};

/**
 * Sends task assignment, delegation, or completion notifications
 */
const sendTaskNotificationEmail = async ({
  to,
  recipientName,
  taskTitle,
  type,
  actorName,
  reason = '',
  smtpConfig,
}) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const taskUrl = `${clientUrl}/app/tasks`;

  let subject = '';
  let body = '';

  if (type === 'assigned') {
    subject = `New Task Assigned: ${taskTitle}`;
    body = `<strong>${actorName}</strong> has assigned a new task to you: "${taskTitle}".`;
  } else if (type === 'delegated') {
    subject = `Task Delegated: ${taskTitle}`;
    body = `<strong>${actorName}</strong> has delegated task "${taskTitle}" to you.${reason ? `<br/><br/>Reason: ${reason}` : ''}`;
  } else if (type === 'completed') {
    subject = `Task Completed: ${taskTitle}`;
    body = `<strong>${actorName}</strong> marked task "${taskTitle}" as completed.`;
  } else if (type === 'cancelled') {
    subject = `Task Cancelled: ${taskTitle}`;
    body = `<strong>${actorName}</strong> cancelled task "${taskTitle}".`;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4f46e5;">Task Notification</h2>
      <p>Hello ${recipientName || 'Team Member'},</p>
      <p>${body}</p>
      <a href="${taskUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">View Task Dashboard</a>
    </div>
  `;

  return sendEmail({ smtpConfig, to, subject, html });
};

module.exports = {
  createTransporter,
  sendEmail,
  testSmtpConnection,
  sendTestEmail,
  sendPasswordResetEmail,
  sendOrganizationInvitationEmail,
  sendTaskNotificationEmail,
};
