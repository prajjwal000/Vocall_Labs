require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Session = require('../src/models/Session');
const Organization = require('../src/models/Organization');
const OrganizationMember = require('../src/models/OrganizationMember');
const Role = require('../src/models/Role');
const Workflow = require('../src/models/Workflow');
const WorkflowRequest = require('../src/models/WorkflowRequest');
const WorkflowApproval = require('../src/models/WorkflowApproval');

const PORT = 5007;
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
  console.log('🚀 Starting Nexus Workflow Engine Automated Test Suite...\n');

  await mongoose.connect('mongodb://127.0.0.1:27017/nexus');
  console.log('Connected to MongoDB for testing.');

  // Clean test data
  await User.deleteMany({ email: /@workflowtest\.com$/i });
  await Session.deleteMany({});
  await Organization.deleteMany({ name: /Workflow Org/i });
  await OrganizationMember.deleteMany({});
  await Role.deleteMany({});
  await Workflow.deleteMany({});
  await WorkflowRequest.deleteMany({});
  await WorkflowApproval.deleteMany({});

  server = app.listen(PORT);
  baseUrl = `http://localhost:${PORT}`;

  try {
    // -------------------------------------------------------------
    // 1. SETUP: USERS & WORKSPACES
    // -------------------------------------------------------------
    console.log('\n--- 1. Setting up Users and Roles ---');

    // 1.1 Alice (Owner)
    let res = await request('POST', '/api/auth/register', {
      firstName: 'Alice',
      lastName: 'Owner',
      email: 'alice@workflowtest.com',
      password: 'Password123',
    });
    const cookieAlice = `ff_token=${res.cookies.ff_token}`;
    const alice = res.data.data.user;

    // 1.2 Marcus (Manager)
    res = await request('POST', '/api/auth/register', {
      firstName: 'Marcus',
      lastName: 'Manager',
      email: 'marcus@workflowtest.com',
      password: 'Password123',
    });
    const cookieMarcus = `ff_token=${res.cookies.ff_token}`;
    const marcus = res.data.data.user;

    // 1.3 Arthur (Approver)
    res = await request('POST', '/api/auth/register', {
      firstName: 'Arthur',
      lastName: 'Approver',
      email: 'arthur@workflowtest.com',
      password: 'Password123',
    });
    const cookieArthur = `ff_token=${res.cookies.ff_token}`;
    const arthur = res.data.data.user;

    // 1.4 Emma (Employee)
    res = await request('POST', '/api/auth/register', {
      firstName: 'Emma',
      lastName: 'Employee',
      email: 'emma@workflowtest.com',
      password: 'Password123',
    });
    const cookieEmma = `ff_token=${res.cookies.ff_token}`;
    const emma = res.data.data.user;

    // 1.5 Bob (Org Beta Owner)
    res = await request('POST', '/api/auth/register', {
      firstName: 'Bob',
      lastName: 'Beta',
      email: 'bob@workflowtest.com',
      password: 'Password123',
    });
    const cookieBob = `ff_token=${res.cookies.ff_token}`;

    // Create Org Alpha
    res = await request('POST', '/api/organizations', {
      name: 'Workflow Org Alpha',
    }, { Cookie: cookieAlice });
    const orgAlpha = res.data.data.organization;

    // Create Org Beta
    res = await request('POST', '/api/organizations', {
      name: 'Workflow Org Beta',
    }, { Cookie: cookieBob });
    const orgBeta = res.data.data.organization;

    // Configure Manager & Approver Roles in Org Alpha
    const managerRole = await Role.create({
      organizationId: orgAlpha.id,
      name: 'Department Manager',
      key: 'manager',
      permissions: ['workflows.read', 'requests.read', 'requests.create', 'approvals.read', 'approvals.approve', 'approvals.reject'],
      isSystem: false,
    });

    const approverRole = await Role.create({
      organizationId: orgAlpha.id,
      name: 'Finance Approver',
      key: 'approver',
      permissions: ['workflows.read', 'requests.read', 'approvals.read', 'approvals.approve', 'approvals.reject'],
      isSystem: false,
    });

    const memberRole = await Role.findOne({ organizationId: orgAlpha.id, key: 'member' });

    // Link Memberships
    await OrganizationMember.create({
      organizationId: orgAlpha.id,
      userId: marcus.id,
      role: 'manager',
      roleId: managerRole._id,
      status: 'active',
    });

    await OrganizationMember.create({
      organizationId: orgAlpha.id,
      userId: arthur.id,
      role: 'approver',
      roleId: approverRole._id,
      status: 'active',
    });

    await OrganizationMember.create({
      organizationId: orgAlpha.id,
      userId: emma.id,
      role: 'member',
      roleId: memberRole?._id,
      status: 'active',
    });

    // -------------------------------------------------------------
    // 2. WORKFLOW CATALOG & TEMPLATES
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Workflow Catalog & Template Seeding ---');

    // 2.1 Owner queries workflows (triggers automatic default template seeding)
    res = await request('GET', '/api/workflows', null, {
      Cookie: cookieAlice,
      'x-organization-id': orgAlpha.id,
    });
    assert(res.status === 200 && res.data.success === true, 'Owner can list organization workflows');
    assert(res.data.data.length >= 3, 'Pre-configured default templates automatically seeded (Expense, Leave, Procurement)');

    const expenseWorkflow = res.data.data.find((w) => w.category === 'expense');
    assert(expenseWorkflow !== undefined, 'Expense Reimbursement workflow exists');
    assert(expenseWorkflow.steps.length === 2, 'Expense workflow has 2 approval stages');

    // 2.2 Create Custom 2-Stage Workflow
    res = await request('POST', '/api/workflows', {
      name: 'Custom Hardware Request',
      description: 'Request laptops, monitors, or developer accessories',
      category: 'procurement',
      icon: '💻',
      formSchema: [
        { fieldKey: 'deviceModel', label: 'Device Model', type: 'text', required: true },
        { fieldKey: 'budgetEstimate', label: 'Estimated Budget ($)', type: 'number', required: true },
      ],
      steps: [
        { stepNumber: 1, name: 'Manager Review', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'manager' },
        { stepNumber: 2, name: 'Finance Sign-Off', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'approver' },
      ],
    }, {
      Cookie: cookieAlice,
      'x-organization-id': orgAlpha.id,
    });
    assert(res.status === 201 && res.data.success === true, 'Owner created custom 2-stage workflow');
    const customWorkflow = res.data.data;

    // -------------------------------------------------------------
    // 3. REQUEST SUBMISSION & EXECUTION PIPELINE
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Request Submission & Multi-Stage Approvals ---');

    // 3.1 Emma (Employee) submits a request
    res = await request('POST', `/api/workflows/${customWorkflow._id}/submit`, {
      formData: {
        deviceModel: 'MacBook Pro M3 Max 64GB',
        budgetEstimate: 3500,
      },
    }, {
      Cookie: cookieEmma,
      'x-organization-id': orgAlpha.id,
    });
    assert(res.status === 201 && res.data.success === true, 'Emma submitted hardware request');
    const request1 = res.data.data;
    assert(request1.requestCode.startsWith('REQ-'), 'Request code generated sequentially (REQ-XXXX)');
    assert(request1.status === 'pending', 'Initial request status is pending');
    assert(request1.currentStepNumber === 1, 'Current step is 1');

    // 3.2 Verify Step 1 Approval exists in Marcus's (Manager) queue
    res = await request('GET', '/api/approvals?status=pending', null, {
      Cookie: cookieMarcus,
      'x-organization-id': orgAlpha.id,
    });
    assert(res.status === 200 && res.data.data.length === 1, 'Manager has 1 pending approval item');
    const step1Approval = res.data.data[0];
    assert(step1Approval.stepNumber === 1, 'Approval task is for Step 1 (Manager Review)');

    // 3.3 Emma cannot approve her own request (403)
    res = await request('POST', `/api/approvals/${step1Approval._id}/decide`, {
      decision: 'approved',
      comment: 'Self approval',
    }, {
      Cookie: cookieEmma,
      'x-organization-id': orgAlpha.id,
    });
    assert(res.status === 403, 'Employee blocked from approving request without authorization (403)');

    // 3.4 Marcus (Manager) Approves Step 1 -> Advances to Step 2
    res = await request('POST', `/api/approvals/${step1Approval._id}/decide`, {
      decision: 'approved',
      comment: 'Approved from Engineering Q3 Capex',
    }, {
      Cookie: cookieMarcus,
      'x-organization-id': orgAlpha.id,
    });
    assert(res.status === 200 && res.data.success === true, 'Manager approved Step 1');
    assert(res.data.data.currentStepNumber === 2, 'Request automatically advanced to Step 2');
    assert(res.data.data.status === 'in_progress', 'Request status updated to in_progress');

    // 3.5 Verify Step 2 Approval exists in Arthur's (Approver) queue
    res = await request('GET', '/api/approvals?status=pending', null, {
      Cookie: cookieArthur,
      'x-organization-id': orgAlpha.id,
    });
    assert(res.status === 200 && res.data.data.length === 1, 'Finance Approver now has pending Step 2 task');
    const step2Approval = res.data.data[0];
    assert(step2Approval.stepNumber === 2, 'Approval task is for Step 2 (Finance Sign-Off)');

    // 3.6 Arthur (Finance Approver) Approves Step 2 -> Completes Workflow
    res = await request('POST', `/api/approvals/${step2Approval._id}/decide`, {
      decision: 'approved',
      comment: 'Purchase order #8841 generated',
    }, {
      Cookie: cookieArthur,
      'x-organization-id': orgAlpha.id,
    });
    assert(res.status === 200 && res.data.success === true, 'Finance Approver approved final Step 2');
    assert(res.data.data.status === 'approved', 'Request status transitioned to "approved"');
    assert(res.data.data.completedAt !== null, 'Request completedAt timestamp recorded');

    // 3.7 Emma checks request timeline
    res = await request('GET', `/api/requests/${request1._id}`, null, {
      Cookie: cookieEmma,
      'x-organization-id': orgAlpha.id,
    });
    assert(res.status === 200 && res.data.data.history.length === 3, 'Request audit trail contains all 3 events (submitted -> approved step 1 -> approved step 2)');

    // -------------------------------------------------------------
    // 4. REJECTION LIFECYCLE
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Rejection Lifecycle ---');

    // 4.1 Emma submits Request 2
    res = await request('POST', `/api/workflows/${customWorkflow._id}/submit`, {
      formData: {
        deviceModel: 'Gold Plated Gaming Rig',
        budgetEstimate: 15000,
      },
    }, {
      Cookie: cookieEmma,
      'x-organization-id': orgAlpha.id,
    });
    const request2 = res.data.data;

    // 4.2 Marcus (Manager) Rejects Request 2
    res = await request('GET', '/api/approvals?status=pending', null, {
      Cookie: cookieMarcus,
      'x-organization-id': orgAlpha.id,
    });
    const step1RejectTask = res.data.data.find((a) => a.requestId._id.toString() === request2._id.toString());
    assert(step1RejectTask !== undefined, 'Found pending approval task for Request 2');

    res = await request('POST', `/api/approvals/${step1RejectTask._id}/decide`, {
      decision: 'rejected',
      comment: 'Rejected: Non-standard hardware not permitted',
    }, {
      Cookie: cookieMarcus,
      'x-organization-id': orgAlpha.id,
    });
    assert(res.status === 200 && res.data.success === true, 'Manager rejected request');
    assert(res.data.data.status === 'rejected', 'Request status immediately marked "rejected"');

    // 4.3 Verify Arthur has 0 pending tasks (rejection terminated the workflow)
    res = await request('GET', '/api/approvals?status=pending', null, {
      Cookie: cookieArthur,
      'x-organization-id': orgAlpha.id,
    });
    assert(res.data.data.length === 0, 'No Step 2 task created following rejection');

    // -------------------------------------------------------------
    // 5. TENANT ISOLATION
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Multi-Tenant Isolation ---');

    // 5.1 Bob (Org Beta) cannot view Org Alpha requests
    res = await request('GET', `/api/requests/${request1._id}`, null, {
      Cookie: cookieBob,
      'x-organization-id': orgBeta.id,
    });
    assert(res.status === 404, 'Cross-tenant request query blocked (404)');

    // 5.2 Bob cannot submit against Org Alpha workflow
    res = await request('POST', `/api/workflows/${customWorkflow._id}/submit`, {
      formData: { deviceModel: 'Test' },
    }, {
      Cookie: cookieBob,
      'x-organization-id': orgBeta.id,
    });
    assert(res.status === 404, 'Cross-tenant workflow submission blocked (404)');

    console.log('\n===============================================================');
    console.log('🎉 ALL WORKFLOW ENGINE TESTS PASSED 100%!');
    console.log('===============================================================\n');

  } catch (err) {
    console.error('\n❌ Workflow Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    await User.deleteMany({ email: /@workflowtest\.com$/i });
    await Session.deleteMany({});
    await Organization.deleteMany({ name: /Workflow Org/i });
    await OrganizationMember.deleteMany({});
    await Role.deleteMany({});
    await Workflow.deleteMany({});
    await WorkflowRequest.deleteMany({});
    await WorkflowApproval.deleteMany({});
    if (server) server.close();
    await mongoose.connection.close();
  }
}

runTests();
