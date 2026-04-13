// config/db.js - MongoDB connection using Mongoose
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Primary MongoDB Connection Error: ${error.message}`);
    console.log('🔄 Falling back to In-Memory MongoDB for local development...');
    
    try {
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log('✅ In-Memory MongoDB Started and Connected!');

      // Seed a demo user for immediate testing
      const demoUser = await User.findOne({ email: 'admin@cloudnest.com' });
      if (!demoUser) {
        // Hash the default PIN: 123456
        const pinSalt = await bcrypt.genSalt(12);
        const hashedPin = await bcrypt.hash('123456', pinSalt);

        await User.create({
          name: 'CloudNest Admin',
          email: 'admin@cloudnest.com',
          password: 'admin@123',
          role: 'admin',
          tier: 'pro',
          securityPin: hashedPin,   // default PIN: 123456
        });
        
        // Seed extra test users
        await User.create([
          { name: 'vasu', email: 'user1@cloudnest.com', password: 'password123', role: 'viewer' },
          { name: 'user2', email: 'user2@cloudnest.com', password: 'password123', role: 'uploader' },
          { name: 'user3', email: 'user3@cloudnest.com', password: 'password123', role: 'downloader' },
        ]);
        
        console.log('✨ Admin and mock users created! Default Admin PIN: 123456');

      }
    } catch (memError) {
      console.error(`❌ Failed to start In-Memory MongoDB: ${memError.message}`);
    }
  }
};

module.exports = connectDB;
