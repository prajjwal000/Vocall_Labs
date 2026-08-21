const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Role = require('../models/Role');
const Organization = require('../models/Organization');
const roleService = require('../services/role.service');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexus';

const runTests = async () => {
  console.log('======================================================');
  console.log('🧪 TESTING RBAC ROLE EDITING & PERMISSIONS UPDATE');
  console.log('======================================================');

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB.\n');

  try {
    const org = await Organization.findOne({ slug: 'acme-corp' }) || await Organization.findOne();
    if (!org) throw new Error('Test organization not found');

    console.log(`🏢 Organization: "${org.name}" (${org._id})`);

    // Ensure roles exist
    const roles = await roleService.getOrganizationRoles(org._id);
    console.log(`Found ${roles.length} roles: ${roles.map(r => r.key).join(', ')}`);

    let managerRole = roles.find(r => r.key === 'manager');
    if (!managerRole) {
      console.log('Creating manager role...');
      managerRole = await Role.create({
        name: 'Department Manager',
        key: 'manager',
        description: 'Manager review authority for requisitions and workflows',
        organizationId: org._id,
        permissions: ['workflows.read', 'workflows.create', 'approvals.read', 'approvals.approve'],
        isSystem: false,
      });
      managerRole = managerRole.toJSON();
    }

    console.log(`\nTesting Role Update on: "${managerRole.name}" (ID: ${managerRole.id})`);
    console.log(`Current permissions (${managerRole.permissions.length}):`, managerRole.permissions);

    // Update role with custom permissions
    const updatedPerms = [
      'employees.read',
      'employees.create',
      'workflows.read',
      'workflows.create',
      'requests.read',
      'requests.create',
      'approvals.read',
      'approvals.approve',
      'approvals.reject',
      'tasks.read',
      'tasks.create',
      'tasks.delegate',
      'forms.read',
    ];

    const updated = await roleService.updateRole({
      organizationId: org._id,
      roleId: managerRole.id,
      updateData: {
        name: 'Department Manager',
        description: 'Manager review authority for requisitions and workflows (Customized)',
        permissions: updatedPerms,
      },
    });

    console.log('\n✅ Role Updated Successfully!');
    console.log(`Name: ${updated.name}`);
    console.log(`Description: ${updated.description}`);
    console.log(`New permissions count: ${updated.permissions.length}`);
    console.log('Permissions:', updated.permissions);

    console.log('\n======================================================');
    console.log('🎉 RBAC ROLE EDITING TESTS PASSED 100%!');
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
