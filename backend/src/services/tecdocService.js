import axios from 'axios';
import TECDOC_CONFIG from '../config/tecdoc.js';
import memoryCache from '../common/utils/cache.js';
import ENV from '../config/env.js';

const FALLBACK_MANUFACTURERS = [
  { id: 111, manuId: 111, name: 'TOYOTA', manuName: 'TOYOTA', count: 1850 },
  { id: 16, manuId: 16, name: 'BMW', manuName: 'BMW', count: 1420 },
  { id: 5, manuId: 5, name: 'AUDI', manuName: 'AUDI', count: 1210 },
  { id: 121, manuId: 121, name: 'VOLKSWAGEN', manuName: 'VOLKSWAGEN', count: 2100 },
  { id: 74, manuId: 74, name: 'MERCEDES-BENZ', manuName: 'MERCEDES-BENZ', count: 1680 },
  { id: 80, manuId: 80, name: 'NISSAN', manuName: 'NISSAN', count: 980 },
  { id: 36, manuId: 36, name: 'FORD', manuName: 'FORD', count: 1150 },
  { id: 183, manuId: 183, name: 'HYUNDAI', manuName: 'HYUNDAI', count: 870 },
  { id: 63, manuId: 63, name: 'MARUTI SUZUKI', manuName: 'MARUTI SUZUKI', count: 640 },
  { id: 54, manuId: 54, name: 'ISUZU', manuName: 'ISUZU', count: 520 },
];

const FALLBACK_SERIES = {
  111: [
    { id: 501, modelId: 501, name: 'HILUX VIII Pickup', modelname: 'HILUX VIII Pickup', count: 48 },
    { id: 502, modelId: 502, name: 'FORTUNER', modelname: 'FORTUNER', count: 32 },
    { id: 503, modelId: 503, name: 'COROLLA Sedan', modelname: 'COROLLA Sedan', count: 64 },
    { id: 504, modelId: 504, name: 'LAND CRUISER PRADO', modelname: 'LAND CRUISER PRADO', count: 28 },
    { id: 505, modelId: 505, name: 'RAV 4 V', modelname: 'RAV 4 V', count: 36 },
  ],
  183: [
    { id: 9145, modelId: 9145, name: 'ACCENT IV (RB)', modelname: 'ACCENT IV (RB)', count: 24 },
    { id: 11984, modelId: 11984, name: 'i20 II (GB, IB)', modelname: 'i20 II (GB, IB)', count: 30 },
    { id: 11050, modelId: 11050, name: 'i10 I (PA)', modelname: 'i10 I (PA)', count: 18 },
    { id: 14758, modelId: 14758, name: 'TUCSON (TL, TLE)', modelname: 'TUCSON (TL, TLE)', count: 36 },
    { id: 16024, modelId: 16024, name: 'CRETA', modelname: 'CRETA', count: 22 },
  ],
  36: [
    { id: 10450, modelId: 10450, name: 'RANGER (TKE)', modelname: 'RANGER (TKE)', count: 44 },
    { id: 11620, modelId: 11620, name: 'ECOSPORT', modelname: 'ECOSPORT', count: 26 },
    { id: 14500, modelId: 14500, name: 'EVEREST', modelname: 'EVEREST', count: 28 },
  ],
  54: [
    { id: 10252, modelId: 10252, name: 'D-MAX I (TFR, TFS)', modelname: 'D-MAX I (TFR, TFS)', count: 38 },
    { id: 40683, modelId: 40683, name: 'D-MAX II (TFR, TFS)', modelname: 'D-MAX II (TFR, TFS)', count: 32 },
  ],
  16: [
    { id: 601, modelId: 601, name: '3 Series (G20)', modelname: '3 Series (G20)', count: 42 },
    { id: 602, modelId: 602, name: '5 Series (G30)', modelname: '5 Series (G30)', count: 38 },
    { id: 603, modelId: 603, name: 'X3 (G01)', modelname: 'X3 (G01)', count: 30 },
  ],
  121: [
    { id: 701, modelId: 701, name: 'GOLF VIII (CD1)', modelname: 'GOLF VIII (CD1)', count: 54 },
    { id: 702, modelId: 702, name: 'POLO VI (AW1)', modelname: 'POLO VI (AW1)', count: 46 },
    { id: 703, modelId: 703, name: 'AMAROK', modelname: 'AMAROK', count: 32 },
  ],
  63: [
    { id: 801, modelId: 801, name: 'ALTO (HA12, HA23)', modelname: 'ALTO (HA12, HA23)', count: 18 },
    { id: 802, modelId: 802, name: 'SWIFT IV', modelname: 'SWIFT IV', count: 24 },
  ],
  74: [
    { id: 2039, modelId: 2039, name: 'SPRINTER 2-t Van (B901, B902)', modelname: 'SPRINTER 2-t Van (B901, B902)', count: 24 },
    { id: 2041, modelId: 2041, name: 'SPRINTER 3-t Bus (B903)', modelname: 'SPRINTER 3-t Bus (B903)', count: 30 },
    { id: 1587, modelId: 1587, name: 'ACTROS', modelname: 'ACTROS', count: 29 },
    { id: 3431, modelId: 3431, name: 'ATEGO', modelname: 'ATEGO', count: 23 },
    { id: 124, modelId: 124, name: 'C-CLASS (W205)', modelname: 'C-CLASS (W205)', count: 45 },
    { id: 125, modelId: 125, name: 'E-CLASS (W213)', modelname: 'E-CLASS (W213)', count: 38 },
  ],
};

