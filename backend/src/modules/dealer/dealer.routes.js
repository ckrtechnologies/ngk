import { Router } from 'express';
import { getDealers, updateDealerApproval, geocodeAddress, reverseGeocodeCoords } from './dealer.controller.js';
import { optionalAuth, verifyToken, requireRole } from '../../common/middleware/auth.middleware.js';

const dealerRouter = Router();

dealerRouter.get('/geocode', optionalAuth, geocodeAddress);
dealerRouter.get('/reverse-geocode', optionalAuth, reverseGeocodeCoords);
dealerRouter.get('/', optionalAuth, getDealers);
dealerRouter.get('/dealers', optionalAuth, getDealers);
dealerRouter.put('/:id/approval', optionalAuth, updateDealerApproval);
dealerRouter.put('/approval/:id', optionalAuth, updateDealerApproval);

export default dealerRouter;
