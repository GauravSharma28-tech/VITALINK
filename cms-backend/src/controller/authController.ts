import { Request, Response } from 'express';
import User from '../model/UserModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface UserInterface {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  address: string;
  role: 'admin' | 'user';
}

// Error handling utility
const handleErrors = (err: any): Partial<UserInterface> => {
  console.log(err.message, err.code);
  const errors: Partial<UserInterface> = {};

  // Duplicate email error
  if (err.code === 11000) {
    errors.email = 'Email already registered';
    return errors;
  }

  // Validation errors 
  if (err.message.includes('User validation failed')) {
    Object.values(err.errors).forEach(({ properties }: any) => {
      errors[properties.path as keyof UserInterface] = properties.message;
    });
  }

  return errors;
};

// Login user
export const login = async (req: Request, res: Response, next: unknown) => {
  console.log('Login attempt:', req.body);
  console.log('Environment variables:', {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET ? 'Set' : 'Not Set',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET ? 'Set' : 'Not Set'
  });

  const { email, password } = req.body;

  try {
    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      throw new Error('JWT secrets are not configured');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '30m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Save refreshToken in DB
    user.refreshToken = refreshToken;
    await user.save();
    console.log('Tokens generated and saved');

    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ 
      accessToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    const errors = handleErrors(error);
    res.status(500).json({ errors });
  }
};

// Register new user (admin only)
export const createUser = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, address, role = 'user' } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      address,
      role,
    });

    await newUser.save();
    res.status(201).json({ 
      message: 'User created successfully', 
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        address: newUser.address
      }
    });
  } catch (error) {
    const errors = handleErrors(error);
    res.status(400).json({ errors });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).select('-password -refreshToken');
    res.status(200).json(users);
  } catch (error) {
    const errors = handleErrors(error);
    res.status(500).json({ errors });
  }
};

// Update user role (admin only)
export const updateUserRole = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;

  try {
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ 
      message: 'User role updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        address: user.address
      }
    });
  } catch (error) {
    const errors = handleErrors(error);
    res.status(500).json({ errors });
  }
};

// Delete user (admin only)
export const deleteUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user.role === 'admin' && user._id.toString() === req.user?.userId) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }

    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    const errors = handleErrors(error);
    res.status(500).json({ errors });
  }
};

// Logout user
export const logout = async (req: Request, res: Response) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); 

  const refreshToken = cookies.jwt;

  // Clear token from DB
  const user = await User.findOne({ refreshToken }).exec();
  if (user) {
  user.refreshToken = '';
  await user.save();
  }

  // Clear HTTP-only cookie
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.sendStatus(204);
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.userId; // From JWT middleware

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    const errors = handleErrors(error);
    res.status(500).json({ errors });
  }
};

// Get user details
export const getUserDetails = async (req: Request, res: Response) => {
  const userId = req.user?.userId; // From JWT middleware

  try {
    const user = await User.findById(userId).select('-password -refreshToken');
    //console.log(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    const errors = handleErrors(error);
    res.status(500).json({ errors });
  }
};

// Update user details
export const updateUserDetails = async (req: Request, res: Response) => {
  const userId = req.user?.userId; // From JWT middleware
  const { firstName, lastName, email, address } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already in use
    if (email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update user details
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email.toLowerCase();
    user.address = address;

    await user.save();
    res.status(200).json({ message: 'User details updated successfully', user });
  } catch (error) {
    const errors = handleErrors(error);
    res.status(500).json({ errors });
  }
};

// Update user details (admin only)
export const updateUserByAdmin = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { firstName, lastName, email, address, role } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already in use by another user
    if (email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update user details
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email.toLowerCase();
    user.address = address;
    user.role = role;

    await user.save();
    res.status(200).json({ 
      message: 'User details updated successfully', 
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        address: user.address
      }
    });
  } catch (error) {
    const errors = handleErrors(error);
    res.status(500).json({ errors });
  }
};