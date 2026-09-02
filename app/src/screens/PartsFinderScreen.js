import React, { useEffect, useState } from 'react';
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
import { serviceJsonApi, addSearchHistoryApi } from '../apis/api';
import { getMyselfRedux } from '../redux/getData';
import Toast from 'react-native-toast-message';
import AppHeader from '../components/common/AppHeader';
import AppButton from '../components/common/AppButton';
import AppInput from '../components/common/AppInput';

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

  const handleSelectSeries = (item) => {
    setSelectedSeries(item);
    setModalVisible(false);
  };

  const handleProceedToVehicles = () => {
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
    navigation.navigate('vehiclesListScreen', {
      selectedApp,
      appType,
      selectedManufacturer,
      selectedSeries,
    });
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
    const payload = {
      getArticles: {
        articleCountry: 'ZA',
        dataSupplierIds: ['5567', '7729'],
        searchQuery: partNumber.trim(),
        lang: 'en',
        perPage: 20,
        page: 1,
        includeAll: true,
      },
    };

    try {
      const res = await apiFunction(serviceJsonApi, [], payload, 'POST', false);
      setPartSearching(false);
      const results =
        res?.data?.array || res?.getArticles?.array || res?.data || [];

      // Record Search History if user logged in
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        apiFunction(
          addSearchHistoryApi,
          [],
          { userId, query: partNumber.trim(), resultsCount: results.length },
          'POST',
          false
        ).catch(() => {});
      }

      navigation.navigate('VerifiedParts', {
        articles: results,
        searchQuery: partNumber.trim(),
        directSearch: true,
      });
    } catch (err) {
      setPartSearching(false);
      Toast.show({
        type: 'error',
        text1: 'Search Failed',
        text2: err?.response?.data?.message || 'Error searching catalog.',
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
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
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
                    onPress={() => setSelectedApp(app.id)}
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

            {/* Step 2: Make & Model Cascade */}
            <Text style={[styles.inputSectionLabel, { marginTop: 14 }]}>
              VEHICLE SPECIFICATIONS
            </Text>

            {/* Manufacturer Selector */}
            <TouchableOpacity
              style={styles.pickerField}
              onPress={() => openPicker('manufacturer')}
              activeOpacity={0.75}
            >
              <View>
                <Text style={styles.pickerFieldLabel}>Make / Manufacturer</Text>
                <Text
                  style={[
                    styles.pickerFieldValue,
                    !selectedManufacturer && styles.pickerFieldPlaceholder,
                  ]}
                >
                  {selectedManufacturer?.manuName ||
                    selectedManufacturer?.name ||
                    'Select Make (e.g. Toyota, BMW)'}
                </Text>
              </View>
              <ChevronDown size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Series Selector */}
            <TouchableOpacity
              style={[
                styles.pickerField,
                !selectedManufacturer && styles.pickerFieldDisabled,
              ]}
              onPress={() => selectedManufacturer && openPicker('series')}
              disabled={!selectedManufacturer}
              activeOpacity={0.75}
            >
              <View>
                <Text style={styles.pickerFieldLabel}>Model Series</Text>
                <Text
                  style={[
                    styles.pickerFieldValue,
                    !selectedSeries && styles.pickerFieldPlaceholder,
                  ]}
                >
                  {selectedSeries?.modelname ||
                    selectedSeries?.name ||
                    (selectedManufacturer
                      ? 'Select Model (e.g. Hilux, 3 Series)'
                      : 'Select Make first')}
                </Text>
              </View>
              <ChevronDown size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Proceed CTA */}
            <AppButton
              title="View Matching Engines & Trims"
              rightIcon={<ArrowRight size={16} color="#FFFFFF" />}
              onPress={handleProceedToVehicles}
              disabled={!selectedManufacturer || !selectedSeries}
              style={styles.proceedBtn}
            />
          </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  segmentTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  scrollBody: {
    paddingBottom: 24,
  },
  inputSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  appTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  appTypePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
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
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  pickerFieldPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  proceedBtn: {
    marginTop: 10,
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
