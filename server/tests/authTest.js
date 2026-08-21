require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Session = require('../src/models/Session');

const PORT = 5001; // Use separate port for test runner
let server;
let baseUrl;

// Helper for making HTTP requests
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }

        // Extract cookies
        const setCookie = res.headers['set-cookie'] || [];
        const cookies = {};
        setCookie.forEach((c) => {
          const parts = c.split(';')[0].split('=');
          cookies[parts[0].trim()] = parts[1] ? parts[1].trim() : '';
        });

        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
          cookies,
          rawCookieHeader: setCookie.join('; '),
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('🚀 Starting Nexus Part 2 - Authentication Automated Test Suite...\n');

  // Connect to DB
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus');
  console.log('Connected to MongoDB for testing.');

  // Clean test collections
  await User.deleteMany({ email: /@testnexus\.com$/i });
  await Session.deleteMany({});

  // Start test server
  server = app.listen(PORT);
  baseUrl = `http://localhost:${PORT}`;

  try {
    // -------------------------------------------------------------
    // 1. REGISTRATION TESTS
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Registration ---');

    // 1.1 Missing fields
    let res = await request('POST', '/api/auth/register', { email: 'john@testnexus.com' });
    assert(res.status === 400 && res.data.success === false, 'Rejects registration with missing fields');

    // 1.2 Invalid email format
    res = await request('POST', '/api/auth/register', {
      firstName: 'John',
      lastName: 'Doe',
      email: 'not-an-email',
      password: 'Password123',
    });
    assert(res.status === 400 && res.data.code === 'INVALID_EMAIL', 'Rejects invalid email format');

    // 1.3 Weak passwords
    res = await request('POST', '/api/auth/register', {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@testnexus.com',
      password: 'short',
    });
    assert(res.status === 400 && res.data.code === 'PASSWORD_POLICY_FAILED', 'Rejects short password (< 8 chars)');

    res = await request('POST', '/api/auth/register', {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@testnexus.com',
      password: 'password123',
    });
    assert(res.status === 400 && res.data.code === 'PASSWORD_POLICY_FAILED', 'Rejects password without uppercase');

    res = await request('POST', '/api/auth/register', {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@testnexus.com',
      password: 'PASSWORD123',
    });
    assert(res.status === 400 && res.data.code === 'PASSWORD_POLICY_FAILED', 'Rejects password without lowercase');

    res = await request('POST', '/api/auth/register', {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@testnexus.com',
      password: 'PasswordXYZ',
    });
    assert(res.status === 400 && res.data.code === 'PASSWORD_POLICY_FAILED', 'Rejects password without numbers');

    // 1.4 Valid registration
    res = await request('POST', '/api/auth/register', {
      firstName: 'John',
      lastName: 'Doe',
      email: 'John.Doe@TestNexus.com', // Test normalization
      password: 'Password123',
    });
    assert(res.status === 201 && res.data.success === true, 'Successfully registers user with valid credentials');
    assert(res.data.data.user.email === 'john.doe@testnexus.com', 'Normalizes email to lowercase');
    assert(!res.data.data.user.passwordHash, 'Never exposes passwordHash in response');
    assert(res.cookies.ff_token && res.cookies.ff_token.length > 20, 'Sets httpOnly ff_token cookie');

    const registeredCookie = `ff_token=${res.cookies.ff_token}`;

    // 1.5 Duplicate email registration
    res = await request('POST', '/api/auth/register', {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'john.doe@testnexus.com',
      password: 'Password123',
    });
    assert(res.status === 409 && res.data.code === 'EMAIL_ALREADY_EXISTS', 'Rejects duplicate email with 409 Conflict');

    // -------------------------------------------------------------
    // 2. AUTHENTICATION & /api/auth/me TESTS
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Authentication & /api/auth/me ---');

    // 2.1 Access without cookie
    res = await request('GET', '/api/auth/me');
    assert(res.status === 401 && res.data.code === 'UNAUTHORIZED', 'Rejects unauthenticated request with 401');

    // 2.2 Access with invalid cookie
    res = await request('GET', '/api/auth/me', null, { Cookie: 'ff_token=invalid.jwt.token' });
    assert(res.status === 401 && res.data.code === 'INVALID_TOKEN', 'Rejects invalid JWT with 401');

    // 2.3 Access with valid cookie from registration
    res = await request('GET', '/api/auth/me', null, { Cookie: registeredCookie });
    assert(res.status === 200 && res.data.success === true, 'Returns user profile with valid cookie');
    assert(res.data.data.user.firstName === 'John', 'Correct user profile returned');

    // -------------------------------------------------------------
    // 3. LOGOUT TESTS
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Logout ---');

    res = await request('POST', '/api/auth/logout', null, { Cookie: registeredCookie });
    assert(res.status === 200 && res.data.success === true, 'Successfully logs out');

    // Verify session revoked in DB
    res = await request('GET', '/api/auth/me', null, { Cookie: registeredCookie });
    assert(res.status === 401 && res.data.code === 'SESSION_REVOKED', 'Revoked session can no longer access protected routes');

    // Calling logout again when already logged out should succeed
    res = await request('POST', '/api/auth/logout');
    assert(res.status === 200, 'Logout succeeds gracefully even without active session');

    // -------------------------------------------------------------
    // 4. LOGIN TESTS
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Login ---');

    // 4.1 Missing credentials
    res = await request('POST', '/api/auth/login', { email: 'john.doe@testnexus.com' });
    assert(res.status === 400 && res.data.code === 'MISSING_CREDENTIALS', 'Rejects missing password');

    // 4.2 Wrong password (generic response)
    res = await request('POST', '/api/auth/login', {
      email: 'john.doe@testnexus.com',
      password: 'WrongPassword999',
    });
    assert(res.status === 401 && res.data.message === 'Invalid email or password', 'Returns generic 401 for wrong password');

    // 4.3 Unknown email (generic response)
    res = await request('POST', '/api/auth/login', {
      email: 'nonexistent@testnexus.com',
      password: 'Password123',
    });
    assert(res.status === 401 && res.data.message === 'Invalid email or password', 'Returns generic 401 for non-existent email');

    // 4.4 Inactive user login
    await User.updateOne({ email: 'john.doe@testnexus.com' }, { status: 'inactive' });
    res = await request('POST', '/api/auth/login', {
      email: 'john.doe@testnexus.com',
      password: 'Password123',
    });
    assert(res.status === 403 && res.data.code === 'ACCOUNT_INACTIVE', 'Rejects login for inactive account with 403');

    // 4.5 Suspended user login
    await User.updateOne({ email: 'john.doe@testnexus.com' }, { status: 'suspended' });
    res = await request('POST', '/api/auth/login', {
      email: 'john.doe@testnexus.com',
      password: 'Password123',
    });
    assert(res.status === 403 && res.data.code === 'ACCOUNT_SUSPENDED', 'Rejects login for suspended account with 403');

    // 4.6 Valid login
    await User.updateOne({ email: 'john.doe@testnexus.com' }, { status: 'active' });
    res = await request('POST', '/api/auth/login', {
      email: 'JOHN.DOE@testnexus.com',
      password: 'Password123',
    });
    assert(res.status === 200 && res.data.success === true, 'Successful login returns 200');
    assert(res.cookies.ff_token && res.cookies.ff_token.length > 20, 'Sets ff_token cookie upon login');
    const authCookie = `ff_token=${res.cookies.ff_token}`;

    // -------------------------------------------------------------
    // 5. CHANGE PASSWORD TESTS
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Change Password ---');

    // 5.1 Unauthenticated
    res = await request('PUT', '/api/auth/change-password', {
      currentPassword: 'Password123',
      newPassword: 'NewPassword123',
    });
    assert(res.status === 401, 'Rejects unauthenticated change password');

    // 5.2 Wrong current password
    res = await request('PUT', '/api/auth/change-password', {
      currentPassword: 'IncorrectOldPassword1',
      newPassword: 'NewPassword123',
    }, { Cookie: authCookie });
    assert(res.status === 400 && res.data.code === 'INVALID_CURRENT_PASSWORD', 'Rejects incorrect current password');

    // 5.3 Weak new password
    res = await request('PUT', '/api/auth/change-password', {
      currentPassword: 'Password123',
      newPassword: 'weak',
    }, { Cookie: authCookie });
    assert(res.status === 400 && res.data.code === 'PASSWORD_POLICY_FAILED', 'Rejects weak new password');

    // 5.4 Same new password as current
    res = await request('PUT', '/api/auth/change-password', {
      currentPassword: 'Password123',
      newPassword: 'Password123',
    }, { Cookie: authCookie });
    assert(res.status === 400 && res.data.code === 'SAME_PASSWORD', 'Rejects identical new password');

    // 5.5 Valid password change
    res = await request('PUT', '/api/auth/change-password', {
      currentPassword: 'Password123',
      newPassword: 'NewPassword123',
    }, { Cookie: authCookie });
    assert(res.status === 200 && res.data.success === true, 'Successfully changes password');

    // -------------------------------------------------------------
    // 6. FORGOT & RESET PASSWORD TESTS
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Forgot & Reset Password ---');

    // 6.1 Forgot password for unknown email (generic response)
    res = await request('POST', '/api/auth/forgot-password', { email: 'unknown@testnexus.com' });
    assert(res.status === 200 && res.data.success === true, 'Returns generic 200 for unknown email on forgot password');

    // 6.2 Forgot password for valid user
    res = await request('POST', '/api/auth/forgot-password', { email: 'john.doe@testnexus.com' });
    assert(res.status === 200 && res.data.success === true, 'Returns generic 200 for valid user forgot password');

    // Verify token was stored hashed in DB
    const userInDb = await User.findOne({ email: 'john.doe@testnexus.com' }).select('+passwordResetToken +passwordResetExpires');
    assert(userInDb.passwordResetToken && userInDb.passwordResetToken.length === 64, 'Stores SHA-256 hashed reset token in DB');
    assert(userInDb.passwordResetExpires > new Date(), 'Sets future expiration on reset token');

    // Create a known raw token and hashed token for deterministic reset testing
    const crypto = require('crypto');
    const rawTestToken = crypto.randomBytes(32).toString('hex');
    const hashedTestToken = crypto.createHash('sha256').update(rawTestToken).digest('hex');

    userInDb.passwordResetToken = hashedTestToken;
    userInDb.passwordResetExpires = new Date(Date.now() + 3600000);
    await userInDb.save();

    // 6.3 Reset with invalid token
    res = await request('POST', '/api/auth/reset-password', {
      token: 'fake-invalid-token',
      password: 'ResetPassword123',
    });
    assert(res.status === 400 && res.data.code === 'INVALID_OR_EXPIRED_TOKEN', 'Rejects invalid reset token');

    // 6.4 Reset with weak password
    res = await request('POST', '/api/auth/reset-password', {
      token: rawTestToken,
      password: 'weak',
    });
    assert(res.status === 400 && res.data.code === 'PASSWORD_POLICY_FAILED', 'Rejects weak password during reset');

    // 6.5 Reset with expired token
    userInDb.passwordResetExpires = new Date(Date.now() - 1000);
    await userInDb.save();
    res = await request('POST', '/api/auth/reset-password', {
      token: rawTestToken,
      password: 'ResetPassword123',
    });
    assert(res.status === 400 && res.data.code === 'INVALID_OR_EXPIRED_TOKEN', 'Rejects expired reset token');

    // Restore token validity
    userInDb.passwordResetExpires = new Date(Date.now() + 3600000);
    await userInDb.save();

    // 6.6 Valid password reset
    res = await request('POST', '/api/auth/reset-password', {
      token: rawTestToken,
      password: 'ResetPassword123',
    });
    assert(res.status === 200 && res.data.success === true, 'Successfully resets password with valid token');

    // 6.7 Reused reset token is rejected
    res = await request('POST', '/api/auth/reset-password', {
      token: rawTestToken,
      password: 'AnotherPassword123',
    });
    assert(res.status === 400 && res.data.code === 'INVALID_OR_EXPIRED_TOKEN', 'Rejects already-used reset token (single-use enforced)');

    // 6.8 Login with new password
    res = await request('POST', '/api/auth/login', {
      email: 'john.doe@testnexus.com',
      password: 'ResetPassword123',
    });
    assert(res.status === 200 && res.data.success === true, 'Can log in with newly reset password');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n=======================================================');
    console.log('🎉 ALL BACKEND AUTHENTICATION TESTS PASSED PERFECTLY!');
    console.log('=======================================================\n');

  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup
    await User.deleteMany({ email: /@testnexus\.com$/i });
    await Session.deleteMany({});
    if (server) server.close();
    await mongoose.connection.close();
  }
}

runTests();
