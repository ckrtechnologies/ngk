import garageService from './garage.service.js';
import { sendSuccess, sendError } from '../../common/utils/response.js';

export const addVehicleToGarage = async (req, res) => {
  try {
    const id = req.params.id || req.body.userId || req.body.id || req.user?.id;
    if (!id) {
      return sendError(res, 'User ID is required', 400);
    }
    const vehicleData = req.body.modal || req.body.vehicle || req.body;
    const updatedUser = await garageService.addVehicleToGarage(id, vehicleData);
    return sendSuccess(res, { user: updatedUser }, 'Vehicle added to garage successfully');
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const getGarageVehicles = async (req, res) => {
  try {
    const id = req.params.id || req.query.userId || req.user?.id;
    if (!id) {
      return sendError(res, 'User ID is required', 400);
    }
    const vehicles = await garageService.getGarageVehicles(id);
    return sendSuccess(res, { vehicles }, 'Garage vehicles fetched successfully');
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const addSearchHistory = async (req, res) => {
  try {
    const id = req.params.id || req.body.userId || req.body.id || req.user?.id;
    if (!id) {
      return sendError(res, 'User ID is required', 400);
    }
    const searchData = req.body.dat || req.body.query || req.body;
    const updatedUser = await garageService.addSearchHistory(id, searchData);
    return sendSuccess(res, { user: updatedUser }, 'Search history added successfully');
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const addVehicleToWatchlist = async (req, res) => {
  try {
    const id = req.params.id || req.body.userId || req.body.id || req.user?.id;
    if (!id) {
      return sendError(res, 'User ID is required', 400);
    }
    const item = req.body.vehicle || req.body.part || req.body.modal || req.body;
    
    // If it's vehicle data (make + model), add to garage as well
    if (item.make && item.model) {
      await garageService.addVehicleToGarage(id, item);
    }
    
    const updatedUser = await garageService.addToWatchlist(id, item);
    return sendSuccess(res, { user: updatedUser }, 'Added to watchlist/garage successfully');
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const removeFromWatchlist = async (req, res) => {
  try {
    const id = req.params.id || req.body.userId || req.body.id || req.user?.id;
    const partId = req.params.partId || req.body.partId || req.body.vehicleId || req.body.id;
    if (!id || !partId) {
      return sendError(res, 'User ID and Part/Vehicle ID are required', 400);
    }
    
    // Also remove from garage_vehicles table if it exists there
    await garageService.removeVehicleFromGarage(id, partId);
    
    const updatedUser = await garageService.removeFromWatchlist(id, partId);
    return sendSuccess(res, { user: updatedUser }, 'Removed from watchlist successfully');
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};
