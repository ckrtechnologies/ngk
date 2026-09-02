import { Router } from 'express';
import { addEnquiry, getEnquiries, updateStatus, addMessage } from './enquiry.controller.js';
import { optionalAuth } from '../../common/middleware/auth.middleware.js';

const enquiryRouter = Router();

enquiryRouter.post('/add', optionalAuth, addEnquiry);
enquiryRouter.get('/getEnquiry/:userId', optionalAuth, getEnquiries);
enquiryRouter.get('/:userId', optionalAuth, getEnquiries);
enquiryRouter.put('/updateStatus/:id', optionalAuth, updateStatus);
enquiryRouter.post('/addMessage/:id', optionalAuth, addMessage);

export default enquiryRouter;
