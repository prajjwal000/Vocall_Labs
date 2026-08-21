const COOKIE_NAME = 'ff_token';

/**
 * Sets HTTP-only authentication cookie
 * @param {import('express').Response} res
 * @param {string} token
 */
const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'lax' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
  });
};

/**
 * Clears HTTP-only authentication cookie
 * @param {import('express').Response} res
 */
const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'lax' : 'lax',
    expires: new Date(0),
  });
};

module.exports = {
  COOKIE_NAME,
  setAuthCookie,
  clearAuthCookie,
};
