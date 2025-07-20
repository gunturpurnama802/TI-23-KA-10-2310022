import axios from 'axios';

const API_KEY = 'f0767e20-27cb-43d5-a351-61e1b9ee3e7f';
const API_BASE_URL = 'http://api.airvisual.com/v2';

// PERUBAHAN: Fungsi diubah untuk menerima latitude dan longitude
export const getAirQuality = async (lat, lon) => {
  // Pastikan lat dan lon adalah angka yang valid sebelum membuat request
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    console.error('Koordinat tidak valid untuk getAirQuality');
    return null; // Mengembalikan null agar bisa ditangani di UI
  }
  
  try {
    // PERUBAHAN: Menggunakan endpoint `nearest_city` yang mencari berdasarkan koordinat
    const response = await axios.get(`${API_BASE_URL}/nearest_city`, {
      params: {
        lat: lat,
        lon: lon,
        key: API_KEY,
      },
      timeout: 10000 // Tambahkan timeout untuk mencegah loading tanpa akhir
    });
    
    // PERUBAHAN: Struktur response API mungkin berbeda, kita ambil data polusi
    // dari `data.data.current.pollution`
    if (response.data && response.data.data && response.data.data.current) {
      return response.data.data.current.pollution;
    } else {
      throw new Error('Struktur data kualitas udara tidak sesuai');
    }
  } catch (error) {
    // Tangani error dengan lebih baik
    console.error('Error fetching air quality:', error.message || error);
    // Jika ada response error dari server, log detailnya
    if (error.response) {
      console.error('IQAir API Response:', error.response.data);
    }
    return null; // Mengembalikan null agar aplikasi tidak crash
  }
};