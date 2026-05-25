import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { ChevronLeft, Home, Search, Settings, MapPin, Phone, Loader2, MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getDealersRedux, getUsersRedux } from '../redux/getData';


const DealerLocatorScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();
  const { dealers: apiDealersData, loading, myself, users, selectedVehicle, part } = useSelector((state) => state.getData);
  const [dynamicDealers, setDynamicDealers] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const geocodingRef = React.useRef(false);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          console.log('Location permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation(position.coords);
      },
      (error) => {
        console.log(error.code, error.message);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    );
  };


  React.useEffect(() => {
    requestLocationPermission();
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  React.useEffect(() => {
    if (!currentLocation || dynamicDealers.length === 0 || geocodingRef.current) return;

    const hasUncalculated = dynamicDealers.some(d => d.distance === 'N/A');
    if (!hasUncalculated) return;

    geocodingRef.current = true;

    const processDistances = async () => {
      let dealersCopy = [...dynamicDealers];
      let updated = false;
      const isOwner = myself?.role === "owner";

      for (let i = 0; i < dealersCopy.length; i++) {
        if (dealersCopy[i].distance !== 'N/A') continue;

        const dealer = dealersCopy[i];
        console.log(dealer, "dealer")
        const hasAddress = isOwner
          ? (dealer.address && dealer.address.trim().length > 0)
          : (dealer.address && dealer.address !== 'Address not available');

        if (!hasAddress) {
          dealersCopy[i] = { ...dealersCopy[i], distance: 'N/A' };
          updated = true;
        } else {
          const searchString = isOwner
            ? dealer.address
            : `${dealer.address}, ${dealer.city}, ${dealer.zip}`;
          try {
            // Try Nominatim first with standard browser headers
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchString)}`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.openstreetmap.org/',
                'Accept': 'application/json'
              }
            });
            console.log(res, "res");
            let lat = null;
            let lon = null;
            if (res.ok) {
              const text = await res.text();
              try {
                const data = JSON.parse(text);
                if (data && data.length > 0) {
                  lat = parseFloat(data[0].lat);
                  lon = parseFloat(data[0].lon);
                }
              } catch (parseErr) {
                console.log("JSON parse error on search text");
              }
            }

            // Fallback to BigDataCloud free forward geocoding API if Nominatim returns 403 Forbidden or no results
            if ((!lat || !lon) && dealer.city) {
              console.log("Nominatim search failed or empty, trying BigDataCloud fallback for city:", dealer.city);
              const bdcRes = await fetch(`https://api.bigdatacloud.net/data/geocoding-by-locality?localityLanguage=en&locality=${encodeURIComponent(dealer.city)}`);
              if (bdcRes.ok) {
                const bdcData = await bdcRes.json();
                if (bdcData && bdcData.latitude && bdcData.longitude) {
                  lat = parseFloat(bdcData.latitude);
                  lon = parseFloat(bdcData.longitude);
                }
              }
            }

            if (lat && lon) {
              const dist = calculateDistance(currentLocation.latitude, currentLocation.longitude, lat, lon);
              dealersCopy[i] = { ...dealersCopy[i], distance: `${dist} km` };
            } else {
              dealersCopy[i] = { ...dealersCopy[i], distance: 'Unknown' };
            }
            updated = true;
          } catch (e) {
            console.log("Geocoding error", e);
            dealersCopy[i] = { ...dealersCopy[i], distance: 'Unknown' };
            updated = true;
          }
        }

        if (updated) {
          setDynamicDealers([...dealersCopy]);
          updated = false;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      geocodingRef.current = false;
    };

    processDistances();
  }, [currentLocation, dynamicDealers, myself]);

  React.useEffect(() => {
    const payload = {
      "getBrands": {
        "articleCountry": "ZA",
        "lang": "en",
        "includeAll": true
      }
    };
    dispatch(getDealersRedux(payload));

    if (!users) {
      dispatch(getUsersRedux());
    }
  }, [dispatch]);



  React.useEffect(() => {
    if (myself?.role === "owner") {
      const dealers = (users || []).filter(user => user.role?.toLowerCase() === "reseller" || user.role?.toLowerCase() === "distributor").map(user => ({
        ...user,
        distance: 'N/A'
      }));

      console.log(dealers, "dealers1");
      setDynamicDealers(dealers);
    }
    else {

      if (apiDealersData?.data?.array) {
        const brandsArray = apiDealersData.data.array;
        const extractedDealers = [];

        console.log(brandsArray, '-----------------brandsArray');

        brandsArray.forEach((brand, bIndex) => {
          if (brand.addressDetails) {
            const addresses = Array.isArray(brand.addressDetails) ? brand.addressDetails : [brand.addressDetails];
            addresses.forEach((addr, aIndex) => {
              extractedDealers.push({
                id: `${brand.mfrId || bIndex}-${aIndex}`,
                name: addr.name || brand.mfrName || addr.addressName || 'Unknown Dealer',
                address: addr.street || addr.street2 || 'Address not available',
                type: addr.addressType === 1 ? 'Distributor' : 'Reseller',
                distance: 'N/A', // Distance usually not provided by getBrands unless coordinates are used
                status: 'Open',
                zip: addr.zip || addr.zipCode || addr.mailbox || '',
                city: addr.city || addr.city2 || '',
                phone: addr.phone || '',
                logo: brand.dataSupplierLogo?.imageURL200 || null,
              });
            });
          }
        });
        setDynamicDealers(extractedDealers);
      }
    }
  }, [apiDealersData, myself, users]);

  const filteredDealers = dynamicDealers.filter(dealer => {
    const query = searchQuery.toLowerCase();
    const isOwner = myself?.role === "owner";
    if (isOwner) {
      return (
        (dealer.name && dealer.name.toLowerCase().includes(query)) ||
        (dealer.address && dealer.address.toLowerCase().includes(query))
      );
    } else {
      return (
        (dealer.city && dealer.city.toLowerCase().includes(query)) ||
        (dealer.zip && dealer.zip.includes(searchQuery)) ||
        (dealer.name && dealer.name.toLowerCase().includes(query))
      );
    }
  });

  const handleNavigate = (dealer) => {
    const isOwner = myself?.role === "owner";
    const destination = isOwner
      ? (dealer.address || '')
      : `${dealer.address}, ${dealer.city}, ${dealer.zip}`;

    if (!destination || destination.trim() === '' || destination === 'Address is not shared' || destination.includes('Address not available')) {
      alert('Address is not available for navigation');
      return;
    }
    const url = Platform.select({
      ios: `maps://app?daddr=${encodeURIComponent(destination)}`,
      android: `google.navigation:q=${encodeURIComponent(destination)}`
    });
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  };

  const renderBadge = (dealer) => {
    const isOwner = myself?.role === "owner";
    const dealerType = isOwner ? 'Reseller' : dealer.type;
    return (
      <View style={styles.badgeRow}>
        <View style={[styles.badge, dealerType === 'Reseller' ? styles.resellerBadge : styles.distributorBadge]}>
          <Text style={styles.badgeText}>{dealerType}</Text>
        </View>
        {dealer.status === 'Closed' && (
          <View style={[styles.badge, styles.closedBadge]}>
            <Text style={styles.badgeText}>Closed</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#FFFFFF" size={wp('6%')} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dealer Locator</Text>
        <TouchableOpacity style={styles.homeIconContainer} onPress={() => navigation.navigate('OwnerHome')}>
          <Home color="#C6122E" size={wp('5%')} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <Search color="#8E8E8E" size={wp('5%')} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city or zip..."
            placeholderTextColor="#8E8E8E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{filteredDealers.length} nearest results</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Settings color="#C6122E" size={wp('4%')} />
            <Text style={styles.settingsText}>Map Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Dealer Cards */}
        {loading ? (
          <View style={{ alignItems: 'center', marginTop: hp('5%') }}>
            <Text style={{ color: '#8E8E8E' }}>Loading dealers...</Text>
          </View>
        ) : filteredDealers.length > 0 ? (
          filteredDealers.map((dealer) => {
            const isOwner = myself?.role === "owner";
            const displayAddress = isOwner
              ? (dealer.address ? dealer.address : 'Address is not shared')
              : `${dealer.address} ${dealer.city ? `, ${dealer.city}` : ''} ${dealer.zip ? `- ${dealer.zip}` : ''}`;

            return (
              <View key={dealer.id} style={styles.dealerCard}>
                <View style={styles.cardInfoRow}>
                  <View style={styles.cardLeft}>
                    {renderBadge(dealer)}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: hp('0.5%') }}>
                      {dealer.logo ? (
                        <Image source={{ uri: dealer.logo }} style={{ width: wp('15%'), height: wp('10%'), resizeMode: 'contain', marginRight: wp('3%') }} />
                      ) : null}
                      <Text style={[styles.dealerName, { flex: 1, marginBottom: 0 }]}>{dealer.name}</Text>
                    </View>
                    <Text style={styles.dealerAddress}>{displayAddress}</Text>
                    {dealer.phone ? <Text style={styles.dealerAddress}>Phone: {dealer.phone}</Text> : null}
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.distanceValue}>{dealer.distance}</Text>
                    <Text style={styles.distanceLabel}>DISTANCE</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.navigateBtn} onPress={() => handleNavigate(dealer)}>
                    <MapPin color="#000000" size={wp('4%')} />
                    <Text style={styles.navigateBtnText}>Navigate</Text>
                  </TouchableOpacity>
                  {myself?.role === "owner" ?
                    <TouchableOpacity onPress={() => {
                      navigation.navigate('TechnicalEnquiry', { dealerId: dealer.id, part: part ? part : null, vehicle: selectedVehicle ? selectedVehicle : null });
                    }} style={styles.callBtn}>
                      <MessageCircle color="#FFFFFF" size={wp('4%')} />
                      <Text style={styles.callBtnText}>Create Enquiry</Text>
                    </TouchableOpacity>
                    : <TouchableOpacity onPress={() => {
                      if (dealer.phone) {
                        Linking.openURL(`tel:${dealer.phone}`);
                      } else {
                        alert('Phone number is not available');
                      }
                    }} style={styles.callBtn}>
                      <Phone color="#FFFFFF" size={wp('4%')} />
                      <Text style={styles.callBtnText}>Call store</Text>
                    </TouchableOpacity>}
                </View>
              </View>
            );
          })
        ) : (
          <View style={{ alignItems: 'center', marginTop: hp('5%') }}>
            <Text style={{ color: '#8E8E8E' }}>No dealers found</Text>
          </View>
        )}

        <View style={{ height: hp('5%') }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    backgroundColor: '#C6122E',
    height: hp('8%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    // marginTop:35,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
  },
  homeIconContainer: {
    backgroundColor: '#FFFFFF',
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: wp('6%'),
    paddingTop: hp('2%'),
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: wp('4%'),
    paddingHorizontal: wp('4%'),
    height: hp('8%'),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: hp('2%'),
  },
  searchIcon: {
    marginRight: wp('3%'),
  },
  searchInput: {
    flex: 1,
    fontSize: wp('3.5%'),
    color: '#000000',
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: hp('4%'),
  },
  filterBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('8%'),
    marginRight: wp('3%'),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flex: 1,
    alignItems: 'center',
  },
  activeFilterBtn: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterText: {
    fontSize: wp('3.2%'),
    color: '#000000',
    fontWeight: 'bold',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2.5%'),
  },
  resultsCount: {
    fontSize: wp('3.2%'),
    color: '#000000',
    fontWeight: 'bold',
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsText: {
    fontSize: wp('3%'),
    color: '#C6122E',
    fontWeight: 'bold',
    marginLeft: wp('1.5%'),
  },
  dealerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('6%'),
    padding: wp('5%'),
    marginBottom: hp('2.5%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('2.5%'),
  },
  cardLeft: {
    flex: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: hp('1%'),
  },
  badge: {
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('1.5%'),
    marginRight: wp('2%'),
  },
  resellerBadge: {
    backgroundColor: '#2E8B57',
  },
  distributorBadge: {
    backgroundColor: '#0047AB',
  },
  closedBadge: {
    backgroundColor: '#C6122E',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: wp('2.4%'),
    fontWeight: 'bold',
  },
  dealerName: {
    fontSize: wp('4.5%'),
    fontWeight: '900',
    color: '#000000',
    marginBottom: hp('0.5%'),
  },
  dealerAddress: {
    fontSize: wp('3%'),
    color: '#8E8E8E',
    fontWeight: '500',
  },
  distanceValue: {
    fontSize: wp('4.5%'),
    fontWeight: '900',
    color: '#C6122E',
  },
  distanceLabel: {
    fontSize: wp('2.4%'),
    color: '#8E8E8E',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navigateBtn: {
    flex: 1,
    flexDirection: 'row',
    height: hp('7%'),
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#D1D1D1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  navigateBtnText: {
    color: '#000000',
    fontSize: wp('3.2%'),
    fontWeight: 'bold',
    marginLeft: wp('2%'),
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    height: hp('7%'),
    backgroundColor: '#000000',
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: wp('3.2%'),
    fontWeight: 'bold',
    marginLeft: wp('2%'),
  },
});

export default DealerLocatorScreen;
