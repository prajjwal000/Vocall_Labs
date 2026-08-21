require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Session = require('../src/models/Session');
const Organization = require('../src/models/Organization');
const OrganizationMember = require('../src/models/OrganizationMember');

const PORT = 5002; // Dedicated port for org test runner
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
  console.log('🚀 Starting Nexus Part 3 - Organization & Workspace Automated Test Suite...\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus');
  console.log('Connected to MongoDB for testing.');

  // Clean collections
  await User.deleteMany({ email: /@tenanttest\.com$/i });
  await Session.deleteMany({});
  await Organization.deleteMany({ name: /Test Org/i });
  await OrganizationMember.deleteMany({});

  server = app.listen(PORT);
  baseUrl = `http://localhost:${PORT}`;

  try {
    // -------------------------------------------------------------
    // SETUP: Register User A & User B
    // -------------------------------------------------------------
    console.log('\n--- 1. Setting up Users ---');
    let res = await request('POST', '/api/auth/register', {
      firstName: 'Alice',
      lastName: 'Owner',
      email: 'alice@tenanttest.com',
      password: 'Password123',
    });
    assert(res.status === 201, 'Registered User A (Alice)');
    const cookieUserA = `ff_token=${res.cookies.ff_token}`;
    const userA = res.data.data.user;

    res = await request('POST', '/api/auth/register', {
      firstName: 'Bob',
      lastName: 'User',
      email: 'bob@tenanttest.com',
      password: 'Password123',
    });
    assert(res.status === 201, 'Registered User B (Bob)');
    const cookieUserB = `ff_token=${res.cookies.ff_token}`;
    const userB = res.data.data.user;

    // -------------------------------------------------------------
    // 2. ORGANIZATION CREATION TESTS
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Organization Creation ---');

    // 2.1 Unauthenticated creation
    res = await request('POST', '/api/organizations', { name: 'Test Org Alpha' });
    assert(res.status === 401, 'Rejects unauthenticated organization creation');

    // 2.2 Missing name
    res = await request('POST', '/api/organizations', { description: 'No name' }, { Cookie: cookieUserA });
    assert(res.status === 400 && res.data.code === 'VALIDATION_ERROR', 'Rejects creation with missing name');

    // 2.3 Valid creation by User A (Org A1)
    res = await request('POST', '/api/organizations', {
      name: 'Test Org Alpha',
      description: 'Alpha workspace description',
    }, { Cookie: cookieUserA });
    assert(res.status === 201 && res.data.success === true, 'User A creates Test Org Alpha');
    assert(res.data.data.organization.role === 'owner', 'Creator automatically becomes owner');
    assert(res.data.data.organization.slug === 'test-org-alpha', 'Correct slug generated');
    const orgA1 = res.data.data.organization;

    // 2.4 Duplicate slug handling by User A (Org A2 with same name)
    res = await request('POST', '/api/organizations', {
      name: 'Test Org Alpha',
      description: 'Second Alpha workspace',
    }, { Cookie: cookieUserA });
    assert(res.status === 201 && res.data.success === true, 'Creates second organization with same base name');
    assert(res.data.data.organization.slug === 'test-org-alpha-1', 'Generates unique collision-free slug');
    const orgA2 = res.data.data.organization;

    // 2.5 User B creates Org B1
    res = await request('POST', '/api/organizations', {
      name: 'Test Org Beta',
      description: 'Beta workspace description',
    }, { Cookie: cookieUserB });
    assert(res.status === 201 && res.data.success === true, 'User B creates Test Org Beta');
    const orgB1 = res.data.data.organization;

    // -------------------------------------------------------------
    // 3. ORGANIZATION LISTING TESTS
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Organization Listing ---');

    // 3.1 User A list
    res = await request('GET', '/api/organizations', null, { Cookie: cookieUserA });
    assert(res.status === 200 && res.data.success === true, 'User A can fetch their organizations');
    assert(res.data.data.length === 2, 'User A sees exactly 2 organizations');
    const orgAIds = res.data.data.map((o) => o.id);
    assert(orgAIds.includes(orgA1.id) && orgAIds.includes(orgA2.id), 'User A sees Org A1 and Org A2');
    assert(!orgAIds.includes(orgB1.id), 'User A cannot see User B org (No data leak)');

    // 3.2 User B list
    res = await request('GET', '/api/organizations', null, { Cookie: cookieUserB });
    assert(res.status === 200 && res.data.success === true, 'User B can fetch their organizations');
    assert(res.data.data.length === 1, 'User B sees exactly 1 organization');
    assert(res.data.data[0].id === orgB1.id, 'User B sees Org B1');

    // -------------------------------------------------------------
    // 4. CROSS-TENANT ISOLATION & ACCESS CONTROL TESTS
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Cross-Tenant Isolation (Mandatory) ---');

    // 4.1 User A -> Org A1 (Allowed)
    res = await request('GET', `/api/organizations/${orgA1.id}`, null, { Cookie: cookieUserA });
    assert(res.status === 200 && res.data.data.organization.id === orgA1.id, 'User A -> Org A1 is ALLOWED (200)');

    // 4.2 User A -> Org B1 (Denied)
    res = await request('GET', `/api/organizations/${orgB1.id}`, null, { Cookie: cookieUserA });
    assert(res.status === 403 && res.data.code === 'FORBIDDEN', 'User A -> Org B1 is DENIED (403)');

    // 4.3 User B -> Org A1 (Denied)
    res = await request('GET', `/api/organizations/${orgA1.id}`, null, { Cookie: cookieUserB });
    assert(res.status === 403 && res.data.code === 'FORBIDDEN', 'User B -> Org A1 is DENIED (403)');

    // 4.4 User A attempts to update Org B1 (Denied)
    res = await request('PATCH', `/api/organizations/${orgB1.id}`, { name: 'Hacked Org' }, { Cookie: cookieUserA });
    assert(res.status === 403 && res.data.code === 'FORBIDDEN', 'User A modifying Org B1 is DENIED (403)');

    // 4.5 User A attempts to delete Org B1 (Denied)
    res = await request('DELETE', `/api/organizations/${orgB1.id}`, null, { Cookie: cookieUserA });
    assert(res.status === 403 && res.data.code === 'FORBIDDEN', 'User A deleting Org B1 is DENIED (403)');

    // 4.6 Non-existent ID gives 403 (does not leak existence)
    const fakeId = new mongoose.Types.ObjectId().toString();
    res = await request('GET', `/api/organizations/${fakeId}`, null, { Cookie: cookieUserA });
    assert(res.status === 403 && res.data.code === 'FORBIDDEN', 'Non-existent org returns 403 without leaking existence');

    // -------------------------------------------------------------
    // 5. ORGANIZATION UPDATE & ROLE TESTS
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Organization Update & Role Permissions ---');

    // 5.1 Owner updates organization
    res = await request('PATCH', `/api/organizations/${orgA1.id}`, {
      name: 'Test Org Alpha Updated',
      description: 'Updated description',
      timezone: 'America/New_York',
      currency: 'USD',
    }, { Cookie: cookieUserA });
    assert(res.status === 200 && res.data.success === true, 'Owner can update organization settings');
    assert(res.data.data.organization.name === 'Test Org Alpha Updated', 'Name updated');
    assert(res.data.data.organization.settings.timezone === 'America/New_York', 'Timezone updated');
    assert(res.data.data.organization.settings.currency === 'USD', 'Currency updated');

    // 5.2 Add User B as member to Org A1
    const memberDoc = await OrganizationMember.create({
      userId: userB.id,
      organizationId: orgA1.id,
      role: 'member',
      status: 'active',
    });

    // Verify User B can now read Org A1 with role 'member'
    res = await request('GET', `/api/organizations/${orgA1.id}`, null, { Cookie: cookieUserB });
    assert(res.status === 200 && res.data.data.organization.role === 'member', 'User B can now access Org A1 as member');

    // Member attempts to update settings -> 403
    res = await request('PATCH', `/api/organizations/${orgA1.id}`, { name: 'Member Update Attempt' }, { Cookie: cookieUserB });
    assert(res.status === 403, 'Member is forbidden from updating organization settings');

    // Promote User B to admin
    await OrganizationMember.updateOne({ _id: memberDoc._id }, { role: 'admin' });

    // Admin updates settings -> 200
    res = await request('PATCH', `/api/organizations/${orgA1.id}`, { description: 'Admin updated description' }, { Cookie: cookieUserB });
    assert(res.status === 200 && res.data.data.organization.description === 'Admin updated description', 'Admin can update organization settings');

    // -------------------------------------------------------------
    // 6. COMPOUND UNIQUE MEMBERSHIP INDEX TEST
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Compound Unique Membership Index ---');
    try {
      await OrganizationMember.create({
        userId: userB.id,
        organizationId: orgA1.id,
        role: 'member',
      });
      assert(false, 'Duplicate membership should throw error');
    } catch (err) {
      assert(err.code === 11000, 'Compound index prevents duplicate membership for same user in same org');
    }

    // -------------------------------------------------------------
    // 7. SOFT DELETION TESTS
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Organization Soft Deletion ---');

    // 7.1 Admin (non-owner) attempts to delete -> 403
    res = await request('DELETE', `/api/organizations/${orgA1.id}`, null, { Cookie: cookieUserB });
    assert(res.status === 403, 'Admin/member cannot delete organization');

    // 7.2 Owner deletes organization -> 200
    res = await request('DELETE', `/api/organizations/${orgA1.id}`, null, { Cookie: cookieUserA });
    assert(res.status === 200 && res.data.success === true, 'Owner can soft-delete organization');

    // 7.3 Subsequent access to deleted org -> 403
    res = await request('GET', `/api/organizations/${orgA1.id}`, null, { Cookie: cookieUserA });
    assert(res.status === 403, 'Deleted organization is inaccessible via API (403)');

    // 7.4 Deleted org not returned in listing
    res = await request('GET', '/api/organizations', null, { Cookie: cookieUserA });
    assert(res.data.data.length === 1 && res.data.data[0].id === orgA2.id, 'Deleted organization excluded from listing');

    // 7.5 Org document still exists in database with status 'deleted'
    const deletedOrgDoc = await Organization.findById(orgA1.id);
    assert(deletedOrgDoc && deletedOrgDoc.status === 'deleted', 'Organization document remains in MongoDB with status=deleted');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log('🎉 ALL BACKEND ORGANIZATION & ISOLATION TESTS PASSED 100%!');
    console.log('===============================================================\n');

  } catch (err) {
    console.error('\n❌ Organization Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup
    await User.deleteMany({ email: /@tenanttest\.com$/i });
    await Session.deleteMany({});
    await Organization.deleteMany({ name: /Test Org/i });
    await OrganizationMember.deleteMany({});
    if (server) server.close();
    await mongoose.connection.close();
  }
}

runTests();
