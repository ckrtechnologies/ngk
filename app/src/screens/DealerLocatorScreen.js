import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Phone,
  Search,
  Store,
  ExternalLink,
  MessageSquare,
  X,
  Navigation as NavigationIcon,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getDealersRedux } from '../redux/getData';
import AppHeader from '../components/common/AppHeader';

const DealerLocatorScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { dealers: apiDealersData, loading } = useSelector(
    (state) => state.getData
  );

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(getDealersRedux());
  }, [dispatch]);

  const dealersList = Array.isArray(apiDealersData)
    ? apiDealersData
    : apiDealersData?.data || [];

  const filteredDealers = dealersList.filter((d) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = (d.name || d.dealer_name || '').toLowerCase();
    const city = (d.city || '').toLowerCase();
    const province = (d.province || '').toLowerCase();
    const address = (d.address || '').toLowerCase();
    return (
      name.includes(query) ||
      city.includes(query) ||
      province.includes(query) ||
      address.includes(query)
    );
  });

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => {});
    }
  };

  const handleOpenMap = (dealer) => {
    const query = encodeURIComponent(
      `${dealer.name || ''}, ${dealer.address || ''}, ${dealer.city || ''}`
    );
    Linking.openURL(`https://maps.google.com/?q=${query}`).catch(() => {});
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
        title="Authorized Stockists"
        subtitle={`${filteredDealers.length} Regional Distributors & Resellers`}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by city, province, or dealer name..."
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollBody}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#C6122E" />
              <Text style={styles.loadingText}>Loading authorized dealer network...</Text>
            </View>
          ) : filteredDealers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Store size={36} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Stockists Found</Text>
              <Text style={styles.emptySubtitle}>
                No dealers match "{searchQuery}". Try searching for a major city like Johannesburg, Durban, or Cape Town.
              </Text>
            </View>
          ) : (
            <View style={styles.dealersList}>
              {filteredDealers.map((dealer, idx) => (
                <View key={dealer.id || idx} style={styles.dealerCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.dealerIconBox}>
                      <Store size={18} color="#C6122E" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dealerName}>
                        {dealer.name || dealer.dealer_name || 'Authorized Stockist'}
                      </Text>
                      <Text style={styles.dealerCity}>
                        {dealer.city || 'Regional Outlet'}{' '}
                        {dealer.province ? `• ${dealer.province}` : ''}
                      </Text>
                    </View>
                  </View>

                  {dealer.address ? (
                    <View style={styles.addressRow}>
                      <MapPin size={13} color="#6B7280" style={{ marginTop: 2 }} />
                      <Text style={styles.addressText} numberOfLines={2}>
                        {dealer.address}
                      </Text>
                    </View>
                  ) : null}

                  {/* Actions Row */}
                  <View style={styles.cardActions}>
                    {dealer.phone ? (
                      <TouchableOpacity
                        style={styles.phoneAction}
                        onPress={() => handleCall(dealer.phone)}
                        activeOpacity={0.7}
                      >
                        <Phone size={14} color="#059669" />
                        <Text style={styles.phoneText}>{dealer.phone}</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={styles.mapAction}
                      onPress={() => handleOpenMap(dealer)}
                      activeOpacity={0.7}
                    >
                      <NavigationIcon size={13} color="#2563EB" />
                      <Text style={styles.mapText}>Directions</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
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
    paddingTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  scrollBody: {
    paddingBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    gap: 6,
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
  },
  dealersList: {
    gap: 12,
  },
  dealerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dealerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dealerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  dealerCity: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 10,
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
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  phoneAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  mapAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mapText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
});

export default DealerLocatorScreen;
