import garageService from './garage.service.js';
import { sendSuccess, sendError } from '../../common/utils/response.js';

export const addVehicleToGarage = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicleData = req.body.modal || req.body.vehicle || req.body;
    const updatedUser = await garageService.addVehicleToGarage(id, vehicleData);
    return sendSuccess(res, { user: updatedUser }, 'Vehicle added to garage successfully');
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const addSearchHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const searchData = req.body.dat || req.body.query || req.body;
    const updatedUser = await garageService.addSearchHistory(id, searchData);
    return sendSuccess(res, { user: updatedUser }, 'Search history added successfully');
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const addVehicleToWatchlist = async (req, res) => {
  try {
    const { id } = req.params;
    const item = req.body.vehicle || req.body.part || req.body.modal || req.body;
    const updatedUser = await garageService.addToWatchlist(id, item);
    return sendSuccess(res, { user: updatedUser }, 'Added to watchlist successfully');
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const removeFromWatchlist = async (req, res) => {
  try {
    const { id, partId } = req.params;
    const updatedUser = await garageService.removeFromWatchlist(id, partId);
    return sendSuccess(res, { user: updatedUser }, 'Removed from watchlist successfully');
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};
