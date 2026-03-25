import mongoose from 'mongoose';
const bcrypt = require('bcrypt');
const { isEmail } = require('validator');

interface UserInterface {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  refreshToken: string;
  address: string;
  role: 'admin' | 'user';
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserModelInterface extends mongoose.Model<UserInterface> {
  login(email: string, password: string): Promise<UserInterface & Document>;
}

const userSchema = new mongoose.Schema<UserInterface, UserModelInterface>({
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
    validate: [isEmail, 'Please enter a valid email address'],
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

const User = mongoose.model<UserInterface, UserModelInterface>(
  'User',
  userSchema
);
export default User;
