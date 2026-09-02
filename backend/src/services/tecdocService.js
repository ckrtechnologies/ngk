import axios from 'axios';
import TECDOC_CONFIG from '../config/tecdoc.js';
import memoryCache from '../common/utils/cache.js';
import ENV from '../config/env.js';

class TecDocService {
  constructor() {
    this.endpoint = TECDOC_CONFIG.ENDPOINT;
    this.providerId = TECDOC_CONFIG.PROVIDER_ID;
    this.defaultCountry = TECDOC_CONFIG.COUNTRY;
    this.defaultLang = TECDOC_CONFIG.LANG;
  }

  /**
   * Helper to execute HTTP POST requests to TecDoc Pegasus 3.0 endpoint
   */
  async execute(payload, apiKey = null) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const effectiveApiKey = apiKey || ENV.TECDOC_API_KEY;
    if (effectiveApiKey) {
      headers['X-Api-Key'] = effectiveApiKey;
    }

    try {
      const response = await axios.post(this.endpoint, payload, {
        headers,
        timeout: 20000,
      });
      return response.data;
    } catch (error) {
      console.error('TecDoc API execution error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message || 'TecDoc service communication error');
    }
  }

  /**
   * 1. Get Vehicle Manufacturers (Pegasus 3.0 getLinkageTargets with fallback)
   */
  async getManufacturers(type = 'P', country = this.defaultCountry, lang = this.defaultLang) {
    const cacheKey = `mfrs_${type}_${country}_${lang}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) return cached;

    // Primary: Modern Pegasus 3.0 getLinkageTargets
    const payloadPegasus = {
      getLinkageTargets: {
        provider: this.providerId,
        linkageTargetCountry: country,
        lang: lang,
        linkageTargetType: type,
        includeMfrFacets: true,
        perPage: 0,
        page: 1,
      },
    };

    try {
      const data = await this.execute(payloadPegasus);
      const mfrCounts = data?.mfrFacets?.counts || [];

      if (mfrCounts.length > 0) {
        const formatted = mfrCounts.map((m) => ({
          id: m.id,
          manuId: m.id,
          name: m.name,
          manuName: m.name,
          count: m.count,
        }));
        memoryCache.set(cacheKey, formatted, 86400); // 24h
        return formatted;
      }
    } catch (e) {
      console.warn('Pegasus getLinkageTargets failed, attempting getManufacturers fallback:', e.message);
    }

    // Fallback: Legacy getManufacturers
    const fallbackPayload = {
      getManufacturers: {
        provider: this.providerId,
        country: country,
        lang: lang,
        linkingTargetType: type,
      },
    };

    const fbData = await this.execute(fallbackPayload);
    const mfrs = fbData?.data?.array || [];
    const formatted = mfrs.map((m) => ({
      id: m.manuId,
      manuId: m.manuId,
      name: m.manuName,
      manuName: m.manuName,
    }));

    if (formatted.length > 0) {
      memoryCache.set(cacheKey, formatted, 86400);
    }
    return formatted;
  }

  /**
   * 2. Get Model Series for a Manufacturer (Pegasus 3.0)
   */
  async getModelSeries(mfrId, type = 'P', country = this.defaultCountry, lang = this.defaultLang) {
    const cacheKey = `series_${mfrId}_${type}_${country}_${lang}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) return cached;

    const payloadPegasus = {
      getLinkageTargets: {
        provider: this.providerId,
        linkageTargetCountry: country,
        lang: lang,
        linkageTargetType: type,
        mfrIds: [parseInt(mfrId, 10)],
        includeVehicleModelSeriesFacets: true,
        perPage: 0,
        page: 1,
      },
    };

    try {
      const data = await this.execute(payloadPegasus);
      const seriesCounts = data?.vehicleModelSeriesFacets?.counts || [];

      if (seriesCounts.length > 0) {
        const formatted = seriesCounts.map((s) => ({
          id: s.id,
          modelId: s.id,
          name: s.name,
          modelname: s.name,
          count: s.count,
        }));
        memoryCache.set(cacheKey, formatted, 86400);
        return formatted;
      }
    } catch (e) {
      console.warn('Pegasus getModelSeries failed, trying legacy fallback:', e.message);
    }

