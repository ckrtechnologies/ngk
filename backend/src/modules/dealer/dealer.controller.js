import dealerService from './dealer.service.js';
import { sendSuccess, sendError } from '../../common/utils/response.js';

export const getDealers = async (req, res) => {
  try {
    const { role, q, searchQuery, userLat, userLon, lat, lon, radius, includeUnapproved } = req.query;
    const dealers = await dealerService.getDealers({
      role,
      searchQuery: q || searchQuery,
      userLat: userLat || lat,
      userLon: userLon || lon,
      radius: radius !== undefined && radius !== null && radius !== '' ? parseFloat(radius) : null,
      includeUnapproved: includeUnapproved === 'true',
    });
    return sendSuccess(res, { dealers, count: dealers.length }, 'Dealers fetched successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const updateDealerApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved, is_live, approval_status, rejection_reason } = req.body;
    const result = await dealerService.updateApproval(id, {
      is_approved,
      is_live,
      approval_status,
      rejection_reason,
    });
    return sendSuccess(res, { dealer: result }, 'Dealer approval updated successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};
