import { BASE_URL } from '../config/api';

export const SOUTH_AFRICA_CITY_PRESETS = [
  { name: 'Sandton (Johannesburg)', city: 'Sandton', lat: -26.1076, lon: 28.0567, address: 'Sandton, Johannesburg, 2196' },
  { name: 'Johannesburg Central', city: 'Johannesburg', lat: -26.2041, lon: 28.0473, address: 'Johannesburg CBD, Gauteng, 2001' },
  { name: 'Midrand Logistics Hub', city: 'Midrand', lat: -25.9983, lon: 28.1263, address: 'Midrand, Johannesburg, 1685' },
  { name: 'Cape Town Central', city: 'Cape Town', lat: -33.9249, lon: 18.4241, address: 'Cape Town, Western Cape, 8001' },
  { name: 'Bellville (Cape Town)', city: 'Cape Town', lat: -33.8998, lon: 18.6288, address: 'Bellville, Cape Town, 7530' },
  { name: 'Durban Coastal', city: 'Durban', lat: -29.8587, lon: 31.0218, address: 'Durban, KwaZulu-Natal, 4001' },
  { name: 'Pretoria Metro', city: 'Pretoria', lat: -25.7479, lon: 28.2293, address: 'Pretoria, Gauteng, 0002' },
  { name: 'Gqeberha (Port Elizabeth)', city: 'Gqeberha', lat: -33.9608, lon: 25.6022, address: 'Gqeberha, Eastern Cape, 6001' },
  { name: 'Bloemfontein', city: 'Bloemfontein', lat: -29.0852, lon: 26.1596, address: 'Bloemfontein, Free State, 9301' },
];

/**
 * Reverse geocode coordinates to human-readable address & city
 */
export const reverseGeocode = async (lat, lon) => {
  if (!lat || !lon) throw new Error('Latitude and Longitude are required');

  // 1. Try Backend Proxy first
  try {
    const res = await fetch(`${BASE_URL}/dealers/reverse-geocode?lat=${lat}&lon=${lon}`);
    const data = await res.json();
    if (data && data.success && data.formattedAddress) {
      return {
        address: data.formattedAddress,
        city: data.city || 'Johannesburg',
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
      };
    }
  } catch {
    // Fall back to direct Nominatim
  }

  // 2. Direct Nominatim fallback
  const directUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  const directRes = await fetch(directUrl);
  const directData = await directRes.json();
  if (!directData || !directData.display_name) {
    throw new Error('Address not found for these coordinates');
  }

  const addr = directData.address || {};
  const city = addr.city || addr.town || addr.municipality || addr.suburb || 'Johannesburg';

  return {
    address: directData.display_name,
    city,
    latitude: parseFloat(directData.lat || lat),
    longitude: parseFloat(directData.lon || lon),
  };
};

/**
 * Geocode text address into latitude and longitude coordinates
 */
export const geocodeAddress = async (addressText) => {
  if (!addressText || !addressText.trim()) throw new Error('Address text is required');
  const clean = addressText.trim();

  // 1. Try Backend Proxy first
  try {
    const res = await fetch(`${BASE_URL}/dealers/geocode?address=${encodeURIComponent(clean)}`);
    const data = await res.json();
    if (data && data.success && data.latitude && data.longitude) {
      return {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        formattedAddress: data.formattedAddress || clean,
      };
    }
  } catch {
    // Fall back to direct Nominatim
  }

  // 2. Direct Nominatim fallback
  const directUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clean)}&countrycodes=za&limit=1`;
  const directRes = await fetch(directUrl);
  const directData = await directRes.json();
  if (directData && directData.length > 0) {
    const item = directData[0];
    return {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      formattedAddress: item.display_name,
    };
  }

  // Fallback search without country filter
  const fbUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clean)}&limit=1`;
  const fbRes = await fetch(fbUrl);
  const fbData = await fbRes.json();
  if (fbData && fbData.length > 0) {
    const item = fbData[0];
    return {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      formattedAddress: item.display_name,
    };
  }

  throw new Error('Could not find coordinates for this address. Please verify or use city presets.');
};

/**
 * Detect user's current GPS position via browser Geolocation and prefetch address text
 */
export const detectCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Browser geolocation is not supported on this device'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const result = await reverseGeocode(latitude, longitude);
          resolve(result);
        } catch {
          // If reverse geocoding fails, return raw coordinates
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            address: `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
            city: 'Johannesburg',
          });
        }
      },
      (err) => {
        reject(new Error(err.message || 'Unable to retrieve your current location'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
};
