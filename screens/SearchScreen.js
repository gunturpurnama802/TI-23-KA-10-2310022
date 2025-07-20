import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// DIKEMBALIKAN: Import getPopularCities
import { searchLocations, getPopularCities } from '../services/locationService';

export default function SearchScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  // DIKEMBALIKAN: Menggunakan state untuk kota populer manual
  const [popularCities] = useState(getPopularCities());

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText.length >= 2) {
        performSearch(searchText);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const performSearch = async (query) => {
    setLoading(true);
    try {
      const results = await searchLocations(query, 8);
      setSearchResults(results);
    } catch (error) {
      Alert.alert('Error', error.message || 'Gagal mencari lokasi');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    Keyboard.dismiss();
    navigation.navigate('Home', {
      location: {
        name: location.name,
        lat: location.lat,
        lon: location.lon,
      }
    });
  };

  const renderLocationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => handleLocationSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.locationIcon}>
        <Ionicons name="location-outline" size={20} color="#4C90FF" />
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationDetails} numberOfLines={1}>{item.fullName}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderPopularCityItem = ({ item }) => (
    <TouchableOpacity
      style={styles.popularCityItem}
      onPress={() => handleLocationSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.popularCityIcon}>
        <Ionicons name="location" size={18} color="#666" />
      </View>
      <Text style={styles.popularCityName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const clearSearch = () => setSearchText('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pilih Lokasi</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kota atau tempat..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="words"
            returnKeyType="search"
            autoFocus={true}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4C90FF" />
          </View>
        )}

        {searchText.length >= 2 && !loading && (
          <FlatList
            data={searchResults}
            renderItem={renderLocationItem}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={() => <Text style={styles.sectionTitle}>Hasil Pencarian</Text>}
            ListEmptyComponent={() => (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={48} color="#ccc" />
                <Text style={styles.noResultsText}>Tidak ada hasil untuk "{searchText}"</Text>
              </View>
            )}
          />
        )}

        {searchText.length < 2 && !loading && (
          <FlatList
            data={popularCities}
            renderItem={renderPopularCityItem}
            keyExtractor={(item) => item.name}
            numColumns={2}
            ListHeaderComponent={() => <Text style={styles.sectionTitle}>Kota Populer</Text>}
            columnWrapperStyle={styles.popularRow}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingTop: 20,
    paddingBottom: 10,
  },
  popularRow: {
    justifyContent: 'space-between',
  },
  popularCityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 12,
    marginBottom: 10,
    width: '48.5%',
    borderWidth: 1,
    borderColor: '#eee'
  },
  popularCityIcon: {
    marginRight: 8,
  },
  popularCityName: {
    color: '#333',
    fontWeight: '500',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  locationIcon: {
    marginRight: 15,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  locationDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  noResultsText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
});