import { Router } from 'express';
import {
  addVehicleToGarage,
  getGarageVehicles,
  addSearchHistory,
  addVehicleToWatchlist,
  removeFromWatchlist,
  setPrimaryVehicle,
} from './garage.controller.js';
import { optionalAuth } from '../../common/middleware/auth.middleware.js';

const garageRouter = Router();

// Add Vehicle to Garage (supports POST /addVehicleToGarage, POST /addVehicleToGarage/:id, PUT /addVehicleToGarage/:id)
garageRouter.post('/addVehicleToGarage', optionalAuth, addVehicleToGarage);
garageRouter.post('/addVehicleToGarage/:id', optionalAuth, addVehicleToGarage);
garageRouter.put('/addVehicleToGarage/:id', optionalAuth, addVehicleToGarage);

// Set Primary Vehicle
garageRouter.post('/setPrimaryVehicle', optionalAuth, setPrimaryVehicle);
garageRouter.post('/set-primary', optionalAuth, setPrimaryVehicle);

// Get Garage Vehicles
garageRouter.get('/vehicles/:id', optionalAuth, getGarageVehicles);
garageRouter.get('/garageVehicles/:id', optionalAuth, getGarageVehicles);

// Add Search History
garageRouter.post('/addSearchHistory', optionalAuth, addSearchHistory);
garageRouter.post('/addSearchHistory/:id', optionalAuth, addSearchHistory);
garageRouter.put('/addSearchHistory/:id', optionalAuth, addSearchHistory);

// Add to Watchlist / Garage
garageRouter.post('/addVehicleToWatchlist', optionalAuth, addVehicleToWatchlist);
garageRouter.post('/addVehicleToWatchlist/:id', optionalAuth, addVehicleToWatchlist);
garageRouter.put('/addVehicleToWatchlist/:id', optionalAuth, addVehicleToWatchlist);

// Remove from Watchlist / Garage
garageRouter.post('/removeFromWatchlist', optionalAuth, removeFromWatchlist);
garageRouter.delete('/removeFromWatchlist/:id/:partId', optionalAuth, removeFromWatchlist);
garageRouter.delete('/removeFromWatchlist/:partId', optionalAuth, removeFromWatchlist);

export default garageRouter;
