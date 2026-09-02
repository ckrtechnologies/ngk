import path from 'path';
import { sendSuccess, sendError } from '../../common/utils/response.js';

export const handleFileUpload = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    const file = req.file;
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3001';
    const publicUrl = `${protocol}://${host}/uploads/${file.filename}`;

    return sendSuccess(
      res,
      {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: publicUrl,
        publicUrl: publicUrl,
      },
      'File uploaded successfully',
      201
    );
  } catch (error) {
    return sendError(res, error.message, 500, error);
  }
};
