import { Request, Response, NextFunction } from 'express';
import User from '../model/UserModel';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role?: string;
  };
}

export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.user.userId).select('role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user.role = user.role;
    next();
  } catch (error) {
    console.error('Role verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const requireUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.user.userId).select('role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user.role = user.role;
    next();
  } catch (error) {
    console.error('Role verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 