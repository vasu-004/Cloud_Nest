const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:51151/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongod')
  .then(async () => {
    const users = await User.find({});
    console.log(users.map(u => ({ email: u.email, role: u.role, _id: u._id })));
    process.exit(0);
  });
