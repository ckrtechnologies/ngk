import { Router } from 'express';
import { register, login, sendOtp, verifyOtp, updatePassword } from './auth.controller.js';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/sendOtp', sendOtp);
authRouter.post('/send-otp', sendOtp);
authRouter.post('/verifyOtp', verifyOtp);
authRouter.post('/verify-otp', verifyOtp);
authRouter.put('/updatePassword', updatePassword);
authRouter.post('/reset-password', updatePassword);

export default authRouter;
