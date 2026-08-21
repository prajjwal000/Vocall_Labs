/**
 * Authentication & Notification Email Service
 */
const sendPasswordResetEmail = async ({ to, resetToken, firstName }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  // Log in development / test
  console.log('----------------------------------------------------');
  console.log(`[EMAIL SERVICE] Password Reset Email to: ${to}`);
  console.log(`Hello ${firstName || 'User'},`);
  console.log(`You requested a password reset for your Nexus account.`);
  console.log(`Reset Link (valid for 1 hour): ${resetUrl}`);
  console.log('----------------------------------------------------');

  return {
    success: true,
    messageId: `simulated-${Date.now()}`,
    resetUrl,
  };
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
}) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const invitationUrl = `${clientUrl}/accept-invitation/${rawToken}`;

  console.log('----------------------------------------------------');
  console.log(`[EMAIL SERVICE] Workspace Invitation to: ${to}`);
  console.log(`You've been invited to join ${organizationName} on Nexus.`);
  if (inviterName) {
    console.log(`Invited by: ${inviterName}`);
  }
  console.log(`Invitation Link: ${invitationUrl}`);
  console.log(`Expires: ${expiresAt ? new Date(expiresAt).toISOString() : 'in 7 days'}`);
  console.log('----------------------------------------------------');

  return {
    success: true,
    messageId: `simulated-invite-${Date.now()}`,
    invitationUrl,
  };
};

/**
 * Sends task assignment, delegation, or completion notifications
 */
const sendTaskNotificationEmail = async ({
  to,
  recipientName,
  taskTitle,
  type, // 'assigned' | 'delegated' | 'completed' | 'cancelled'
  actorName,
  reason = '',
}) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const taskUrl = `${clientUrl}/app/tasks`;

  console.log('----------------------------------------------------');
  console.log(`[EMAIL/NOTIFICATION SERVICE] Task Notification to: ${to}`);
  console.log(`Hello ${recipientName || 'Team Member'},`);
  if (type === 'assigned') {
    console.log(`${actorName} has assigned a new task to you: "${taskTitle}".`);
  } else if (type === 'delegated') {
    console.log(`${actorName} has delegated task "${taskTitle}" to you.`);
    if (reason) console.log(`Reason: ${reason}`);
  } else if (type === 'completed') {
    console.log(`${actorName} marked task "${taskTitle}" as completed.`);
  } else if (type === 'cancelled') {
    console.log(`${actorName} cancelled task "${taskTitle}".`);
  }
  console.log(`Task Dashboard: ${taskUrl}`);
  console.log('----------------------------------------------------');

  return {
    success: true,
    messageId: `simulated-task-notif-${Date.now()}`,
  };
};

module.exports = {
  sendPasswordResetEmail,
  sendOrganizationInvitationEmail,
  sendTaskNotificationEmail,
};
