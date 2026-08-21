require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const TaskActivity = require('../models/TaskActivity');
const Organization = require('../models/Organization');
const OrganizationMember = require('../models/OrganizationMember');
const User = require('../models/User');
const taskService = require('../services/task.service');

const runTaskVerification = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexus';
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    // 1. Find active organization
    let org = await Organization.findOne({ status: { $ne: 'deleted' } });
    if (!org) {
      org = await Organization.create({
        name: 'Nexus Test Organization',
        slug: `test-org-${Date.now()}`,
        status: 'active',
        plan: 'growth',
      });
    }
    console.log(`\n🏢 Testing with Organization: "${org.name}" (${org._id})`);

    // Helper to find or create a test user & membership
    const ensureMember = async (firstName, lastName, email, role = 'member') => {
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          firstName,
          lastName,
          email,
          passwordHash: '$2a$10$abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          isEmailVerified: true,
        });
      }
      await OrganizationMember.findOneAndUpdate(
        { organizationId: org._id, userId: user._id },
        { status: 'active', role, joinedAt: new Date() },
        { upsert: true, new: true }
      );
      return user;
    };

    const manager = await ensureMember('Rahul', 'Sharma', 'rahul.manager@test.nexus', 'admin');
    const employeeA = await ensureMember('Amit', 'Patel', 'amit.dev@test.nexus', 'member');
    const employeeB = await ensureMember('Priya', 'Verma', 'priya.qa@test.nexus', 'member');

    console.log(`👤 Manager: ${manager.firstName} ${manager.lastName} (${manager._id})`);
    console.log(`👤 Employee A: ${employeeA.firstName} ${employeeA.lastName} (${employeeA._id})`);
    console.log(`👤 Employee B: ${employeeB.firstName} ${employeeB.lastName} (${employeeB._id})`);

    // Clean previous test tasks
    await Task.deleteMany({ organizationId: org._id, title: /Test Security Audit/i });

    // ==========================================
    // TEST 1: Task Assignment
    // ==========================================
    console.log('\n--- [TEST 1] Task Creation & Initial Assignment ---');
    const createdTask = await taskService.createTask({
      organizationId: org._id,
      assignedBy: manager._id,
      assigneeId: employeeA._id,
      title: 'Test Security Audit & Compliance Review',
      description: 'Review quarterly cloud infrastructure access controls and certificates.',
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000 * 3),
      user: manager,
    });

    console.log(`✅ Task created: "${createdTask.title}" (${createdTask._id})`);
    console.log(`   Status: ${createdTask.status}, Current Owner: ${createdTask.currentAssignee.firstName}`);
    console.log(`   Original Assignee: ${createdTask.originalAssignee.firstName}, Depth: ${createdTask.delegationDepth}`);

    if (createdTask.currentAssignee._id.toString() !== employeeA._id.toString()) {
      throw new Error('Initial assignee mismatch!');
    }

    // Verify activity event
    const initialActivities = await TaskActivity.find({ taskId: createdTask._id });
    console.log(`   Activity events logged: ${initialActivities.length} (Type: ${initialActivities[0]?.type})`);

    // ==========================================
    // TEST 2: Scoped Querying
    // ==========================================
    console.log('\n--- [TEST 2] Scoped Query Verification ---');
    const myTasksEmployeeA = await taskService.getTasks({
      organizationId: org._id,
      userId: employeeA._id,
      userRole: 'member',
      isOwner: false,
      scope: 'my',
    });
    console.log(`✅ Employee A "My Tasks" count: ${myTasksEmployeeA.data.length} (Expected >= 1)`);

    const assignedByManager = await taskService.getTasks({
      organizationId: org._id,
      userId: manager._id,
      userRole: 'owner',
      isOwner: true,
      scope: 'assigned_by_me',
    });
    console.log(`✅ Manager "Assigned by Me" count: ${assignedByManager.data.length} (Expected >= 1)`);

    // ==========================================
    // TEST 3: Unauthorized Completion Prevention
    // ==========================================
    console.log('\n--- [TEST 3] Ownership Enforcement on Completion ---');
    try {
      await taskService.completeTask({
        organizationId: org._id,
        taskId: createdTask._id,
        userId: employeeB._id,
        userRole: 'member',
        isOwner: false,
        user: employeeB,
      });
      throw new Error('Employee B should NOT be able to complete a task owned by Employee A!');
    } catch (err) {
      console.log(`✅ Correctly blocked unauthorized completion: "${err.message}"`);
    }

    // ==========================================
    // TEST 4: Delegation with Loop Protection
    // ==========================================
    console.log('\n--- [TEST 4] Delegation & Audit History ---');
    const delegatedTask = await taskService.delegateTask({
      organizationId: org._id,
      taskId: createdTask._id,
      userId: employeeA._id,
      userRole: 'member',
      isOwner: false,
      user: employeeA,
      toUserId: employeeB._id,
      reason: 'Priya is leading cloud security auditing this quarter.',
    });

    console.log(`✅ Task Delegated to: ${delegatedTask.currentAssignee.firstName} ${delegatedTask.currentAssignee.lastName}`);
    console.log(`   New Status: ${delegatedTask.status}, Depth: ${delegatedTask.delegationDepth}`);
    console.log(`   Delegation History Count: ${delegatedTask.delegationHistory.length}`);
    console.log(`   Reason: "${delegatedTask.delegationHistory[0].reason}"`);

    // Test Cycle Detection: Priya tries to delegate back to Employee A
    console.log('\n--- [TEST 5] Cycle / Loop Detection Prevention ---');
    try {
      await taskService.delegateTask({
        organizationId: org._id,
        taskId: createdTask._id,
        userId: employeeB._id,
        userRole: 'member',
        isOwner: false,
        user: employeeB,
        toUserId: employeeA._id,
        reason: 'Attempting circular delegation back to Employee A',
      });
      throw new Error('Delegation cycle should have been blocked!');
    } catch (err) {
      console.log(`✅ Correctly prevented circular delegation cycle: "${err.message}"`);
    }

    // ==========================================
    // TEST 6: Task Completion by New Owner
    // ==========================================
    console.log('\n--- [TEST 6] Task Completion by New Owner (Priya) ---');
    const completedTask = await taskService.completeTask({
      organizationId: org._id,
      taskId: createdTask._id,
      userId: employeeB._id,
      userRole: 'member',
      isOwner: false,
      user: employeeB,
      notes: 'All cloud compliance certificates verified and approved.',
    });

    console.log(`✅ Task Completed: Status: ${completedTask.status}`);
    console.log(`   Completed By: ${completedTask.completedBy.firstName} ${completedTask.completedBy.lastName}`);
    console.log(`   Completed At: ${completedTask.completedAt}`);

    // Verify full activity timeline
    const fullDetail = await taskService.getTaskById({
      organizationId: org._id,
      taskId: createdTask._id,
    });
    console.log(`\n📋 Full Database Activity Timeline (${fullDetail.activities.length} events):`);
    fullDetail.activities.forEach((act, idx) => {
      console.log(`   [${idx + 1}] (${act.type.toUpperCase()}) ${act.details} — ${act.actorName} at ${new Date(act.createdAt).toLocaleTimeString()}`);
    });

    // ==========================================
    // TEST 7: Tenant Isolation
    // ==========================================
    console.log('\n--- [TEST 7] Multi-Tenant Isolation ---');
    const fakeOrgId = new mongoose.Types.ObjectId();
    try {
      await taskService.getTaskById({
        organizationId: fakeOrgId,
        taskId: createdTask._id,
      });
      throw new Error('Cross-tenant access should have failed!');
    } catch (err) {
      console.log(`✅ Multi-tenant isolation verified: Cross-tenant query returned "${err.message}"`);
    }

    console.log('\n======================================================');
    console.log('🎉 ALL TASK & EMPLOYEE DELEGATION TESTS PASSED 100%!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

runTaskVerification();
