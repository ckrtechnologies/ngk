import { Router } from 'express';
import {
  getManufacturers,
  getModelSeries,
  getVehicles,
  getArticlesByVehicle,
  getArticlesByPartNumber,
  getBrands,
  getVehiclesByVIN,
  proxyServiceJson,
} from './catalog.controller.js';
import { optionalAuth } from '../../common/middleware/auth.middleware.js';

const catalogRouter = Router();

// Dedicated clean REST endpoints
catalogRouter.get('/manufacturers', optionalAuth, getManufacturers);
catalogRouter.get('/series', optionalAuth, getModelSeries);
catalogRouter.get('/vehicles', optionalAuth, getVehicles);
catalogRouter.get('/articles/by-vehicle', optionalAuth, getArticlesByVehicle);
catalogRouter.get('/articles/by-part', optionalAuth, getArticlesByPartNumber);
catalogRouter.get('/brands', optionalAuth, getBrands);
catalogRouter.get('/vin/:vin', optionalAuth, getVehiclesByVIN);

// Universal JSON Endpoint proxy (replaces frontend direct calls to TecAlliance)
catalogRouter.post('/services/TecdocToCatDLB.jsonEndpoint', optionalAuth, proxyServiceJson);
catalogRouter.post('/serviceJson', optionalAuth, proxyServiceJson);

export default catalogRouter;
