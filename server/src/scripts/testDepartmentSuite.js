const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Organization = require('../models/Organization');
const Department = require('../models/Department');
const OrganizationMember = require('../models/OrganizationMember');
const User = require('../models/User');
const departmentService = require('../services/department.service');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexus';

const runTests = async () => {
  console.log('======================================================');
  console.log('🧪 TESTING NEXUS DEPARTMENTS & EMPLOYEES SUITE');
  console.log('======================================================');

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB.\n');

  try {
    const org = await Organization.findOne({ slug: 'acme-corp' }) || await Organization.findOne();
    if (!org) throw new Error('Test organization not found');

    console.log(`🏢 Organization: "${org.name}" (${org._id})`);

    // 1. Test getDepartments (and auto initialization)
    console.log('\n--- [TEST 1] Department Initialization & Listing ---');
    const departments = await departmentService.getDepartments(org._id);
    console.log(`✅ Retrieved ${departments.length} departments:`);
    departments.forEach(d => console.log(`   • [${d.code}] ${d.name} (Members: ${d.memberCount}, Budget: $${d.budget.toLocaleString()})`));

    // 2. Test createDepartment
    console.log('\n--- [TEST 2] Department Creation ---');
    const newDeptCode = 'SEC';
    await Department.deleteOne({ organizationId: org._id, code: newDeptCode });
    const createdDept = await departmentService.createDepartment(org._id, {
      name: 'Information Security & Compliance',
      code: newDeptCode,
      description: 'Zero-trust architecture, SOC2 compliance, and vulnerability assessments',
      color: '#ef4444',
      budget: 180000,
    });
    console.log(`✅ Created Department: [${createdDept.code}] "${createdDept.name}" (ID: ${createdDept.id})`);

    // 3. Test assignMembersToDepartment
    console.log('\n--- [TEST 3] Member Assignment & Job Titles ---');
    const members = await OrganizationMember.find({ organizationId: org._id, status: 'active' });
    if (members.length > 0) {
      const targetMember = members[0];
      await departmentService.assignMembersToDepartment(
        org._id,
        createdDept.id,
        [targetMember._id.toString()],
        'Lead Security Architect'
      );
      console.log(`✅ Assigned member to ${createdDept.name}`);
    }

    // 4. Test getDepartmentById
    console.log('\n--- [TEST 4] Department Detail & Roster ---');
    const deptDetail = await departmentService.getDepartmentById(org._id, createdDept.id);
    console.log(`✅ Department Detail: "${deptDetail.name}" has ${deptDetail.members.length} members:`);
    deptDetail.members.forEach(m => console.log(`   • ${m.name} (${m.email}) - Title: ${m.jobTitle}`));

    // 5. Test updateDepartment
    console.log('\n--- [TEST 5] Department Update ---');
    const updatedDept = await departmentService.updateDepartment(org._id, createdDept.id, {
      budget: 200000,
      description: 'Enterprise zero-trust architecture, SOC2/ISO compliance, and automated pen-testing',
    });
    console.log(`✅ Updated Department Budget: $${updatedDept.budget.toLocaleString()}`);

    // 6. Test Org Hierarchy Tree
    console.log('\n--- [TEST 6] Department Tree Hierarchy ---');
    const tree = await departmentService.getDepartmentOrgTree(org._id);
    console.log(`✅ Department Tree Root Nodes Count: ${tree.length}`);

    // 7. Cleanup created test department
    console.log('\n--- [TEST 7] Department Deletion & Member Unassignment ---');
    const delResult = await departmentService.deleteDepartment(org._id, createdDept.id);
    console.log(`✅ ${delResult.message}`);

    console.log('\n======================================================');
    console.log('🎉 ALL DEPARTMENT SUITE TESTS PASSED 100%!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

runTests();