const FALLBACK_ARTICLES = [
  {
    articleId: 93501,
    articleNo: 'ILKAR7C10',
    partNumber: 'ILKAR7C10',
    articleName: 'Laser Iridium Spark Plug',
    dataSupplierName: 'NGK SPARK PLUG',
    brand: 'NGK SPARK PLUG',
    specs: [
      { label: 'Thread Size', value: 'M12 x 1.25' },
      { label: 'Spanner Size', value: '14 mm' },
      { label: 'Spark Position', value: '5 mm' },
      { label: 'Electrode Gap', value: '1.0 mm' },
    ],
  },
  {
    articleId: 6343,
    articleNo: 'BKR6E-11',
    partNumber: 'BKR6E-11',
    articleName: 'Yellow Line Standard Spark Plug',
    dataSupplierName: 'NGK SPARK PLUG',
    brand: 'NGK SPARK PLUG',
    specs: [
      { label: 'Thread Size', value: 'M14 x 1.25' },
      { label: 'Spanner Size', value: '16 mm' },
      { label: 'Spark Position', value: '3 mm' },
      { label: 'Electrode Gap', value: '1.1 mm' },
    ],
  },
  {
    articleId: 96350,
    articleNo: 'OZA659-EE4',
    partNumber: 'OZA659-EE4',
    articleName: 'NTK Lambda Oxygen Sensor',
    dataSupplierName: 'NTK VEHICLE ELECTRONICS',
    brand: 'NTK VEHICLE ELECTRONICS',
    specs: [
      { label: 'Sensor Type', value: 'Zirconia Lambda Sensor' },
      { label: 'Number of Poles', value: '4' },
      { label: 'Overall Length', value: '450 mm' },
    ],
  },
  {
    articleId: 91432,
    articleNo: 'Y-534J',
    partNumber: 'Y-534J',
    articleName: 'D-Power Diesel Glow Plug',
    dataSupplierName: 'NGK SPARK PLUG',
    brand: 'NGK SPARK PLUG',
    specs: [
      { label: 'Voltage', value: '11.0 V' },
      { label: 'Current', value: '4.5 A' },
      { label: 'Cone Pitch', value: '93°' },
    ],
  },
];

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

    // Auto-inject provider if missing
    if (payload && typeof payload === 'object') {
      Object.keys(payload).forEach((key) => {
        if (payload[key] && typeof payload[key] === 'object' && !payload[key].provider) {
          payload[key].provider = this.providerId;
        }
      });
    }

    try {
      const response = await axios.post(this.endpoint, payload, {
        headers,
        timeout: 20000,
      });

      // If TecAlliance returns 401 unwhitelisted IP status object inside response.data
      if (response.data && response.data.status === 401) {
        console.warn('TecAlliance reported 401 Access not allowed for current outbound IP.');
        return this.handleFallback(payload);
      }

      return response.data;
    } catch (error) {
      console.warn('TecDoc API execution error, falling back to local automotive catalog:', error.message);
      return this.handleFallback(payload);
    }
  }

  /**
   * Seamless offline/fallback provider for unwhitelisted local development IPs
   */
  handleFallback(payload) {
    if (payload.getManufacturers2 || payload.getManufacturers || payload.getLinkageTargets?.includeMfrFacets) {
      return {
        data: { array: FALLBACK_MANUFACTURERS },
        mfrFacets: { counts: FALLBACK_MANUFACTURERS },
        status: 200,
      };
    }

    if (payload.getModelSeries2 || payload.getModelSeries || payload.getLinkageTargets?.includeVehicleModelSeriesFacets) {
      const mfrId = payload.getModelSeries2?.manuId || payload.getModelSeries?.manuId || payload.getLinkageTargets?.mfrIds?.[0] || 111;
      const list = FALLBACK_SERIES[mfrId] || FALLBACK_SERIES[111];
      return {
        data: { array: list },
        vehicleModelSeriesFacets: { counts: list },
        status: 200,
      };
    }

    if (payload.getArticles || payload.getArticles2) {
      const query = (payload.getArticles?.searchQuery || '').toUpperCase();
      let matches = FALLBACK_ARTICLES;
      if (query) {
        matches = FALLBACK_ARTICLES.filter(
          (a) => a.articleNo.includes(query) || a.articleName.toUpperCase().includes(query)
        );
      }
      return {
        data: { array: matches.length > 0 ? matches : FALLBACK_ARTICLES },
        articles: matches.length > 0 ? matches : FALLBACK_ARTICLES,
        status: 200,
      };
    }

    if (payload.getBrands) {
      return {
        data: {
          array: [
            { brandId: 5567, brandName: 'NGK SPARK PLUG', dataSupplierName: 'NGK SPARK PLUG' },
            { brandId: 7729, brandName: 'NTK VEHICLE ELECTRONICS', dataSupplierName: 'NTK VEHICLE ELECTRONICS' },
          ],
        },
        status: 200,
      };
    }

    return { data: { array: [] }, status: 200 };
  }

  /**
   * 1. Get Vehicle Manufacturers (Pegasus 3.0 getLinkageTargets with fallback)
   */
  async getManufacturers(type = 'P', country = this.defaultCountry, lang = this.defaultLang) {
    const cacheKey = `mfrs_${type}_${country}_${lang}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) return cached;

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

    const data = await this.execute(payloadPegasus);
    const mfrCounts = data?.mfrFacets?.counts || data?.data?.array || FALLBACK_MANUFACTURERS;

    const formatted = mfrCounts.map((m) => ({
      id: m.id || m.manuId,
      manuId: m.id || m.manuId,
      name: m.name || m.manuName,
      manuName: m.name || m.manuName,
      count: m.count || 100,
    }));

    memoryCache.set(cacheKey, formatted, 86400);
    return formatted;
  }

  /**
   * 2. Get Model Series for a Manufacturer (Pegasus 3.0)
   */
  async getModelSeries(mfrId, type = 'P', country = this.defaultCountry, lang = this.defaultLang) {
    const cacheKey = `series_${mfrId}_${type}_${country}_${lang}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) return cached;

    const isCommercial = type === 'O' || type === 'COMMERCIAL';
    let seriesCounts = [];

    if (isCommercial) {
      // Query heavy commercial trucks (O) and light commercial vans/bakkies (P)
      const [resO, resP] = await Promise.all([
        this.execute({
          getLinkageTargets: {
            provider: this.providerId,
            linkageTargetCountry: country,
            lang: lang,
            linkageTargetType: 'O',
            mfrIds: [parseInt(mfrId, 10)],
            includeVehicleModelSeriesFacets: true,
            perPage: 0,
            page: 1,
          },
        }),
        this.execute({
          getLinkageTargets: {
            provider: this.providerId,
            linkageTargetCountry: country,
            lang: lang,
            linkageTargetType: 'P',
            mfrIds: [parseInt(mfrId, 10)],
            includeVehicleModelSeriesFacets: true,
            perPage: 0,
            page: 1,
          },
        }),
      ]);

      const listO = (resO?.vehicleModelSeriesFacets?.counts || resO?.data?.array || []).map((s) => ({
        ...s,
        linkingTargetType: 'O',
      }));

      const commRegex =
        /\b(SPRINTER|VITO|VIANO|CITAN|VARIO|HILUX|HIACE|QUANTUM|DYNA|PROBOX|D-MAX|KB|RANGER|TRANSIT|BANTAM|COURIER|AMAROK|CADDY|TRANSPORTER|CRAFTER|CARAVELLE|MULTIVAN|H-100|H-1|PORTER|STAREX|NAVARA|HARDBODY|NP200|NP300|1400 BAKKIE|NV200|NV350|CABSTAR)\b/i;

      const listP = (resP?.vehicleModelSeriesFacets?.counts || resP?.data?.array || [])
        .filter((s) => commRegex.test(s.name || s.modelname || ''))
        .map((s) => ({ ...s, linkingTargetType: 'P' }));

      const seen = new Set();
      for (const s of [...listP, ...listO]) {
        const sId = s.id || s.modelId;
        if (sId && !seen.has(sId)) {
          seen.add(sId);
          seriesCounts.push(s);
        }
      }
    } else {
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
      const data = await this.execute(payloadPegasus);
      seriesCounts =
        data?.vehicleModelSeriesFacets?.counts ||
        data?.data?.array ||
        FALLBACK_SERIES[mfrId] ||
        FALLBACK_SERIES[111];
    }

    const popPrefix =
      /^(FH|FM|FL|FE|FMX|9400|B12|B9|B7|ACTROS|ATEGO|AXOR|AROCS|SPRINTER|VITO|VIANO|CITAN|D-MAX|KB|N-SERIES|F-SERIES|NPR|NQR|NHR|NMR|FRR|FTR|FVR|R|G|P|S|TGX|TGS|TGM|TGL|CLA|TGE|XF|CF|LF|300|500|700|DAILY|EUROCARGO|STRALIS|TRAKKER|S-WAY|HILUX|QUANTUM|HIACE|DYNA|LAND CRUISER|HINO|RANGER|TRANSIT|CUSTOM|CARGO|AMAROK|CADDY|TRANSPORTER|CRAFTER)/i;

    const formatted = (seriesCounts || []).map((s) => ({
      id: s.id || s.modelId,
      modelId: s.id || s.modelId,
      name: s.name || s.modelname,
      modelname: s.name || s.modelname,
      linkingTargetType: s.linkingTargetType || type,
      count: s.count || 20,
    }));

    if (isCommercial) {
      formatted.sort((a, b) => {
        const aPop = popPrefix.test(a.name || '') ? 0 : 1;
        const bPop = popPrefix.test(b.name || '') ? 0 : 1;
        if (aPop !== bPop) return aPop - bPop;
        return (a.name || '').localeCompare(b.name || '');
      });
    }

    memoryCache.set(cacheKey, formatted, 86400);
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

    const data = await this.execute(payloadPegasus);
    const targets = data?.linkageTargets || data?.data?.array || [];

    if (targets.length > 0) {
      const formatted = targets.map((v) => ({
        id: v.linkageTargetId || v.carId || v.id,
        carId: v.linkageTargetId || v.carId || v.id,
        linkageTargetId: v.linkageTargetId || v.carId,
        linkageTargetType: v.linkageTargetType || type || 'P',
        typeName: v.description || v.typeName || v.linkageTargetType || 'Standard Engine',
        modelName: v.vehicleModelSeriesName || v.modelName || 'Model Variant',
        manuName: v.mfrName || v.manuName || 'Manufacturer',
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

    return [
      {
        id: 1001,
        carId: 1001,
        linkageTargetId: 1001,
        linkageTargetType: type || 'P',
        typeName: '2.8 GD-6 (GUN126) 150kW / 204HP',
        modelName: 'HILUX VIII',
        manuName: 'TOYOTA',
        yearOfConstrFrom: '2020',
        powerHpFrom: '204',
        powerKwFrom: '150',
      },
      {
        id: 1002,
        carId: 1002,
        linkageTargetId: 1002,
        linkageTargetType: type || 'P',
        typeName: '2.4 GD-6 (GUN125) 110kW / 150HP',
        modelName: 'HILUX VIII',
        manuName: 'TOYOTA',
        yearOfConstrFrom: '2016',
        powerHpFrom: '150',
        powerKwFrom: '110',
      },
    ];
  }

  /**
   * 4. Get Verified Parts / Articles for a Vehicle
   */
  async getArticlesByVehicle(vehicleId, type = 'P', country = this.defaultCountry, lang = this.defaultLang) {
    // In TecDoc supplier catalog for ZA (NGK/NTK/KYB), articles are linked to linkage targets
    // as type 'P' (and 'V'). Type 'O' queries return 0 articles from TecDoc.
    const primaryType = (type === 'O' || type === 'C') ? 'P' : (type || 'P');
    const payload = {
      getArticles: {
        provider: this.providerId,
        articleCountry: country,
        lang: lang,
        linkageTargetId: parseInt(vehicleId, 10),
        linkageTargetType: primaryType,
        includeAll: true,
        includeImages: true,
        includePDFs: true,
        includeGenericArticleFacets: true,
      },
    };

    let data = await this.execute(payload);
    let articles = data?.articles || data?.data?.array;

    // If initial query returned empty, try fallback target types ('P', 'V', or original type)
    if (!articles || articles.length === 0) {
      for (const altType of ['P', 'V', type]) {
        if (altType === primaryType) continue;
        payload.getArticles.linkageTargetType = altType;
        const altData = await this.execute(payload);
        if (altData?.articles?.length > 0) {
          articles = altData.articles;
          break;
        }
      }
    }

    const finalArticles = articles || FALLBACK_ARTICLES;
    return this.sanitizeArticles(finalArticles);
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
        searchType: 10,
        includeAll: true,
        includeImages: true,
        includePDFs: true,
      },
    };

    const data = await this.execute(payload);
    const articles = data?.articles || data?.data?.array || FALLBACK_ARTICLES;
    return this.sanitizeArticles(articles);
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

    const data = await this.execute(payload);
    const brands = data?.data?.array || data?.brands || [
      { brandId: 5567, brandName: 'NGK SPARK PLUG', dataSupplierName: 'NGK SPARK PLUG' },
      { brandId: 7729, brandName: 'NTK VEHICLE ELECTRONICS', dataSupplierName: 'NTK VEHICLE ELECTRONICS' },
    ];
    memoryCache.set(cacheKey, brands, 86400);
    return brands;
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
   * 8. Get Popular Car, Motorcycle, or Commercial Brands with official CDN Logos
   */
  getPopularBrands(type = 'P') {
    const t = (type || 'P').toUpperCase();

    if (t === 'M' || t === 'MOTORCYCLE') {
      return [
        { id: 45, manuId: 45, name: 'HONDA', manuName: 'HONDA', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/honda.png' },
        { id: 109, manuId: 109, name: 'SUZUKI', manuName: 'SUZUKI', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/suzuki.png' },
        { id: 16, manuId: 16, name: 'BMW', manuName: 'BMW', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/bmw.png' },
        { id: 2760, manuId: 2760, name: 'KTM', manuName: 'KTM', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/ktm.png' },
        { id: 112, manuId: 112, name: 'TRIUMPH', manuName: 'TRIUMPH', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/triumph.png' },
        { id: 181, manuId: 181, name: 'PIAGGIO', manuName: 'PIAGGIO', logoUrl: 'https://ngkapi.ckrtechnologies.in/uploads/logos/piaggio.png' },
        { id: 4552, manuId: 4552, name: 'BAJAJ', manuName: 'BAJAJ', logoUrl: 'https://ngkapi.ckrtechnologies.in/uploads/logos/bajaj.png' },
        { id: 1164, manuId: 1164, name: 'YAMAHA', manuName: 'YAMAHA', logoUrl: 'https://ngkapi.ckrtechnologies.in/uploads/logos/yamaha.png' },
        { id: 574, manuId: 574, name: 'KAWASAKI', manuName: 'KAWASAKI', logoUrl: 'https://ngkapi.ckrtechnologies.in/uploads/logos/kawasaki.png' },
      ];
    }

    if (t === 'O' || t === 'C' || t === 'COMMERCIAL') {
      return [
        { id: 54, manuId: 54, name: 'ISUZU', manuName: 'ISUZU', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/isuzu.png' },
        { id: 74, manuId: 74, name: 'MERCEDES-BENZ', manuName: 'MERCEDES-BENZ', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/mercedes-benz.png' },
        { id: 120, manuId: 120, name: 'VOLVO', manuName: 'VOLVO', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/volvo.png' },
        { id: 103, manuId: 103, name: 'SCANIA', manuName: 'SCANIA', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/scania.png' },
        { id: 69, manuId: 69, name: 'MAN', manuName: 'MAN', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/man.png' },
        { id: 151, manuId: 151, name: 'HINO', manuName: 'HINO', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/hino.png' },
        { id: 24, manuId: 24, name: 'DAF', manuName: 'DAF', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/daf.png' },
        { id: 55, manuId: 55, name: 'IVECO', manuName: 'IVECO', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/iveco.png' },
        { id: 36, manuId: 36, name: 'FORD', manuName: 'FORD', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/ford.png' },
      ];
    }

    // Default: Passenger Cars (P)
    return [
      { id: 111, manuId: 111, name: 'TOYOTA', manuName: 'TOYOTA', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/toyota.png' },
      { id: 121, manuId: 121, name: 'VOLKSWAGEN', manuName: 'VOLKSWAGEN', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/volkswagen.png' },
      { id: 16, manuId: 16, name: 'BMW', manuName: 'BMW', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/bmw.png' },
      { id: 74, manuId: 74, name: 'MERCEDES-BENZ', manuName: 'MERCEDES-BENZ', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/mercedes-benz.png' },
      { id: 36, manuId: 36, name: 'FORD', manuName: 'FORD', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/ford.png' },
      { id: 5, manuId: 5, name: 'AUDI', manuName: 'AUDI', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/audi.png' },
      { id: 80, manuId: 80, name: 'NISSAN', manuName: 'NISSAN', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/nissan.png' },
      { id: 183, manuId: 183, name: 'HYUNDAI', manuName: 'HYUNDAI', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/hyundai.png' },
      { id: 54, manuId: 54, name: 'ISUZU', manuName: 'ISUZU', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/isuzu.png' },
    ];
  }

  /**
   * 9. Get all popular brands in all 3 categories in a single call
   */
  getAllPopularBrands() {
    return {
      passenger: this.getPopularBrands('P'),
      motorcycle: this.getPopularBrands('M'),
      commercial: this.getPopularBrands('O'),
    };
  }

  /**
   * Helper to format article specifications and document URLs
   */
  sanitizeArticles(articles) {
    return (articles || []).map((a) => {
      const genericDesc =
        a.genericArticles && a.genericArticles.length > 0
          ? a.genericArticles[0].genericArticleDescription
          : a.genericArticleDescription;

      const title = a.articleName || genericDesc || a.mfrName || a.dataSupplierName || 'Automotive Component';
      const partNumber = a.articleNo || a.articleNumber || a.directArticle?.articleNo || a.partNumber || '';

      const specs = a.specs || [];
      if (specs.length === 0) {
        if (a.articleCriteria && Array.isArray(a.articleCriteria)) {
          a.articleCriteria.forEach((c) => {
            specs.push({ label: c.criteriaDescription, value: c.formattedValue || c.rawValue });
          });
        } else if (a.articleAttributes?.array) {
          a.articleAttributes.array.forEach((attr) => {
            specs.push({ label: attr.attrName, value: attr.attrValue });
          });
        }
      }

      return {
        id: a.articleId || a.directArticle?.articleId || partNumber,
        articleId: a.articleId || a.directArticle?.articleId || partNumber,
        articleNumber: partNumber,
        partNumber: partNumber,
        title: title,
        articleName: title,
        brandName: a.brand || a.mfrName || a.dataSupplierName || 'NGK SPARK PLUG',
        mfrName: a.mfrName || a.brand || a.dataSupplierName || 'NGK SPARK PLUG',
        dataSupplierName: a.dataSupplierName || a.mfrName || a.brand || 'NGK SPARK PLUG',
        tradeNumbers: a.tradeNumbers || [partNumber],
        genericArticles: a.genericArticles || [{ genericArticleDescription: title }],
        specs: specs,
        articleCriteria: a.articleCriteria || [],
        images: a.images || [],
        images360: (a.images || []).filter(
          (img) =>
            img.fileName?.toLowerCase()?.includes('360') ||
            img.headerDescription?.toLowerCase()?.includes('360')
        ),
        oenNumbers: a.oenNumbers || [],
        imageUrl:
          a.imageUrl ||
          a.images?.[0]?.imageURL800 ||
          a.images?.[0]?.imageURL400 ||
          a.images?.[0]?.imageURL200 ||
          null,
        raw: a,
      };
    });
  }

  /**
   * Categorize single article into top-level automotive systems
   */
  categorizeArticle(article) {
    const genericId = Number(article.genericArticles?.[0]?.genericArticleId || article.genericArticleId || 0);
    const desc = (
      article.genericArticles?.[0]?.genericArticleDescription ||
      article.articleName ||
      article.title ||
      ''
    ).toLowerCase();

    // 1. Ignition & Glow Systems (NGK)
    if (
      [686, 243, 689, 685].includes(genericId) ||
      desc.includes('spark plug') ||
      desc.includes('glow plug') ||
      desc.includes('ignition') ||
      desc.includes('bougie')
    ) {
      let sub = 'Spark Plugs';
      if (desc.includes('glow')) sub = 'Glow Plugs';
      else if (desc.includes('coil')) sub = 'Ignition Coils';
      else if (desc.includes('cable') || desc.includes('lead') || desc.includes('wire')) sub = 'Ignition Leads';

      return {
        id: 'ignition',
        name: 'Ignition & Glow',
        icon: 'Zap',
        subCategory: sub,
      };
    }

    // 2. Sensors & Engine Electronics (NTK)
    if (
      [3922, 3923, 3925, 3926].includes(genericId) ||
      desc.includes('lambda') ||
      desc.includes('oxygen sensor') ||
      desc.includes('o2 sensor') ||
      desc.includes('sensor') ||
      desc.includes('probe') ||
      desc.includes('transmitter') ||
      desc.includes('flow meter')
    ) {
      let sub = 'Engine Sensors';
      if (desc.includes('lambda') || desc.includes('oxygen') || desc.includes('o2')) sub = 'Lambda / O2 Sensors';
      else if (desc.includes('temp')) sub = 'Temperature Sensors';
      else if (desc.includes('pressure') || desc.includes('map')) sub = 'Pressure Sensors';

      return {
        id: 'sensors',
        name: 'Sensors & Electronics',
        icon: 'Activity',
        subCategory: sub,
      };
    }

    // 3. Suspension & Damping (KYB)
    if (
      [854, 855, 856].includes(genericId) ||
      desc.includes('shock') ||
      desc.includes('damper') ||
      desc.includes('strut') ||
      desc.includes('spring') ||
      desc.includes('amortisseur')
    ) {
      let sub = 'Shock Absorbers';
      if (desc.includes('spring')) sub = 'Coil Springs';
      else if (desc.includes('mount') || desc.includes('bearing')) sub = 'Strut Mounts';

      return {
        id: 'suspension',
        name: 'Suspension & Damping',
        icon: 'ShieldCheck',
        subCategory: sub,
      };
    }

    // 4. Other Components
    return {
      id: 'general',
      name: 'Other Components',
      icon: 'Layers',
      subCategory: 'Components',
    };
  }

  /**
   * Group an array of articles into categorized buckets with counts and metadata
   */
  groupArticlesByCategory(articles = []) {
    const categoryMap = {
      ignition: { id: 'ignition', name: 'Ignition & Glow', icon: 'Zap', count: 0, articles: [] },
      sensors: { id: 'sensors', name: 'Sensors & Electronics', icon: 'Activity', count: 0, articles: [] },
      suspension: { id: 'suspension', name: 'Suspension & Damping', icon: 'ShieldCheck', count: 0, articles: [] },
      general: { id: 'general', name: 'Other Components', icon: 'Layers', count: 0, articles: [] },
    };

    const enrichedArticles = articles.map((article) => {
      const category = this.categorizeArticle(article);
      categoryMap[category.id].count += 1;
      categoryMap[category.id].articles.push(article);
      return { ...article, category };
    });

    const categories = Object.values(categoryMap).filter((cat) => cat.count > 0);

    return {
      articles: enrichedArticles,
      totalCount: enrichedArticles.length,
      categories,
      categoryCounts: {
        all: enrichedArticles.length,
        ignition: categoryMap.ignition.count,
        sensors: categoryMap.sensors.count,
        suspension: categoryMap.suspension.count,
        general: categoryMap.general.count,
      },
    };
  }
}

export const tecdocService = new TecDocService();
export default tecdocService;
