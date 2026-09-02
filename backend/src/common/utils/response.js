/**
 * Unified API Response Helper
 */

export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== null && typeof data === 'object' && !Array.isArray(data) ? data : { data }),
  });
};

export const sendError = (res, message = 'An error occurred', statusCode = 500, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(error ? { error: error.message || error } : {}),
  });
};
