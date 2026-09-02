import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Supabase Database & Auth (VPS Hosted Supabase)
  SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ngkdb.ckrtechnologies.in',
  SUPABASE_KEY: process.env.PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // TecAlliance TecDoc Pegasus 3.0
  SERVICE_URL: process.env.SERVICE_URL || 'https://webservice.tecalliance.services/pegasus-3-0',
  PROVIDER_ID: parseInt(process.env.PROVIDER_ID, 10) || 25690,
  TECDOC_API_KEY: process.env.TECDOC_API_KEY || '',
  DEFAULT_COUNTRY: process.env.DEFAULT_COUNTRY || 'ZA',
  DEFAULT_LANG: process.env.DEFAULT_LANG || 'en',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'ngk-super-secure-jwt-secret-key-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};

export default ENV;
