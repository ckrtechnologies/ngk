import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SERVICE_URL = process.env.SERVICE_URL || 'https://webservice.tecalliance.services/pegasus-3-0';
const ENDPOINT = `${SERVICE_URL}/services/TecdocToCatDLB.jsonEndpoint`;
const PROVIDER_ID = parseInt(process.env.PROVIDER_ID, 10) || 25690;
const COUNTRY = 'ZA'; // South Africa
const LANG = 'en';

console.log('='.repeat(70));
console.log('🚀 TECDOC PEGASUS 3.0 WHITELIST & BRANDS TEST SCRIPT');
console.log('='.repeat(70));
console.log(`Endpoint:    ${ENDPOINT}`);
console.log(`Provider ID: ${PROVIDER_ID}`);
console.log(`Country:     ${COUNTRY}`);
console.log(`Language:    ${LANG}`);

async function checkPublicIp() {
  try {
    const res = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
    console.log(`Current Outbound IP: ${res.data.ip}`);
    return res.data.ip;
  } catch (err) {
    console.log(`Could not resolve public IP: ${err.message}`);
    return 'Unknown';
  }
}

async function testGetBrands() {
  console.log('\n' + '-'.repeat(70));
  console.log('📦 TEST 1: Fetching Product / Data Supplier Brands (getBrands) & Logos...');
  console.log('-'.repeat(70));

  const payload = {
    getBrands: {
      provider: PROVIDER_ID,
      articleCountry: COUNTRY,
      lang: LANG,
      includeAll: true,
      includeDataSupplierLogo: true,
      includeAddressDetails: true,
    },
  };

  try {
    const startTime = Date.now();
    const response = await axios.post(ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 15000,
    });
    const elapsedMs = Date.now() - startTime;

    console.log(`✅ Status Code: ${response.status} (${response.statusText}) [${elapsedMs}ms]`);
    console.log('TecDoc Response Headers:', response.headers['content-type']);

    const data = response.data;
    const brands = data?.data?.array || data?.brands || data?.array || [];

    console.log(`\n🎉 SUCCESS! Whitelisted IP confirmed working with Provider ${PROVIDER_ID}.`);
    console.log(`Total Brands Returned: ${brands.length}`);

    if (brands.length > 0) {
      console.log('\n--- Sample Brands & Logo Information ---');
      brands.slice(0, 15).forEach((b, idx) => {
        const brandName = b.brandName || b.name || b.dataSupplierName || b.mfrName || 'Unknown';
        const brandId = b.brandId || b.dataSupplierId || b.id || 'N/A';
        const logoDocId = b.brandLogoId || b.docId || b.logoDocId;
        const logoUrl = b.docURL || b.logoUrl || (logoDocId ? `${SERVICE_URL}/documents/${PROVIDER_ID}/${logoDocId}/0` : 'No direct URL');
        console.log(`[${idx + 1}] ID: ${brandId} | Name: ${brandName.padEnd(25)} | Logo: ${logoUrl}`);
      });

      if (brands.length > 15) {
        console.log(`... and ${brands.length - 15} more brands.`);
      }
    } else {
      console.log('Raw response structure:', JSON.stringify(data, null, 2).substring(0, 500));
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error calling getBrands:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return { success: false, error };
  }
}

async function testGetVehicleManufacturers() {
  console.log('\n' + '-'.repeat(70));
  console.log('🚗 TEST 2: Fetching Vehicle Manufacturers (getLinkageTargets & getManufacturers)...');
  console.log('-'.repeat(70));

  // Try Pegasus 3.0 getLinkageTargets first
  const payloadPegasus = {
    getLinkageTargets: {
      provider: PROVIDER_ID,
      linkageTargetCountry: COUNTRY,
      lang: LANG,
      linkageTargetType: 'P',
      includeMfrFacets: true,
      perPage: 0,
      page: 1,
    },
  };

  try {
    const startTime = Date.now();
    const response = await axios.post(ENDPOINT, payloadPegasus, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 15000,
    });
    const elapsedMs = Date.now() - startTime;

    console.log(`✅ Status Code: ${response.status} (${response.statusText}) [${elapsedMs}ms]`);

    const mfrCounts = response.data?.mfrFacets?.counts || [];
    console.log(`Total Vehicle Manufacturers Found (getLinkageTargets): ${mfrCounts.length || response.data?.total || 0}`);

    if (mfrCounts.length > 0) {
      console.log('\n--- Sample Vehicle Manufacturers ---');
      mfrCounts.slice(0, 15).forEach((m, idx) => {
        console.log(`[${idx + 1}] ID: ${m.id} | Name: ${m.name.padEnd(25)} | Vehicle Count: ${m.count}`);
      });
      if (mfrCounts.length > 15) {
        console.log(`... and ${mfrCounts.length - 15} more manufacturers.`);
      }
    } else {
      console.log('Trying fallback getManufacturers method...');
      const fallbackPayload = {
        getManufacturers: {
          provider: PROVIDER_ID,
          country: COUNTRY,
          lang: LANG,
          linkingTargetType: 'P',
        },
      };
      const fbRes = await axios.post(ENDPOINT, fallbackPayload, { timeout: 15000 });
      const fbMfrs = fbRes.data?.data?.array || [];
      console.log(`Total Manufacturers (getManufacturers): ${fbMfrs.length}`);
      fbMfrs.slice(0, 10).forEach((m, idx) => {
        console.log(`[${idx + 1}] ID: ${m.manuId} | Name: ${m.manuName}`);
      });
    }

    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error calling getLinkageTargets:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return { success: false, error };
  }
}

async function run() {
  await checkPublicIp();
  await testGetBrands();
  await testGetVehicleManufacturers();
  console.log('\n' + '='.repeat(70));
  console.log('🏁 TEST COMPLETED');
  console.log('='.repeat(70));
}

run();
