import userService from './user.service.js';
import { sendSuccess, sendError } from '../../common/utils/response.js';

export const getUserById = async (req, res) => {
  try {
    const id = req.params.id || req.user?.id;
    const user = await userService.getUserById(id);
    return sendSuccess(res, { user: [user] }, 'User found', 200);
  } catch (error) {
    return sendError(res, error.message, 404, error);
  }
};

export const getUsers = async (req, res) => {
  try {
    const role = req.query.role;
    const users = await userService.getAllUsers(role);
    return sendSuccess(res, { users }, 'Users found', 200);
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await userService.updateUser(id, req.body);
    return sendSuccess(res, { user: updated }, 'User updated successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    return sendSuccess(res, null, 'User deleted successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const readNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    const notifications = await userService.readNotifications(id);
    return sendSuccess(res, { notifications }, 'Notifications updated successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};
