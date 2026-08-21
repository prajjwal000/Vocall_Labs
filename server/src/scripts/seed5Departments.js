const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const OrganizationMember = require('../models/OrganizationMember');
const User = require('../models/User');
const Department = require('../models/Department');

const seedDepartments = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  console.log('Connecting to online MongoDB Atlas...');
  await mongoose.connect(uri);

  const org = await Organization.findOne({ slug: 'acme-corp' }) || await Organization.findOne();
  if (!org) {
    console.error('❌ Acme Corporation organization not found!');
    process.exit(1);
  }

  console.log(`🏢 Seeding 5 Departments for: "${org.name}" (${org._id})`);

  // Find users to assign as heads / members
  const users = await User.find({ email: { $in: [
    'owner@acme.com',
    'manager@acme.com',
    'approver@acme.com',
    'employee@acme.com',
    'sarah.jenkins@acme.com',
    'david.wilson@acme.com',
    'support.lead@nexus.com'
  ] } });

  const userMap = {};
  users.forEach((u) => {
    userMap[u.email] = u;
  });

  const departmentData = [
    {
      name: 'Engineering & Technology',
      code: 'ENG',
      description: 'Core platform architecture, software development, infrastructure, and cloud security.',
      color: '#4f46e5', // Indigo
      budget: 250000,
      headUserId: userMap['david.wilson@acme.com']?._id || userMap['manager@acme.com']?._id,
      status: 'active',
    },
    {
      name: 'Product & Design',
      code: 'PRD',
      description: 'UI/UX design systems, user experience research, feature specifications, and product roadmaps.',
      color: '#ec4899', // Pink
      budget: 120000,
      headUserId: userMap['sarah.jenkins@acme.com']?._id || userMap['owner@acme.com']?._id,
      status: 'active',
    },
    {
      name: 'Finance & Accounting',
      code: 'FIN',
      description: 'Corporate budget planning, payroll processing, tax compliance, and revenue auditing.',
      color: '#10b981', // Emerald
      budget: 150000,
      headUserId: userMap['owner@acme.com']?._id,
      status: 'active',
    },
    {
      name: 'Human Resources & People',
      code: 'HR',
      description: 'Talent recruitment, employee onboarding, benefits administration, and team culture.',
      color: '#8b5cf6', // Purple
      budget: 80000,
      headUserId: userMap['employee@acme.com']?._id,
      status: 'active',
    },
    {
      name: 'Operations & Customer Success',
      code: 'OPS',
      description: 'Cross-functional workflow management, client onboarding, customer operations, and SLA tracking.',
      color: '#f59e0b', // Amber
      budget: 95000,
      headUserId: userMap['approver@acme.com']?._id,
      status: 'active',
    },
  ];

  const createdDepartments = [];

  for (const item of departmentData) {
    const dept = await Department.findOneAndUpdate(
      { organizationId: org._id, code: item.code },
      { ...item, organizationId: org._id },
      { upsert: true, new: true }
    );
    createdDepartments.push(dept);
    console.log(`✅ Department seeded: [${dept.code}] ${dept.name} ($${dept.budget.toLocaleString()})`);
  }

  // Assign members with job titles to departments
  const memberAssignments = [
    { email: 'owner@acme.com', deptCode: 'FIN', jobTitle: 'Chief Executive & Finance Lead' },
    { email: 'manager@acme.com', deptCode: 'ENG', jobTitle: 'Engineering Manager' },
    { email: 'david.wilson@acme.com', deptCode: 'ENG', jobTitle: 'Principal Cloud Architect' },
    { email: 'sarah.jenkins@acme.com', deptCode: 'PRD', jobTitle: 'Lead Product Designer' },
    { email: 'employee@acme.com', deptCode: 'HR', jobTitle: 'People Operations Specialist' },
    { email: 'approver@acme.com', deptCode: 'OPS', jobTitle: 'Head of Customer Operations' },
  ];

  console.log('\n👥 Assigning organization members to departments...');
  for (const assignment of memberAssignments) {
    const user = userMap[assignment.email];
    const dept = createdDepartments.find((d) => d.code === assignment.deptCode);

    if (user && dept) {
      await OrganizationMember.findOneAndUpdate(
        { organizationId: org._id, userId: user._id },
        { departmentId: dept._id, jobTitle: assignment.jobTitle }
      );
      console.log(`   • ${user.firstName} ${user.lastName} (${assignment.email}) -> [${dept.code}] ${assignment.jobTitle}`);
    }
  }

  console.log('\n======================================================');
  console.log('🎉 5 DEPARTMENTS SUCCESSFULLY SEEDED INTO MONGODB ATLAS!');
  console.log('======================================================\n');

  await mongoose.disconnect();
};

seedDepartments().catch((err) => {
  console.error('Error seeding departments:', err);
  process.exit(1);
});
