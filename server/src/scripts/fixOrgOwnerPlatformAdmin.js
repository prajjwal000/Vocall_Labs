const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const run = async () => {
  try {
    await connectDB();
    console.log('Connected to Atlas MongoDB');

    const result = await User.updateOne(
      { email: 'owner@acme.com' },
      {
        $set: {
          isPlatformUser: false,
          platformStatus: null,
          platformRoleId: null,
          isBootstrapAdmin: false,
        },
      }
    );

    console.log('Updated owner@acme.com in DB:', result);

    const updatedUser = await User.findOne({ email: 'owner@acme.com' });
    console.log('Verified user state:', {
      email: updatedUser.email,
      isPlatformUser: updatedUser.isPlatformUser,
      platformRoleId: updatedUser.platformRoleId,
      isBootstrapAdmin: updatedUser.isBootstrapAdmin,
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error fixing user:', err);
    process.exit(1);
  }
};

run();
