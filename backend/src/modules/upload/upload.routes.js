import { Router } from 'express';
import { handleFileUpload } from './upload.controller.js';
import upload from '../../common/middleware/upload.middleware.js';
import { optionalAuth } from '../../common/middleware/auth.middleware.js';

const uploadRouter = Router();

uploadRouter.post('/', optionalAuth, upload.single('file'), handleFileUpload);
uploadRouter.post('/image', optionalAuth, upload.single('image'), handleFileUpload);

export default uploadRouter;
