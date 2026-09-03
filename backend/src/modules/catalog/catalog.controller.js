import tecdocService from '../../services/tecdocService.js';
import { sendSuccess, sendError } from '../../common/utils/response.js';

export const getManufacturers = async (req, res) => {
  try {
    const { type, country, lang } = req.query;
    const manufacturers = await tecdocService.getManufacturers(type, country, lang);
    return sendSuccess(res, { data: { array: manufacturers }, count: manufacturers.length }, 'Manufacturers fetched successfully');
  } catch (error) {
    return sendError(res, error.message, 500, error);
  }
};

export const getModelSeries = async (req, res) => {
  try {
    const { manuId, mfrId, type, country, lang } = req.query;
    const id = manuId || mfrId;
    if (!id) {
      return sendError(res, 'manuId or mfrId query parameter is required', 400);
    }
    const series = await tecdocService.getModelSeries(id, type, country, lang);
    return sendSuccess(res, { data: { array: series }, count: series.length }, 'Model series fetched successfully');
  } catch (error) {
    return sendError(res, error.message, 500, error);
  }
};

export const getVehicles = async (req, res) => {
  try {
    const { manuId, mfrId, modId, seriesId, type, country, lang } = req.query;
    const manufacturerId = manuId || mfrId;
    const modelSeriesId = modId || seriesId;
    if (!manufacturerId || !modelSeriesId) {
      return sendError(res, 'manuId and modId query parameters are required', 400);
    }
    const vehicles = await tecdocService.getVehicles(manufacturerId, modelSeriesId, type, country, lang);
    return sendSuccess(res, { data: { array: vehicles }, count: vehicles.length }, 'Vehicles fetched successfully');
  } catch (error) {
    return sendError(res, error.message, 500, error);
  }
};

export const getArticlesByVehicle = async (req, res) => {
  try {
    const { linkageTargetId, carId, vehicleId, type, country, lang } = req.query;
    const id = linkageTargetId || carId || vehicleId;
    if (!id) {
      return sendError(res, 'linkageTargetId or vehicleId query parameter is required', 400);
    }
    const articles = await tecdocService.getArticlesByVehicle(id, type, country, lang);
    return sendSuccess(res, { status: 200, articles, count: articles.length }, 'Articles fetched successfully');
  } catch (error) {
    return sendError(res, error.message, 500, error);
  }
};

export const getArticlesByPartNumber = async (req, res) => {
  try {
    const { searchQuery, partNumber, query, country, lang } = req.query;
    const search = searchQuery || partNumber || query;
    if (!search) {
      return sendError(res, 'searchQuery query parameter is required', 400);
    }
    const articles = await tecdocService.getArticlesByPartNumber(search, country, lang);
    return sendSuccess(res, { status: 200, articles, count: articles.length }, 'Articles fetched successfully');
  } catch (error) {
    return sendError(res, error.message, 500, error);
  }
};

export const getBrands = async (req, res) => {
  try {
    const { country, lang } = req.query;
    const brands = await tecdocService.getBrands(country, lang);
    return sendSuccess(res, { data: { array: brands }, count: brands.length }, 'Brands fetched successfully');
  } catch (error) {
    return sendError(res, error.message, 500, error);
  }
};

export const getVehiclesByVIN = async (req, res) => {
  try {
    const { vin } = req.params;
    const { country, lang } = req.query;
    if (!vin || vin.length < 5) {
      return sendError(res, 'Valid VIN parameter is required', 400);
    }
    const vehicles = await tecdocService.getVehiclesByVIN(vin, country, lang);
    return sendSuccess(res, { vehicles }, 'VIN decoded successfully');
  } catch (error) {
    return sendError(res, error.message, 500, error);
  }
};

export const getPopularBrands = async (req, res) => {
  try {
    const { type } = req.query;
    if (type) {
      const brands = tecdocService.getPopularBrands(type);
      return sendSuccess(
        res,
        { data: { array: brands }, count: brands.length },
        'Popular brands fetched successfully'
      );
    }
    // Return all 3 categories in a single call for client-side instant caching
    const all = tecdocService.getAllPopularBrands();
    return sendSuccess(res, { ...all, data: all }, 'All popular brands fetched successfully');
  } catch (error) {
    return sendError(res, error.message, 500, error);
  }
};

/**
 * Universal proxy endpoint for frontend components passing arbitrary TecDoc JSON payloads
 */
export const proxyServiceJson = async (req, res) => {
  try {
    const payload = req.body;
    const data = await tecdocService.execute(payload);
    return res.status(200).json(data);
  } catch (error) {
    return sendError(res, error.message, 500, error);
  }
};

export const get360Frames = async (req, res) => {
  try {
    const { gifUrl } = req.query;
    if (!gifUrl) {
      return sendError(res, 'gifUrl query parameter is required', 400);
    }
    const { extract360Frames } = await import('../../services/gif360Service.js');
    const data = await extract360Frames(gifUrl);
    return sendSuccess(res, data, '360 frames extracted successfully');
  } catch (error) {
    return sendError(res, error.message, 500, error);
  }
};

