import { Router } from 'express';
import { getDealers } from './dealer.controller.js';
import { optionalAuth } from '../../common/middleware/auth.middleware.js';

const dealerRouter = Router();

dealerRouter.get('/', optionalAuth, getDealers);
dealerRouter.get('/dealers', optionalAuth, getDealers);

export default dealerRouter;
