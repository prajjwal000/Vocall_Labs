require('dotenv').config();
const mongoose = require('mongoose');
const { seedPlatformRBAC } = require('../services/platformRole.service');

const run = async () => {
  try {
    console.log('Connecting to MongoDB for Platform RBAC Seeding...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus');

    console.log('🌱 Seeding Platform Roles and Permissions...');
    await seedPlatformRBAC();

    console.log('✅ Platform RBAC Seeded Successfully!');
  } catch (err) {
    console.error('❌ Failed to seed Platform RBAC:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
