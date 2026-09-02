import enquiryService from './enquiry.service.js';
import { sendSuccess, sendError } from '../../common/utils/response.js';

export const addEnquiry = async (req, res) => {
  try {
    const data = await enquiryService.addEnquiry(req.body);
    return sendSuccess(res, { enquiry: data }, 'Enquiry added successfully', 201);
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const getEnquiries = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id;
    const enquiries = await enquiryService.getEnquiries(userId);
    return sendSuccess(res, { enquiry: enquiries }, 'Enquiries fetched successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await enquiryService.updateStatus(id, req.body);
    return sendSuccess(res, { enquiry: data }, 'Status updated successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};

export const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await enquiryService.addMessage(id, req.body);
    return sendSuccess(res, { enquiry: data }, 'Message added successfully', 200);
  } catch (error) {
    return sendError(res, error.message, 400, error);
  }
};
