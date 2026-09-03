import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Car,
  Bike,
  Wrench,
  Search,
  ChevronDown,
  Check,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFunction } from '../apis/apiFunction';
import {
  serviceJsonApi,
  addSearchHistoryApi,
  vehiclesApi,
  popularBrandsApi,
  articlesByPartApi,
} from '../apis/api';
import { getMyselfRedux } from '../redux/getData';
import Toast from 'react-native-toast-message';
import AppHeader from '../components/common/AppHeader';
import AppButton from '../components/common/AppButton';
import AppInput from '../components/common/AppInput';
import JourneyStepIndicator from '../components/common/JourneyStepIndicator';
import BrandLogoCard from '../components/parts/BrandLogoCard';
const DEFAULT_POPULAR_BRANDS = {
  passenger: [
    { id: 111, manuId: 111, name: 'TOYOTA', manuName: 'TOYOTA', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/toyota.png' },
    { id: 121, manuId: 121, name: 'VOLKSWAGEN', manuName: 'VOLKSWAGEN', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/volkswagen.png' },
    { id: 16, manuId: 16, name: 'BMW', manuName: 'BMW', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/bmw.png' },
    { id: 74, manuId: 74, name: 'MERCEDES-BENZ', manuName: 'MERCEDES-BENZ', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/mercedes-benz.png' },
    { id: 45, manuId: 45, name: 'FORD', manuName: 'FORD', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/ford.png' },
    { id: 5, manuId: 5, name: 'AUDI', manuName: 'AUDI', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/audi.png' },
    { id: 80, manuId: 80, name: 'NISSAN', manuName: 'NISSAN', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/nissan.png' },
    { id: 52, manuId: 52, name: 'HYUNDAI', manuName: 'HYUNDAI', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/hyundai.png' },
    { id: 56, manuId: 56, name: 'ISUZU', manuName: 'ISUZU', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/isuzu.png' },
  ],
  motorcycle: [
    { id: 45, manuId: 45, name: 'HONDA', manuName: 'HONDA', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/honda.png' },
    { id: 109, manuId: 109, name: 'SUZUKI', manuName: 'SUZUKI', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/suzuki.png' },
    { id: 16, manuId: 16, name: 'BMW', manuName: 'BMW', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/bmw.png' },
    { id: 2760, manuId: 2760, name: 'KTM', manuName: 'KTM', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/ktm.png' },
    { id: 112, manuId: 112, name: 'TRIUMPH', manuName: 'TRIUMPH', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/triumph.png' },
    { id: 181, manuId: 181, name: 'PIAGGIO', manuName: 'PIAGGIO' },
    { id: 4552, manuId: 4552, name: 'BAJAJ', manuName: 'BAJAJ' },
    { id: 1164, manuId: 1164, name: 'YAMAHA', manuName: 'YAMAHA' },
    { id: 574, manuId: 574, name: 'KAWASAKI', manuName: 'KAWASAKI' },
  ],
  commercial: [
    { id: 54, manuId: 54, name: 'ISUZU', manuName: 'ISUZU', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/isuzu.png' },
    { id: 74, manuId: 74, name: 'MERCEDES-BENZ', manuName: 'MERCEDES-BENZ', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/mercedes-benz.png' },
    { id: 120, manuId: 120, name: 'VOLVO', manuName: 'VOLVO', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/volvo.png' },
    { id: 103, manuId: 103, name: 'SCANIA', manuName: 'SCANIA', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/scania.png' },
    { id: 69, manuId: 69, name: 'MAN', manuName: 'MAN', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/man.png' },
    { id: 151, manuId: 151, name: 'HINO', manuName: 'HINO', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/hino.png' },
    { id: 24, manuId: 24, name: 'DAF', manuName: 'DAF', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/daf.png' },
    { id: 55, manuId: 55, name: 'IVECO', manuName: 'IVECO', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/iveco.png' },
    { id: 36, manuId: 36, name: 'FORD', manuName: 'FORD', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/ford.png' },
  ],
};

const PartsFinderScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { myself } = useSelector((state) => state.getData);

  const [searchMode, setSearchMode] = useState('vehicle'); // 'vehicle' | 'part'
  const [selectedApp, setSelectedApp] = useState('Passenger');
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);

  // Direct Part Number state
  const [partNumber, setPartNumber] = useState('');
  const [partSearching, setPartSearching] = useState(false);

  // Dropdown data
  const [manufacturersData, setManufacturersData] = useState([]);
  const [seriesData, setSeriesData] = useState([]);
  const [loadingDropdown, setLoadingDropdown] = useState(false);
  // All popular brands pre-loaded into local state
  const [brandsByCategory, setBrandsByCategory] = useState(DEFAULT_POPULAR_BRANDS);
  const [brandCount, setBrandCount] = useState(9);

  // Modal selector state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); // 'manufacturer' | 'series'
  const [filterQuery, setFilterQuery] = useState('');

  const applications = [
    { id: 'Passenger', label: 'Passenger', icon: Car, type: 'P' },
    { id: 'Motorcycle', label: 'Motorcycle', icon: Bike, type: 'M' },
    { id: 'Commercial', label: 'Commercial', icon: Wrench, type: 'O' },
  ];

  useEffect(() => {
    const fetchMyself = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) dispatch(getMyselfRedux(userId));
    };
    if (!myself) fetchMyself();
  }, [dispatch]);

  // Single initial API call on screen mount - loads all 3 categories at once
  useEffect(() => {
    const fetchAllBrands = async () => {
      try {
        const res = await apiFunction(popularBrandsApi, [], {}, 'GET', false);
        const data = res?.data || res;
        if (data?.passenger || data?.motorcycle || data?.commercial) {
          setBrandsByCategory((prev) => ({
            passenger: data.passenger?.length ? data.passenger : prev.passenger,
            motorcycle: data.motorcycle?.length ? data.motorcycle : prev.motorcycle,
            commercial: data.commercial?.length ? data.commercial : prev.commercial,
          }));
        } else if (Array.isArray(data?.array) && data.array.length > 0) {
          setBrandsByCategory((prev) => ({ ...prev, passenger: data.array }));
        }
      } catch (err) {
        console.warn('Failed to pre-load popular brands:', err);
      }
    };
    fetchAllBrands();
  }, []);

  // Synchronous in-memory lookup: ZERO network calls on tab toggle!
  const popularBrands = useMemo(() => {
    if (selectedApp === 'Motorcycle') return brandsByCategory.motorcycle || [];
    if (selectedApp === 'Commercial') return brandsByCategory.commercial || [];
    return brandsByCategory.passenger || [];
  }, [selectedApp, brandsByCategory]);

  // Fetch manufacturers when application changes
  useEffect(() => {
    const fetchManufacturers = async () => {
      setLoadingDropdown(true);
      const appType =
        applications.find((a) => a.id === selectedApp)?.type || 'P';
      const payload = {
        getManufacturers2: {
          country: 'ZA',
          lang: 'en',
          linkingTargetType: appType,
          includeAll: true,
        },
      };

      try {
        const res = await apiFunction(serviceJsonApi, [], payload, 'POST', false);
        const list =
          res?.data?.array ||
          res?.getManufacturers2?.array ||
          res?.data ||
          [];
        setManufacturersData(list);
      } catch (err) {
        console.warn('Failed to load manufacturers', err);
      } finally {
        setLoadingDropdown(false);
      }
    };

    fetchManufacturers();
    setSelectedManufacturer(null);
    setSelectedSeries(null);
    setSeriesData([]);
  }, [selectedApp]);

  // Fetch series when manufacturer is selected
  const fetchSeriesForManufacturer = async (manu) => {
    setLoadingDropdown(true);
    const appType =
      applications.find((a) => a.id === selectedApp)?.type || 'P';
    const payload = {
      getModelSeries2: {
        country: 'ZA',
        lang: 'en',
        linkingTargetType: appType,
        manuId: manu.manuId || manu.id,
        includeAll: true,
      },
    };

    try {
      const res = await apiFunction(serviceJsonApi, [], payload, 'POST', false);
      const list =
        res?.data?.array ||
        res?.getModelSeries2?.array ||
        res?.data ||
        [];
      setSeriesData(list);
    } catch (err) {
      console.warn('Failed to load model series', err);
    } finally {
      setLoadingDropdown(false);
    }
  };

  const openPicker = (type) => {
    setModalType(type);
    setFilterQuery('');
    setModalVisible(true);
  };

  const handleSelectManufacturer = (item) => {
    setSelectedManufacturer(item);
    setSelectedSeries(null);
    setModalVisible(false);
    fetchSeriesForManufacturer(item);
  };

  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const handleSelectPopularBrand = (item) => {
    setSelectedManufacturer(item);
    setSelectedSeries(null);
    fetchSeriesForManufacturer(item);
  };

  const handleSelectSeries = (item) => {
    setSelectedSeries(item);
    setModalVisible(false);
  };

  const handleProceedToVehicles = async () => {
    if (!selectedManufacturer || !selectedSeries) {
      Toast.show({
        type: 'error',
        text1: 'Selection Required',
        text2: 'Please choose both Manufacturer and Model Series.',
      });
      return;
    }

    const appType =
      applications.find((a) => a.id === selectedApp)?.type || 'P';

    const mfrId = selectedManufacturer.manuId || selectedManufacturer.id;
    const seriesId = selectedSeries.modelId || selectedSeries.id;

    setLoadingVehicles(true);
    let list = [];
    try {
      const payload = {
        getLinkageTargets: {
          linkageTargetCountry: 'ZA',
          lang: 'en',
          linkageTargetType: appType,
          mfrIds: Number(mfrId),
          vehicleModelSeriesIds: Number(seriesId),
          perPage: 100,
          page: 1,
        },
      };

      const res = await apiFunction(serviceJsonApi, [], payload, 'POST', false);
      list = res?.linkageTargets || res?.data?.array || res?.data || [];

      if (!list || list.length === 0) {
        const restRes = await apiFunction(
          `${vehiclesApi}?mfrId=${mfrId}&seriesId=${seriesId}&type=${appType}`,
          [],
          {},
          'GET',
          false
        );
        list = restRes?.data?.array || restRes?.data || [];
      }
    } catch (err) {
      console.warn('Failed to pre-fetch vehicles:', err);
    } finally {
      setLoadingVehicles(false);
      navigation.navigate('vehiclesListScreen', {
        selectedApp,
        appType,
        selectedManufacturer,
        selectedSeries,
        vehiclesList: list,
      });
    }
  };

  const handlePartSearch = async () => {
    if (!partNumber.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Part Number Required',
        text2: 'Please enter an NGK or OE part number.',
      });
      return;
    }

    setPartSearching(true);
    const trimmed = partNumber.trim();
    const payload = {
      getArticles: {
        articleCountry: 'ZA',
        searchQuery: trimmed,
        searchType: 10,
        lang: 'en',
        perPage: 30,
        page: 1,
        includeAll: true,
      },
    };

    try {
      const res = await apiFunction(serviceJsonApi, [], payload, 'POST', false);
      let results = res?.articles || res?.data?.array || res?.data || [];

      // Fallback to backend REST endpoint if needed
      if (!results || results.length === 0) {
        const restRes = await apiFunction(
          `${articlesByPartApi}?searchQuery=${encodeURIComponent(trimmed)}`,
          [],
          {},
          'GET',
          false
        );
        results = restRes?.articles || restRes?.data?.array || restRes?.data || [];
      }

      setPartSearching(false);

      // Record Search History if user logged in
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        apiFunction(
          addSearchHistoryApi,
          [],
          { userId, query: trimmed, resultsCount: results.length },
          'POST',
          false
        ).catch(() => {});
      }

      navigation.navigate('VerifiedParts', {
        articles: results,
        searchQuery: trimmed,
        directSearch: true,
      });
    } catch (err) {
      setPartSearching(false);
      Toast.show({
        type: 'error',
        text1: 'Search Failed',
        text2: 'Unable to reach parts database. Please try again.',
      });
    }
  };

  const getFilteredModalList = () => {
    const list = modalType === 'manufacturer' ? manufacturersData : seriesData;
    if (!filterQuery.trim()) return list;
    return list.filter((item) => {
      const name = item.manuName || item.modelname || item.name || '';
      return name.toLowerCase().includes(filterQuery.toLowerCase());
    });
  };

  const insets = useSafeAreaInsets();

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
        title="Parts Finder"
        subtitle="TecDoc Pegasus 3.0 Catalog"
        onBack={() => navigation.goBack()}
      />

      {/* 3-Step Journey Indicator */}
      <JourneyStepIndicator currentStep={1} />

      <View style={styles.container}>
        {/* Segmented Mode Tabs */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              searchMode === 'vehicle' && styles.segmentBtnActive,
            ]}
            onPress={() => setSearchMode('vehicle')}
            activeOpacity={0.8}
          >
            <Car
              size={16}
              color={searchMode === 'vehicle' ? '#C6122E' : '#6B7280'}
            />
            <Text
              style={[
                styles.segmentText,
                searchMode === 'vehicle' && styles.segmentTextActive,
              ]}
            >
              By Vehicle
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              searchMode === 'part' && styles.segmentBtnActive,
            ]}
            onPress={() => setSearchMode('part')}
            activeOpacity={0.8}
          >
            <Search
              size={16}
              color={searchMode === 'part' ? '#C6122E' : '#6B7280'}
            />
            <Text
              style={[
                styles.segmentText,
                searchMode === 'part' && styles.segmentTextActive,
              ]}
            >
              By Part #
            </Text>
          </TouchableOpacity>
        </View>

        {searchMode === 'vehicle' ? (
          <View style={styles.vehicleContainer}>
            <View style={styles.vehicleTopSection}>
              {/* Step 1: Vehicle Application Type Pills */}
              <Text style={styles.inputSectionLabel}>APPLICATION TYPE</Text>
              <View style={styles.appTypeRow}>
                {applications.map((app) => {
                  const IconComponent = app.icon;
                  const isSelected = selectedApp === app.id;
                  return (
                    <TouchableOpacity
                      key={app.id}
                      style={[
                        styles.appTypePill,
                        isSelected && styles.appTypePillSelected,
                      ]}
                      onPress={() => {
                        if (selectedApp !== app.id) {
                          setSelectedApp(app.id);
                          setSelectedManufacturer(null);
                          setSelectedSeries(null);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <IconComponent
                        size={16}
                        color={isSelected ? '#FFFFFF' : '#4B5563'}
                      />
                      <Text
                        style={[
                          styles.appTypePillText,
                          isSelected && styles.appTypePillTextSelected,
                        ]}
                      >
                        {app.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Popular Vehicle Brands Quick Select (6-9 Cards) */}
              {popularBrands.length > 0 && (
                <View style={styles.popularSection}>
                  <View style={styles.popularHeaderRow}>
                    <Text style={styles.inputSectionLabel}>
                      TOP 9 {selectedApp.toUpperCase()} BRANDS
                    </Text>
                  </View>
                  <View style={styles.brandsGrid}>
                    {popularBrands.slice(0, brandCount).map((b) => {
                      const isSelected =
                        (selectedManufacturer?.manuId || selectedManufacturer?.id) ===
                        (b.manuId || b.id);
                      return (
                        <BrandLogoCard
                          key={b.id || b.manuId}
                          item={b}
                          isSelected={isSelected}
                          onPress={handleSelectPopularBrand}
                        />
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Step 2: Make & Model Side-by-Side (Single Row) */}
              <Text style={[styles.inputSectionLabel, { marginTop: 12 }]}>
                VEHICLE SPECIFICATIONS
              </Text>

              <View style={styles.specsRow}>
                {/* Manufacturer Selector */}
                <TouchableOpacity
                  style={[styles.pickerField, styles.halfPicker]}
                  onPress={() => openPicker('manufacturer')}
                  activeOpacity={0.75}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerFieldLabel}>Make</Text>
                    <Text
                      style={[
                        styles.pickerFieldValue,
                        !selectedManufacturer && styles.pickerFieldPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {selectedManufacturer?.manuName ||
                        selectedManufacturer?.name ||
                        'Select Make'}
                    </Text>
                  </View>
                  <ChevronDown size={14} color="#9CA3AF" />
                </TouchableOpacity>

                {/* Series Selector */}
                <TouchableOpacity
                  style={[
                    styles.pickerField,
                    styles.halfPicker,
                    !selectedManufacturer && styles.pickerFieldDisabled,
                  ]}
                  onPress={() => selectedManufacturer && openPicker('series')}
                  disabled={!selectedManufacturer}
                  activeOpacity={0.75}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerFieldLabel}>Model Series</Text>
                    <Text
                      style={[
                        styles.pickerFieldValue,
                        !selectedSeries && styles.pickerFieldPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {selectedSeries?.modelname ||
                        selectedSeries?.name ||
                        (selectedManufacturer ? 'Select Model' : 'Choose Make')}
                    </Text>
                  </View>
                  <ChevronDown size={14} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom CTA Button pinned at the bottom */}
            <View style={styles.vehicleBottomSection}>
              <AppButton
                title="View Matching Engines & Trims"
                rightIcon={<ArrowRight size={16} color="#FFFFFF" />}
                onPress={handleProceedToVehicles}
                disabled={!selectedManufacturer || !selectedSeries}
                loading={loadingVehicles}
                height={48}
                style={styles.proceedBtn}
              />
            </View>
          </View>
        ) : (
          <View style={styles.partSearchContainer}>
            <Text style={styles.inputSectionLabel}>DIRECT PART NUMBER LOOKUP</Text>
            <AppInput
              placeholder="e.g. BKR6E-11, ILKAR7C10, 93501"
              value={partNumber}
              onChangeText={setPartNumber}
              autoCapitalize="characters"
              leftIcon={<Search size={18} color="#9CA3AF" />}
              containerStyle={{ marginBottom: 12 }}
            />

            <AppButton
              title="Search NGK & OE Catalog"
              onPress={handlePartSearch}
              loading={partSearching}
              style={styles.proceedBtn}
            />

            <View style={styles.infoHintCard}>
              <Sparkles size={18} color="#C6122E" />
              <Text style={styles.infoHintText}>
                Supports NGK Stock Numbers, Order Numbers, and OE Cross-Reference Part Numbers.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Modern Bottom Sheet Modal Picker */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'manufacturer'
                  ? 'Select Manufacturer'
                  : 'Select Model Series'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Filter Search Input */}
            <View style={styles.modalSearchBox}>
              <Search size={16} color="#9CA3AF" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Type to filter..."
                placeholderTextColor="#9CA3AF"
                value={filterQuery}
                onChangeText={setFilterQuery}
                autoCapitalize="none"
              />
            </View>

            {/* List */}
            {loadingDropdown ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator color="#C6122E" size="small" />
                <Text style={styles.modalLoadingText}>Loading options...</Text>
              </View>
            ) : (
              <FlatList
                data={getFilteredModalList()}
                keyExtractor={(item, idx) =>
                  String(item.manuId || item.modelId || idx)
                }
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const label =
                    item.manuName || item.modelname || item.name || '';
                  return (
                    <TouchableOpacity
                      style={styles.modalRow}
                      onPress={() =>
                        modalType === 'manufacturer'
                          ? handleSelectManufacturer(item)
                          : handleSelectSeries(item)
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalRowText}>{label}</Text>
                      <Check size={16} color="#C6122E" style={{ opacity: 0 }} />
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 2,
    marginBottom: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 34,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  segmentTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  scrollBody: {
    paddingBottom: 16,
  },
  vehicleContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  vehicleTopSection: {
    flex: 1,
  },
  vehicleBottomSection: {
    paddingTop: 8,
  },
  inputSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  appTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  popularSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  popularHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  popularHint: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C6122E',
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  appTypePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  appTypePillSelected: {
    backgroundColor: '#C6122E',
    borderColor: '#C6122E',
  },
  appTypePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  appTypePillTextSelected: {
    color: '#FFFFFF',
  },
  specsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  halfPicker: {
    flex: 1,
    height: 50,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 0,
  },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  pickerFieldDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },
  pickerFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  pickerFieldValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  pickerFieldPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  proceedBtn: {
    marginTop: 4,
  },
  partSearchContainer: {
    flex: 1,
  },
  infoHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#C6122E',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  infoHintText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    padding: 0,
  },
  modalLoading: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  modalLoadingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});

export default PartsFinderScreen;
