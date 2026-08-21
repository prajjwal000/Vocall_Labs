const jwt = require('jsonwebtoken');

/**
 * Signs a JWT with minimal payload
 * @param {object} payload - { userId, sessionId }
 * @returns {string} JWT string
 */
const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'nexus_super_secret_jwt_key_change_in_prod', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

/**
 * Verifies a JWT
 * @param {string} token
 * @returns {object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'nexus_super_secret_jwt_key_change_in_prod');
};

module.exports = {
  signToken,
  verifyToken,
};
