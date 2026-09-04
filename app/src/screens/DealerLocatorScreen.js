import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Linking,
  ActivityIndicator,
  RefreshControl,
  Platform,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Phone,
  Search,
  Store,
  MessageSquare,
  X,
  Navigation as NavigationIcon,
  ShieldCheck,
  Building2,
  Locate,
  SlidersHorizontal,
} from 'lucide-react-native';
import Geolocation from '@react-native-community/geolocation';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { apiFunction } from '../apis/apiFunction';
import { dealersApi } from '../apis/api';
import { getDealersRedux } from '../redux/getData';
import AppHeader from '../components/common/AppHeader';
import DealerFilterModal, {
  DEFAULT_FILTERS,
} from '../components/common/DealerFilterModal';

const DealerLocatorScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const { dealers: apiDealersData } = useSelector((state) => state.getData);

  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Modal & Filter State
  const [modalVisible, setModalVisible] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const fetchDealers = useCallback(
    async (coords = null, customRadius = null) => {
      try {
        const activeRadius =
          customRadius !== null ? customRadius : filters.radius;
        const queryParams =
          coords?.userLat && coords?.userLon
            ? {
                userLat: coords.userLat,
                userLon: coords.userLon,
                ...(activeRadius && activeRadius < 1000
                  ? { radius: activeRadius }
                  : {}),
              }
            : {};

        const res = await apiFunction(dealersApi, [], queryParams, 'GET', false);
        const list =
          res?.dealers ||
          res?.data?.array ||
          (Array.isArray(res?.data) ? res.data : []) ||
          [];
        setDealers(list);
        dispatch(getDealersRedux(queryParams));
      } catch (err) {
        console.warn('Failed to load dealers:', err);
        // Fallback to Redux data if available
        const reduxList =
          apiDealersData?.data?.array ||
          (Array.isArray(apiDealersData) ? apiDealersData : []) ||
          apiDealersData?.dealers ||
          [];
        if (reduxList.length > 0) setDealers(reduxList);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLocating(false);
      }
    },
    [apiDealersData, dispatch, filters.radius]
  );

  const acquireGPS = useCallback(async () => {
    setLocating(true);
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'NGK Location Access',
            message:
              'Allow NGK to discover verified stockists and dealers near your current location.',
            buttonPositive: 'Allow',
            buttonNegative: 'Cancel',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setLocating(false);
          fetchDealers(null);
          return;
        }
      }

      Geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            userLat: pos.coords.latitude,
            userLon: pos.coords.longitude,
          };
          setUserCoords(coords);
          fetchDealers(coords);
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          setLocating(false);
          fetchDealers(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (err) {
      console.warn('Failed to acquire location:', err);
      setLocating(false);
      fetchDealers(null);
    }
  }, [fetchDealers]);

  useEffect(() => {
    acquireGPS();
  }, [acquireGPS]);

  const onRefresh = () => {
    setRefreshing(true);
    if (userCoords) {
      fetchDealers(userCoords);
    } else {
      acquireGPS();
    }
  };

  // Compute how many non-default filter settings are active
  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.radius !== 50) c++;
    if (filters.role !== 'all') c++;
    if (filters.sortBy !== 'nearest') c++;
    if (filters.hasWhatsApp) c++;
    if (filters.hasPhone) c++;
    if (filters.oemCertified) c++;
    if (filters.province && filters.province !== 'All Provinces') c++;
    return c;
  }, [filters]);

  // Apply complete set of client & server filter rules
  const filteredDealers = useMemo(() => {
    let list = dealers.filter((d) => {
      // 1. Role filter
      if (filters.role === 'distributor' && d.role !== 'distributor') return false;
      if (filters.role === 'reseller' && d.role !== 'reseller') return false;

      // 2. Distance radius filter (if radius < 1000 and distance is available)
      if (
        filters.radius < 1000 &&
        d.distanceKm !== undefined &&
        d.distanceKm !== null &&
        d.distanceKm !== 999999
      ) {
        if (d.distanceKm > filters.radius) return false;
      }

      // 3. Capabilities & Badges
      if (filters.hasWhatsApp && !d.phone) return false;
      if (filters.hasPhone && !d.phone) return false;
      if (filters.oemCertified && d.isApproved === false) return false;

      // 4. Province filter
      if (
        filters.province &&
        filters.province !== 'All Provinces' &&
        filters.province !== 'all'
      ) {
        const prov = (d.province || '').toLowerCase();
        const city = (d.city || '').toLowerCase();
        const address = (d.address || d.streetAddress || '').toLowerCase();
        const target = filters.province.toLowerCase();
        if (
          !prov.includes(target) &&
          !city.includes(target) &&
          !address.includes(target)
        ) {
          return false;
        }
      }

      // 5. Text search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (
          d.name ||
          d.dealer_name ||
          d.companyName ||
          ''
        ).toLowerCase();
        const city = (d.city || '').toLowerCase();
        const province = (d.province || '').toLowerCase();
        const address = (d.address || d.streetAddress || '').toLowerCase();
        if (
          !name.includes(query) &&
          !city.includes(query) &&
          !province.includes(query) &&
          !address.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });

    // 6. Sort Order
    if (filters.sortBy === 'alpha') {
      list.sort((a, b) => {
        const nameA = a.name || a.companyName || '';
        const nameB = b.name || b.companyName || '';
        return nameA.localeCompare(nameB);
      });
    } else {
      // Default: nearest first
      list.sort((a, b) => {
        const distA =
          a.distanceKm !== undefined && a.distanceKm !== null
            ? a.distanceKm
            : 999999;
        const distB =
          b.distanceKm !== undefined && b.distanceKm !== null
            ? b.distanceKm
            : 999999;
        return distA - distB;
      });
    }

    return list;
  }, [dealers, searchQuery, filters]);

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => {});
    }
  };

  const handleWhatsApp = (phone) => {
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${cleanPhone}`).catch(() => {});
    }
  };

  const handleOpenMap = (dealer) => {
    const query = encodeURIComponent(
      `${dealer.name || ''}, ${dealer.address || dealer.streetAddress || ''}, ${
        dealer.city || ''
      }`
    );
    Linking.openURL(`https://maps.google.com/?q=${query}`).catch(() => {});
  };

  const handleEnquire = (dealer) => {
    navigation.navigate('TechnicalEnquiry', {
      dealerId: dealer.id || dealer.dealerId,
      dealerName: dealer.name || dealer.companyName,
    });
  };

  const counts = useMemo(() => {
    return {
      all: dealers.length,
      distributors: dealers.filter((d) => d.role === 'distributor').length,
      resellers: dealers.filter((d) => d.role === 'reseller').length,
    };
  }, [dealers]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    // If distance radius changed and GPS is available, refresh server query
    if (newFilters.radius !== filters.radius && userCoords) {
      fetchDealers(userCoords, newFilters.radius);
    }
  };

  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <AppHeader
        title="Authorized Dealers"
        subtitle={`${filteredDealers.length} Official Stockists & Hubs`}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.container}>
        {/* Search Bar + Filter Modal Button Row */}
        <View style={styles.searchBarRow}>
          <View style={styles.searchBar}>
            <Search size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by city, province, or dealer..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Modal Trigger Button */}
          <TouchableOpacity
            style={[
              styles.filterTriggerBtn,
              activeFilterCount > 0 && styles.filterTriggerBtnActive,
            ]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <SlidersHorizontal
              size={18}
              color={activeFilterCount > 0 ? '#FFFFFF' : '#1E293B'}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadgeCircle}>
                <Text style={styles.filterBadgeCircleText}>
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Location Status Bar */}
        <View style={styles.locationBar}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              flex: 1,
            }}
          >
            <Locate size={14} color={userCoords ? '#059669' : '#9CA3AF'} />
            <Text style={styles.locationBarText} numberOfLines={1}>
              {locating
                ? 'Acquiring GPS location...'
                : userCoords
                ? `GPS Active • ${
                    filters.radius >= 1000
                      ? 'All South Africa'
                      : `Within ${filters.radius}km`
                  }`
                : 'GPS inactive • Showing national directory'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={acquireGPS}
            style={styles.locateBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.locateBtnText}>
              {userCoords ? 'Refresh GPS' : 'Enable GPS'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Filter Chips Bar (Shown when any filter is active) */}
        {activeFilterCount > 0 && (
          <View style={styles.activeChipsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeChipsScroll}
            >
              <Text style={styles.activeChipsLabel}>Filters:</Text>

              {filters.radius !== 50 && (
                <View style={styles.activeChipPill}>
                  <Text style={styles.activeChipText}>
                    {filters.radius >= 1000 ? 'All SA' : `≤ ${filters.radius}km`}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setFilters((prev) => ({ ...prev, radius: 50 }))
                    }
                  >
                    <X size={11} color="#C6122E" strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>
              )}

              {filters.role !== 'all' && (
                <View style={styles.activeChipPill}>
                  <Text style={styles.activeChipText}>
                    {filters.role === 'distributor'
                      ? 'Distributors'
                      : 'Resellers'}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setFilters((prev) => ({ ...prev, role: 'all' }))
                    }
                  >
                    <X size={11} color="#C6122E" strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>
              )}

              {filters.province &&
                filters.province !== 'All Provinces' &&
                filters.province !== 'all' && (
                  <View style={styles.activeChipPill}>
                    <Text style={styles.activeChipText}>
                      {filters.province}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          province: 'All Provinces',
                        }))
                      }
                    >
                      <X size={11} color="#C6122E" strokeWidth={2.4} />
                    </TouchableOpacity>
                  </View>
                )}

              {filters.hasWhatsApp && (
                <View style={styles.activeChipPill}>
                  <Text style={styles.activeChipText}>WhatsApp</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setFilters((prev) => ({ ...prev, hasWhatsApp: false }))
                    }
                  >
                    <X size={11} color="#C6122E" strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>
              )}

              {filters.hasPhone && (
                <View style={styles.activeChipPill}>
                  <Text style={styles.activeChipText}>Phone Direct</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setFilters((prev) => ({ ...prev, hasPhone: false }))
                    }
                  >
                    <X size={11} color="#C6122E" strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>
              )}

              {filters.oemCertified && (
                <View style={styles.activeChipPill}>
                  <Text style={styles.activeChipText}>OEM Certified</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setFilters((prev) => ({ ...prev, oemCertified: false }))
                    }
                  >
                    <X size={11} color="#C6122E" strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>
              )}

              {filters.sortBy === 'alpha' && (
                <View style={styles.activeChipPill}>
                  <Text style={styles.activeChipText}>A-Z</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setFilters((prev) => ({ ...prev, sortBy: 'nearest' }))
                    }
                  >
                    <X size={11} color="#C6122E" strokeWidth={2.4} />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                onPress={() => setFilters(DEFAULT_FILTERS)}
                style={styles.clearAllBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.clearAllBtnText}>Clear All</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Quick Filter Pills: All | Distributors | Resellers */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              filters.role === 'all' && styles.filterPillActive,
            ]}
            onPress={() => setFilters((prev) => ({ ...prev, role: 'all' }))}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                filters.role === 'all' && styles.filterPillTextActive,
              ]}
            >
              All ({counts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filters.role === 'distributor' && styles.filterPillActive,
            ]}
            onPress={() =>
              setFilters((prev) => ({ ...prev, role: 'distributor' }))
            }
            activeOpacity={0.7}
          >
            <Building2
              size={12}
              color={filters.role === 'distributor' ? '#FFFFFF' : '#4B5563'}
            />
            <Text
              style={[
                styles.filterPillText,
                filters.role === 'distributor' && styles.filterPillTextActive,
              ]}
            >
              Distributors ({counts.distributors})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filters.role === 'reseller' && styles.filterPillActive,
            ]}
            onPress={() =>
              setFilters((prev) => ({ ...prev, role: 'reseller' }))
            }
            activeOpacity={0.7}
          >
            <Store
              size={12}
              color={filters.role === 'reseller' ? '#FFFFFF' : '#4B5563'}
            />
            <Text
              style={[
                styles.filterPillText,
                filters.role === 'reseller' && styles.filterPillTextActive,
              ]}
            >
              Resellers ({counts.resellers})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#C6122E" />
            <Text style={styles.loadingText}>
              Loading authorized stockists...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredDealers}
            keyExtractor={(item, index) =>
              String(item.id || item.dealerId || index)
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#C6122E']}
                tintColor="#C6122E"
              />
            }
            renderItem={({ item }) => {
              const isDistributor = item.role === 'distributor';
              const name =
                item.name ||
                item.companyName ||
                item.dealer_name ||
                'Authorized Stockist';
              const address = item.address || item.streetAddress;
              const cityProvince =
                [item.city, item.province].filter(Boolean).join(' • ') ||
                'South Africa';

              return (
                <View style={styles.dealerCard}>
                  {/* Top Row: Name & Role Badge */}
                  <View style={styles.cardHeader}>
                    <View style={styles.dealerIconBox}>
                      {isDistributor ? (
                        <Building2 size={18} color="#C6122E" />
                      ) : (
                        <Store size={18} color="#C6122E" />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.titleBadgeRow}>
                        <Text style={styles.dealerName} numberOfLines={1}>
                          {name}
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          {item.distance && item.distance !== 'N/A' && (
                            <View style={styles.distanceBadge}>
                              <NavigationIcon size={9} color="#C6122E" />
                              <Text style={styles.distanceBadgeText}>
                                {item.distance}
                              </Text>
                            </View>
                          )}
                          <View
                            style={[
                              styles.roleBadge,
                              isDistributor
                                ? styles.distributorBadge
                                : styles.resellerBadge,
                            ]}
                          >
                            <ShieldCheck
                              size={10}
                              color={isDistributor ? '#1D4ED8' : '#047857'}
                            />
                            <Text
                              style={[
                                styles.roleBadgeText,
                                isDistributor
                                  ? styles.distributorBadgeText
                                  : styles.resellerBadgeText,
                              ]}
                            >
                              {isDistributor ? 'DISTRIBUTOR' : 'RESELLER'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.dealerCity}>{cityProvince}</Text>
                    </View>
                  </View>

                  {/* Address */}
                  {address ? (
                    <View style={styles.addressRow}>
                      <MapPin
                        size={13}
                        color="#6B7280"
                        style={{ marginTop: 2 }}
                      />
                      <Text style={styles.addressText} numberOfLines={2}>
                        {address}
                      </Text>
                    </View>
                  ) : null}

                  {/* Actions Row */}
                  <View style={styles.cardActions}>
                    {item.phone ? (
                      <TouchableOpacity
                        style={styles.actionBtnCall}
                        onPress={() => handleCall(item.phone)}
                        activeOpacity={0.7}
                      >
                        <Phone size={13} color="#059669" />
                        <Text style={styles.actionTextCall}>Call</Text>
                      </TouchableOpacity>
                    ) : null}

                    {item.phone ? (
                      <TouchableOpacity
                        style={styles.actionBtnWhatsApp}
                        onPress={() => handleWhatsApp(item.phone)}
                        activeOpacity={0.7}
                      >
                        <MessageSquare size={13} color="#047857" />
                        <Text style={styles.actionTextWhatsApp}>WhatsApp</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={styles.actionBtnMap}
                      onPress={() => handleOpenMap(item)}
                      activeOpacity={0.7}
                    >
                      <NavigationIcon size={13} color="#2563EB" />
                      <Text style={styles.actionTextMap}>Directions</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnEnquire}
                      onPress={() => handleEnquire(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionTextEnquire}>Enquire</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Store size={40} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>
                  No Authorized Stockists Found
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? `No dealers match "${searchQuery}". Try adjusting your filters or radius.`
                    : activeFilterCount > 0
                    ? 'No stockists match the active filters. Try expanding the search radius or resetting filters.'
                    : 'No stockists currently available in this category.'}
                </Text>
                {activeFilterCount > 0 && (
                  <TouchableOpacity
                    onPress={() => setFilters(DEFAULT_FILTERS)}
                    style={styles.emptyResetBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.emptyResetBtnText}>
                      Reset All Filters
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>

      {/* Dealer Filter Modal */}
      <DealerFilterModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        filters={filters}
        onApply={handleApplyFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        dealers={dealers}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    padding: 0,
  },
  filterTriggerBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  filterTriggerBtnActive: {
    backgroundColor: '#C6122E',
    borderColor: '#C6122E',
  },
  filterBadgeCircle: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeCircleText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationBarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  locateBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  locateBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C6122E',
  },
  activeChipsContainer: {
    marginBottom: 8,
  },
  activeChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeChipsLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginRight: 2,
  },
  activeChipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  activeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C6122E',
  },
  clearAllBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3.5,
  },
  clearAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillActive: {
    backgroundColor: '#C6122E',
    borderColor: '#C6122E',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 24,
    gap: 10,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyResetBtn: {
    marginTop: 10,
    backgroundColor: '#C6122E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  distanceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C6122E',
  },
  dealerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  dealerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  dealerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distributorBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  resellerBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  distributorBadgeText: {
    color: '#1D4ED8',
  },
  resellerBadgeText: {
    color: '#047857',
  },
  dealerCity: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 12,
    paddingLeft: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  actionBtnCall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  actionTextCall: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  actionBtnWhatsApp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  actionTextWhatsApp: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  actionBtnMap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionTextMap: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  actionBtnEnquire: {
    marginLeft: 'auto',
    backgroundColor: '#C6122E',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionTextEnquire: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default DealerLocatorScreen;
