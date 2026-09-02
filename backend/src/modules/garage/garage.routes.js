import { Router } from 'express';
import {
  addVehicleToGarage,
  addSearchHistory,
  addVehicleToWatchlist,
  removeFromWatchlist,
} from './garage.controller.js';
import { optionalAuth } from '../../common/middleware/auth.middleware.js';

const garageRouter = Router();

garageRouter.put('/addVehicleToGarage/:id', optionalAuth, addVehicleToGarage);
garageRouter.put('/addSearchHistory/:id', optionalAuth, addSearchHistory);
garageRouter.put('/addVehicleToWatchlist/:id', optionalAuth, addVehicleToWatchlist);
garageRouter.delete('/removeFromWatchlist/:id/:partId', optionalAuth, removeFromWatchlist);

export default garageRouter;
