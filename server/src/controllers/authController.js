const authService = require('../services/authService');
const { verifyToken } = require('../utils/jwt');
const { COOKIE_NAME, setAuthCookie, clearAuthCookie } = require('../utils/cookie');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { user, token } = await authService.register({
      firstName,
      lastName,
      email,
      password,
      ipAddress,
      userAgent,
    });

    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login existing user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { user, token } = await authService.login({
      email,
      password,
      ipAddress,
      userAgent,
    });

    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user and revoke active session
 * POST /api/auth/logout
 * Always succeeds even if session is already expired or missing
 */
const logout = async (req, res, next) => {
  try {
    let token = req.cookies ? req.cookies[COOKIE_NAME] : null;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded && decoded.sessionId) {
          await authService.logout(decoded.sessionId);
        }
      } catch (err) {
        // Token might already be expired; ignore error
      }
    }

    clearAuthCookie(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user.toJSON ? req.user.toJSON() : req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset token
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPassword({ token, password });

    clearAuthCookie(res);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password for authenticated user
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const currentSessionId = req.session ? req.session.sessionId : null;

    const result = await authService.changePassword({
      userId: req.user._id,
      currentPassword,
      newPassword,
      currentSessionId,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
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
