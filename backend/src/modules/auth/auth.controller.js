import authService from './auth.service.js';
import { sendSuccess, sendError } from '../../common/utils/response.js';

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, result, 'User registered successfully', 201);
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, 'User logged in successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.sendOtp(email);
    return sendSuccess(res, result, 'OTP sent successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyOtp(email, otp);
    return sendSuccess(res, result, 'OTP verified successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const result = await authService.updatePassword(req.body);
    return sendSuccess(res, result, 'Password updated successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};
