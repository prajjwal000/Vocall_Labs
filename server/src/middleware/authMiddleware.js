const { verifyToken } = require('../utils/jwt');
const { COOKIE_NAME } = require('../utils/cookie');
const User = require('../models/User');
const Session = require('../models/Session');

/**
 * Authentication Middleware to guard protected routes
 */
const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies ? req.cookies[COOKIE_NAME] : null;

    // Optional header fallback for testing / tools
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
        code: 'UNAUTHORIZED',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token',
        code: 'INVALID_TOKEN',
      });
    }

    const { userId, sessionId } = decoded;

    if (!userId || !sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Malformed authentication token',
        code: 'INVALID_TOKEN',
      });
    }

    // Validate active session
    const session = await Session.findOne({
      sessionId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session has expired or was revoked. Please log in again.',
        code: 'SESSION_REVOKED',
      });
    }

    // Validate active user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: `Account is ${user.status}. Please contact support.`,
        code: `ACCOUNT_${user.status.toUpperCase()}`,
      });
    }

    // Check if password changed after token was issued
    if (user.passwordChangedAt && decoded.iat) {
      const changedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({
          success: false,
          message: 'Password was recently changed. Please log in again.',
          code: 'PASSWORD_CHANGED',
        });
      }
    }

    // Update lastUsedAt asynchronously
    Session.updateOne({ _id: session._id }, { lastUsedAt: new Date() }).exec();

    req.user = user;
    req.session = session;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Authentication: attaches req.user if valid token present, but never blocks
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    let token = req.cookies ? req.cookies[COOKIE_NAME] : null;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded?.userId) {
          const user = await User.findById(decoded.userId);
          if (user && user.status === 'active') {
            req.user = user;
          }
        }
      } catch {
        // Ignore token errors for optional auth
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate,
};