    // Fallback: Legacy getModelSeries
    const fallbackPayload = {
      getModelSeries: {
        provider: this.providerId,
        country: country,
        lang: lang,
        manuId: parseInt(mfrId, 10),
        linkingTargetType: type,
      },
    };

    const fbData = await this.execute(fallbackPayload);
    const series = fbData?.data?.array || [];
    const formatted = series.map((s) => ({
      id: s.modelId,
      modelId: s.modelId,
      name: s.modelname || s.name,
      modelname: s.modelname || s.name,
    }));

    if (formatted.length > 0) {
      memoryCache.set(cacheKey, formatted, 86400);
    }
    return formatted;
  }

  /**
   * 3. Get Vehicle Variants / Models for Series (Pegasus 3.0)
   */
  async getVehicles(mfrId, seriesId, type = 'P', country = this.defaultCountry, lang = this.defaultLang) {
    const cacheKey = `vehicles_${mfrId}_${seriesId}_${type}_${country}_${lang}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) return cached;

    const payloadPegasus = {
      getLinkageTargets: {
        provider: this.providerId,
        linkageTargetCountry: country,
        lang: lang,
        linkageTargetType: type,
        mfrIds: [parseInt(mfrId, 10)],
        vehicleModelSeriesIds: [parseInt(seriesId, 10)],
        includeAll: true,
        perPage: 100,
        page: 1,
      },
    };

    try {
      const data = await this.execute(payloadPegasus);
      const targets = data?.linkageTargets || [];

      if (targets.length > 0) {
        const formatted = targets.map((v) => ({
          id: v.linkageTargetId || v.carId || v.id,
          carId: v.linkageTargetId || v.carId || v.id,
          linkageTargetId: v.linkageTargetId || v.carId,
          typeName: v.description || v.typeName || v.linkageTargetType,
          modelName: v.vehicleModelSeriesName || v.modelName,
          manuName: v.mfrName || v.manuName,
          constructionType: v.constructionType,
          yearOfConstrFrom: v.beginYearMonth || v.yearOfConstrFrom,
          yearOfConstrTo: v.endYearMonth || v.yearOfConstrTo,
          powerHpFrom: v.hp || v.powerHpFrom,
          powerKwFrom: v.kw || v.powerKwFrom,
          cylinderCapacityCcm: v.ccm || v.cylinderCapacityCcm,
          raw: v,
        }));
        memoryCache.set(cacheKey, formatted, 86400);
        return formatted;
      }
    } catch (e) {
      console.warn('Pegasus getVehicles failed, trying legacy fallback:', e.message);
    }

    // Fallback: Legacy getVehicleIdsByCriteria
    const fallbackPayload = {
      getVehicleIdsByCriteria: {
        provider: this.providerId,
        countriesCarSelection: country,
        lang: lang,
        carType: type,
        manuId: parseInt(mfrId, 10),
        modId: parseInt(seriesId, 10),
      },
    };

    const fbData = await this.execute(fallbackPayload);
    const list = fbData?.data?.array || [];
    if (list.length > 0) {
      memoryCache.set(cacheKey, list, 86400);
    }
    return list;
  }

  /**
   * 4. Get Verified Parts / Articles for a Vehicle
   */
  async getArticlesByVehicle(vehicleId, type = 'P', country = this.defaultCountry, lang = this.defaultLang) {
    const payload = {
      getArticles: {
        provider: this.providerId,
        articleCountry: country,
        lang: lang,
        linkageTargetId: parseInt(vehicleId, 10),
        linkageTargetType: type,
        includeAll: true,
        includeImages: true,
        includePDFs: true,
        includeGenericArticleFacets: true,
        includeCriteriaFacets: true,
      },
    };

    const data = await this.execute(payload);
    return this.sanitizeArticles(data?.articles || data?.data?.array || []);
  }

  /**
   * 5. Get Articles by Part Number Query
   */
  async getArticlesByPartNumber(searchQuery, country = this.defaultCountry, lang = this.defaultLang) {
    const payload = {
      getArticles: {
        provider: this.providerId,
        articleCountry: country,
        lang: lang,
        searchQuery: searchQuery,
        searchType: 0, // Exact & direct match
        includeAll: true,
        includeImages: true,
        includePDFs: true,
      },
    };

    const data = await this.execute(payload);
    return this.sanitizeArticles(data?.articles || data?.data?.array || []);
  }

  /**
   * 6. Get Product / Supplier Brands & Logos (getBrands)
   */
  async getBrands(country = this.defaultCountry, lang = this.defaultLang) {
    const cacheKey = `brands_${country}_${lang}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) return cached;

    const payload = {
      getBrands: {
        provider: this.providerId,
        articleCountry: country,
        lang: lang,
        includeAll: true,
        includeDataSupplierLogo: true,
        includeAddressDetails: true,
      },
    };

    try {
      const data = await this.execute(payload);
      const brands = data?.data?.array || data?.brands || [];
      if (brands.length > 0) {
        memoryCache.set(cacheKey, brands, 86400);
        return brands;
      }
    } catch (e) {
      console.warn('getBrands failed, trying getAmBrands fallback:', e.message);
    }

    // Fallback: getAmBrands
    const fbPayload = {
      getAmBrands: {
        provider: this.providerId,
        articleCountry: country,
        lang: lang,
      },
    };
    const fbData = await this.execute(fbPayload);
    const list = fbData?.data?.array || [];
    if (list.length > 0) {
      memoryCache.set(cacheKey, list, 86400);
    }
    return list;
  }

  /**
   * 7. Decode 17-digit VIN (getVehiclesByVIN)
   */
  async getVehiclesByVIN(vin, country = this.defaultCountry, lang = this.defaultLang) {
    const payload = {
      getVehiclesByVIN: {
        provider: this.providerId,
        country: country,
        lang: lang,
        vin: vin,
      },
    };

    const data = await this.execute(payload);
    return data?.data?.array || data?.matchingVehicles || [];
  }

  /**
   * Helper to format article specifications and document URLs
   */
  sanitizeArticles(articles) {
    return articles.map((a) => {
      const genericDesc = a.genericArticles && a.genericArticles.length > 0
        ? a.genericArticles[0].genericArticleDescription
        : a.genericArticleDescription;

      const title = genericDesc || a.mfrName || a.dataSupplierName || 'Automotive Component';
      const partNumber = a.articleNumber || a.directArticle?.articleNo || '';

      const specs = [];
      if (a.articleCriteria && Array.isArray(a.articleCriteria)) {
        a.articleCriteria.forEach((c) => {
          specs.push({ label: c.criteriaDescription, value: c.formattedValue || c.rawValue });
        });
      } else if (a.articleAttributes?.array) {
        a.articleAttributes.array.forEach((attr) => {
          specs.push({ label: attr.attrName, value: attr.attrValue });
        });
      }

      // Extract image/document URL
      let imageUrl = null;
      if (a.images && a.images.length > 0) {
        imageUrl = a.images[0].imageURL800 || a.images[0].imageURL400 || a.images[0].imageURL100 || a.images[0].imageURL50 || a.images[0].docUrl;
      } else if (a.articleDocuments?.array && a.articleDocuments.array.length > 0) {
        const doc = a.articleDocuments.array[0];
        imageUrl = doc.docUrl || (doc.docId ? `${TECDOC_CONFIG.DOCUMENTS_ENDPOINT}/${this.providerId}/${doc.docId}/0` : null);
      }

      return {
        id: a.articleId || a.directArticle?.articleId || partNumber,
        articleId: a.articleId || a.directArticle?.articleId,
        articleNumber: partNumber,
        partNumber: partNumber,
        title: title,
        brandName: a.mfrName || a.dataSupplierName || 'NGK',
        mfrName: a.mfrName || a.dataSupplierName,
        specs: specs,
        imageUrl: imageUrl,
        raw: a,
      };
    });
  }
}

export const tecdocService = new TecDocService();
export default tecdocService;
