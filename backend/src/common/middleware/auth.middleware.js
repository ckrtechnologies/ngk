import jwt from 'jsonwebtoken';
import ENV from '../../config/env.js';
import { sendError } from '../utils/response.js';

/**
 * Middleware to verify JWT token in Authorization header
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader) {
    return sendError(res, 'Access denied. No authorization token provided.', 401);
  }

  const parts = authHeader.split(' ');
  const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : authHeader;

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    req.user = decoded; // { id, email, role, ... }
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token.', 401, error);
  }
};

/**
 * Role-Based Access Control (RBAC) guard
 * @param {string[]} allowedRoles
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized.', 401);
    }

    const userRole = (req.user.role || '').toLowerCase();
    const hasRole = allowedRoles.map(r => r.toLowerCase()).includes(userRole);

    if (!hasRole) {
      return sendError(res, `Forbidden: Requires one of [${allowedRoles.join(', ')}] role.`, 403);
    }

    next();
  };
};

/**
 * Optional authentication: attaches user if token is valid, continues if not
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) return next();

  const parts = authHeader.split(' ');
  const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : authHeader;

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    req.user = decoded;
  } catch {
    // Ignore invalid token for optional routes
  }
  next();
};
