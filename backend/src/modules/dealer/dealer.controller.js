import dealerService from './dealer.service.js';
import { sendSuccess, sendError } from '../../common/utils/response.js';

export const getDealers = async (req, res) => {
  try {
    const { role, q } = req.query;
    const dealers = await dealerService.getDealers({ role, searchQuery: q });
    return sendSuccess(res, { dealers, count: dealers.length }, 'Dealers fetched successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};
