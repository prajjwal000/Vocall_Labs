const bcrypt = require('bcryptjs');

const DEFAULT_PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
};

/**
 * Validates password against configured policy
 * @param {string} password
 * @param {object} customPolicy
 * @returns {{ isValid: boolean, message?: string }}
 */
const validatePassword = (password, customPolicy = {}) => {
  const policy = { ...DEFAULT_PASSWORD_POLICY, ...customPolicy };

  if (typeof password !== 'string') {
    return { isValid: false, message: 'Password must be a string' };
  }

  if (password.length < policy.minLength) {
    return {
      isValid: false,
      message: `Password must be at least ${policy.minLength} characters long`,
    };
  }

  if (password.length > policy.maxLength) {
    return {
      isValid: false,
      message: `Password must not exceed ${policy.maxLength} characters`,
    };
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter',
    };
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter',
    };
  }

  if (policy.requireNumber && !/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
    };
  }

  return { isValid: true };
};

/**
 * Hashes plaintext password with bcrypt
 * @param {string} password
 * @returns {Promise<string>}
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compares plaintext password with bcrypt hash
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const comparePassword = async (password, hash) => {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
};

module.exports = {
  DEFAULT_PASSWORD_POLICY,
  validatePassword,
  hashPassword,
  comparePassword,
};
