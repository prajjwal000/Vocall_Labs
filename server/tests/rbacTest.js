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
const Permission = require('../src/models/Permission');

const PORT = 5004;
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
  console.log('🚀 Starting Nexus Part 5 - Organization RBAC Automated Test Suite...\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus');
  console.log('Connected to MongoDB for testing.');

  // Clean test data
  await User.deleteMany({ email: /@rbactest\.com$/i });
  await Session.deleteMany({});
  await Organization.deleteMany({ name: /RBAC Org/i });
  await OrganizationMember.deleteMany({});
  await OrganizationInvitation.deleteMany({});
  await Role.deleteMany({});

  server = app.listen(PORT);
  baseUrl = `http://localhost:${PORT}`;

  try {
    // -------------------------------------------------------------
    // SETUP: Users and Organizations
    // -------------------------------------------------------------
    console.log('\n--- 1. Setting up Users and Organizations ---');

    // 1.1 User A (Alice - Org A Owner)
    let res = await request('POST', '/api/auth/register', {
      firstName: 'Alice',
      lastName: 'Owner',
      email: 'alice@rbactest.com',
      password: 'Password123',
    });
    const cookieUserA = `ff_token=${res.cookies.ff_token}`;
    const userA = res.data.data.user;

    // 1.2 User B (Bob - Org B Owner)
    res = await request('POST', '/api/auth/register', {
      firstName: 'Bob',
      lastName: 'Owner',
      email: 'bob@rbactest.com',
      password: 'Password123',
    });
    const cookieUserB = `ff_token=${res.cookies.ff_token}`;
    const userB = res.data.data.user;

    // 1.3 User C (Charlie - Org A Admin)
    res = await request('POST', '/api/auth/register', {
      firstName: 'Charlie',
      lastName: 'Admin',
      email: 'charlie@rbactest.com',
      password: 'Password123',
    });
    const cookieUserC = `ff_token=${res.cookies.ff_token}`;
    const userC = res.data.data.user;

    // 1.4 User D (David - Org A Member)
    res = await request('POST', '/api/auth/register', {
      firstName: 'David',
      lastName: 'Member',
      email: 'david@rbactest.com',
      password: 'Password123',
    });
    const cookieUserD = `ff_token=${res.cookies.ff_token}`;
    const userD = res.data.data.user;

    // Create Org A
    res = await request('POST', '/api/organizations', {
      name: 'RBAC Org Alpha',
      description: 'Alpha workspace for RBAC testing',
    }, { Cookie: cookieUserA });
    const orgA = res.data.data.organization;

    // Create Org B
    res = await request('POST', '/api/organizations', {
      name: 'RBAC Org Beta',
      description: 'Beta workspace for RBAC testing',
    }, { Cookie: cookieUserB });
    const orgB = res.data.data.organization;

    // -------------------------------------------------------------
    // 2. DEFAULT ROLES INITIALIZATION
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Default System Roles Initialization ---');

    const orgARoles = await Role.find({ organizationId: orgA.id });
    assert(orgARoles.length >= 3, 'Organization creation automatically initialized default roles');

    const ownerRole = orgARoles.find((r) => r.key === 'owner');
    const adminRole = orgARoles.find((r) => r.key === 'admin');
    const memberRole = orgARoles.find((r) => r.key === 'member');

    assert(ownerRole && ownerRole.isSystem === true, 'Owner role is a system role');
    assert(ownerRole.permissions.includes('*'), 'Owner role contains wildcard (*) permissions');
    assert(adminRole && adminRole.permissions.includes('roles.create'), 'Admin role has roles.create permission');
    assert(memberRole && memberRole.isDefault === true, 'Member role is marked as default');
    assert(!memberRole.permissions.includes('roles.create'), 'Member role does NOT have roles.create permission');

    // Add Charlie as Admin in Org A
    const charlieMember = await OrganizationMember.create({
      userId: userC.id,
      organizationId: orgA.id,
      roleId: adminRole._id,
      role: 'admin',
      status: 'active',
    });

    // Add David as Member in Org A
    const davidMember = await OrganizationMember.create({
      userId: userD.id,
      organizationId: orgA.id,
      roleId: memberRole._id,
      role: 'member',
      status: 'active',
    });

    // -------------------------------------------------------------
    // 3. PERMISSIONS CATALOG API
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Permissions Catalog API ---');

    res = await request('GET', '/api/permissions', null, { Cookie: cookieUserA });
    assert(res.status === 200 && res.data.success === true, 'Permissions catalog returns 200');
    assert(Array.isArray(res.data.data) && res.data.data.length > 15, 'Returns comprehensive permission list');
    const hasEmployeeRead = res.data.data.some((p) => p.key === 'employees.read');
    assert(hasEmployeeRead, 'Catalog contains employees.read');

    // -------------------------------------------------------------
    // 4. ROLE PERMISSIONS & OWNER OVERRIDE
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Permission Enforcement & Owner Override ---');

    // 4.1 Owner can fetch roles
    res = await request('GET', `/api/organizations/${orgA.id}/roles`, null, { Cookie: cookieUserA });
    assert(res.status === 200 && res.data.success === true, 'Owner can access roles endpoint');

    // 4.2 Admin can fetch roles (has roles.read)
    res = await request('GET', `/api/organizations/${orgA.id}/roles`, null, { Cookie: cookieUserC });
    assert(res.status === 200 && res.data.success === true, 'Admin can access roles endpoint');

    // 4.3 Member cannot create roles (missing roles.create)
    res = await request('POST', `/api/organizations/${orgA.id}/roles`, {
      name: 'Unauthorized Role',
      key: 'unauthorized_role',
    }, { Cookie: cookieUserD });
    assert(res.status === 403 && res.data.code === 'FORBIDDEN', 'Member cannot create role (403 Forbidden)');

    // -------------------------------------------------------------
    // 5. CUSTOM ROLE MANAGEMENT LIFECYCLE
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Custom Role Creation, Validation & Deletion ---');

    // 5.1 Admin creates custom role
    res = await request('POST', `/api/organizations/${orgA.id}/roles`, {
      name: 'HR Manager',
      key: 'hr_manager',
      description: 'Manages HR operations',
      permissions: ['employees.read', 'employees.update', 'departments.read'],
    }, { Cookie: cookieUserC });
    assert(res.status === 201 && res.data.success === true, 'Admin can create custom role');
    const hrRole = res.data.data.role;
    assert(hrRole.key === 'hr_manager', 'Correct role key generated');

    // 5.2 Reject unknown permission
    res = await request('POST', `/api/organizations/${orgA.id}/roles`, {
      name: 'Invalid Perm Role',
      key: 'invalid_perm_role',
      permissions: ['unknown.superpower.permission'],
    }, { Cookie: cookieUserA });
    assert(res.status === 400 && res.data.code === 'UNKNOWN_PERMISSION', 'Rejects unknown permission key (400)');

    // 5.3 Reject duplicate role key
    res = await request('POST', `/api/organizations/${orgA.id}/roles`, {
      name: 'Duplicate HR',
      key: 'hr_manager',
      permissions: ['employees.read'],
    }, { Cookie: cookieUserA });
    assert(res.status === 409 && res.data.code === 'ROLE_EXISTS', 'Rejects duplicate role key in organization (409)');

    // 5.4 Reject reserved system role keys
    res = await request('POST', `/api/organizations/${orgA.id}/roles`, {
      name: 'Fake Owner',
      key: 'owner',
      permissions: ['employees.read'],
    }, { Cookie: cookieUserA });
    assert(res.status === 400 && res.data.code === 'RESERVED_ROLE_KEY', 'Rejects creating role with reserved key "owner" (400)');

    // 5.5 Update custom role
    res = await request('PATCH', `/api/organizations/${orgA.id}/roles/${hrRole.id}`, {
      description: 'Updated HR Description',
      permissions: ['employees.read', 'employees.create', 'employees.update', 'departments.read'],
    }, { Cookie: cookieUserA });
    assert(res.status === 200, 'Can update custom role permissions');
    assert(res.data.data.role.permissions.includes('employees.create'), 'Role permissions updated');

    // 5.6 Protect system owner role from modification
    res = await request('PATCH', `/api/organizations/${orgA.id}/roles/${ownerRole.id}`, {
      permissions: ['employees.read'],
    }, { Cookie: cookieUserA });
    assert(res.status === 403 && res.data.code === 'CANNOT_MODIFY_OWNER_ROLE', 'Protects Owner role permissions from being modified (403)');

    // 5.7 Protect system roles from deletion
    res = await request('DELETE', `/api/organizations/${orgA.id}/roles/${ownerRole.id}`, null, { Cookie: cookieUserA });
    assert(res.status === 403 && res.data.code === 'CANNOT_DELETE_SYSTEM_ROLE', 'Cannot delete system owner role (403)');

    // 5.8 Custom role deletion
    res = await request('DELETE', `/api/organizations/${orgA.id}/roles/${hrRole.id}`, null, { Cookie: cookieUserA });
    assert(res.status === 200 && res.data.success === true, 'Can delete custom role');

    // -------------------------------------------------------------
    // 6. MEMBER ROLE ASSIGNMENT & OWNER PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Member Role Assignment & Owner Protection ---');

    // Create Support Role
    res = await request('POST', `/api/organizations/${orgA.id}/roles`, {
      name: 'Support Specialist',
      key: 'support_specialist',
      permissions: ['support.read', 'support.update'],
    }, { Cookie: cookieUserA });
    const supportRole = res.data.data.role;

    // Assign Support Role to David
    res = await request('PATCH', `/api/organizations/${orgA.id}/members/${davidMember.id}/role`, {
      roleId: supportRole.id,
    }, { Cookie: cookieUserA });
    assert(res.status === 200 && res.data.success === true, 'Owner can assign role to member');
    assert(res.data.data.member.role === 'support_specialist', 'Member role updated to support_specialist');

    // Look up Alice's membership
    const aliceMember = await OrganizationMember.findOne({ organizationId: orgA.id, userId: userA.id });

    // Attempt to demote/modify Owner role
    res = await request('PATCH', `/api/organizations/${orgA.id}/members/${aliceMember.id}/role`, {
      roleId: supportRole.id,
    }, { Cookie: cookieUserA });
    assert(res.status === 403 && res.data.code === 'CANNOT_MODIFY_OWNER_ROLE', 'Owner cannot be demoted or modified (403)');

    // Member cannot assign roles
    res = await request('PATCH', `/api/organizations/${orgA.id}/members/${davidMember.id}/role`, {
      roleId: adminRole.id,
    }, { Cookie: cookieUserD });
    assert(res.status === 403 && res.data.code === 'FORBIDDEN', 'Non-privileged member cannot assign roles (403)');

    // -------------------------------------------------------------
    // 7. CROSS-TENANT RBAC ISOLATION
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Cross-Tenant RBAC Isolation ---');

    // Org B Owner Bob cannot list Org A roles
    res = await request('GET', `/api/organizations/${orgA.id}/roles`, null, { Cookie: cookieUserB });
    assert(res.status === 403 && res.data.code === 'FORBIDDEN', 'User B cannot list Org A roles (403)');

    // Org B Owner Bob cannot create role in Org A
    res = await request('POST', `/api/organizations/${orgA.id}/roles`, {
      name: 'Hacker Role',
      key: 'hacker_role',
    }, { Cookie: cookieUserB });
    assert(res.status === 403 && res.data.code === 'FORBIDDEN', 'User B cannot create role in Org A (403)');

    // Attempt to assign Org B role to Org A member
    const orgBRoles = await Role.find({ organizationId: orgB.id });
    const orgBAdminRole = orgBRoles.find((r) => r.key === 'admin');

    res = await request('PATCH', `/api/organizations/${orgA.id}/members/${davidMember.id}/role`, {
      roleId: orgBAdminRole.id,
    }, { Cookie: cookieUserA });
    assert(res.status === 404 && res.data.code === 'ROLE_NOT_FOUND', 'Cannot assign role belonging to a different organization');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log('🎉 ALL RBAC & TENANT ISOLATION TESTS PASSED 100%!');
    console.log('===============================================================\n');

  } catch (err) {
    console.error('\n❌ RBAC Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup
    await User.deleteMany({ email: /@rbactest\.com$/i });
    await Session.deleteMany({});
    await Organization.deleteMany({ name: /RBAC Org/i });
    await OrganizationMember.deleteMany({});
    await OrganizationInvitation.deleteMany({});
    await Role.deleteMany({});
    if (server) server.close();
    await mongoose.connection.close();
  }
}

runTests();
