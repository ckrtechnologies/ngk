import { Router } from 'express';
import { getUserById, getUsers, updateUser, deleteUser, readNotifications } from './user.controller.js';
import { optionalAuth, verifyToken, requireRole } from '../../common/middleware/auth.middleware.js';

const userRouter = Router();

userRouter.get('/user/:id', optionalAuth, getUserById);
userRouter.get('/me', verifyToken, getUserById);
userRouter.get('/users', optionalAuth, getUsers);
userRouter.get('/users/:id', optionalAuth, getUserById);
userRouter.get('/:id', optionalAuth, getUserById);
userRouter.put('/updateUser/:id', optionalAuth, updateUser);
userRouter.put('/:id', optionalAuth, updateUser);
userRouter.delete('/deleteUser/:id', optionalAuth, deleteUser);
userRouter.delete('/:id', optionalAuth, deleteUser);
userRouter.put('/readNotifications/:id', optionalAuth, readNotifications);

export default userRouter;
