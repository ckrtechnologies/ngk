import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Car,
  Search,
  ChevronRight,
  X,
  Gauge,
  Calendar,
  Zap,
  RotateCcw,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { apiFunction } from '../apis/apiFunction';
import { serviceJsonApi, vehiclesApi } from '../apis/api';
import AppHeader from '../components/common/AppHeader';
import JourneyStepIndicator from '../components/common/JourneyStepIndicator';

const VehiclesListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const { selectedManufacturer, selectedSeries, appType = 'P', vehiclesList: passedList } =
    route.params || {};

  const [vehicles, setVehicles] = useState(
    Array.isArray(passedList) && passedList.length > 0 ? passedList : []
  );
  const [loading, setLoading] = useState(
    !Array.isArray(passedList) || passedList.length === 0
  );
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const mfrId = selectedManufacturer?.manuId || selectedManufacturer?.id;
  const seriesId = selectedSeries?.modelId || selectedSeries?.id;
  const mfrName = selectedManufacturer?.manuName || selectedManufacturer?.name || 'Manufacturer';
  const seriesName = selectedSeries?.modelname || selectedSeries?.name || 'Model Series';
  const seriesType = selectedSeries?.linkingTargetType || appType || 'P';

  const fetchVehicles = useCallback(async () => {
    if (!mfrId || !seriesId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Primary: Pegasus 3.0 getLinkageTargets
      const payload = {
        getLinkageTargets: {
          linkageTargetCountry: 'ZA',
          lang: 'en',
          linkageTargetType: seriesType,
          mfrIds: Number(mfrId),
          vehicleModelSeriesIds: Number(seriesId),
          perPage: 100,
          page: 1,
        },
      };

      const res = await apiFunction(serviceJsonApi, [], payload, 'POST', false);
      let list = res?.linkageTargets || res?.data?.array || res?.data || [];

      // Fallback: REST endpoint if array is empty
      if (!list || list.length === 0) {
        const restRes = await apiFunction(
          `${vehiclesApi}?mfrId=${mfrId}&seriesId=${seriesId}&type=${seriesType}`,
          [],
          {},
          'GET',
          false
        );
        list = restRes?.data?.array || restRes?.data || [];
      }

      const formatted = (list || []).map((v) => ({
        ...v,
        linkageTargetType: v.linkageTargetType || seriesType,
      }));

      setVehicles(formatted);
    } catch (err) {
      console.warn('Failed to fetch vehicles for series:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mfrId, seriesId, seriesType]);

  useEffect(() => {
    if (!passedList || passedList.length === 0) {
      setLoading(true);
      fetchVehicles();
    }
  }, [fetchVehicles, passedList]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles();
  };

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return vehicles;
    const q = searchQuery.toLowerCase();
    return vehicles.filter((item) => {
      const name = (
        item.description ||
        item.typeName ||
        item.vehicleSalesDescription ||
        item.matchCode ||
        item.name ||
        ''
      ).toLowerCase();
      const engineCode = (item.engines?.[0]?.code || item.engineCode || '').toLowerCase();
      const kw = String(item.kiloWattsFrom || item.powerKwFrom || '');
      const hp = String(item.horsePowerFrom || item.powerHpFrom || '');
      return name.includes(q) || engineCode.includes(q) || kw.includes(q) || hp.includes(q);
    });
  }, [vehicles, searchQuery]);

  const handleSelectVehicle = (item) => {
    navigation.navigate('VerifiedParts', {
      vehicle: item,
      selectedManufacturer,
      selectedSeries,
      appType: item.linkageTargetType || seriesType || 'P',
    });
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
        title={`${mfrName} ${seriesName}`}
        subtitle="Select exact engine & year trim"
        onBack={() => navigation.goBack()}
      />

      {/* 3-Step Journey Indicator */}
      <JourneyStepIndicator
        currentStep={2}
        onStepPress={(step) => {
          if (step === 1) navigation.goBack();
        }}
      />

      <View style={styles.container}>
        {/* Search Filter Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search trim, engine code, kW, or HP..."
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

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#C6122E" />
            <Text style={styles.loadingText}>Fetching matching engines & trims...</Text>
            <Text style={styles.loadingSub}>TecDoc Pegasus 3.0 Catalog</Text>
          </View>
        ) : (
          <FlatList
            data={filteredList}
            keyExtractor={(item, index) =>
              String(item.linkageTargetId || item.carId || item.id || index)
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
              const trimTitle =
                item.description ||
                item.typeName ||
                item.vehicleSalesDescription ||
                'Standard Trim';

              const kw = item.kiloWattsFrom || item.powerKwFrom || item.kw;
              const hp = item.horsePowerFrom || item.powerHpFrom || item.hp;
              const powerStr = kw && hp ? `${kw} kW / ${hp} HP` : hp ? `${hp} HP` : kw ? `${kw} kW` : null;

              const begin = item.beginYearMonth || item.yearOfConstrFrom;
              const end = item.endYearMonth || item.yearOfConstrTo || 'Present';
              const yearStr = begin ? `${begin} - ${end}` : null;

              const capacity = item.capacityLiters
                ? `${item.capacityLiters}L`
                : item.capacityCC || item.ccm
                ? `${item.capacityCC || item.ccm} cc`
                : null;

              const fuel = item.fuelType || item.engineType;
              const engineCode = item.engines?.[0]?.code || item.engineCode;

              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => handleSelectVehicle(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.iconCircle}>
                    <Car size={20} color="#C6122E" />
                  </View>

                  <View style={styles.infoCol}>
                    <View style={styles.titleRow}>
                      <Text style={styles.cardTitle}>{trimTitle}</Text>
                      {fuel ? <Text style={styles.fuelBadge}>{fuel}</Text> : null}
                    </View>

                    {/* Specs Row */}
                    <View style={styles.specsRow}>
                      {powerStr && (
                        <View style={styles.specItem}>
                          <Zap size={12} color="#4B5563" />
                          <Text style={styles.specText}>{powerStr}</Text>
                        </View>
                      )}
                      {capacity && (
                        <View style={styles.specItem}>
                          <Gauge size={12} color="#4B5563" />
                          <Text style={styles.specText}>{capacity}</Text>
                        </View>
                      )}
                      {yearStr && (
                        <View style={styles.specItem}>
                          <Calendar size={12} color="#4B5563" />
                          <Text style={styles.specText}>{yearStr}</Text>
                        </View>
                      )}
                    </View>

                    {/* Engine Code if present */}
                    {engineCode && (
                      <Text style={styles.engineCodeText}>
                        Engine Code: <Text style={styles.engineCodeVal}>{engineCode}</Text>
                      </Text>
                    )}
                  </View>

                  <ChevronRight size={18} color="#9CA3AF" />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Car size={36} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Matching Trims Found</Text>
                <Text style={styles.emptyText}>
                  We could not find engine trims for {seriesName}. Try refreshing or choosing another model.
                </Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchVehicles}>
                  <RotateCcw size={14} color="#C6122E" />
                  <Text style={styles.retryText}>Retry Fetching</Text>
                </TouchableOpacity>
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
    height: 44,
    marginBottom: 10,
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
  listContent: {
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  fuelBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  engineCodeText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  engineCodeVal: {
    fontWeight: '700',
    color: '#374151',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 14,
  },
  loadingSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C6122E',
  },
});

export default VehiclesListScreen;