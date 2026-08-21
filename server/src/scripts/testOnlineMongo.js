const mongoose = require('mongoose');

const uri = 'mongodb+srv://jaiswalsrijan91_db_user:iweTNepDZqU0kYXT@cluster0.jfk2hw5.mongodb.net/nexus?retryWrites=true&w=majority';

const testOnlineMongo = async () => {
  console.log('Testing connection to online MongoDB Atlas...');
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ Online MongoDB Atlas Connected successfully: ${conn.connection.host}`);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in online DB:', collections.map(c => c.name));
  } catch (error) {
    console.error('❌ Failed to connect to online MongoDB Atlas:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Done.');
  }
};

testOnlineMongo();
