import ENV from './env.js';

export const TECDOC_CONFIG = {
  ENDPOINT: `${ENV.SERVICE_URL}/services/TecdocToCatDLB.jsonEndpoint`,
  DOCUMENTS_ENDPOINT: `${ENV.SERVICE_URL}/documents`,
  PROVIDER_ID: ENV.PROVIDER_ID,
  COUNTRY: ENV.DEFAULT_COUNTRY,
  LANG: ENV.DEFAULT_LANG,
  
  // Linkage Target Types (Pegasus 3.0)
  LINKAGE_TYPES: {
    PASSENGER: 'P',
    MOTORCYCLE: 'M',
    COMMERCIAL: 'O',
    AXLE: 'A',
    ENGINE: 'M',
    SERIES: 'S',
  },
};

export default TECDOC_CONFIG;
