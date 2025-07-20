import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { getLocationId, getDailyForecast, getHourlyForecast } from '../services/forecaApi';
import { getAirQuality } from '../services/iqairApi';
import { Ionicons } from '@expo/vector-icons';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  return `${days[date.getDay()]}, ${date.getDate()}`;
};

const getWeatherEmoji = (symbolPhrase) => {
  const phrase = symbolPhrase?.toLowerCase() || '';
  if (phrase.includes('cerah') || phrase.includes('sunny')) return '☀️';
  if (phrase.includes('berawan') || phrase.includes('cloudy')) return '☁️';
  if (phrase.includes('hujan') || phrase.includes('rain')) return '🌧️';
  if (phrase.includes('badai') || phrase.includes('storm')) return '⛈️';
  return '⛅';
};

const formatTime = (timeString) => {
  const date = new Date(timeString);
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

export default function ForecastScreen({ route, navigation }) {
  const { location } = route.params;

  const [forecast, setForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [aqi, setAqi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHourIndex, setSelectedHourIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!location || !location.name) throw new Error('Data lokasi tidak valid');
        const locId = await getLocationId(location.name);
        const [daily, hourly, air] = await Promise.all([
          getDailyForecast(locId),
          getHourlyForecast(locId),
          getAirQuality(location.lat, location.lon)
        ]);
        setForecast(daily || []);
        setHourlyForecast(hourly || []);
        setAqi(air);

        if (hourly && hourly.length > 0) {
          const now = new Date();
          const currentHour = now.getHours();
          const closestHourIndex = hourly.findIndex(h => new Date(h.time).getHours() >= currentHour);
          setSelectedHourIndex(closestHourIndex !== -1 ? closestHourIndex : 0);
        }
      } catch (e) {
        const errorMessage = e.message || 'Terjadi kesalahan tidak diketahui.';
        setError(errorMessage);
        Alert.alert('Gagal Memuat Data', errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location]);

  const renderHourlyForecast = () => (
    hourlyForecast.length > 0 ? (
      <View style={styles.hourlyContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll}>
          {hourlyForecast.map((item, idx) => (
            <TouchableOpacity
              key={`${item.time}-${idx}`}
              style={[styles.hourlyItem, idx === selectedHourIndex && styles.hourlyItemActive]}
              onPress={() => setSelectedHourIndex(idx)}
            >
              <Text style={[styles.hourlyTemp, idx === selectedHourIndex && styles.hourlyTempActive]}>
                {`${Math.round(item.temperature)}°`}
              </Text>
              <View style={[styles.hourlyIconContainer, idx === selectedHourIndex && styles.hourlyIconActive]}>
                <Text style={styles.hourlyWeatherEmoji}>
                  {getWeatherEmoji(item.symbolPhrase)}
                </Text>
              </View>
              <Text style={[styles.hourlyTime, idx === selectedHourIndex && styles.hourlyTimeActive]}>
                {formatTime(item.time)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    ) : null
  );

  const renderDailyForecast = () => (
    forecast.length > 0 ? (
      <View style={styles.weeklyContainer}>
        {forecast.slice(0, 7).map((item, idx) => (
          <View key={item.date} style={[styles.dailyCard, idx === forecast.slice(0, 7).length - 1 && styles.dailyCardLast]}>
            <View style={styles.dailyLeft}>
              <Text style={styles.dayName}>{formatDate(item.date)}</Text>
            </View>
            <View style={styles.dailyCenter}>
              <Text style={styles.dailyWeatherEmoji}>{getWeatherEmoji(item.symbolPhrase)}</Text>
            </View>
            <View style={styles.dailyRight}>
              <Text style={styles.dailyTemp}>{`${Math.round(item.maxTemp)}°`}</Text>
            </View>
          </View>
        ))}
      </View>
    ) : null
  );

  const renderAirQuality = () => (
    aqi ? (
      <View style={styles.airQualityCard}>
        <Text style={styles.airQualityTitle}>Kualitas Udara</Text>
        <View style={styles.airQualityMainContent}>
          <View style={styles.airQualityLeft}>
            <Text style={styles.aqiNumber}>{aqi.aqius}</Text>
            <Text style={styles.aqiLabel}>AQI (US)</Text>
          </View>
          <View style={styles.airQualityRight}>
            <Text style={styles.aqiStatus}>
              {aqi.aqius <= 50 ? 'Baik' :
               aqi.aqius <= 100 ? 'Sedang' :
               aqi.aqius <= 150 ? 'Tidak Sehat' : 'Sangat Tidak Sehat'}
            </Text>
            <Text style={styles.currentPMText}>
              {`Polutan Utama: ${typeof aqi.mainus === 'string' ? aqi.mainus.toUpperCase() : 'N/A'}`}
            </Text>
          </View>
        </View>
      </View>
    ) : null
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Gagal memuat data.</Text>
          <Text style={styles.errorSubText}>{error}</Text>
        </View>
      );
    }
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderHourlyForecast()}
        {renderDailyForecast()}
        {renderAirQuality()}
      </ScrollView>
    );
  };

  const today = new Date();
  const headerDate = today.toLocaleDateString('id-ID', { month: 'long', day: 'numeric' });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="white" />
          <Text style={styles.backText}>Kembali</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
            {String(location.name)}
          </Text>
          <View style={styles.dateContainer}>
            <Text style={styles.headerDate}>{headerDate}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.mapsButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Ionicons name="map" size={20} color="white" />
        </TouchableOpacity>
      </View>
      {renderContent()}
    </View>
  );
}




const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#4C90FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { 
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 5,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  headerDate: {
    fontSize: 16,
    color: 'white',
  },
  mapsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: { 
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  hourlyContainer: {
    marginBottom: 30,
  },
  hourlyScroll: {
    paddingVertical: 15,
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 70,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 25,
  },
  hourlyItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  hourlyTemp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  hourlyTempActive: {
    color: 'white',
    fontWeight: '600',
  },
  hourlyIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  hourlyIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  hourlyWeatherEmoji: {
    fontSize: 24,
  },
  hourlyTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  hourlyTimeActive: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  weeklyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  dailyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dailyCardLast: {
    borderBottomWidth: 0,
  },
  dailyLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  dayName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  dailyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyWeatherEmoji: {
    fontSize: 24,
    textAlign: 'center',
  },
  dailyRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dailyTemp: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  airQualityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  airQualityTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  airQualityMainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  airQualityLeft: {
    alignItems: 'flex-start',
  },
  aqiNumber: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  aqiLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  airQualityRight: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: 20,
  },
  aqiStatus: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
    marginBottom: 8,
  },
  currentPMText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
});
