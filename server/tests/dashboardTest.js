require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Session = require('../src/models/Session');
const Organization = require('../src/models/Organization');
const OrganizationMember = require('../src/models/OrganizationMember');
const OrganizationInvitation = require('../src/models/OrganizationInvitation');
const Role = require('../src/models/Role');

const PORT = 5006;
let server;
let baseUrl;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
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
  console.log('🚀 Starting Nexus Part 7 - Dashboard Automated Test Suite...\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus');
  console.log('Connected to MongoDB for testing.');

  // Clean test data
  await User.deleteMany({ email: /@dashboardtest\.com$/i });
  await Session.deleteMany({});
  await Organization.deleteMany({ name: /Dashboard Org/i });
  await OrganizationMember.deleteMany({});
  await OrganizationInvitation.deleteMany({});
  await Role.deleteMany({});

  server = app.listen(PORT);
  baseUrl = `http://localhost:${PORT}`;

  try {
    // -------------------------------------------------------------
    // SETUP: Users and Organizations
    // -------------------------------------------------------------
    console.log('\n--- 1. Setting up Users and Workspaces ---');

    // 1.1 User A (Alice - Org A Owner)
    let res = await request('POST', '/api/auth/register', {
      firstName: 'Alice',
      lastName: 'Owner',
      email: 'alice@dashboardtest.com',
      password: 'Password123',
    });
    const cookieUserA = `ff_token=${res.cookies.ff_token}`;
    const userA = res.data.data.user;

    // 1.2 User B (Bob - Org B Owner)
    res = await request('POST', '/api/auth/register', {
      firstName: 'Bob',
      lastName: 'Owner',
      email: 'bob@dashboardtest.com',
      password: 'Password123',
    });
    const cookieUserB = `ff_token=${res.cookies.ff_token}`;
    const userB = res.data.data.user;

    // 1.3 User C (Charlie - Org A Member)
    res = await request('POST', '/api/auth/register', {
      firstName: 'Charlie',
      lastName: 'Member',
      email: 'charlie@dashboardtest.com',
      password: 'Password123',
    });
    const cookieUserC = `ff_token=${res.cookies.ff_token}`;
    const userC = res.data.data.user;

    // Create Org Alpha
    res = await request('POST', '/api/organizations', {
      name: 'Dashboard Org Alpha',
    }, { Cookie: cookieUserA });
    const orgAlpha = res.data.data.organization;

    // Create Org Beta
    res = await request('POST', '/api/organizations', {
      name: 'Dashboard Org Beta',
    }, { Cookie: cookieUserB });
    const orgBeta = res.data.data.organization;

    // Add Charlie as active member to Org Alpha
    const memberRole = await Role.findOne({ organizationId: orgAlpha.id, key: 'member' });
    await OrganizationMember.create({
      organizationId: orgAlpha.id,
      userId: userC.id,
      roleId: memberRole?._id,
      role: 'member',
      status: 'active',
      joinedAt: new Date(),
    });

    // -------------------------------------------------------------
    // 2. DASHBOARD ACCESS & TENANT ISOLATION
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Dashboard Access & Tenant Isolation ---');

    // 2.1 Unauthenticated request returns 401
    res = await request('GET', '/api/dashboard/summary');
    assert(res.status === 401 && res.data.code === 'UNAUTHORIZED', 'Unauthenticated request returns 401');

    // 2.2 Missing organization context returns 400
    res = await request('GET', '/api/dashboard/summary', null, { Cookie: cookieUserA });
    assert(res.status === 400 && res.data.code === 'MISSING_ORGANIZATION_ID', 'Missing organization context returns 400');

    // 2.3 User B querying Org Alpha returns 403 (Tenant Isolation)
    res = await request('GET', '/api/dashboard/summary', null, {
      Cookie: cookieUserB,
      'x-organization-id': orgAlpha.id,
    });
    assert(res.status === 403 && res.data.code === 'FORBIDDEN', 'User B blocked from querying Org Alpha dashboard (403)');

    // 2.4 User A querying Org Alpha via header returns 200
    res = await request('GET', '/api/dashboard/summary', null, {
      Cookie: cookieUserA,
      'x-organization-id': orgAlpha.id,
    });
    assert(res.status === 200 && res.data.success === true, 'Owner can access Org Alpha dashboard summary');
    assert(res.data.data.organization.name === 'Dashboard Org Alpha', 'Returns correct organization details');

    // 2.5 User A querying Org Alpha via query param (?organizationId=...) returns 200
    res = await request('GET', `/api/dashboard/summary?organizationId=${orgAlpha.id}`, null, {
      Cookie: cookieUserA,
    });
    assert(res.status === 200 && res.data.success === true, 'Query param organization context works seamlessly');

    // -------------------------------------------------------------
    // 3. REAL METRICS AGGREGATION
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Real Dashboard Metrics Aggregation ---');

    assert(res.data.data.employees.total === 2, 'Employees total matches real database count (Alice + Charlie = 2)');
    assert(res.data.data.employees.newThisMonth === 2, 'New this month matches active joined members (2)');
    assert(res.data.data.employees.pendingInvitations === 0, 'Pending invitations is currently 0');
    assert(res.data.data.requests.pending === 0, 'Requests pending initialized to real 0');
    assert(res.data.data.approvals.pending === 0, 'Approvals pending initialized to real 0');
    assert(res.data.data.workflows.active === 0, 'Workflows active initialized to real 0');

    // Create an invitation in Org Alpha and verify metric update
    await request('POST', `/api/organizations/${orgAlpha.id}/invitations`, {
      email: 'newhire@dashboardtest.com',
    }, { Cookie: cookieUserA });

    res = await request('GET', '/api/dashboard/summary', null, {
      Cookie: cookieUserA,
      'x-organization-id': orgAlpha.id,
    });
    assert(res.data.data.employees.pendingInvitations === 1, 'Creating invitation increments pendingInvitations count dynamically to 1');

    // -------------------------------------------------------------
    // 4. REAL ACTIVITY FEED
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Real Activity Feed API ---');

    // 4.1 Unauthenticated activity request returns 401
    res = await request('GET', '/api/dashboard/activity');
    assert(res.status === 401, 'Unauthenticated activity request returns 401');

    // 4.2 Cross-tenant activity request blocked
    res = await request('GET', '/api/dashboard/activity', null, {
      Cookie: cookieUserB,
      'x-organization-id': orgAlpha.id,
    });
    assert(res.status === 403, 'Cross-tenant activity access blocked (403)');

    // 4.3 Owner gets Org Alpha real activity feed
    res = await request('GET', '/api/dashboard/activity', null, {
      Cookie: cookieUserA,
      'x-organization-id': orgAlpha.id,
    });
    assert(res.status === 200 && Array.isArray(res.data.data), 'Activity feed returns 200 with list');
    assert(res.data.data.length >= 2, 'Returns real workspace events (member joins, invitations)');
    assert(res.data.data[0].timestamp !== undefined, 'Each activity item includes real timestamp');

    // Verify events are sorted descending
    if (res.data.data.length > 1) {
      const t1 = new Date(res.data.data[0].timestamp).getTime();
      const t2 = new Date(res.data.data[1].timestamp).getTime();
      assert(t1 >= t2, 'Activities are chronologically sorted newest first');
    }

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log('🎉 ALL DASHBOARD & REAL DATA TESTS PASSED 100%!');
    console.log('===============================================================\n');

  } catch (err) {
    console.error('\n❌ Dashboard Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup
    await User.deleteMany({ email: /@dashboardtest\.com$/i });
    await Session.deleteMany({});
    await Organization.deleteMany({ name: /Dashboard Org/i });
    await OrganizationMember.deleteMany({});
    await OrganizationInvitation.deleteMany({});
    await Role.deleteMany({});
    if (server) server.close();
    await mongoose.connection.close();
  }
}

runTests();
