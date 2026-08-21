const crypto = require('crypto');
const User = require('../models/User');
const Session = require('../models/Session');
const {
  validatePassword,
  hashPassword,
  comparePassword,
} = require('../utils/passwordPolicy');
const { signToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('./emailService');

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 1 day
const RESET_TOKEN_EXPIRES_MS = 60 * 60 * 1000; // 1 hour

/**
 * Registers a new user and creates an initial session
 */
const register = async ({ firstName, lastName, email, password, ipAddress, userAgent }) => {
  if (!firstName || !lastName || !email || !password) {
    const error = new Error('Please provide first name, last name, email, and password');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalizedEmail)) {
    const error = new Error('Please provide a valid email address');
    error.statusCode = 400;
    error.code = 'INVALID_EMAIL';
    throw error;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    const error = new Error(passwordValidation.message);
    error.statusCode = 400;
    error.code = 'PASSWORD_POLICY_FAILED';
    throw error;
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('An account with this email address already exists');
    error.statusCode = 409;
    error.code = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    passwordHash,
    status: 'active',
    emailVerified: false,
  });

  // Create initial session
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await Session.create({
    userId: user._id,
    sessionId,
    expiresAt,
    ipAddress,
    userAgent,
  });

  const token = signToken({
    userId: user._id.toString(),
    sessionId,
  });

  return {
    user: user.toJSON(),
    token,
    session,
  };
};

/**
 * Authenticates user credentials and generates a session & JWT
 */
const login = async ({ email, password, ipAddress, userAgent }) => {
  if (!email || !password) {
    const error = new Error('Please provide both email and password');
    error.statusCode = 400;
    error.code = 'MISSING_CREDENTIALS';
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  if (user.status === 'inactive') {
    const error = new Error('Your account is inactive. Please contact support.');
    error.statusCode = 403;
    error.code = 'ACCOUNT_INACTIVE';
    throw error;
  }

  if (user.status === 'suspended') {
    const error = new Error('Your account has been suspended. Please contact support.');
    error.statusCode = 403;
    error.code = 'ACCOUNT_SUSPENDED';
    throw error;
  }

  // Update lastLoginAt
  user.lastLoginAt = new Date();
  await user.save();

  // Create session
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await Session.create({
    userId: user._id,
    sessionId,
    expiresAt,
    ipAddress,
    userAgent,
  });

  const token = signToken({
    userId: user._id.toString(),
    sessionId,
  });

  return {
    user: user.toJSON(),
    token,
    session,
  };
};

/**
 * Revokes a session
 */
const logout = async (sessionId) => {
  if (sessionId) {
    await Session.findOneAndUpdate(
      { sessionId, revokedAt: null },
      { revokedAt: new Date() }
    );
  }
  return { success: true };
};

/**
 * Retrieves current authenticated user profile
 */
const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  if (user.status !== 'active') {
    const error = new Error('Account is not active');
    error.statusCode = 403;
    error.code = 'ACCOUNT_NOT_ACTIVE';
    throw error;
  }

  return user.toJSON();
};

/**
 * Handles forgot password request and generates single-use hashed reset token
 */
const forgotPassword = async (email) => {
  if (!email) {
    const error = new Error('Please provide an email address');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (user && user.status === 'active') {
    // Generate raw unhashed token to email to user
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token with SHA-256 for secure database storage
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(rawResetToken)
      .digest('hex');

    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRES_MS);
    await user.save();

    try {
      await sendPasswordResetEmail({
        to: user.email,
        resetToken: rawResetToken,
        firstName: user.firstName,
      });
    } catch (err) {
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();
      console.error('Error sending password reset email:', err);
    }
  }

  // Always return a generic response to prevent user enumeration
  return {
    message: 'If an account exists, a password reset email has been sent.',
  };
};

/**
 * Resets password using valid unexpired token and revokes all active sessions
 */
const resetPassword = async ({ token, password }) => {
  if (!token || !password) {
    const error = new Error('Please provide both token and new password');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    const error = new Error(passwordValidation.message);
    error.statusCode = 400;
    error.code = 'PASSWORD_POLICY_FAILED';
    throw error;
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    const error = new Error('Password reset token is invalid or has expired');
    error.statusCode = 400;
    error.code = 'INVALID_OR_EXPIRED_TOKEN';
    throw error;
  }

  // Update password and clear reset token
  user.passwordHash = await hashPassword(password);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.passwordChangedAt = new Date();
  await user.save();

  // Revoke all existing sessions so user must log in again
  await Session.updateMany(
    { userId: user._id, revokedAt: null },
    { revokedAt: new Date() }
  );

  return {
    message: 'Password has been reset successfully. Please log in with your new password.',
  };
};

/**
 * Changes password for authenticated user
 */
const changePassword = async ({ userId, currentPassword, newPassword, currentSessionId }) => {
  if (!currentPassword || !newPassword) {
    const error = new Error('Please provide both current password and new password');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 400;
    error.code = 'INVALID_CURRENT_PASSWORD';
    throw error;
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    const error = new Error(passwordValidation.message);
    error.statusCode = 400;
    error.code = 'PASSWORD_POLICY_FAILED';
    throw error;
  }

  if (currentPassword === newPassword) {
    const error = new Error('New password cannot be the same as your current password');
    error.statusCode = 400;
    error.code = 'SAME_PASSWORD';
    throw error;
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  await user.save();

  // Revoke other sessions to protect account across other devices
  if (currentSessionId) {
    await Session.updateMany(
      { userId: user._id, sessionId: { $ne: currentSessionId }, revokedAt: null },
      { revokedAt: new Date() }
    );
  }

  return {
    message: 'Password changed successfully.',
  };
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
};
