import axios from 'axios';

const API_DOMAIN = 'https://pfa.foreca.com';
const USERNAME = 'adi2422sd';
const PASSWORD = 'UBFWATVmyIG6';

let accessToken = null;
let tokenPromise = null; // Promise untuk mengelola permintaan token yang sedang berjalan

// Fungsi getAccessToken yang lebih cerdas untuk mencegah multiple request
export const getAccessToken = () => {
  if (accessToken) {
    return Promise.resolve(accessToken);
  }

  if (tokenPromise) {
    return tokenPromise;
  }

  tokenPromise = new Promise(async (resolve, reject) => {
    try {
      const response = await axios.post(`${API_DOMAIN}/authorize/token?expire_hours=2`, {
        user: USERNAME,
        password: PASSWORD,
      });
      accessToken = response.data.access_token;
      tokenPromise = null; // Hapus promise setelah berhasil
      resolve(accessToken);
    } catch (error) {
      console.error("Gagal mendapatkan access token Foreca:", error.response?.data || error.message);
      tokenPromise = null; // Hapus promise jika gagal
      reject(new Error("Otentikasi ke layanan cuaca gagal."));
    }
  });

  return tokenPromise;
};


export const getLocationId = async (city) => {
  const token = await getAccessToken();
  try {
    const res = await axios.get(`${API_DOMAIN}/api/v1/location/search/${city}?lang=id`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data && res.data.locations && res.data.locations.length > 0) {
      return res.data.locations[0].id;
    } else {
      console.warn(`Lokasi "${city}" tidak ditemukan di database cuaca.`);
      throw new Error(`Data cuaca untuk "${city}" tidak tersedia.`);
    }
  } catch (error) {
    if (error.response && error.response.status === 429) {
      throw new Error('Terlalu banyak permintaan. Coba lagi beberapa saat.');
    }
    if (!error.message.includes("Data cuaca untuk")) {
        console.error(`Error saat mencari location ID untuk "${city}":`, error.message);
    }
    throw error;
  }
};

export const getCurrentWeather = async (locationId) => {
  const token = await getAccessToken();
  const res = await axios.get(`${API_DOMAIN}/api/v1/current/${locationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.current;
};

export const getDailyForecast = async (locationId) => {
  const token = await getAccessToken();
  const res = await axios.get(`${API_DOMAIN}/api/v1/forecast/daily/${locationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.forecast;
};

export const getHourlyForecast = async (locationId) => {
  const token = await getAccessToken();
  const res = await axios.get(`${API_DOMAIN}/api/v1/forecast/hourly/${locationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.forecast;
};
