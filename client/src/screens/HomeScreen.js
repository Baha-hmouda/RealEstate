import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView, StyleSheet, Dimensions, StatusBar, FlatList, ScrollView, Pressable, TextInput, TouchableOpacity, Image, View, Text, Alert, ActivityIndicator } from 'react-native';
import storage from '../components/Authentification/storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import COLORS from '../consts/colors';
import axios from 'axios';
import FeaturedScroller from '../components/featuredScroller'; 
import socketserv from '../components/request/socketserv';


const { width } = Dimensions.get('screen');


const HomeScreen = ({ navigation }) => {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pressedCard, setPressedCard] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [userId, setUserId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchHouses(1);
    getUserId();
  }, []);

  const getUserId = useCallback(async () => {
    try {
      const userData = await storage.load({ key: 'loginState' });
      console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",userData);
      setUserId(userData.user);
      fetchFavorites(userData.user);
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
    }
  }, []);

  const fetchHouses = useCallback(async (page) => {
    setLoadingMore(true);
    try {
      const response = await axios.get(`http://192.168.1.201:4000/api/house/allhouses`);
      setHouses(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch houses');
      console.error('Failed to fetch houses:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);
  

  
  const fetchFavorites = async (userId) => {
    if (!userId) return;
    try {
      const response = await axios.get(`http://192.168.1.201:4000/api/favorites/${userId}/house`);
      const favoriteHouses = new Set(response.data.map(fav => fav.houseId));
      setFavorites(favoriteHouses);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };
  

  const toggleFavorite = useCallback(async (houseId) => {
    if (!userId) {
      Alert.alert('Error', 'User ID not set');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`http://192.168.1.201:4000/api/favorite/toggle`, { userId, estateId: houseId, type: 'house' });
      setFavorites(prev => {
        const updated = new Set(prev);
        if (updated.has(houseId)) {
          updated.delete(houseId);
        } else {
          updated.add(houseId);
        }
        return updated;
      });
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      Alert.alert('Error', 'Failed to update favorites');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const ListOptions = () => {
    const optionsList = [
      {
        title: 'See all houses',
        img: require('../assets/villa.jpg'),
        action: () => navigation.navigate('SeeAllHouses'),
      },
      {
        title: 'See all lands',
        img: require('../assets/land2.jpg'),
        action: () => navigation.navigate('SeeAllLands'),
      },
    ];

    


return (
      <View style={styles.optionListContainer}>
        {optionsList.map((option, index) => (
          <TouchableOpacity
            key={index}
            onPress={option.action}
            style={styles.optionCard}
            activeOpacity={0.8}
          >
            <Image source={option.img} style={styles.optionCardImage} />
            <View style={styles.optionCardContent}>
              <Text style={styles.optionCardTitle}>{option.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const toggleCard = useCallback((id) => {
    setPressedCard(pressedCard === id ? null : id);
  }, [pressedCard]);

  const renderHouseItem = ({ item }) => {
    const isFavorite = favorites.has(item.id);
    return (
      <Pressable onPress={() => toggleCard(item.id)}>
        <View style={styles.card}>
          <Image
            source={{ uri: item.Media[0]?.link || 'https://cdn.pixabay.com/photo/2014/11/21/17/17/house-540796_1280.jpg' }}
            style={styles.cardImage}
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardType}>{item.propertyType}</Text>
            <View style={styles.ratingContainer}>
              <View style={styles.rating}>
                <Icon name="star" size={20} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating || '4.5'}</Text>
              </View>
              <TouchableOpacity
                style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
                onPress={() => toggleFavorite(item.id)}
              >
                <Icon name={isFavorite ? "favorite" : "favorite-border"} size={20} color={isFavorite ? COLORS.red : COLORS.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.cardPrice}>${item.price}/month</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardLocation}>{item.location}</Text>
            {pressedCard === item.id && (
              <View style={styles.iconsContainer}>
                <View style={styles.iconRow}>
                  <Icon name="bathtub" size={20} color="#000" />
                  <Text style={styles.iconText}>{item.numberbathrooms}</Text>
                </View>
                <View style={styles.iconRow}>
                  <Icon name="king-bed" size={20} color="#000" />
                  <Text style={styles.iconText}>{item.numberbedrooms}</Text>
                </View>
                <View style={styles.iconRow}>
                  <Icon name="garage" size={20} color="#000" />
                  <Text style={styles.iconText}>{item.garage}</Text>
                </View>
                <View style={styles.iconRow}>
                  <Icon name="local-parking" size={20} color="#000" />
                  <Text style={styles.iconText}>{item.parking ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.iconRow}>
                  <Icon name="check-circle" size={20} color={item.isVerified ? '#00FF00' : '#FF0000'} />
                  <Text style={styles.iconText}>{item.isVerified ? 'Verified' : 'Not Verified'}</Text>
                </View>
                <View style={styles.iconRow}>
                  <Icon name="attach-money" size={20} color="#000" />
                  <Text style={styles.iconText}>{item.purchaseoption}</Text>
                </View>
                <View style={styles.iconRow}>
                  <Icon name="home" size={20} color="#000" />
                  <Text style={styles.iconText}>{item.houseAge}</Text>
                </View>
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => navigation.navigate('ViewDetailsHouse', { house: item })}
                >
                  <Text style={styles.detailsButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHouses(nextPage);
      flatListRef.current.scrollToOffset({ animated: true, offset: 0 }); // Scroll to top
    }
  }, [hasMore, loadingMore, page]);

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
        {loadingMore ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Text style={styles.loadMoreButtonText}>Load More</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={28} style={styles.searchIcon} />
            <TextInput
              placeholder="Search for houses, lands..."
              style={{ flex: 1 }}
            />
          </View>
          <TouchableOpacity style={styles.sortBtn} onPress={() => navigation.navigate('FilterScreen')}>
            <Icon name="tune" color={COLORS.white} size={28} />
          </TouchableOpacity>
          
          
          <TouchableOpacity style={styles.favoriteBtn} onPress={() => navigation.navigate('FavoritesScreen')}>
            <Icon name="favorite" color={COLORS.white} size={28} />
          </TouchableOpacity>
        </View>
        <ListOptions />

        <Text style={styles.sectionTitle}>Featured Properties</Text>
        {loading && page === 1 ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <FeaturedScroller
            houses={houses}
            navigation={navigation}
            toggleCard={toggleCard}
            pressedCard={pressedCard}
          />
        )}
        <Text style={styles.sectionTitle}>All Properties</Text>
        <FlatList
          data={houses}
          keyExtractor={(item) => `house-${item.id}`}
          renderItem={renderHouseItem}
          contentContainerStyle={styles.listContainer}
          numColumns={2}
          ListFooterComponent={renderFooter}
          ref={flatListRef}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
    color: '#888',
    fontSize: 27,
  },
  favoriteBtn: {
    padding: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    marginLeft: 10,
  },
  sortBtn: {
    padding: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 25,
  },
  
  optionListContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  optionCard: {
    width: width / 2.3,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  optionCardImage: {
    width: '100%',
    height: 120,
  },
  optionCardContent: {
    padding: 10,
    alignItems: 'center',
  },
  optionCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
  },
  featuredListContainer: {
    paddingVertical: 10,
    paddingLeft: 20,
  },
  listContainer: {
    padding: 4,
  },
  card: {
    elevation: 2,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: (width / 2) - 20,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 120,
  },
  cardContent: {
    padding: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardType: {
    fontSize: 14,
    color: '#888',
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    justifyContent: 'space-between',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 5,
    color: '#FFD700',
    fontSize: 16,
  },
  favoriteButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
    elevation: 5,
    borderColor: '#FFFFFF',
    borderWidth: 1,
    marginLeft: 10, // Add some space between the rating and the favorite button
  },
  favoriteButtonActive: {
    backgroundColor: '#FFD700',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginVertical: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardLocation: {
    fontSize: 12,
    color: '#888',
    marginVertical: 5,
  },
  iconsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  iconText: {
    marginLeft: 5,
    fontSize: 14,
  },
  detailsButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  loadMoreButton: {
    padding: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
  },
  loadMoreButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen
