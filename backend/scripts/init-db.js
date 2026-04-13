// scripts/init-db.js - Database initialization script
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const initDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/clouduploader';
    console.log(`📡 Connecting to MongoDB: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 1. Ensure Admin User Exists
    const adminEmail = 'admin@cloudnest.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      console.log('👤 Admin user not found. Creating default admin...');
      
      // Hash default PIN: 123456
      const pinSalt = await bcrypt.genSalt(12);
      const hashedPin = await bcrypt.hash('123456', pinSalt);

      await User.create({
        name: 'CloudNest Admin',
        email: adminEmail,
        password: 'admin@123',
        role: 'admin',
        tier: 'pro',
        securityPin: hashedPin,
      });

      console.log('✨ Default admin created successfully!');
      console.log(`   Email: ${adminEmail}`);
      console.log('   Password: admin@123');
      console.log('   Security PIN: 123456');
    } else {
      console.log('✅ Admin user already exists. Skipping user creation.');
    }

    // 2. Initializing Collections (Mongoose handles this on first model usage)
    console.log('📑 Database collections initialized.');

    await mongoose.connection.close();
    console.log('🏁 Initialization complete. Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Initialization Error: ${error.message}`);
    process.exit(1);
  }
};

initDB();
