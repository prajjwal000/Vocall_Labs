const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ Fatal: MONGO_URI is not defined in .env');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`🌐 Online MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n❌ Failed to connect to online MongoDB Atlas:`);
    console.error(`   ${error.message}`);
    console.error(`\n💡 If this is an IP Whitelist error, please ensure your IP or 0.0.0.0/0 is added in:`);
    console.error(`   MongoDB Atlas Console -> Network Access -> IP Access List\n`);

    // Fallback to local MongoDB if offline
    try {
      console.log('🔄 Attempting local MongoDB connection...');
      const fallbackConn = await mongoose.connect('mongodb://127.0.0.1:27017/nexus', {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`✅ MongoDB Connected (Local Fallback): ${fallbackConn.connection.host}`);
    } catch (localErr) {
      console.error(`❌ Local MongoDB also unavailable: ${localErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
