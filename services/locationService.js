// services/locationService.js
import axios from 'axios';

// Using OpenStreetMap Nominatim API for geocoding (free and reliable)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export const searchLocations = async (query, limit = 5) => {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params: {
        format: 'json',
        q: query,
        limit: limit,
        'accept-language': 'id,en',
        countrycodes: 'id', // Focus on Indonesia
        addressdetails: 1,
        extratags: 1,
        namedetails: 1
      },
      timeout: 5000
    });

    if (response.data && Array.isArray(response.data)) {
      return response.data.map(item => ({
        id: item.place_id,
        name: getLocationName(item),
        fullName: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type || 'unknown',
        importance: item.importance || 0
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching locations:', error);
    throw new Error('Gagal mencari lokasi. Periksa koneksi internet Anda.');
  }
};

// Extract a clean location name from the Nominatim response
const getLocationName = (item) => {
  // Try to get the most appropriate name
  if (item.namedetails && item.namedetails.name) {
    return item.namedetails.name;
  }
  
  if (item.address) {
    // Priority order for location names
    const nameFields = [
      'city', 'town', 'village', 'suburb', 'neighbourhood',
      'county', 'state_district', 'state', 'region'
    ];
    
    for (const field of nameFields) {
      if (item.address[field]) {
        return item.address[field];
      }
    }
  }
  
  // Fallback to first part of display_name
  return item.display_name.split(',')[0];
};

// Get detailed information about a specific location
export const getLocationDetails = async (lat, lon) => {
  try {
    const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
      params: {
        format: 'json',
        lat: lat,
        lon: lon,
        'accept-language': 'id,en',
        addressdetails: 1,
        extratags: 1,
        namedetails: 1,
        zoom: 10
      },
      timeout: 5000
    });

    if (response.data) {
      const item = response.data;
      return {
        name: getLocationName(item),
        fullName: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        address: item.address,
        type: item.type || 'unknown'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting location details:', error);
    throw new Error('Gagal mendapatkan detail lokasi.');
  }
};

// Popular Indonesian cities for quick access
export const getPopularCities = () => {
  return [
    { name: 'Jakarta', lat: -6.2088, lon: 106.8456, fullName: 'Jakarta, Indonesia' },
    { name: 'Bogor', lat: -6.5950, lon: 106.8161, fullName: 'Bogor, Jawa Barat, Indonesia' },
    { name: 'Bandung', lat: -6.9175, lon: 107.6191, fullName: 'Bandung, Jawa Barat, Indonesia' },
    { name: 'Surabaya', lat: -7.2575, lon: 112.7521, fullName: 'Surabaya, Jawa Timur, Indonesia' },
    { name: 'Yogyakarta', lat: -7.7956, lon: 110.3695, fullName: 'Yogyakarta, Indonesia' },
    { name: 'Medan', lat: 3.5952, lon: 98.6722, fullName: 'Medan, Sumatera Utara, Indonesia' },
    { name: 'Semarang', lat: -6.9669, lon: 110.4203, fullName: 'Semarang, Jawa Tengah, Indonesia' },
    { name: 'Makassar', lat: -5.1477, lon: 119.4327, fullName: 'Makassar, Sulawesi Selatan, Indonesia' },
    { name: 'Palembang', lat: -2.9761, lon: 104.7754, fullName: 'Palembang, Sumatera Selatan, Indonesia' },
    { name: 'Tangerang', lat: -6.1701, lon: 106.6403, fullName: 'Tangerang, Banten, Indonesia' }
  ];
};

// Validate coordinates
export const isValidCoordinate = (lat, lon) => {
  return (
    typeof lat === 'number' && 
    typeof lon === 'number' &&
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180
  );
};