const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const OrganizationMember = require('../models/OrganizationMember');
const OrganizationInvitation = require('../models/OrganizationInvitation');
const Role = require('../models/Role');
const PlatformRole = require('../models/PlatformRole');
const Workflow = require('../models/Workflow');
const WorkflowRequest = require('../models/WorkflowRequest');
const WorkflowApproval = require('../models/WorkflowApproval');
const { hashPassword } = require('../utils/passwordPolicy');
const { seedPlatformRBAC } = require('../services/platformRole.service');
const { initializeOrganizationRoles } = require('../services/role.service');
const { ensureDefaultWorkflows } = require('../services/workflow.service');

const DEMO_PASSWORD = 'Password123';

const seedRichDemoData = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  try {
    console.log('Connecting to online MongoDB Atlas...');
    await mongoose.connect(uri);

    console.log('🌱 1. Initializing Platform RBAC roles...');
    await seedPlatformRBAC();

    const platformAdminRole = await PlatformRole.findOne({ key: 'platform_admin' });
    const platformSupportRole = await PlatformRole.findOne({ key: 'platform_support' });
    const platformBillingRole = await PlatformRole.findOne({ key: 'platform_billing' });
    const platformOpsRole = await PlatformRole.findOne({ key: 'platform_operations' });

    const passwordHash = await hashPassword(DEMO_PASSWORD);

    // -------------------------------------------------------------
    // 1. CREATE CORE USERS & PLATFORM STAFF
    // -------------------------------------------------------------
    console.log('👤 2. Creating User Accounts...');

    const userSeedList = [
      {
        firstName: 'Alex',
        lastName: 'Vance',
        email: 'platform.admin@nexus.com',
        isPlatformUser: true,
        platformStatus: 'active',
        platformRoleId: platformAdminRole?._id,
        isBootstrapAdmin: true,
      },
      {
        firstName: 'Olivia',
        lastName: 'Owner',
        email: 'owner@acme.com',
        isPlatformUser: false,
        platformStatus: null,
        platformRoleId: null,
        isBootstrapAdmin: false,
      },
      {
        firstName: 'Marcus',
        lastName: 'Manager',
        email: 'manager@acme.com',
        isPlatformUser: false,
      },
      {
        firstName: 'Arthur',
        lastName: 'Approver',
        email: 'approver@acme.com',
        isPlatformUser: false,
      },
      {
        firstName: 'Emma',
        lastName: 'Employee',
        email: 'employee@acme.com',
        isPlatformUser: false,
      },
      {
        firstName: 'Sarah',
        lastName: 'Jenkins',
        email: 'sarah.jenkins@acme.com',
        isPlatformUser: false,
      },
      {
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@acme.com',
        isPlatformUser: false,
      },
      {
        firstName: 'Chloe',
        lastName: 'Support',
        email: 'support.lead@nexus.com',
        isPlatformUser: true,
        platformStatus: 'active',
        platformRoleId: platformSupportRole?._id,
      },
      {
        firstName: 'Bradley',
        lastName: 'Billing',
        email: 'billing.lead@nexus.com',
        isPlatformUser: true,
        platformStatus: 'active',
        platformRoleId: platformBillingRole?._id,
      },
      {
        firstName: 'Nathan',
        lastName: 'Operations',
        email: 'ops.lead@nexus.com',
        isPlatformUser: true,
        platformStatus: 'active',
        platformRoleId: platformOpsRole?._id,
      },
    ];

    const users = {};
    for (const u of userSeedList) {
      let user = await User.findOne({ email: u.email });
      if (user) {
        user.firstName = u.firstName;
        user.lastName = u.lastName;
        user.passwordHash = passwordHash;
        user.isPlatformUser = u.isPlatformUser || false;
        user.platformStatus = u.platformStatus || null;
        user.platformRoleId = u.platformRoleId || null;
        user.isBootstrapAdmin = u.isBootstrapAdmin || false;
        await user.save();
      } else {
        user = await User.create({
          ...u,
          passwordHash,
          status: 'active',
          emailVerified: true,
        });
      }
      users[u.email] = user;
    }

    // -------------------------------------------------------------
    // 2. CREATE WORKSPACES & ROLES
    // -------------------------------------------------------------
    console.log('🏢 3. Setting up Demo Organizations...');

    let acmeOrg = await Organization.findOne({ name: 'Acme Corporation' });
    if (!acmeOrg) {
      acmeOrg = await Organization.create({
        name: 'Acme Corporation',
        slug: 'acme-corp',
        ownerId: users['owner@acme.com']._id,
        plan: 'growth',
        status: 'active',
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          domainRestrictionEnabled: true,
          allowedEmailDomains: ['acme.com', 'acmecorp.io'],
        },
      });
      await initializeOrganizationRoles(acmeOrg._id);
    } else {
      acmeOrg.ownerId = users['owner@acme.com']._id;
      acmeOrg.status = 'active';
      await acmeOrg.save();
    }

    let starkOrg = await Organization.findOne({ name: 'Stark Industries' });
    if (!starkOrg) {
      starkOrg = await Organization.create({
        name: 'Stark Industries',
        slug: 'stark-industries',
        ownerId: users['sarah.jenkins@acme.com']._id,
        plan: 'enterprise',
        status: 'active',
      });
      await initializeOrganizationRoles(starkOrg._id);
    }

    // -------------------------------------------------------------
    // 3. CONFIGURE ACME ROLES & MEMBERSHIPS
    // -------------------------------------------------------------
    console.log('🛡️  4. Linking Acme Corp RBAC Roles...');

    const acmeOwnerRole = await Role.findOne({ organizationId: acmeOrg._id, key: 'owner' });
    const acmeAdminRole = await Role.findOne({ organizationId: acmeOrg._id, key: 'admin' });
    const acmeMemberRole = await Role.findOne({ organizationId: acmeOrg._id, key: 'member' });

    let acmeManagerRole = await Role.findOne({ organizationId: acmeOrg._id, key: 'manager' });
    const managerPermissions = [
      'employees.read', 'employees.update',
      'departments.read',
      'workflows.read', 'workflows.create', 'workflows.update',
      'requests.read', 'requests.create', 'requests.update', 'requests.cancel',
      'approvals.read', 'approvals.approve', 'approvals.reject',
      'forms.read', 'support.read',
    ];
    if (!acmeManagerRole) {
      acmeManagerRole = await Role.create({
        organizationId: acmeOrg._id,
        name: 'Department Manager',
        key: 'manager',
        description: 'Oversees departmental staff, approves requests, and manages team workflows',
        permissions: managerPermissions,
        isSystem: false,
        isDefault: false,
      });
    } else {
      acmeManagerRole.permissions = managerPermissions;
      await acmeManagerRole.save();
    }

    let acmeApproverRole = await Role.findOne({ organizationId: acmeOrg._id, key: 'approver' });
    const approverPermissions = [
      'workflows.read',
      'requests.read', 'requests.create',
      'approvals.read', 'approvals.approve', 'approvals.reject',
      'employees.read', 'departments.read', 'forms.read',
    ];
    if (!acmeApproverRole) {
      acmeApproverRole = await Role.create({
        organizationId: acmeOrg._id,
        name: 'Expense & Request Approver',
        key: 'approver',
        description: 'Authorized to review, approve, and reject operational team requests',
        permissions: approverPermissions,
        isSystem: false,
        isDefault: false,
      });
    } else {
      acmeApproverRole.permissions = approverPermissions;
      await acmeApproverRole.save();
    }

    const acmeMembers = [
      { user: users['owner@acme.com'], roleKey: 'owner', roleDoc: acmeOwnerRole },
      { user: users['manager@acme.com'], roleKey: 'manager', roleDoc: acmeManagerRole },
      { user: users['approver@acme.com'], roleKey: 'approver', roleDoc: acmeApproverRole },
      { user: users['employee@acme.com'], roleKey: 'member', roleDoc: acmeMemberRole },
      { user: users['sarah.jenkins@acme.com'], roleKey: 'admin', roleDoc: acmeAdminRole },
      { user: users['david.wilson@acme.com'], roleKey: 'member', roleDoc: acmeMemberRole },
    ];

    for (const m of acmeMembers) {
      await OrganizationMember.findOneAndUpdate(
        { organizationId: acmeOrg._id, userId: m.user._id },
        {
          organizationId: acmeOrg._id,
          userId: m.user._id,
          role: m.roleKey,
          roleId: m.roleDoc?._id,
          status: 'active',
          joinedAt: new Date(),
        },
        { upsert: true }
      );
    }

    // -------------------------------------------------------------
    // 4. SEED WORKFLOW DEFINITIONS & LIVE DEMO REQUESTS
    // -------------------------------------------------------------
    console.log('⚡ 5. Initializing Workflows & Live Requests...');

    await ensureDefaultWorkflows(acmeOrg._id, users['owner@acme.com']._id);

    const expenseWf = await Workflow.findOne({ organizationId: acmeOrg._id, category: 'expense' });
    const leaveWf = await Workflow.findOne({ organizationId: acmeOrg._id, category: 'leave' });
    const hardwareWf = await Workflow.findOne({ organizationId: acmeOrg._id, category: 'procurement' });

    // Request 1: Expense Request pending for Marcus Manager
    await WorkflowRequest.deleteMany({ organizationId: acmeOrg._id });
    await WorkflowApproval.deleteMany({ organizationId: acmeOrg._id });

    const req1 = await WorkflowRequest.create({
      organizationId: acmeOrg._id,
      workflowId: expenseWf._id,
      requesterId: users['employee@acme.com']._id,
      requestCode: 'REQ-0001',
      title: 'Client Dinner at Midtown Grill ($420.00)',
      formData: {
        expenseTitle: 'Client Dinner at Midtown Grill',
        amount: 420,
        currency: 'USD',
        category: 'meals',
        expenseDate: '2026-08-19',
        notes: 'Dinner with Acme Corp prospective Enterprise client team.',
      },
      status: 'pending',
      currentStepNumber: 1,
      totalSteps: 2,
      history: [
        {
          stepNumber: 1,
          stepName: 'Department Manager Review',
          action: 'submitted',
          actorId: users['employee@acme.com']._id,
          actorName: 'Emma Employee',
          actorEmail: 'employee@acme.com',
          comment: 'Submitted for managerial approval',
          timestamp: new Date(Date.now() - 3600000 * 4),
        },
      ],
    });

    await WorkflowApproval.create({
      organizationId: acmeOrg._id,
      requestId: req1._id,
      workflowId: expenseWf._id,
      stepNumber: 1,
      stepName: 'Department Manager Review',
      assignedRoleKey: 'manager',
      assignedRoleId: acmeManagerRole._id,
      status: 'pending',
    });

    // Request 2: Hardware request advanced to Stage 2 (pending for Arthur Approver)
    const req2 = await WorkflowRequest.create({
      organizationId: acmeOrg._id,
      workflowId: hardwareWf._id,
      requesterId: users['employee@acme.com']._id,
      requestCode: 'REQ-0002',
      title: 'MacBook Pro 16" M3 Max ($3,499.00)',
      formData: {
        itemType: 'laptop',
        specs: 'MacBook Pro 16" M3 Max 64GB 1TB',
        urgency: 'high',
        justification: 'Required for running local AI model evaluation workloads.',
      },
      status: 'in_progress',
      currentStepNumber: 2,
      totalSteps: 2,
      history: [
        {
          stepNumber: 1,
          stepName: 'Manager Approval',
          action: 'submitted',
          actorId: users['employee@acme.com']._id,
          actorName: 'Emma Employee',
          actorEmail: 'employee@acme.com',
          comment: 'Submitted hardware requisition',
          timestamp: new Date(Date.now() - 3600000 * 8),
        },
        {
          stepNumber: 1,
          stepName: 'Manager Approval',
          action: 'approved',
          actorId: users['manager@acme.com']._id,
          actorName: 'Marcus Manager',
          actorEmail: 'manager@acme.com',
          comment: 'Engineering head approved: verified business need.',
          timestamp: new Date(Date.now() - 3600000 * 2),
        },
      ],
    });

    await WorkflowApproval.create({
      organizationId: acmeOrg._id,
      requestId: req2._id,
      workflowId: hardwareWf._id,
      stepNumber: 2,
      stepName: 'IT Operations Procurement',
      assignedRoleKey: 'approver',
      assignedRoleId: acmeApproverRole._id,
      status: 'pending',
    });

    // Request 3: Approved Leave Request for Sarah Jenkins
    await WorkflowRequest.create({
      organizationId: acmeOrg._id,
      workflowId: leaveWf._id,
      requesterId: users['sarah.jenkins@acme.com']._id,
      requestCode: 'REQ-0003',
      title: 'Paid Time Off (PTO) - 4 Days',
      formData: {
        leaveType: 'pto',
        startDate: '2026-09-01',
        endDate: '2026-09-05',
        reason: 'Annual family vacation; Marcus will cover urgent triage.',
      },
      status: 'approved',
      currentStepNumber: 2,
      totalSteps: 2,
      completedAt: new Date(Date.now() - 3600000 * 24),
      history: [
        {
          stepNumber: 1,
          stepName: 'Team Manager Approval',
          action: 'submitted',
          actorId: users['sarah.jenkins@acme.com']._id,
          actorName: 'Sarah Jenkins',
          actorEmail: 'sarah.jenkins@acme.com',
          comment: 'Annual leave request',
          timestamp: new Date(Date.now() - 3600000 * 30),
        },
        {
          stepNumber: 1,
          stepName: 'Team Manager Approval',
          action: 'approved',
          actorId: users['manager@acme.com']._id,
          actorName: 'Marcus Manager',
          actorEmail: 'manager@acme.com',
          comment: 'Approved. Coverage plan confirmed.',
          timestamp: new Date(Date.now() - 3600000 * 26),
        },
        {
          stepNumber: 2,
          stepName: 'HR Operations Confirmation',
          action: 'approved',
          actorId: users['owner@acme.com']._id,
          actorName: 'Olivia Owner',
          actorEmail: 'owner@acme.com',
          comment: 'Recorded in HR system.',
          timestamp: new Date(Date.now() - 3600000 * 24),
        },
      ],
    });

    console.log('\n===============================================================');
    console.log('🎉 WORKFLOW ENGINE & RICH DEMO DATA SUCCESSFULLY SEEDED!');
    console.log('===============================================================');
    console.log('\n⚡ WORKFLOW PROCESSES:');
    console.log('   1. 💰 Expense Reimbursement (2 Stages: Manager -> Finance Approver)');
    console.log('   2. 💻 Hardware & Equipment Procurement (2 Stages: Manager -> Approver)');
    console.log('   3. 🌴 Leave & Time-Off Request (2 Stages: Manager -> HR Admin)\n');
    console.log('📋 LIVE WORKFLOW REQUESTS:');
    console.log('   • REQ-0001: Expense Dinner ($420) -> ⏳ Pending in Marcus Manager\'s queue');
    console.log('   • REQ-0002: MacBook Pro ($3,499)  -> ⏳ Pending in Arthur Approver\'s queue');
    console.log('   • REQ-0003: Paid Time Off (4 Days) -> ✅ Fully Approved');
    console.log('===============================================================\n');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedRichDemoData();
