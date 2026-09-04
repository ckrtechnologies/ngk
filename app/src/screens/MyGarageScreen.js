import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Car,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  X,
  Sparkles,
  BookOpen,
  Edit3,
  ChevronDown,
  ChevronRight,
  Check,
  RotateCcw,
  ShieldCheck,
  Zap,
  Layers,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyselfRedux } from '../redux/getData';
import { apiFunction } from '../apis/apiFunction';
import {
  addVehicleToGarageApi,
  addVehicleToWatchlistApi,
  removeFromWatchlistApi,
  serviceJsonApi,
  vehiclesApi,
  popularBrandsApi,
} from '../apis/api';
import Toast from 'react-native-toast-message';
import AppHeader from '../components/common/AppHeader';
import AppButton from '../components/common/AppButton';
import AppInput from '../components/common/AppInput';
import BrandLogoCard from '../components/parts/BrandLogoCard';

const DEFAULT_POPULAR_BRANDS = [
  { id: 111, manuId: 111, name: 'TOYOTA', manuName: 'TOYOTA', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/toyota.png' },
  { id: 121, manuId: 121, name: 'VOLKSWAGEN', manuName: 'VOLKSWAGEN', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/volkswagen.png' },
  { id: 16, manuId: 16, name: 'BMW', manuName: 'BMW', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/bmw.png' },
  { id: 74, manuId: 74, name: 'MERCEDES-BENZ', manuName: 'MERCEDES-BENZ', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/mercedes-benz.png' },
  { id: 36, manuId: 36, name: 'FORD', manuName: 'FORD', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/ford.png' },
  { id: 5, manuId: 5, name: 'AUDI', manuName: 'AUDI', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/audi.png' },
  { id: 80, manuId: 80, name: 'NISSAN', manuName: 'NISSAN', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/nissan.png' },
  { id: 183, manuId: 183, name: 'HYUNDAI', manuName: 'HYUNDAI', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/hyundai.png' },
  { id: 54, manuId: 54, name: 'ISUZU', manuName: 'ISUZU', logoUrl: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/isuzu.png' },
];

// Canonical mapper for TecDoc South Africa (ZA) manufacturer IDs
const resolveManuId = (manu) => {
  if (!manu) return null;
  const name = (manu.manuName || manu.name || '').toUpperCase().trim();
  const rawId = Number(manu.manuId || manu.id);
  if (name.includes('HYUNDAI')) return 183;
  if (name === 'FORD' && rawId === 45) return 36;
  if (name === 'ISUZU' && (rawId === 56 || !rawId)) return 54;
  return rawId;
};

const sanitizeBrand = (b) => {
  const fixedId = resolveManuId(b);
  return { ...b, id: fixedId, manuId: fixedId };
};

const MyGarageScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { myself } = useSelector((state) => state.getData);

  // Main modal & submission states
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mode: 'catalog' | 'manual'
  const [entryMode, setEntryMode] = useState('catalog');

  // Form states for vehicle details
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [engine, setEngine] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [catalogLinkageTargetId, setCatalogLinkageTargetId] = useState(null);

  // Catalog selection states
  const [selectedManu, setSelectedManu] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Lists & Loading states
  const [popularBrands, setPopularBrands] = useState(DEFAULT_POPULAR_BRANDS);
  const [allManufacturers, setAllManufacturers] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [loadingManu, setLoadingManu] = useState(false);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Secondary Picker Modal (for searching all makes, all series, or all trims)
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState('manu'); // 'manu' | 'series' | 'trim'
  const [pickerSearch, setPickerSearch] = useState('');

  const refreshUser = useCallback(async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (userId) dispatch(getMyselfRedux(userId));
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Pre-fetch dynamic popular brands if available
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const res = await apiFunction(popularBrandsApi, [], {}, 'GET', false);
        const data = res?.data || res;
        if (data?.passenger?.length) {
          setPopularBrands(data.passenger.map(sanitizeBrand));
        } else if (Array.isArray(data?.array) && data.array.length > 0) {
          setPopularBrands(data.array.map(sanitizeBrand));
        }
      } catch (err) {
        // Fallback to DEFAULT_POPULAR_BRANDS is already in place
      }
    };
    loadBrands();
  }, []);

  // Resilient multi-level garage vehicle resolution (handles garage, cars, vehicleId, or watchlist vehicle summaries)
  const garageVehicles = myself?.garage?.length
    ? myself.garage
    : (myself?.cars?.length
      ? myself.cars
      : (myself?.vehicleId?.length
        ? myself.vehicleId
        : (myself?.watchList?.filter(item => item.article_summary?.make || item.brand_name)?.map(item => ({
            id: item.id,
            make: item.article_summary?.make || item.brand_name,
            model: item.article_summary?.model || item.part_number,
            year: item.article_summary?.year || '',
            engine: item.article_summary?.engine || 'Standard',
            licensePlate: item.article_summary?.licensePlate || '',
            vin: item.article_summary?.vin || '',
            linkageTargetId: item.article_summary?.linkageTargetId || item.article_summary?.carId,
            isPrimary: false,
          })) || [])));

  // Reset modal form state
  const resetForm = () => {
    setMake('');
    setModel('');
    setYear('');
    setEngine('');
    setLicensePlate('');
    setVin('');
    setCatalogLinkageTargetId(null);
    setSelectedManu(null);
    setSelectedSeries(null);
    setSelectedVehicle(null);
    setSeriesList([]);
    setVehiclesList([]);
  };

  const handleOpenModal = () => {
    resetForm();
    setEntryMode('catalog');
    setModalVisible(true);
  };

  // Fetch all manufacturers for the searchable picker
  const fetchAllManufacturers = async () => {
    if (allManufacturers.length > 0) return;
    setLoadingManu(true);
    try {
      const payload = {
        getManufacturers2: {
          country: 'ZA',
          lang: 'en',
          linkingTargetType: 'P',
          includeAll: true,
        },
      };
      const res = await apiFunction(serviceJsonApi, [], payload, 'POST', false);
      const list =
        res?.data?.array ||
        res?.getManufacturers2?.array ||
        res?.data ||
        [];
      setAllManufacturers(list.map(sanitizeBrand));
    } catch (err) {
      console.warn('Failed to load manufacturers:', err);
    } finally {
      setLoadingManu(false);
    }
  };

  // Fetch series for a manufacturer
  const fetchSeriesForManu = async (manu) => {
    setLoadingSeries(true);
    setSeriesList([]);
    setSelectedSeries(null);
    setSelectedVehicle(null);
    setVehiclesList([]);

    const mfrId = resolveManuId(manu);
    try {
      const payload = {
        getModelSeries2: {
          country: 'ZA',
          lang: 'en',
          linkingTargetType: 'P',
          manuId: mfrId,
          includeAll: true,
        },
      };
      const res = await apiFunction(serviceJsonApi, [], payload, 'POST', false);
      const list =
        res?.data?.array ||
        res?.getModelSeries2?.array ||
        res?.data ||
        [];
      setSeriesList(list.map((s) => ({ ...s, linkingTargetType: 'P' })));
    } catch (err) {
      console.warn('Failed to load model series:', err);
    } finally {
      setLoadingSeries(false);
    }
  };

  // Fetch vehicles/engines for a series
  const fetchVehiclesForSeries = async (manu, series) => {
    if (!manu || !series) return;
    setLoadingVehicles(true);
    setVehiclesList([]);
    setSelectedVehicle(null);

    const mfrId = resolveManuId(manu);
    const seriesId = series.modelId || series.id;

    try {
      const payload = {
        getLinkageTargets: {
          linkageTargetCountry: 'ZA',
          lang: 'en',
          linkageTargetType: 'P',
          mfrIds: Number(mfrId),
          vehicleModelSeriesIds: Number(seriesId),
          perPage: 100,
          page: 1,
        },
      };
      const res = await apiFunction(serviceJsonApi, [], payload, 'POST', false);
      let list = res?.linkageTargets || res?.data?.array || res?.data || [];

      if (!list || list.length === 0) {
        const restRes = await apiFunction(
          `${vehiclesApi}?mfrId=${mfrId}&seriesId=${seriesId}&type=P`,
          [],
          {},
          'GET',
          false
        );
        list = restRes?.data?.array || restRes?.data || [];
      }

      setVehiclesList(list);
    } catch (err) {
      console.warn('Failed to load vehicles for series:', err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Handlers for Catalog selections
  const handleSelectManu = (manu) => {
    const fixed = sanitizeBrand(manu);
    setSelectedManu(fixed);
    setPickerVisible(false);
    fetchSeriesForManu(fixed);
  };

  const handleSelectSeries = (series) => {
    setSelectedSeries(series);
    setPickerVisible(false);
    fetchVehiclesForSeries(selectedManu, series);
  };

  const handleSelectVehicleTrim = (veh) => {
    setSelectedVehicle(veh);
    setPickerVisible(false);

    // Autofill form inputs
    const manuName = (selectedManu?.manuName || selectedManu?.name || '').toUpperCase();
    const seriesName = (selectedSeries?.modelname || selectedSeries?.name || '').toUpperCase();
    const beginYear = String(
      veh.yearOfConstrFrom ||
      veh.beginYear ||
      veh.beginYearMonth ||
      new Date().getFullYear()
    ).substring(0, 4);

    const engineDesc =
      veh.description ||
      veh.typeName ||
      veh.vehicleSalesDescription ||
      veh.engineCode ||
      (veh.engines?.[0]?.code ? `Engine ${veh.engines[0].code}` : 'Standard');

    const targetId = veh.linkageTargetId || veh.carId || veh.id;

    setMake(manuName);
    setModel(seriesName);
    setYear(beginYear);
    setEngine(engineDesc);
    setCatalogLinkageTargetId(targetId);
  };

  const openPickerModal = async (type) => {
    setPickerType(type);
    setPickerSearch('');
    if (type === 'manu') {
      await fetchAllManufacturers();
    }
    setPickerVisible(true);
  };

  // Submit to backend
  const handleSaveVehicle = async () => {
    if (!make.trim() || !model.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Required Fields',
        text2: 'Please specify Make and Model for the vehicle.',
      });
      return;
    }

    setSubmitting(true);
    const userId = await AsyncStorage.getItem('userId');
    const payload = {
      userId: userId,
      make: make.trim().toUpperCase(),
      model: model.trim().toUpperCase(),
      year: year.trim() || String(new Date().getFullYear()),
      engine: engine.trim() || 'Standard',
      licensePlate: licensePlate.trim().toUpperCase(),
      vin: vin.trim().toUpperCase(),
      linkageTargetId: catalogLinkageTargetId,
      carId: catalogLinkageTargetId,
    };

    try {
      let res = await apiFunction(addVehicleToGarageApi, [], payload, 'POST', false);
      if (!res?.success) {
        res = await apiFunction(addVehicleToWatchlistApi, [], payload, 'POST', false);
      }
      setSubmitting(false);
      if (res?.success) {
        Toast.show({
          type: 'success',
          text1: 'Vehicle Saved to Garage',
          text2: `${payload.make} ${payload.model}`,
        });
        setModalVisible(false);
        resetForm();
        refreshUser();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to Save',
          text2: res?.message || 'Error saving vehicle.',
        });
      }
    } catch (err) {
      setSubmitting(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.response?.data?.message || 'Server error.',
      });
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    const userId = await AsyncStorage.getItem('userId');
    try {
      const res = await apiFunction(
        removeFromWatchlistApi,
        [],
        { userId: userId, vehicleId },
        'POST',
        false
      );
      if (res?.success) {
        Toast.show({
          type: 'success',
          text1: 'Vehicle Removed',
        });
        refreshUser();
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Failed to remove vehicle',
      });
    }
  };

  // Smart Direct Parts Lookup:
  // If catalog linkageTargetId exists, navigate directly to VerifiedPartsScreen!
  // Otherwise, route to PartsFinder with preselected vehicle data.
  const handleLookupParts = (car) => {
    const targetId =
      car.linkageTargetId ||
      car.linkage_target_id ||
      car.raw_specs?.linkageTargetId ||
      car.raw_specs?.carId;

    if (targetId) {
      navigation.navigate('VerifiedParts', {
        vehicle: {
          linkageTargetId: targetId,
          description: `${car.make} ${car.model} ${car.year ? `(${car.year})` : ''} ${car.engine || ''}`.trim(),
          linkageTargetType: 'P',
          make: car.make,
          model: car.model,
          year: car.year,
          engine: car.engine || car.engine_code,
          licensePlate: car.licensePlate || car.license_plate,
        },
        selectedManufacturer: { manuName: car.make },
        selectedSeries: { modelname: car.model },
        appType: 'P',
        source: 'garage_card',
      });
    } else {
      navigation.navigate('PartsFinder', { preselectedVehicle: car });
    }
  };

  // Filter items for the secondary picker modal
  const filteredPickerItems = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (pickerType === 'manu') {
      const list = allManufacturers.length > 0 ? allManufacturers : popularBrands;
      if (!q) return list;
      return list.filter((m) =>
        (m.manuName || m.name || '').toLowerCase().includes(q)
      );
    }
    if (pickerType === 'series') {
      if (!q) return seriesList;
      return seriesList.filter((s) =>
        (s.modelname || s.name || '').toLowerCase().includes(q)
      );
    }
    if (pickerType === 'trim') {
      if (!q) return vehiclesList;
      return vehiclesList.filter((v) => {
        const title = (v.description || v.typeName || v.vehicleSalesDescription || '').toLowerCase();
        const code = (v.engineCode || v.engines?.[0]?.code || '').toLowerCase();
        return title.includes(q) || code.includes(q);
      });
    }
    return [];
  }, [pickerType, pickerSearch, allManufacturers, popularBrands, seriesList, vehiclesList]);

  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <AppHeader
        title="My Garage"
        subtitle={`${garageVehicles.length} Saved Vehicle${garageVehicles.length === 1 ? '' : 's'}`}
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.addIconBtn}
            onPress={handleOpenModal}
            activeOpacity={0.7}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#D0142C']}
            tintColor="#D0142C"
          />
        }
      >
        {garageVehicles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Car size={36} color="#D0142C" />
            </View>
            <Text style={styles.emptyTitle}>Your Garage is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Save your vehicles here to instantly find 100% verified spark plugs, glow plugs, and oxygen sensors.
            </Text>
            <AppButton
              title="Add Your First Vehicle"
              leftIcon={<Plus size={18} color="#FFFFFF" />}
              onPress={handleOpenModal}
              style={{ marginTop: 18 }}
            />
          </View>
        ) : (
          <View style={styles.vehicleList}>
            {garageVehicles.map((car, idx) => {
              const hasCatalogLink = Boolean(
                car.linkageTargetId ||
                car.linkage_target_id ||
                car.raw_specs?.linkageTargetId ||
                car.raw_specs?.carId
              );

              return (
                <View key={car.id || idx} style={styles.carCard}>
                  <View style={styles.carCardTop}>
                    <View style={styles.carIconBox}>
                      <Car size={20} color="#D0142C" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                        <Text style={styles.carMakeModel}>
                          {car.make} {car.model}
                        </Text>
                        {hasCatalogLink && (
                          <View style={styles.verifiedBadge}>
                            <ShieldCheck size={11} color="#059669" strokeWidth={2.5} />
                            <Text style={styles.verifiedBadgeText}>TecDoc Verified</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.carSpecs}>
                        {car.year || 'N/A'} • {car.engine || 'Standard'}
                        {car.license_plate || car.licensePlate
                          ? ` • ${car.license_plate || car.licensePlate}`
                          : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.trashBtn}
                      onPress={() => handleDeleteVehicle(car.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  {/* Card Action Bar */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.findPartsBtn}
                      onPress={() => handleLookupParts(car)}
                      activeOpacity={0.75}
                    >
                      <Search size={14} color="#D0142C" />
                      <Text style={styles.findPartsText}>
                        {hasCatalogLink ? 'View 100% Compatible Parts' : 'Lookup Compatible Parts'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Main Add Vehicle Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Vehicle to Garage</Text>
                <Text style={styles.modalSubtitle}>
                  Choose from catalog or type manual details
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.closeBtn}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Segmented Mode Selector */}
            <View style={styles.modeSegment}>
              <TouchableOpacity
                style={[
                  styles.modeSegmentBtn,
                  entryMode === 'catalog' && styles.modeSegmentBtnActive,
                ]}
                onPress={() => setEntryMode('catalog')}
                activeOpacity={0.8}
              >
                <BookOpen
                  size={15}
                  color={entryMode === 'catalog' ? '#D0142C' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.modeSegmentText,
                    entryMode === 'catalog' && styles.modeSegmentTextActive,
                  ]}
                >
                  Choose from Catalog
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeSegmentBtn,
                  entryMode === 'manual' && styles.modeSegmentBtnActive,
                ]}
                onPress={() => setEntryMode('manual')}
                activeOpacity={0.8}
              >
                <Edit3
                  size={15}
                  color={entryMode === 'manual' ? '#D0142C' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.modeSegmentText,
                    entryMode === 'manual' && styles.modeSegmentTextActive,
                  ]}
                >
                  Enter Manually
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {entryMode === 'catalog' ? (
                /* ================= CATALOG FLOW ================= */
                <View>
                  {!selectedVehicle ? (
                    /* Step-by-step catalog picker */
                    <View style={styles.catalogStepContainer}>
                      {/* STEP 1: MAKE SELECTION */}
                      <View style={styles.stepSection}>
                        <View style={styles.stepHeaderRow}>
                          <View style={styles.stepNumberBadge}>
                            <Text style={styles.stepNumberText}>1</Text>
                          </View>
                          <Text style={styles.stepTitle}>Select Make / Brand</Text>
                          {selectedManu && (
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedManu(null);
                                setSelectedSeries(null);
                                setSeriesList([]);
                                setVehiclesList([]);
                              }}
                              style={styles.stepResetLink}
                            >
                              <RotateCcw size={12} color="#D0142C" />
                              <Text style={styles.stepResetText}>Change</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {selectedManu ? (
                          <View style={styles.selectedPillCard}>
                            <Text style={styles.selectedPillLabel}>Selected Make:</Text>
                            <Text style={styles.selectedPillValue}>
                              {selectedManu.manuName || selectedManu.name}
                            </Text>
                            <CheckCircle2 size={16} color="#059669" />
                          </View>
                        ) : (
                          <View>
                            <View style={styles.popularBrandsGrid}>
                              {popularBrands.slice(0, 9).map((b) => {
                                const isSel =
                                  resolveManuId(selectedManu) === resolveManuId(b);
                                return (
                                  <BrandLogoCard
                                    key={b.id || b.manuId}
                                    item={b}
                                    isSelected={isSel}
                                    onPress={handleSelectManu}
                                  />
                                );
                              })}
                            </View>

                            <TouchableOpacity
                              style={styles.moreBrandsBtn}
                              onPress={() => openPickerModal('manu')}
                              activeOpacity={0.75}
                            >
                              <Search size={14} color="#4B5563" />
                              <Text style={styles.moreBrandsText}>
                                View All 150+ Vehicle Makes...
                              </Text>
                              <ChevronRight size={14} color="#9CA3AF" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>

                      {/* STEP 2: MODEL SERIES SELECTION */}
                      {selectedManu && (
                        <View style={styles.stepSection}>
                          <View style={styles.stepHeaderRow}>
                            <View style={styles.stepNumberBadge}>
                              <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={styles.stepTitle}>Select Model Series</Text>
                            {selectedSeries && (
                              <TouchableOpacity
                                onPress={() => {
                                  setSelectedSeries(null);
                                  setVehiclesList([]);
                                }}
                                style={styles.stepResetLink}
                              >
                                <RotateCcw size={12} color="#D0142C" />
                                <Text style={styles.stepResetText}>Change</Text>
                              </TouchableOpacity>
                            )}
                          </View>

                          {loadingSeries ? (
                            <View style={styles.inlineLoading}>
                              <ActivityIndicator size="small" color="#D0142C" />
                              <Text style={styles.inlineLoadingText}>
                                Loading series for {selectedManu.manuName || selectedManu.name}...
                              </Text>
                            </View>
                          ) : selectedSeries ? (
                            <View style={styles.selectedPillCard}>
                              <Text style={styles.selectedPillLabel}>Selected Series:</Text>
                              <Text style={styles.selectedPillValue}>
                                {selectedSeries.modelname || selectedSeries.name}
                              </Text>
                              <CheckCircle2 size={16} color="#059669" />
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.selectorDropdownBtn}
                              onPress={() => openPickerModal('series')}
                              activeOpacity={0.75}
                            >
                              <Layers size={16} color="#4B5563" />
                              <Text style={styles.selectorDropdownText}>
                                Choose Model Series ({seriesList.length} available)...
                              </Text>
                              <ChevronDown size={16} color="#9CA3AF" />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      {/* STEP 3: ENGINE / TRIM SELECTION */}
                      {selectedSeries && (
                        <View style={styles.stepSection}>
                          <View style={styles.stepHeaderRow}>
                            <View style={styles.stepNumberBadge}>
                              <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <Text style={styles.stepTitle}>Select Engine & Trim</Text>
                          </View>

                          {loadingVehicles ? (
                            <View style={styles.inlineLoading}>
                              <ActivityIndicator size="small" color="#D0142C" />
                              <Text style={styles.inlineLoadingText}>
                                Loading engines & trims from TecDoc...
                              </Text>
                            </View>
                          ) : vehiclesList.length === 0 ? (
                            <View style={styles.emptyTrimsBox}>
                              <Text style={styles.emptyTrimsText}>
                                No specific engine trims listed. You can switch to "Enter Manually" to save this model.
                              </Text>
                              <TouchableOpacity
                                style={styles.quickManualBtn}
                                onPress={() => {
                                  setMake((selectedManu.manuName || selectedManu.name).toUpperCase());
                                  setModel((selectedSeries.modelname || selectedSeries.name).toUpperCase());
                                  setEntryMode('manual');
                                }}
                              >
                                <Text style={styles.quickManualBtnText}>
                                  Continue with Manual Entry
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View>
                              <TouchableOpacity
                                style={styles.selectorDropdownBtn}
                                onPress={() => openPickerModal('trim')}
                                activeOpacity={0.75}
                              >
                                <Zap size={16} color="#D0142C" />
                                <Text style={styles.selectorDropdownText}>
                                  Choose Engine / Trim ({vehiclesList.length} options)...
                                </Text>
                                <ChevronDown size={16} color="#9CA3AF" />
                              </TouchableOpacity>

                              {/* Preview first 3 trims directly for 1-tap selection */}
                              <View style={{ marginTop: 8, gap: 6 }}>
                                {vehiclesList.slice(0, 3).map((v, i) => {
                                  const trimName =
                                    v.description ||
                                    v.typeName ||
                                    v.vehicleSalesDescription ||
                                    v.engineCode ||
                                    'Standard';
                                  const kw = v.kiloWattsFrom || v.powerKwFrom;
                                  const hp = v.horsePowerFrom || v.powerHpFrom;
                                  const powerStr = kw && hp ? `${kw} kW / ${hp} HP` : hp ? `${hp} HP` : kw ? `${kw} kW` : '';
                                  const yearRange = v.yearOfConstrFrom
                                    ? `${v.yearOfConstrFrom} - ${v.yearOfConstrTo || 'Present'}`
                                    : '';

                                  return (
                                    <TouchableOpacity
                                      key={v.linkageTargetId || v.carId || i}
                                      style={styles.quickTrimCard}
                                      onPress={() => handleSelectVehicleTrim(v)}
                                      activeOpacity={0.75}
                                    >
                                      <View style={{ flex: 1 }}>
                                        <Text style={styles.quickTrimTitle}>{trimName}</Text>
                                        <Text style={styles.quickTrimSubtitle}>
                                          {[powerStr, yearRange, v.fuelType].filter(Boolean).join(' • ')}
                                        </Text>
                                      </View>
                                      <ChevronRight size={16} color="#D0142C" />
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ) : (
                    /* Autofilled Review Card & Optional Customizations */
                    <View style={styles.autofillReviewContainer}>
                      {/* Autofilled TecDoc Match Banner */}
                      <View style={styles.matchBanner}>
                        <View style={styles.matchBannerTop}>
                          <View style={styles.verifiedIconWrap}>
                            <ShieldCheck size={18} color="#059669" strokeWidth={2.5} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.matchBannerBadge}>TecDoc Catalog Verified</Text>
                              <Sparkles size={12} color="#D97706" />
                            </View>
                            <Text style={styles.matchCarTitle}>{make} {model}</Text>
                            <Text style={styles.matchCarSubtitle}>{engine}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.reselectBtn}
                            onPress={() => setSelectedVehicle(null)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <RotateCcw size={14} color="#6B7280" />
                            <Text style={styles.reselectBtnText}>Change</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.matchSpecsPillRow}>
                          <View style={styles.matchPill}>
                            <Text style={styles.matchPillLabel}>Year:</Text>
                            <Text style={styles.matchPillVal}>{year || 'N/A'}</Text>
                          </View>
                          <View style={styles.matchPill}>
                            <Text style={styles.matchPillLabel}>Linkage ID:</Text>
                            <Text style={styles.matchPillVal}>#{catalogLinkageTargetId}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Review / Editable Garage Specs */}
                      <Text style={styles.reviewSectionTitle}>Review & Additional Details</Text>

                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <AppInput
                            label="Model Year"
                            placeholder="e.g. 2021"
                            value={year}
                            onChangeText={setYear}
                            keyboardType="number-pad"
                            maxLength={4}
                          />
                        </View>
                        <View style={{ flex: 1.5 }}>
                          <AppInput
                            label="Engine / Trim"
                            placeholder="e.g. 2.8 GD-6"
                            value={engine}
                            onChangeText={setEngine}
                          />
                        </View>
                      </View>

                      <AppInput
                        label="License Plate (Optional)"
                        placeholder="e.g. CA 123-456"
                        value={licensePlate}
                        onChangeText={setLicensePlate}
                        autoCapitalize="characters"
                      />

                      <AppInput
                        label="VIN (Optional)"
                        placeholder="e.g. AHT12345678901234"
                        value={vin}
                        onChangeText={setVin}
                        autoCapitalize="characters"
                      />

                      <AppButton
                        title="Save Vehicle to Garage"
                        leftIcon={<Check size={18} color="#FFFFFF" strokeWidth={2.5} />}
                        onPress={handleSaveVehicle}
                        loading={submitting}
                        style={{ marginTop: 12 }}
                      />
                    </View>
                  )}
                </View>
              ) : (
                /* ================= MANUAL FLOW ================= */
                <View style={styles.manualFlowContainer}>
                  <Text style={styles.manualNoticeText}>
                    Enter your vehicle specifications directly. You can find matching parts at any time.
                  </Text>

                  <AppInput
                    label="Make / Manufacturer *"
                    placeholder="e.g. TOYOTA, AUDI, BMW"
                    value={make}
                    onChangeText={setMake}
                    autoCapitalize="characters"
                  />

                  <AppInput
                    label="Model Series *"
                    placeholder="e.g. HILUX, A4, 320i"
                    value={model}
                    onChangeText={setModel}
                    autoCapitalize="characters"
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <AppInput
                        label="Year"
                        placeholder="e.g. 2021"
                        value={year}
                        onChangeText={setYear}
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </View>
                    <View style={{ flex: 1.5 }}>
                      <AppInput
                        label="Engine / Trim"
                        placeholder="e.g. 2.8 GD-6"
                        value={engine}
                        onChangeText={setEngine}
                      />
                    </View>
                  </View>

                  <AppInput
                    label="License Plate (Optional)"
                    placeholder="e.g. CA 123-456"
                    value={licensePlate}
                    onChangeText={setLicensePlate}
                    autoCapitalize="characters"
                  />

                  <AppInput
                    label="VIN (Optional)"
                    placeholder="e.g. AHT12345678901234"
                    value={vin}
                    onChangeText={setVin}
                    autoCapitalize="characters"
                  />

                  <AppButton
                    title="Save Vehicle to Garage"
                    leftIcon={<Check size={18} color="#FFFFFF" strokeWidth={2.5} />}
                    onPress={handleSaveVehicle}
                    loading={submitting}
                    style={{ marginTop: 12 }}
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Secondary Searchable Picker Modal (Makes, Series, Trims) */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setPickerVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View
            style={[
              styles.pickerSafeArea,
              { paddingTop: insets.top, paddingBottom: insets.bottom },
            ]}
          >
          <View style={styles.pickerHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pickerHeaderTitle}>
                {pickerType === 'manu'
                  ? 'Select Manufacturer'
                  : pickerType === 'series'
                  ? `Select ${selectedManu?.manuName || selectedManu?.name} Series`
                  : `Select Engine / Trim`}
              </Text>
              <Text style={styles.pickerHeaderSub}>
                {filteredPickerItems.length} options available
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setPickerVisible(false)}
              style={styles.pickerCloseBtn}
            >
              <X size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.pickerSearchRow}>
            <Search size={16} color="#9CA3AF" />
            <TextInput
              style={styles.pickerSearchInput}
              placeholder={`Search ${pickerType === 'manu' ? 'make' : pickerType === 'series' ? 'model series' : 'trim or engine code'}...`}
              placeholderTextColor="#9CA3AF"
              value={pickerSearch}
              onChangeText={setPickerSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {pickerSearch.length > 0 && (
              <TouchableOpacity onPress={() => setPickerSearch('')}>
                <X size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {loadingManu && pickerType === 'manu' ? (
            <View style={styles.pickerCenterLoading}>
              <ActivityIndicator size="large" color="#D0142C" />
              <Text style={styles.pickerLoadingText}>Loading manufacturers...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredPickerItems}
              keyExtractor={(item, index) =>
                String(
                  item.manuId ||
                  item.modelId ||
                  item.linkageTargetId ||
                  item.carId ||
                  item.id ||
                  index
                )
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
              renderItem={({ item }) => {
                if (pickerType === 'manu') {
                  const name = item.manuName || item.name || 'Brand';
                  return (
                    <TouchableOpacity
                      style={styles.pickerListItem}
                      onPress={() => handleSelectManu(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.pickerListIconBox}>
                        <Car size={18} color="#D0142C" />
                      </View>
                      <Text style={styles.pickerListItemText}>{name}</Text>
                      <ChevronRight size={16} color="#D1D5DB" />
                    </TouchableOpacity>
                  );
                }

                if (pickerType === 'series') {
                  const name = item.modelname || item.name || 'Series';
                  return (
                    <TouchableOpacity
                      style={styles.pickerListItem}
                      onPress={() => handleSelectSeries(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.pickerListIconBox}>
                        <Layers size={18} color="#D0142C" />
                      </View>
                      <Text style={styles.pickerListItemText}>{name}</Text>
                      <ChevronRight size={16} color="#D1D5DB" />
                    </TouchableOpacity>
                  );
                }

                // Trim selection
                const title =
                  item.description ||
                  item.typeName ||
                  item.vehicleSalesDescription ||
                  item.engineCode ||
                  'Standard Trim';
                const kw = item.kiloWattsFrom || item.powerKwFrom;
                const hp = item.horsePowerFrom || item.powerHpFrom;
                const powerStr = kw && hp ? `${kw} kW / ${hp} HP` : hp ? `${hp} HP` : kw ? `${kw} kW` : null;
                const yearRange = item.yearOfConstrFrom
                  ? `${item.yearOfConstrFrom} - ${item.yearOfConstrTo || 'Present'}`
                  : null;

                return (
                  <TouchableOpacity
                    style={styles.pickerTrimItem}
                    onPress={() => handleSelectVehicleTrim(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.pickerListIconBox}>
                      <Zap size={18} color="#D0142C" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerTrimTitle}>{title}</Text>
                      <Text style={styles.pickerTrimSub}>
                        {[powerStr, yearRange, item.fuelType].filter(Boolean).join(' • ')}
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#D1D5DB" />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  addIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  vehicleList: {
    gap: 12,
  },
  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  carCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  carIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  carMakeModel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  carSpecs: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  trashBtn: {
    padding: 6,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  findPartsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    borderRadius: 8,
  },
  findPartsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D0142C',
  },

  /* Modal Bottom Sheet */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
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
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },

  /* Segmented Toggle */
  modeSegment: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  modeSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  modeSegmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  modeSegmentTextActive: {
    color: '#D0142C',
    fontWeight: '700',
  },

  /* Catalog Steps */
  catalogStepContainer: {
    gap: 14,
  },
  stepSection: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D0142C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  stepResetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  stepResetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D0142C',
  },
  selectedPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  selectedPillLabel: {
    fontSize: 12,
    color: '#065F46',
  },
  selectedPillValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  popularBrandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  moreBrandsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 9,
    marginTop: 8,
  },
  moreBrandsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  selectorDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  selectorDropdownText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  inlineLoadingText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyTrimsBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTrimsText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  quickManualBtn: {
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  quickManualBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D0142C',
  },
  quickTrimCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickTrimTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  quickTrimSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  /* Autofill Review Card */
  autofillReviewContainer: {
    gap: 12,
  },
  matchBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  matchBannerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  verifiedIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchBannerBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    textTransform: 'uppercase',
  },
  matchCarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#065F46',
    marginTop: 2,
  },
  matchCarSubtitle: {
    fontSize: 12,
    color: '#047857',
    marginTop: 1,
  },
  reselectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reselectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  matchSpecsPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
    paddingTop: 8,
  },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchPillLabel: {
    fontSize: 11,
    color: '#047857',
  },
  matchPillVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  reviewSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 4,
  },

  /* Manual flow notice */
  manualFlowContainer: {
    gap: 6,
  },
  manualNoticeText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 16,
  },

  /* Secondary Picker Modal Styles */
  pickerSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  pickerHeaderSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  pickerCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  pickerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  pickerCenterLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  pickerLoadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  pickerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  pickerListIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerListItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  pickerTrimItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  pickerTrimTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  pickerTrimSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default MyGarageScreen;
