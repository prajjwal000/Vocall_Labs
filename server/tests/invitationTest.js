require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Session = require('../src/models/Session');
const Organization = require('../src/models/Organization');
const OrganizationMember = require('../src/models/OrganizationMember');
const OrganizationInvitation = require('../src/models/OrganizationInvitation');

const PORT = 5003;
let server;
let baseUrl;

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
  console.log('🚀 Starting Nexus Part 4 - Organization Employee Invitation Automated Test Suite...\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus');
  console.log('Connected to MongoDB for testing.');

  // Clean test data
  await User.deleteMany({ email: /@invitetest\.com$/i });
  await User.deleteMany({ email: /@acmetest\.com$/i });
  await Session.deleteMany({});
  await Organization.deleteMany({ name: /Invite Org/i });
  await OrganizationMember.deleteMany({});
  await OrganizationInvitation.deleteMany({});

  server = app.listen(PORT);
  baseUrl = `http://localhost:${PORT}`;

  try {
    // -------------------------------------------------------------
    // SETUP: Users and Organizations
    // -------------------------------------------------------------
    console.log('\n--- 1. Setting up Users and Organizations ---');

    // 1.1 User A (Owner of Org A)
    let res = await request('POST', '/api/auth/register', {
      firstName: 'Alice',
      lastName: 'Owner',
      email: 'alice@invitetest.com',
      password: 'Password123',
    });
    const cookieUserA = `ff_token=${res.cookies.ff_token}`;
    const userA = res.data.data.user;

    // 1.2 User B (Owner of Org B)
    res = await request('POST', '/api/auth/register', {
      firstName: 'Bob',
      lastName: 'Owner',
      email: 'bob@invitetest.com',
      password: 'Password123',
    });
    const cookieUserB = `ff_token=${res.cookies.ff_token}`;
    const userB = res.data.data.user;

    // 1.3 User C (Will become Admin in Org A)
    res = await request('POST', '/api/auth/register', {
      firstName: 'Charlie',
      lastName: 'Admin',
      email: 'charlie@invitetest.com',
      password: 'Password123',
    });
    const cookieUserC = `ff_token=${res.cookies.ff_token}`;
    const userC = res.data.data.user;

    // 1.4 User D (Will become Member in Org A)
    res = await request('POST', '/api/auth/register', {
      firstName: 'David',
      lastName: 'Member',
      email: 'david@invitetest.com',
      password: 'Password123',
    });
    const cookieUserD = `ff_token=${res.cookies.ff_token}`;
    const userD = res.data.data.user;

    // 1.5 User E (Existing User who will accept invitation)
    res = await request('POST', '/api/auth/register', {
      firstName: 'Eve',
      lastName: 'Existing',
      email: 'eve@acmetest.com',
      password: 'Password123',
    });
    const userE = res.data.data.user;

    // Create Org A
    res = await request('POST', '/api/organizations', {
      name: 'Invite Org Alpha',
      description: 'Alpha workspace for invites',
    }, { Cookie: cookieUserA });
    const orgA = res.data.data.organization;

    // Create Org B
    res = await request('POST', '/api/organizations', {
      name: 'Invite Org Beta',
      description: 'Beta workspace for invites',
    }, { Cookie: cookieUserB });
    const orgB = res.data.data.organization;

    // Add Charlie as Admin in Org A
    await OrganizationMember.create({
      userId: userC.id,
      organizationId: orgA.id,
      role: 'admin',
      status: 'active',
    });

    // Add David as Member in Org A
    await OrganizationMember.create({
      userId: userD.id,
      organizationId: orgA.id,
      role: 'member',
      status: 'active',
    });

    // -------------------------------------------------------------
    // 2. INVITATION CREATION & PERMISSIONS TESTS
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Invitation Creation & Roles ---');

    // 2.1 Owner can invite
    res = await request('POST', `/api/organizations/${orgA.id}/invitations`, {
      email: 'employee1@acmetest.com',
    }, { Cookie: cookieUserA });
    assert(res.status === 201 && res.data.success === true, 'Owner can create invitation');
    assert(res.data.data.invitation.email === 'employee1@acmetest.com', 'Normalized email stored');
    const invite1 = res.data.data.invitation;
    const rawToken1 = invite1.rawToken;

    // 2.2 Admin can invite
    res = await request('POST', `/api/organizations/${orgA.id}/invitations`, {
      email: 'employee2@acmetest.com',
    }, { Cookie: cookieUserC });
    assert(res.status === 201 && res.data.success === true, 'Admin can create invitation');

    // 2.3 Regular Member CANNOT invite
    res = await request('POST', `/api/organizations/${orgA.id}/invitations`, {
      email: 'employee3@acmetest.com',
    }, { Cookie: cookieUserD });
    assert(res.status === 403 && res.data.code === 'FORBIDDEN', 'Member cannot create invitations (403)');

    // 2.4 Duplicate active member rejection
    res = await request('POST', `/api/organizations/${orgA.id}/invitations`, {
      email: 'david@invitetest.com',
    }, { Cookie: cookieUserA });
    assert(res.status === 409 && res.data.code === 'ALREADY_MEMBER', 'Rejects invitation for existing member (409)');

    // 2.5 Duplicate pending invitation rejection
    res = await request('POST', `/api/organizations/${orgA.id}/invitations`, {
      email: 'employee1@acmetest.com',
    }, { Cookie: cookieUserA });
    assert(res.status === 409 && res.data.code === 'INVITATION_ALREADY_EXISTS', 'Rejects duplicate pending invitation (409)');

    // -------------------------------------------------------------
    // 3. DOMAIN RESTRICTION TESTS
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Domain Restriction Rules ---');

    // Enable domain restriction on Org A for ['acmetest.com', 'acme.org']
    res = await request('PATCH', `/api/organizations/${orgA.id}`, {
      domainRestrictionEnabled: true,
      allowedEmailDomains: ['acmetest.com', 'acme.org'],
    }, { Cookie: cookieUserA });
    assert(res.status === 200, 'Enabled domain restriction on Org A');

    // Allowed domain succeeds
    res = await request('POST', `/api/organizations/${orgA.id}/invitations`, {
      email: 'sarah@ACMETEST.COM',
    }, { Cookie: cookieUserA });
    assert(res.status === 201, 'Accepts email with allowed domain (case-insensitive)');

    // Disallowed domain fails (403)
    res = await request('POST', `/api/organizations/${orgA.id}/invitations`, {
      email: 'sarah@gmail.com',
    }, { Cookie: cookieUserA });
    assert(res.status === 403 && res.data.code === 'EMAIL_DOMAIN_NOT_ALLOWED', 'Rejects disallowed email domain (403)');

    // Substring/evil domain fails (403)
    res = await request('POST', `/api/organizations/${orgA.id}/invitations`, {
      email: 'sarah@evilacmetest.com',
    }, { Cookie: cookieUserA });
    assert(res.status === 403 && res.data.code === 'EMAIL_DOMAIN_NOT_ALLOWED', 'Rejects substring domain evilacmetest.com (403)');

    // -------------------------------------------------------------
    // 4. TOKEN SECURITY & INSPECTING TESTS
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Token Security & Public Inspection ---');

    // 4.1 Inspect valid token
    res = await request('GET', `/api/invitations/${rawToken1}`);
    assert(res.status === 200 && res.data.success === true, 'Public endpoint inspects valid token');
    assert(res.data.data.organizationName === 'Invite Org Alpha', 'Returns organization name');
    assert(res.data.data.email === 'employee1@acmetest.com', 'Returns invited email');
    assert(res.data.data.requiresRegistration === true, 'Signals requiresRegistration for new user');

    // 4.2 Inspect invalid token
    res = await request('GET', '/api/invitations/invalid-raw-token-12345');
    assert(res.status === 400 && res.data.code === 'INVALID_INVITATION', 'Rejects invalid token (400)');

    // -------------------------------------------------------------
    // 5. RESEND & REVOKE TESTS
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Resend & Revocation ---');

    // 5.1 Resend invitation
    res = await request('POST', `/api/organizations/${orgA.id}/invitations/${invite1.id}/resend`, null, { Cookie: cookieUserA });
    assert(res.status === 200 && res.data.success === true, 'Admin can resend invitation');
    const newRawToken1 = res.data.data.invitation.rawToken;
    assert(newRawToken1 !== rawToken1, 'Resend generates new token');

    // Old token should now fail
    res = await request('GET', `/api/invitations/${rawToken1}`);
    assert(res.status === 400, 'Old token is invalidated after resend');

    // 5.2 Create invite to revoke
    res = await request('POST', `/api/organizations/${orgA.id}/invitations`, {
      email: 'revokeme@acmetest.com',
    }, { Cookie: cookieUserA });
    const revokeInvite = res.data.data.invitation;
    const revokeRawToken = revokeInvite.rawToken;

    // Revoke
    res = await request('DELETE', `/api/organizations/${orgA.id}/invitations/${revokeInvite.id}`, null, { Cookie: cookieUserA });
    assert(res.status === 200, 'Admin can revoke invitation');

    // Inspect revoked token -> 410
    res = await request('GET', `/api/invitations/${revokeRawToken}`);
    assert(res.status === 410 && res.data.code === 'INVITATION_REVOKED', 'Revoked invitation returns 410 INVITATION_REVOKED');

    // -------------------------------------------------------------
    // 6. ACCEPTANCE: EXISTING USER (No Duplicate User)
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Acceptance for Existing User ---');

    // Invite Eve (eve@acmetest.com already registered in setup)
    res = await request('POST', `/api/organizations/${orgA.id}/invitations`, {
      email: 'eve@acmetest.com',
    }, { Cookie: cookieUserA });
    const eveInviteToken = res.data.data.invitation.rawToken;

    // Inspect token
    res = await request('GET', `/api/invitations/${eveInviteToken}`);
    assert(res.status === 200 && res.data.data.existingUser === true, 'Recognizes existing user');
    assert(res.data.data.requiresRegistration === false, 'Does not require registration for existing user');

    // Eve accepts invitation
    const totalUsersBefore = await User.countDocuments();
    res = await request('POST', `/api/invitations/${eveInviteToken}/accept`, {});
    assert(res.status === 200 && res.data.success === true, 'Existing user accepts invitation');
    const totalUsersAfter = await User.countDocuments();
    assert(totalUsersBefore === totalUsersAfter, 'Existing User was NOT duplicated in MongoDB');

    // Verify Eve is now a member of Org A
    const eveMember = await OrganizationMember.findOne({ organizationId: orgA.id, userId: userE.id });
    assert(eveMember && eveMember.status === 'active', 'Eve is now an active member of Org A');

    // -------------------------------------------------------------
    // 7. ACCEPTANCE: NEW USER (Registration + Auth)
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Acceptance for New User ---');

    res = await request('POST', `/api/organizations/${orgA.id}/invitations`, {
      email: 'newhire@acmetest.com',
    }, { Cookie: cookieUserA });
    const newHireToken = res.data.data.invitation.rawToken;

    // Accept with registration payload
    res = await request('POST', `/api/invitations/${newHireToken}/accept`, {
      firstName: 'New',
      lastName: 'Hire',
      password: 'Password123',
    });
    assert(res.status === 200 && res.data.success === true, 'New user accepts invitation and registers');
    assert(res.cookies.ff_token && res.cookies.ff_token.length > 20, 'Sets ff_token cookie upon acceptance');
    assert(res.data.data.user.email === 'newhire@acmetest.com', 'Created new user account');

    // Reused token should fail (single-use)
    res = await request('POST', `/api/invitations/${newHireToken}/accept`, {
      firstName: 'Another',
      lastName: 'Attempt',
      password: 'Password123',
    });
    assert(res.status === 410 && res.data.code === 'INVITATION_ALREADY_ACCEPTED', 'Reused token is rejected (410)');

    // -------------------------------------------------------------
    // 8. CROSS-TENANT ISOLATION
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Cross-Tenant Isolation ---');

    // User B (Org B Owner) cannot list Org A invitations
    res = await request('GET', `/api/organizations/${orgA.id}/invitations`, null, { Cookie: cookieUserB });
    assert(res.status === 403 && res.data.code === 'FORBIDDEN', 'User B cannot list Org A invitations (403)');

    // User B cannot create invitation in Org A
    res = await request('POST', `/api/organizations/${orgA.id}/invitations`, {
      email: 'hacker@acmetest.com',
    }, { Cookie: cookieUserB });
    assert(res.status === 403 && res.data.code === 'FORBIDDEN', 'User B cannot create invitation in Org A (403)');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log('🎉 ALL INVITATION & TENANT ISOLATION TESTS PASSED 100%!');
    console.log('===============================================================\n');

  } catch (err) {
    console.error('\n❌ Invitation Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup
    await User.deleteMany({ email: /@invitetest\.com$/i });
    await User.deleteMany({ email: /@acmetest\.com$/i });
    await Session.deleteMany({});
    await Organization.deleteMany({ name: /Invite Org/i });
    await OrganizationMember.deleteMany({});
    await OrganizationInvitation.deleteMany({});
    if (server) server.close();
    await mongoose.connection.close();
  }
}

runTests();
