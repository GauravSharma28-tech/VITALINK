import { Router, RequestHandler } from 'express';
import {
  login,
  createUser,
  getAllUsers,
  updateUserRole,
  deleteUser,
  updateUserByAdmin,
  logout,
  changePassword,
  getUserDetails,
  updateUserDetails
} from '../../controller/authController';
import { handleRefreshToken } from '../../controller/refreshTokenController';
import verifyJWT from '../../middlewear/verifyJWT';
import { requireAdmin } from '../../middlewear/verifyRole';

const router = Router();

// Public auth routes
router.post('/login', login as RequestHandler);

// Protected routes (require authentication)
router.post('/change-password', verifyJWT as RequestHandler, changePassword as RequestHandler);
router.get('/refresh', handleRefreshToken as RequestHandler);
router.get('/logout', logout as RequestHandler);
router.get('/user-details', verifyJWT as RequestHandler, getUserDetails as RequestHandler);
router.put('/update-details', verifyJWT as RequestHandler, updateUserDetails as RequestHandler);

// Admin-only routes
router.post('/create-user', verifyJWT as RequestHandler, requireAdmin as RequestHandler, createUser as RequestHandler);
router.get('/users', verifyJWT as RequestHandler, requireAdmin as RequestHandler, getAllUsers as RequestHandler);
router.put('/users/:userId', verifyJWT as RequestHandler, requireAdmin as RequestHandler, updateUserByAdmin as RequestHandler);
router.put('/users/:userId/role', verifyJWT as RequestHandler, requireAdmin as RequestHandler, updateUserRole as RequestHandler);
router.delete('/users/:userId', verifyJWT as RequestHandler, requireAdmin as RequestHandler, deleteUser as RequestHandler);

export default router;