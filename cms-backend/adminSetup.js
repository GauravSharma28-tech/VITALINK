const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Define the User schema (same as in UserModel.ts)
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please enter your first name'],
  },
  lastName: {
    type: String,
    required: [true, 'Please enter your last name'],
  },
  email: {
    type: String,
    required: [true, 'Please enter your email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please enter your password'],
    minlength: [8, 'Minimum password length is 8 characters'],
  },
  refreshToken: {
    type: String,
  },
  address: {
    type: String,
    required: [true, 'Please enter your address'],
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
    required: true,
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function setupAdmin() {
  try {
    // Connect to MongoDB using environment variable
    const dbConnection = process.env.DB_CONNECTION || 'mongodb://localhost:27017/cms';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbConnection);
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@gmail.com';

    // Check if admin already exists
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      console.log('Admin user found:', adminEmail);
      console.log('Current role:', adminUser.role || 'no role assigned');
      
      // If admin exists but doesn't have admin role, update it
      if (adminUser.role !== 'admin') {
        console.log('Updating role to admin...');
        adminUser.role = 'admin';
        await adminUser.save();
        console.log('Admin role updated successfully!');
      } else {
        console.log('Admin user already has admin role');
      }
      
      console.log('Admin credentials:');
      console.log('Email: admin@gmail.com');
      console.log('Password: admin123');
      console.log('Role: admin');
      
    } else {
      // Create new admin user
      console.log('Creating new admin user...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      adminUser = new User({
        firstName: 'System',
        lastName: 'Administrator',
        email: adminEmail,
        password: hashedPassword,
        address: 'System Address',
        role: 'admin',
      });

      await adminUser.save();
      console.log('New admin user created successfully!');
      console.log('Admin credentials:');
      console.log('Email: admin@gmail.com');
      console.log('Password: admin123');
      console.log('Role: admin');
      console.log('Please change the password after first login.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error setting up admin:', error);
    process.exit(1);
  }
}

setupAdmin(); 