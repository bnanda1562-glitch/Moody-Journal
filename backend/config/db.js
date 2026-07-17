const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Set a very short connection timeout so that it falls back quickly if MongoDB is offline
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mood-journal-ai', {
      serverSelectionTimeoutMS: 2000, // 2 seconds timeout
      connectTimeoutMS: 2000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    process.env.USE_LOCAL_DB = 'false';
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn('⚠️ MongoDB is not active on localhost:27017.');
    console.warn('🔄 ACTIVATING LOCAL JSON FILE-BASED DATABASE FALLBACK ENGINE.');
    console.warn('All signup details and journal posts will be saved locally inside backend/config/local_db.json.');
    process.env.USE_LOCAL_DB = 'true';
    return false;
  }
};

module.exports = connectDB;
