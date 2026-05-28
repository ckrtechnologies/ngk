import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { apiFunction } from '../apis/apiFunction';
import { addSearchHistoryApi, serviceJsonApi } from '../apis/api';
import {
  ChevronLeft,
  Home,
  Car,
  User,
  Triangle,
  Flag,
  Building2,
  Globe,
  Check,
  ChevronDown,
  Info,
  X,
  Search
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyselfRedux } from '../redux/getData';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const PartsFinderScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Vehicle Finder');
  const [currentStep, setCurrentStep] = useState(1);
  const { myself } = useSelector((state) => state.getData);
  const dispatch = useDispatch();

  // Data states
  const [manufacturersData, setManufacturersData] = useState([]);
  const [seriesData, setSeriesData] = useState([]);
  const [variantData, setVariantData] = useState([]);

  // Selection States
  const [selectedApp, setSelectedApp] = useState('Passenger');
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [loadingType, setLoadingType] = useState(''); // 'manufacturer', 'series', 'variant'

  // Part Number States
  const [partNumber, setPartNumber] = useState('');

  // Modal visibility
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownType, setDropdownType] = useState(''); // 'manufacturer', 'series' or 'variant'

  const applications = [
    { id: 'Passenger', label: 'Passenger', icon: Car, type: 'P' },
    { id: 'Motorcycle', label: 'Motorcycle', icon: User, type: 'M' },
    { id: 'Garden', label: 'Garden', icon: Triangle, type: 'P' },
    { id: 'Go Cart', label: 'Go Cart', icon: Flag, type: 'P' },
    { id: 'Construction', label: 'Construction', icon: Building2, type: 'O' },
    { id: 'Marine', label: 'Marine', icon: Globe, type: 'P' },
  ];

  useEffect(() => {
    const getMyself = async () => {
      const userId = await AsyncStorage.getItem("userId");
      dispatch(getMyselfRedux(userId));
    }
    if (!myself) {
      getMyself();
    }
  }, [dispatch])

  // Fetch Manufacturers
  useEffect(() => {
    if (currentStep >= 2) {
      const fetchManufacturers = async () => {
        setLoadingType('manufacturer');
        const appType = applications.find(app => app.id === selectedApp)?.type || 'P';
        const payload = {
          "getManufacturers2": {
            "country": "ZA",
            "lang": "en",
            "linkingTargetType": appType,
            "includeAll": true
          }
        };
        const res = await apiFunction(serviceJsonApi, [], payload, "POST", true);
        console.log(res?.data?.array, '---------> manufacturer')
        if (res?.data?.array) {
          setManufacturersData(res.data.array.map(m => ({ id: m.manuId, label: m.manuName, favorFlag: m.favorFlag })));
        }
        setLoadingType('');
      };
      fetchManufacturers();
    }
  }, [selectedApp, currentStep]);

  // Fetch Series
  useEffect(() => {
    if (currentStep >= 3 && selectedManufacturer) {
      const fetchSeries = async () => {
        setLoadingType('series');
        const appType = applications.find(app => app.id === selectedApp)?.type || 'P';
        const payload = {
          "getModelSeries": {
            "country": "ZA",
            "lang": "en",
            "manuId": selectedManufacturer.id,
            "linkingTargetType": appType
          }
        };
        const res = await apiFunction(serviceJsonApi, [], payload, "POST", true);
        if (res?.data?.array) {
          setSeriesData(res.data.array.map(s => ({ id: s.modelId, label: s.modelname || s.name })));
        }
        setLoadingType('');
      };
      fetchSeries();
    }
  }, [selectedManufacturer, currentStep]);

  // Fetch Variants
  useEffect(() => {
    if (currentStep >= 4 && selectedSeries) {
      const fetchVariants = async () => {
        setLoadingType('variant');
        const appType = applications.find(app => app.id === selectedApp)?.type || 'P';
        const payload = {
          "getVehicleIdsByCriteria": {
            "carType": appType,
            "countriesCarSelection": "ZA",
            "lang": "en",
            "manuId": selectedManufacturer.id,
            "modId": selectedSeries.id
          }
        };
        const res = await apiFunction(serviceJsonApi, [], payload, "POST", true);



        if (res?.data?.array?.length > 0) {
          const carIds = res.data.array.map(v => v.carId);
          const detailsPayload = {
            "getVehicleByIds3": {
              "articleCountry": "ZA",
              "lang": "en",
              "carIds": { "array": carIds },
              "countriesCarSelection": "ZA",
              "country": "ZA",
            }
          };
          const detailsRes = await apiFunction(serviceJsonApi, [], detailsPayload, "POST", true);

          if (detailsRes?.data?.array) {
            setVariantData(detailsRes.data.array.map(v => {
              const details = v.vehicleDetails || {};
              const yearFrom = details.yearOfConstrFrom ? details.yearOfConstrFrom.toString().substring(0, 4) : '';
              const yearTo = details.yearOfConstrTo ? details.yearOfConstrTo.toString().substring(0, 4) : 'Present';
              const years = yearFrom ? `[${yearFrom} - ${yearTo}]` : '';
              const model = details.modelName || '';
              const type = details.typeName || '';
              const fuel = details.fuelType || '';
              const ccm = details.ccmTech ? `${details.ccmTech}cc` : '';
              const hp = details.powerHpTo ? `${details.powerHpTo}HP` : '';

              const label = `${model} ${type} ${years} ${fuel ? `(${fuel}${ccm ? `, ${ccm}` : ''}${hp ? `, ${hp}` : ''})` : ''}`.trim();

              return {
                id: v.carId,
                label: label,
                vehicle: details
              };
            }));
          } else {
            setVariantData([]);
          }
        } else {
          setVariantData([]);
        }
        setLoadingType('');
      };
      fetchVariants();
    }
  }, [selectedSeries, currentStep]);

  console.log(manufacturersData, "manufacturersData")

  const handleContinue = async () => {
    if (activeTab === 'Vehicle Finder') {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {

        const res = await apiFunction(addSearchHistoryApi, [myself?.id], { dat: selectedVariant?.vehicle }, "PUT", false)
        if (!res.success) {
          Toast.show({
            type: 'error',
            text1: 'Failed to add vehicle in the enquiry',
          })
        }
        navigation.navigate('VerifiedParts', { vehicle: selectedVariant?.vehicle || null });
      }
    } else {
      // Navigate to Verified Parts with the part number
      navigation.navigate('VerifiedParts', { partNumber: partNumber });
    }
  };

  const handleChipPress = (item) => {
    setSelectedVariant(item);
    navigation.navigate('VerifiedParts', { vehicle: item || null });
  }

  const openDropdown = (type) => {
    setDropdownType(type);
    setShowDropdown(true);
  };

  console.log(manufacturersData[0], "manufacturersData")

  const selectOption = (option) => {
    if (dropdownType === 'manufacturer') {
      setSelectedManufacturer(option);
      setSelectedSeries(null); // Reset downstream
      setSelectedVariant(null);
    } else if (dropdownType === 'series') {
      setSelectedSeries(option);
      setSelectedVariant(null); // Reset downstream
    } else {
      setSelectedVariant(option);
    }
    setShowDropdown(false);
  };

  const renderStepHeader = () => {
    let title = "Application Setup";
    if (currentStep === 2) title = "Manufacturer Setup";
    if (currentStep === 3) title = "Series Selection";
    if (currentStep === 4) title = "Variant Selection";

    return (
      <View style={styles.setupHeader}>
        <Text style={styles.setupTitle}>{title}</Text>
        <View style={styles.stepRow}>
          {[1, 2, 3, 4].map((step) => (
            <TouchableOpacity
              key={step}
              onPress={() => setCurrentStep(step)}
              style={[
                styles.stepCircle,
                currentStep >= step && styles.completedStepCircle,
                currentStep === step && styles.activeStepCircle
              ]}
            >
              <Text style={[
                styles.stepText,
                currentStep >= step && styles.completedStepText,
                currentStep === step && styles.activeStepText
              ]}>
                {step === 1 ? 'S1' : step === 2 ? 'S2' : step === 3 ? 'S3' : 'S4'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View>
            <Text style={styles.instructionText}>1. Choose application</Text>
            <View style={styles.grid}>
              {applications.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedApp === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.gridItem, isSelected && styles.selectedGridItem]}
                    onPress={() => {
                      setSelectedApp(item.id);
                      setSelectedManufacturer(null);
                      setSelectedSeries(null);
                      setSelectedVariant(null);
                    }}
                  >
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Check color="#C6122E" size={wp('3%')} strokeWidth={3} />
                      </View>
                    )}
                    <IconComponent
                      color={isSelected ? '#C6122E' : '#444'}
                      size={wp('8%')}
                      strokeWidth={1.5}
                    />
                    <Text style={[styles.gridLabel, isSelected && styles.selectedGridLabel]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 2:
        return (
          <View>
            <Text style={styles.instructionText}>2. Select manufacturer</Text>

            {/* Custom Dropdown */}
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => openDropdown('manufacturer')}
              disabled={loadingType === 'manufacturer'}
            >
              <Text style={styles.dropdownValue}>
                {loadingType === 'manufacturer' ? 'Loading...' : selectedManufacturer?.label || 'Select manufacturer'}
              </Text>
              <ChevronDown color="#C6122E" size={wp('6%')} />
            </TouchableOpacity>

            <View style={styles.popularMakersHeader}>
              <Text style={styles.popularMakersText}>Popular makers</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.grid}>
              {manufacturersData.filter((item) => item.favorFlag == 1).map((item) => {
                const isSelected = selectedManufacturer?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.makerItem, isSelected && styles.selectedGridItem, { height: wp('28%') }]}
                    onPress={() => selectOption(item)}
                  >
                    <Car color={isSelected ? '#C6122E' : '#D1D1D1'} size={wp('10%')} />
                    <Text style={[styles.gridLabel, { fontSize: wp('2.5%'), textAlign: 'center' }, isSelected && styles.selectedGridLabel]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 3:
        return (
          <View>
            <Text style={styles.instructionText}>3. Selection</Text>

            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => openDropdown('series')}
              disabled={loadingType === 'series'}
            >
              <Text style={[styles.dropdownValue, !selectedSeries && { color: '#D1D1D1' }]}>
                {loadingType === 'series' ? 'Loading...' : selectedSeries?.label || 'Select series'}
              </Text>
              <ChevronDown color="#C6122E" size={wp('6%')} />
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <View style={styles.infoCircle}>
                <Info color="#D1D1D1" size={wp('10%')} strokeWidth={1} />
              </View>
              <Text style={styles.infoText}>Fill required fields to continue</Text>
            </View>
          </View>
        );

      case 4:
        return (
          <View>
            <Text style={styles.instructionText}>4.Selection</Text>

            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => openDropdown('variant')}
              disabled={loadingType === 'variant'}
            >
              <Text style={[styles.dropdownValue, !selectedVariant && { color: '#D1D1D1' }]}>
                {loadingType === 'variant' ? 'Loading...' : selectedVariant?.label || 'Select variant'}
              </Text>
              <ChevronDown color="#C6122E" size={wp('6%')} />
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <View style={styles.infoCircle}>
                <Info color="#D1D1D1" size={wp('10%')} strokeWidth={1} />
              </View>
              <Text style={styles.infoText}>Fill required fields to continue</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderPartNumberContent = () => {
    return (
      <View>
        <Text style={styles.setupTitlePart}>Global Lookup</Text>
        <View style={styles.divider} />

        <Text style={styles.instructionText}>Enter part number</Text>

        <View style={styles.searchContainer}>
          <Search color="#C6122E" size={wp('6%')} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="e.g. BKR6EIX"
            placeholderTextColor="#D1D1D1"
            value={partNumber}
            onChangeText={setPartNumber}
            autoCapitalize="characters"
          />
        </View>

        <Text style={styles.helperText}>
          Search our global technical database with at least 3 characters.
        </Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoCircle}>
            <Info color="#D1D1D1" size={wp('10%')} strokeWidth={1} />
          </View>
          <Text style={styles.infoText}>Fill required fields to continue</Text>
        </View>
      </View>
    );
  };

  const isContinueDisabled = () => {
    if (activeTab === 'Vehicle Finder') {
      return (currentStep === 2 && !selectedManufacturer) || (currentStep === 3 && !selectedSeries) || (currentStep === 4 && !selectedVariant);
    } else {
      return partNumber.length < 3;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#FFFFFF" size={wp('6%')} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parts Finder</Text>
        <TouchableOpacity style={styles.homeIconContainer} onPress={() => navigation.navigate('OwnerHome')}>
          <Home color="#C6122E" size={wp('5%')} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Recently Searched */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Recently searched</Text>
          <View style={styles.chipRow}>
            {myself?.searchHistory?.length > 0 ? myself?.searchHistory?.slice(0, 3)?.map((item, index) => (
              <TouchableOpacity key={index} style={styles.chip} onPress={() => handleChipPress(item)}>
                <Text style={styles.chipText}>{item?.manuName} {`(${item?.modelName})`} </Text>
              </TouchableOpacity>
            )) : <Text style={styles.chipText}>No search history</Text>}
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Vehicle Finder' && styles.activeTab]}
            onPress={() => setActiveTab('Vehicle Finder')}
          >
            <Text style={[styles.tabText, activeTab === 'Vehicle Finder' && styles.activeTabText]}>
              Vehicle Finder
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Part Number' && styles.activeTab]}
            onPress={() => setActiveTab('Part Number')}
          >
            <Text style={[styles.tabText, activeTab === 'Part Number' && styles.activeTabText]}>
              Part Number
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'Vehicle Finder' ? (
          <>
            {renderStepHeader()}
            <View style={styles.divider} />
            {renderStepContent()}
          </>
        ) : (
          renderPartNumberContent()
        )}

      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueBtn,
            isContinueDisabled() && { backgroundColor: '#D1D1D1' }
          ]}
          onPress={handleContinue}
          disabled={isContinueDisabled()}
        >
          <Text style={styles.continueBtnText}>
            {activeTab === 'Vehicle Finder' && currentStep === 4 ? 'Complete Selection' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {dropdownType}</Text>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <X color="#000" size={wp('6%')} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={
                dropdownType === 'manufacturer' ? manufacturersData :
                  dropdownType === 'series' ? seriesData :
                    variantData
              }
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => selectOption(item)}
                >
                  <Text style={styles.dropdownItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    paddingBottom: hp('15%'),
  },
  sectionHeader: {
    paddingHorizontal: wp('6%'),
    marginTop: hp('3%'),
  },
  sectionLabel: {
    fontSize: wp('3%'),
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: hp('1.5%'),
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#F5F6FA',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
    marginRight: wp('3%'),
    marginBottom: wp('3%'),
  },
  chipText: {
    fontSize: wp('3%'),
    color: '#000000',
    fontWeight: '500',
  },
  tabContainer: {
    backgroundColor: '#F0F1F5',
    marginHorizontal: wp('6%'),
    marginTop: hp('2%'),
    borderRadius: wp('4%'),
    flexDirection: 'row',
    padding: wp('1%'),
    height: hp('8%'),
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp('3%'),
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#000000',
  },
  tabText: {
    fontSize: wp('3.5%'),
    color: '#8E8E8E',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#000000',
  },
  setupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('6%'),
    marginTop: hp('4%'),
  },
  setupTitle: {
    fontSize: wp('5.5%'),
    fontWeight: '900',
    color: '#000000',
  },
  setupTitlePart: {
    fontSize: wp('5.5%'),
    fontWeight: '900',
    color: '#000000',
    marginHorizontal: wp('6%'),
    marginTop: hp('4%'),
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: '#F0F1F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp('2%'),
  },
  completedStepCircle: {
    backgroundColor: '#000000',
  },
  activeStepCircle: {
    backgroundColor: '#C6122E',
    width: wp('10%'),
    borderRadius: wp('5%'),
  },
  stepText: {
    fontSize: wp('2.5%'),
    color: '#8E8E8E',
    fontWeight: 'bold',
  },
  completedStepText: {
    color: '#FFFFFF',
  },
  activeStepText: {
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: wp('6%'),
    marginTop: hp('1.5%'),
  },
  instructionText: {
    fontSize: wp('3.5%'),
    fontWeight: 'bold',
    color: '#000000',
    marginHorizontal: wp('6%'),
    marginTop: hp('4%'),
    marginBottom: hp('2%'),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: wp('4.5%'),
    justifyContent: 'space-between',
  },
  gridItem: {
    width: wp('28%'),
    height: wp('28%'),
    backgroundColor: '#FFFFFF',
    borderRadius: wp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: wp('3%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  makerItem: {
    width: wp('28%'),
    height: wp('34%'),
    backgroundColor: '#FFFFFF',
    borderRadius: wp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: wp('3%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  selectedGridItem: {
    backgroundColor: '#FFF1F3',
    borderColor: '#C6122E',
  },
  gridLabel: {
    fontSize: wp('2.5%'),
    fontWeight: 'bold',
    color: '#000000',
    marginTop: hp('1%'),
  },
  selectedGridLabel: {
    color: '#C6122E',
  },
  checkBadge: {
    position: 'absolute',
    top: wp('2%'),
    right: wp('2%'),
  },
  makerLogo: {
    width: wp('10%'),
    height: wp('10%'),
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp('6%'),
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('2.5%'),
    borderRadius: wp('5%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    marginTop: hp('1%'),
  },
  dropdownValue: {
    fontSize: wp('4.5%'),
    fontWeight: '900',
    color: '#000000',
  },
  popularMakersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp('6%'),
    marginTop: hp('4%'),
    marginBottom: hp('2%'),
  },
  popularMakersText: {
    fontSize: wp('2.8%'),
    color: '#8E8E8E',
    fontWeight: 'bold',
    marginRight: wp('4%'),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: wp('6%'),
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('3%'),
    borderRadius: wp('8%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginTop: hp('1%'),
  },
  searchIcon: {
    marginRight: wp('4%'),
  },
  searchInput: {
    flex: 1,
    fontSize: wp('6%'),
    fontWeight: '900',
    color: '#000000',
    opacity: 0.8,
  },
  helperText: {
    fontSize: wp('2.8%'),
    color: '#8E8E8E',
    textAlign: 'center',
    marginTop: hp('2%'),
    marginHorizontal: wp('6%'),
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: hp('8%'),
  },
  infoCircle: {
    backgroundColor: '#F5F6FA',
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  infoText: {
    fontSize: wp('3.2%'),
    color: '#D1D1D1',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('6%'),
    paddingBottom: hp('4%'),
    paddingTop: hp('2%'),
    borderTopLeftRadius: wp('8%'),
    borderTopRightRadius: wp('8%'),
  },
  continueBtn: {
    backgroundColor: '#000000',
    borderRadius: wp('8%'),
    height: hp('8%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#FFFFFF',
    width: '85%',
    maxHeight: '70%',
    borderRadius: wp('6%'),
    padding: wp('6%'),
  },
  modalTitle: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  dropdownItem: {
    paddingVertical: hp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: wp('4%'),
    color: '#000000',
    fontWeight: '500',
  },
});

export default PartsFinderScreen;
