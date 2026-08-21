require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Session = require('../src/models/Session');
const Organization = require('../src/models/Organization');
const OrganizationMember = require('../src/models/OrganizationMember');
const PlatformRole = require('../src/models/PlatformRole');
const { seedPlatformRBAC } = require('../src/services/platformRole.service');

const PORT = 5005;
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
  console.log('🚀 Starting Nexus Part 6 - Platform RBAC Automated Test Suite...\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus');
  console.log('Connected to MongoDB for testing.');

  // Clean test data
  await User.deleteMany({ email: /@platformtest\.com$/i });
  await Session.deleteMany({});
  await Organization.deleteMany({ name: /Platform Org/i });
  await PlatformRole.deleteMany({});

  // Seed default platform roles
  await seedPlatformRBAC();

  server = app.listen(PORT);
  baseUrl = `http://localhost:${PORT}`;

  try {
    // -------------------------------------------------------------
    // SETUP: Users and Platform Roles
    // -------------------------------------------------------------
    console.log('\n--- 1. Setting up Test Users and Assigning Platform Roles ---');

    const adminRole = await PlatformRole.findOne({ key: 'platform_admin' });
    const supportRole = await PlatformRole.findOne({ key: 'platform_support' });
    const billingRole = await PlatformRole.findOne({ key: 'platform_billing' });
    const viewerRole = await PlatformRole.findOne({ key: 'platform_viewer' });

    assert(adminRole && adminRole.isLocked === true, 'Platform Admin role created and isLocked is true');
    assert(supportRole && supportRole.isLocked === false, 'Platform Support role created and isLocked is false');

    // 1.1 Normal User (No platform access)
    let res = await request('POST', '/api/auth/register', {
      firstName: 'Normal',
      lastName: 'User',
      email: 'normal@platformtest.com',
      password: 'Password123',
    });
    const cookieNormal = `ff_token=${res.cookies.ff_token}`;
    const userNormal = res.data.data.user;

    // 1.2 Org Admin User (Customer Organization Owner, NO platform access)
    res = await request('POST', '/api/auth/register', {
      firstName: 'Org',
      lastName: 'Owner',
      email: 'orgowner@platformtest.com',
      password: 'Password123',
    });
    const cookieOrgAdmin = `ff_token=${res.cookies.ff_token}`;
    const userOrgAdmin = res.data.data.user;

    // Create Customer Org for Org Admin
    res = await request('POST', '/api/organizations', {
      name: 'Platform Org Customer Workspace',
    }, { Cookie: cookieOrgAdmin });
    assert(res.status === 201, 'Customer Organization created');

    // 1.3 Platform Admin (Superuser & Bootstrap Admin)
    res = await request('POST', '/api/auth/register', {
      firstName: 'Super',
      lastName: 'PlatformAdmin',
      email: 'admin@platformtest.com',
      password: 'Password123',
    });
    const cookiePlatformAdmin = `ff_token=${res.cookies.ff_token}`;
    const userPlatformAdmin = res.data.data.user;
    await User.updateOne(
      { _id: userPlatformAdmin.id },
      {
        $set: {
          isPlatformUser: true,
          platformStatus: 'active',
          platformRoleId: adminRole._id,
          isBootstrapAdmin: true,
        },
      }
    );

    // 1.4 Platform Support User
    res = await request('POST', '/api/auth/register', {
      firstName: 'Sam',
      lastName: 'Support',
      email: 'support@platformtest.com',
      password: 'Password123',
    });
    const cookieSupport = `ff_token=${res.cookies.ff_token}`;
    const userSupport = res.data.data.user;
    await User.updateOne(
      { _id: userSupport.id },
      {
        $set: {
          isPlatformUser: true,
          platformStatus: 'active',
          platformRoleId: supportRole._id,
        },
      }
    );

    // 1.5 Platform Viewer User
    res = await request('POST', '/api/auth/register', {
      firstName: 'Victor',
      lastName: 'Viewer',
      email: 'viewer@platformtest.com',
      password: 'Password123',
    });
    const cookieViewer = `ff_token=${res.cookies.ff_token}`;
    const userViewer = res.data.data.user;
    await User.updateOne(
      { _id: userViewer.id },
      {
        $set: {
          isPlatformUser: true,
          platformStatus: 'active',
          platformRoleId: viewerRole._id,
        },
      }
    );

    // -------------------------------------------------------------
    // 2. LAYER SEPARATION & PLATFORM ACCESS GATES
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Layer Separation & Platform Access Gates ---');

    // 2.1 Unauthenticated request returns 401
    res = await request('GET', '/api/admin/roles');
    assert(res.status === 401 && res.data.code === 'UNAUTHORIZED', 'Unauthenticated request to /api/admin/* returns 401');

    // 2.2 Normal User accessing platform returns 403 NOT_PLATFORM_USER
    res = await request('GET', '/api/admin/roles', null, { Cookie: cookieNormal });
    assert(res.status === 403 && res.data.code === 'NOT_PLATFORM_USER', 'Normal user blocked from platform API (403 NOT_PLATFORM_USER)');

    // 2.3 Customer Org Owner (with org * permissions) accessing platform returns 403 NOT_PLATFORM_USER
    res = await request('GET', '/api/admin/roles', null, { Cookie: cookieOrgAdmin });
    assert(res.status === 403 && res.data.code === 'NOT_PLATFORM_USER', 'Customer Org Owner blocked from platform API (403 NOT_PLATFORM_USER)');

    // -------------------------------------------------------------
    // 3. PLATFORM PERMISSIONS & ME ENDPOINT
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Current-User Platform Permissions API ---');

    // 3.1 Platform Admin permissions endpoint
    res = await request('GET', '/api/admin/me/permissions', null, { Cookie: cookiePlatformAdmin });
    assert(res.status === 200 && res.data.success === true, 'Platform Admin gets permissions profile');
    assert(res.data.data.role.key === 'platform_admin', 'Role is platform_admin');
    assert(res.data.data.permissions.includes('*'), 'Platform Admin has wildcard (*) permissions');

    // 3.2 Platform Support permissions endpoint
    res = await request('GET', '/api/admin/me/permissions', null, { Cookie: cookieSupport });
    assert(res.status === 200, 'Platform Support gets permissions profile');
    assert(res.data.data.role.key === 'platform_support', 'Role is platform_support');
    assert(res.data.data.permissions.includes('tickets.view'), 'Platform Support has tickets.view');
    assert(!res.data.data.permissions.includes('roles.view'), 'Platform Support initially lacks roles.view');

    // -------------------------------------------------------------
    // 4. PLATFORM PERMISSION ENFORCEMENT
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Platform Permission Middleware Enforcement ---');

    // 4.1 Platform Admin has full access (wildcard)
    res = await request('GET', '/api/admin/roles', null, { Cookie: cookiePlatformAdmin });
    assert(res.status === 200 && res.data.success === true, 'Platform Admin can view roles (wildcard override)');
    assert(Array.isArray(res.data.data) && res.data.data.length >= 5, 'Returns all seeded platform roles');
    assert(Array.isArray(res.data.catalog) && res.data.catalog.length > 15, 'Returns platform permission catalog');

    // 4.2 Platform Support lacks roles.view -> 403 MISSING_PLATFORM_PERMISSION
    res = await request('GET', '/api/admin/roles', null, { Cookie: cookieSupport });
    assert(res.status === 403 && res.data.code === 'MISSING_PLATFORM_PERMISSION', 'Platform Support blocked from roles.view (403)');

    // -------------------------------------------------------------
    // 5. PLATFORM ADMIN LOCK PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Platform Admin Lock & Bootstrap Protection ---');

    // 5.1 Attempt to modify Platform Admin permissions
    res = await request('PATCH', `/api/admin/roles/${adminRole._id}`, {
      permissions: ['organizations.view'],
    }, { Cookie: cookiePlatformAdmin });
    assert(res.status === 403 && res.data.code === 'PLATFORM_ADMIN_LOCKED', 'Platform Admin role permissions are permanently locked (403)');

    // 5.2 Attempt to demote/modify Bootstrap Admin
    res = await request('PATCH', `/api/admin/users/${userPlatformAdmin.id}/role`, {
      roleId: viewerRole._id,
    }, { Cookie: cookiePlatformAdmin });
    assert(res.status === 403 && res.data.code === 'CANNOT_DEMOTE_BOOTSTRAP_ADMIN', 'Bootstrap Admin cannot be demoted (403)');

    // -------------------------------------------------------------
    // 6. ROLE CUSTOMIZATION & UNKNOWN PERMISSION REJECTION
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Role Customization & Permission Validation ---');

    // 6.1 Reject unknown permission key
    res = await request('PATCH', `/api/admin/roles/${supportRole._id}`, {
      permissions: ['unknown.super.power'],
    }, { Cookie: cookiePlatformAdmin });
    assert(res.status === 400 && res.data.code === 'UNKNOWN_PERMISSION', 'Rejects unknown platform permission key (400)');

    // 6.2 Update Platform Support role to grant roles.view
    const updatedSupportPerms = [
      'organizations.view',
      'users.view',
      'tickets.view',
      'tickets.create',
      'tickets.update',
      'roles.view',
    ];
    res = await request('PATCH', `/api/admin/roles/${supportRole._id}`, {
      permissions: updatedSupportPerms,
    }, { Cookie: cookiePlatformAdmin });
    assert(res.status === 200 && res.data.success === true, 'Successfully updated platform role permissions');
    assert(res.data.data.role.permissions.includes('roles.view'), 'Updated role contains roles.view');

    // 6.3 Support user can now access roles.view
    res = await request('GET', `/api/admin/roles`, null, { Cookie: cookieSupport });
    assert(res.status === 200, 'Support user can now access roles.view after permission update');

    // -------------------------------------------------------------
    // 7. PRIVILEGE ESCALATION PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Privilege Escalation Protection ---');

    // 7.1 Platform Support attempting to edit role permissions without roles.update -> 403
    res = await request('PATCH', `/api/admin/roles/${billingRole._id}`, {
      permissions: ['pricing.update'],
    }, { Cookie: cookieSupport });
    assert(res.status === 403 && res.data.code === 'MISSING_PLATFORM_PERMISSION', 'Support user without roles.update cannot patch roles (403)');

    // 7.2 Give Support user roles.update permission
    await request('PATCH', `/api/admin/roles/${supportRole._id}`, {
      permissions: [...updatedSupportPerms, 'roles.update'],
    }, { Cookie: cookiePlatformAdmin });

    // 7.3 Support user attempting self-escalation (modifying their own role) -> 403 SELF_ESCALATION_BLOCKED
    res = await request('PATCH', `/api/admin/roles/${supportRole._id}`, {
      permissions: [...updatedSupportPerms, 'pricing.update'],
    }, { Cookie: cookieSupport });
    assert(res.status === 403 && res.data.code === 'SELF_ESCALATION_BLOCKED', 'Platform user cannot modify their own assigned role (403)');

    // -------------------------------------------------------------
    // 8. PLATFORM USER MANAGEMENT & ROLE ASSIGNMENT
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Platform Team & Role Assignment API ---');

    // 8.1 List platform users
    res = await request('GET', '/api/admin/users', null, { Cookie: cookiePlatformAdmin });
    assert(res.status === 200 && Array.isArray(res.data.data), 'Platform Admin can list platform users');
    assert(res.data.data.some((u) => u.email === 'admin@platformtest.com'), 'Lists admin user');

    // 8.2 Assign platform role to Normal User A (granting Platform Viewer)
    res = await request('PATCH', `/api/admin/users/${userNormal.id}/role`, {
      roleId: viewerRole._id,
    }, { Cookie: cookiePlatformAdmin });
    assert(res.status === 200 && res.data.success === true, 'Assigned Platform Viewer role to user');

    // 8.3 User A can now access platform me/permissions
    res = await request('GET', '/api/admin/me/permissions', null, { Cookie: cookieNormal });
    assert(res.status === 200 && res.data.data.role.key === 'platform_viewer', 'User A now has active platform_viewer role');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log('🎉 ALL PLATFORM RBAC & SECURITY TESTS PASSED 100%!');
    console.log('===============================================================\n');

  } catch (err) {
    console.error('\n❌ Platform RBAC Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup
    await User.deleteMany({ email: /@platformtest\.com$/i });
    await Session.deleteMany({});
    await Organization.deleteMany({ name: /Platform Org/i });
    await PlatformRole.deleteMany({});
    if (server) server.close();
    await mongoose.connection.close();
  }
}

runTests();
