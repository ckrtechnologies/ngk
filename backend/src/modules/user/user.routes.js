import { Router } from 'express';
import { getUserById, getUsers, updateUser, deleteUser, readNotifications } from './user.controller.js';
import { optionalAuth, verifyToken, requireRole } from '../../common/middleware/auth.middleware.js';

const userRouter = Router();

userRouter.get('/user/:id', optionalAuth, getUserById);
userRouter.get('/me', verifyToken, getUserById);
userRouter.get('/users', optionalAuth, getUsers);
userRouter.put('/updateUser/:id', optionalAuth, updateUser);
userRouter.delete('/deleteUser/:id', optionalAuth, deleteUser);
userRouter.put('/readNotifications/:id', optionalAuth, readNotifications);

export default userRouter;
