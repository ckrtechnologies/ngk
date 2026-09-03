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
  Share2,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { apiFunction } from '../apis/apiFunction';
import { dealersApi } from '../apis/api';
import { getDealersRedux } from '../redux/getData';
import AppHeader from '../components/common/AppHeader';

const DealerLocatorScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const { dealers: apiDealersData } = useSelector((state) => state.getData);

  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'distributor' | 'reseller'

  const fetchDealers = useCallback(async () => {
    try {
      const res = await apiFunction(dealersApi, [], {}, 'GET', false);
      const list =
        res?.dealers ||
        res?.data?.array ||
        (Array.isArray(res?.data) ? res.data : []) ||
        [];
      setDealers(list);
      dispatch(getDealersRedux());
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
    }
  }, [apiDealersData, dispatch]);

  useEffect(() => {
    fetchDealers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDealers();
  };

  const filteredDealers = useMemo(() => {
    return dealers.filter((d) => {
      // Role filter
      if (activeFilter === 'distributor' && d.role !== 'distributor') return false;
      if (activeFilter === 'reseller' && d.role !== 'reseller') return false;

      // Text search
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const name = (d.name || d.dealer_name || d.companyName || '').toLowerCase();
      const city = (d.city || '').toLowerCase();
      const province = (d.province || '').toLowerCase();
      const address = (d.address || d.streetAddress || '').toLowerCase();
      return (
        name.includes(query) ||
        city.includes(query) ||
        province.includes(query) ||
        address.includes(query)
      );
    });
  }, [dealers, searchQuery, activeFilter]);

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
      `${dealer.name || ''}, ${dealer.address || dealer.streetAddress || ''}, ${dealer.city || ''}`
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
        {/* Search Bar */}
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

        {/* Filter Pills: All | Distributors | Resellers */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'all' && styles.filterPillTextActive,
              ]}
            >
              All ({counts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'distributor' && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter('distributor')}
            activeOpacity={0.7}
          >
            <Building2
              size={12}
              color={activeFilter === 'distributor' ? '#FFFFFF' : '#4B5563'}
            />
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'distributor' && styles.filterPillTextActive,
              ]}
            >
              Distributors ({counts.distributors})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'reseller' && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter('reseller')}
            activeOpacity={0.7}
          >
            <Store
              size={12}
              color={activeFilter === 'reseller' ? '#FFFFFF' : '#4B5563'}
            />
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'reseller' && styles.filterPillTextActive,
              ]}
            >
              Resellers ({counts.resellers})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#C6122E" />
            <Text style={styles.loadingText}>Loading authorized stockists...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredDealers}
            keyExtractor={(item, index) => String(item.id || item.dealerId || index)}
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
              const name = item.name || item.companyName || item.dealer_name || 'Authorized Stockist';
              const address = item.address || item.streetAddress;
              const cityProvince = [item.city, item.province].filter(Boolean).join(' • ') || 'South Africa';

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
                          style={[
                            styles.roleBadge,
                            isDistributor ? styles.distributorBadge : styles.resellerBadge,
                          ]}
                        >
                          <ShieldCheck size={10} color={isDistributor ? '#1D4ED8' : '#047857'} />
                          <Text
                            style={[
                              styles.roleBadgeText,
                              isDistributor ? styles.distributorBadgeText : styles.resellerBadgeText,
                            ]}
                          >
                            {isDistributor ? 'DISTRIBUTOR' : 'RESELLER'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.dealerCity}>{cityProvince}</Text>
                    </View>
                  </View>

                  {/* Address */}
                  {address ? (
                    <View style={styles.addressRow}>
                      <MapPin size={13} color="#6B7280" style={{ marginTop: 2 }} />
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
                <Text style={styles.emptyTitle}>No Authorized Stockists Found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? `No dealers match "${searchQuery}". Try searching for another city or province.`
                    : 'No stockists currently available in this category.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 8,
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
    paddingVertical: 60,
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
