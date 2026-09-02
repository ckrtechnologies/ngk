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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { ChevronLeft, Home, Scan, PlusCircle, X, Search } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera } from 'react-native-image-picker';
// import MlkitOcr from 'react-native-mlkit-ocr';
import { PermissionsAndroid } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyselfRedux } from '../redux/getData';
import { apiFunction } from '../apis/apiFunction';
import { serviceJsonApi, addVehicleToWatchlistApi, removeFromWatchlistApi } from '../apis/api';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const MyGarageScreen = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [scannedImage, setScannedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { myself } = useSelector((state) => state.getData)
  const dispatch = useDispatch()

  useEffect(() => {

    const getMyself = async () => {
      const userId = await AsyncStorage.getItem("userId")

      dispatch(getMyselfRedux(userId))
    }

    if (!myself) {

      getMyself()
    }
  }, [dispatch])

  // State for vehicles
  const [vehicles, setVehicles] = useState([
    {
      id: '1',
      make: 'AUDI',
      model: 'A3 SPORTBACK',
      year: '2021',
      details: '1.8L TFSI QUATTRO',
      isActive: true,
    }
  ]);

  // State for form
  const [formData, setFormData] = useState({
    make: '',
    year: '',
    model: '',
    engineNumber: '',
    vin: '',
  });

  const scanDocument = async () => {
    try {
      console.log("Launching camera...");
      const options = {
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
      };

      const result = await launchCamera(options);
      console.log("Camera result:", result);

      if (result.didCancel) {
        console.log('User cancelled camera');
        return;
      } else if (result.errorCode) {
        console.log('Camera Error: ', result.errorMessage);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const imagePath = result.assets[0].uri;
        console.log("Image captured:", imagePath);
        setScannedImage(imagePath);

        setIsLoading(true);
        try {
          if (typeof MlkitOcr !== 'undefined' && MlkitOcr.detectFromUri) {
            const resultOCR = await MlkitOcr.detectFromUri(imagePath);
            if (resultOCR && resultOCR.length > 0) {
              const fullText = resultOCR.map(block => block.text).join(' ');
              processExtractedText(fullText);
            }
          } else {
            console.log("MlkitOcr module not present in current build, opening modal with captured image");
          }
        } catch (ocrError) {
          console.log("OCR Error:", ocrError);
        } finally {
          setIsLoading(false);
          setScannedImage(null);   // image remove
          setModalVisible(true);   // modal open
        }
      } else {
        console.log("No assets found in result");
      }
    } catch (error) {
      console.log("Scan error:", error);
    }
  };

  const processExtractedText = (text) => {
    console.log("Processing text:", text);

    // Simple regex for VIN (usually 17 alphanumeric characters)
    const vinRegex = /[A-HJ-NPR-Z0-9]{17}/i;
    const vinMatch = text.match(vinRegex);

    // Try to find a year (4 digits starting with 19 or 20)
    const yearRegex = /\b(19|20)\d{2}\b/;
    const yearMatch = text.match(yearRegex);

    setFormData(prev => ({
      ...prev,
      vin: vinMatch ? vinMatch[0].toUpperCase() : prev.vin,
      year: yearMatch ? yearMatch[0] : prev.year,
      // We can also try to guess the make/model from common brands
      make: text.toUpperCase().includes('FORD') ? 'FORD' :
        text.toUpperCase().includes('AUDI') ? 'AUDI' :
          text.toUpperCase().includes('BMW') ? 'BMW' :
            text.toUpperCase().includes('TOYOTA') ? 'TOYOTA' : prev.make,
    }));
  };

  console.log(formData, "formData")

  // const processExtractedText = (text) => {
  //   console.log("Processing text:", text);

  //   const vinRegex = /[A-HJ-NPR-Z0-9]{17}/i;
  //   const vinMatch = text.match(vinRegex);

  //   const yearRegex = /\b(19|20)\d{2}\b/;
  //   const yearMatch = text.match(yearRegex);

  //   const upperText = text.toUpperCase();

  //   let detectedMake = '';
  //   let detectedModel = '';

  //   if (upperText.includes('AUDI')) detectedMake = 'AUDI';
  //   if (upperText.includes('BMW')) detectedMake = 'BMW';
  //   if (upperText.includes('FORD')) detectedMake = 'FORD';
  //   if (upperText.includes('TOYOTA')) detectedMake = 'TOYOTA';

  //   if (upperText.includes('A3')) detectedModel = 'A3';
  //   if (upperText.includes('X5')) detectedModel = 'X5';
  //   if (upperText.includes('FOCUS')) detectedModel = 'FOCUS';

  //   setFormData({
  //     make: detectedMake,
  //     year: yearMatch ? yearMatch[0] : '',
  //     model: detectedModel,
  //     engineNumber: '',
  //     vin: vinMatch ? vinMatch[0].toUpperCase() : '',
  //   });
  // };

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "App needs access to camera to scan documents",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Camera permission granted");
        scanDocument();
      } else {
        console.log("Camera permission denied");
      }
    } catch (err) {
      console.warn(err);
    }
  };


  const handleScanDisc = () => {
    requestCameraPermission();
  };

  const handleSaveToGarage = async () => {
    if (!formData.vin) {
      Toast.show({
        type: 'error',
        text1: 'Please enter or scan a valid VIN',
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        "getVehicleDataByVINExt": {
          "lang": "en",
          "vin": formData.vin.trim(),
          "provider": 25690
        }
      };

      const res = await apiFunction(serviceJsonApi, [], payload, "POST", true);
      console.log(res, "VIN Lookup Response");

      let vehicleData = null;
      if (res?.data?.array && res.data.array.length > 0) {
        vehicleData = res.data.array[0];
      } else if (res?.matchingVehicles?.array && res.matchingVehicles.array.length > 0) {
        vehicleData = res.matchingVehicles.array[0];
      } else if (res?.matchingVehicles && res.matchingVehicles.length > 0) {
        vehicleData = res.matchingVehicles[0];
      }

      if (vehicleData) {
        const newVehicleRecord = {
          ...vehicleData,
          carId: vehicleData.carId || vehicleData.id || Date.now(),
          vehicleDescription: vehicleData.vehicleDescription || `${vehicleData.mfrName || formData.make} ${vehicleData.modelDescription || formData.model}`.trim(),
          yearOfConstrFrom: vehicleData.yearOfConstrFrom ? vehicleData.yearOfConstrFrom.toString().substring(0, 4) : formData.year || '2021',
          yearOfConstrTo: vehicleData.yearOfConstrTo ? vehicleData.yearOfConstrTo.toString().substring(0, 4) : 'Present',
          mfrName: vehicleData.mfrName || formData.make,
          modelDescription: vehicleData.modelDescription || formData.model,
          vin: formData.vin.trim(),
          id: vehicleData.carId ? vehicleData.carId.toString() : Date.now().toString()
        };

        if (myself?.id) {
          const saveRes = await apiFunction(addVehicleToWatchlistApi, [myself.id], { vehicle: newVehicleRecord }, "PUT", true);
          if (saveRes?.success) {
            Toast.show({
              type: 'success',
              text1: 'Vehicle added to garage successfully!',
            });
            dispatch(getMyselfRedux(myself.id));
          } else {
            Toast.show({
              type: 'error',
              text1: saveRes?.message || 'Failed to save vehicle to garage',
            });
          }
        } else {
          setVehicles([...vehicles, newVehicleRecord]);
          Toast.show({
            type: 'success',
            text1: 'Vehicle added locally',
          });
        }

        setModalVisible(false);
        setFormData({ make: '', year: '', model: '', engineNumber: '', vin: '' });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Invalid VIN or vehicle not found in TecAlliance catalog',
        });
      }
    } catch (err) {
      console.log("Error in VIN lookup:", err);
      Toast.show({
        type: 'error',
        text1: 'Error verifying VIN number',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeVehicle = async (vehicleId) => {
    if (!myself?.id) {
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
      return;
    }
    try {
      const res = await apiFunction(`${removeFromWatchlistApi}/${myself.id}/${vehicleId}`, [], {}, "DELETE", true);
      if (res?.success) {
        Toast.show({
          type: 'success',
          text1: 'Vehicle removed from garage successfully',
        });
        dispatch(getMyselfRedux(myself.id));
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to remove vehicle from garage',
        });
      }
    } catch (err) {
      console.log("Error removing vehicle:", err);
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
      });
    }
  };

  const selectVehicle = (id) => {
    const updatedVehicles = vehicles.map((vehicle) => {
      if (vehicle.id === id) {
        return { ...vehicle, isActive: true };
      } else {
        return { ...vehicle, isActive: false };
      }
    });

    setVehicles(updatedVehicles);
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#FFFFFF" size={wp('6%')} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MY GARAGE</Text>
        <TouchableOpacity style={styles.homeIconContainer} onPress={() => navigation.navigate('OwnerHome')}>
          <Home color="#C6122E" size={wp('5%')} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Rapid Registration Card */}
        <View style={styles.rapidRegCard}>
          <Text style={styles.rapidRegTitle}>RAPID REGISTRATION</Text>
          <Text style={styles.rapidRegSubtitle}>SCAN YOUR LICENSE DISC TO ADD VEHICLE INSTANTLY</Text>

          <View style={styles.regButtonsContainer}>
            <TouchableOpacity style={styles.regButtonWhite} onPress={() => handleScanDisc()}>
              <View style={styles.regIconCircle}>
                <Scan color="#C6122E" size={wp('5%')} />
              </View>
              <Text style={styles.regButtonTextRed}>SCAN DISC</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.regButtonDark} onPress={() => navigation.navigate('VehiclesList')}>
              <View style={[styles.regIconCircle, { backgroundColor: '#A10E25' }]}>
                <PlusCircle color="#FFFFFF" size={wp('5%')} />
              </View>
              <Text style={styles.regButtonTextWhite}>ADD MANUAL</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Saved Count */}
        <Text style={styles.savedCountText}>{myself?.vehicleId?.length} VEHICLES SAVED</Text>

        {/* Vehicle Cards List */}
        {myself?.vehicleId?.map((item, index) => (
          <View key={index} style={styles.vehicleCard}>
            <View style={styles.redAccent} />
            <View style={styles.vehicleContent}>
              <View style={styles.vehicleHeader}>
                <View style={styles.row}>

                  <Text style={styles.modelYearText}>{item?.yearOfConstrFrom + " - " + item?.yearOfConstrTo} MODEL</Text>
                </View>
                <TouchableOpacity onPress={() => removeVehicle(item.id || item.carId)}>
                  <X color="#D1D1D1" size={wp('5%')} />
                </TouchableOpacity>
              </View>

              <Text style={styles.vehicleName}>{item.vehicleDescription}</Text>


              <View style={styles.vehicleActions}>

                <TouchableOpacity style={styles.findPartsBtn} onPress={() => navigation.navigate('VerifiedParts', { vehicle: item})}>
                  <Search color="#000000" size={wp('4%')} />
                  <Text style={styles.findPartsText}>FIND PARTS</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

      </ScrollView>
      {scannedImage && (
        <View style={{ marginBottom: 20 }}>
          <Image
            source={{ uri: scannedImage }}
            style={{
              width: "100%",
              height: 200,
              borderRadius: 10
            }}
            resizeMode="contain"
          />
        </View>
      )}


      {/* Vehicle Details Modal */}
      <Modal
        animationType="none" // No animation as requested
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>VEHICLE DETAILS</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X color="#000000" size={wp('6%')} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <Text style={styles.modalSubtitle}>
                ENTER VEHICLE DETAILS TO SAVE THEM FOR QUICK LOOKUPS.
              </Text>

              <View style={styles.inputRow}>
                <View style={styles.inputGroupFull}>
                  <Text style={styles.inputLabel}>MAKE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Ford"
                    placeholderTextColor="#D1D1D1"
                    value={formData.make}
                    onChangeText={(text) => setFormData({ ...formData, make: text })}
                  />
                </View>
                <View style={styles.inputGroupHalf}>
                  <Text style={styles.inputLabel}>YEAR</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 2021"
                    placeholderTextColor="#D1D1D1"
                    keyboardType="numeric"
                    value={formData.year}
                    onChangeText={(text) => setFormData({ ...formData, year: text })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MODEL / DESCRIPTION</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Focus RS"
                  placeholderTextColor="#D1D1D1"
                  value={formData.model}
                  onChangeText={(text) => setFormData({ ...formData, model: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ENGINE NUMBER</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. PNDBDP34270"
                  placeholderTextColor="#D1D1D1"
                  value={formData.engineNumber}
                  onChangeText={(text) => setFormData({ ...formData, engineNumber: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>VIN (CHASSIS)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="E.G. MPB2XXMX..."
                  placeholderTextColor="#D1D1D1"
                  value={formData.vin}
                  onChangeText={(text) => setFormData({ ...formData, vin: text })}
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveToGarage}>
                <Text style={styles.saveBtnText}>Save to Garage</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>

              <View style={{ height: hp('10%') }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#C6122E" />
          <Text style={styles.loadingText}>EXTRACTING TEXT...</Text>
        </View>
      )}
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
    letterSpacing: 1,
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
    paddingTop: hp('2%'),
    paddingBottom: hp('5%'),
  },
  rapidRegCard: {
    backgroundColor: '#C6122E',
    marginHorizontal: wp('6%'),
    borderRadius: wp('8%'),
    padding: wp('6%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  rapidRegTitle: {
    color: '#FFFFFF',
    fontSize: wp('5.5%'),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rapidRegSubtitle: {
    color: '#FFFFFF',
    fontSize: wp('2.5%'),
    fontWeight: '600',
    marginTop: hp('0.5%'),
    opacity: 0.9,
  },
  regButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp('3%'),
  },
  regButtonWhite: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    borderRadius: wp('4%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  regButtonDark: {
    backgroundColor: '#A10E25',
    width: '48%',
    borderRadius: wp('4%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  regButtonTextRed: {
    color: '#C6122E',
    fontSize: wp('3%'),
    fontWeight: 'bold',
    marginTop: hp('0.5%'),
  },
  regButtonTextWhite: {
    color: '#FFFFFF',
    fontSize: wp('3%'),
    fontWeight: 'bold',
    marginTop: hp('0.5%'),
  },
  savedCountText: {
    marginHorizontal: wp('6%'),
    marginTop: hp('3%'),
    marginBottom: hp('1.5%'),
    fontSize: wp('3%'),
    fontWeight: 'bold',
    color: '#8E8E8E',
    letterSpacing: 0.5,
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp('6%'),
    borderRadius: wp('6%'),
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: hp('2%'),
  },
  redAccent: {
    width: wp('1.5%'),
    backgroundColor: '#C6122E',
    height: '100%',
  },
  vehicleContent: {
    flex: 1,
    padding: wp('5%'),
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: '#C6122E',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.4%'),
    borderRadius: wp('2%'),
    marginRight: wp('2%'),
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: wp('2.8%'),
    fontWeight: 'bold',
  },
  modelYearText: {
    fontSize: wp('2.5%'),
    color: '#8E8E8E',
    fontWeight: '600',
  },
  vehicleName: {
    fontSize: wp('5.5%'),
    fontWeight: '900',
    color: '#000000',
    marginTop: hp('0.5%'),
  },
  vehicleDetails: {
    fontSize: wp('3%'),
    color: '#C6122E',
    fontWeight: 'bold',
    marginTop: hp('0.2%'),
  },
  vehicleActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp('3%'),
  },
  currentlySelectedBtn: {
    backgroundColor: '#F5F6FA',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    borderRadius: wp('3%'),
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentlySelectedText: {
    fontSize: wp('2.8%'),
    color: '#8E8E8E',
    fontWeight: 'bold',
  },
  findPartsBtn: {
    backgroundColor: '#F0F1F5',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    borderRadius: wp('3%'),
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  findPartsText: {
    fontSize: wp('2.8%'),
    color: '#000000',
    fontWeight: 'bold',
    marginLeft: wp('2%'),
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: wp('8%'),
    borderTopRightRadius: wp('8%'),
    maxHeight: hp('90%'),
    paddingHorizontal: wp('6%'),
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: hp('2%'),
  },
  modalHandle: {
    width: wp('12%'),
    height: hp('0.6%'),
    backgroundColor: '#E0E0E0',
    borderRadius: hp('0.3%'),
    marginBottom: hp('2%'),
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    fontSize: wp('3.2%'),
    color: '#8E8E8E',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: hp('2%'),
    marginBottom: hp('4%'),
    lineHeight: wp('4.5%'),
  },
  modalScroll: {
    marginBottom: hp('2%'),
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
  },
  inputGroupFull: {
    width: '65%',
  },
  inputGroupHalf: {
    width: '30%',
  },
  inputGroup: {
    marginBottom: hp('2%'),
  },
  inputLabel: {
    fontSize: wp('2.8%'),
    fontWeight: 'bold',
    color: '#8E8E8E',
    marginBottom: hp('0.8%'),
  },
  input: {
    backgroundColor: '#F5F6FA',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.8%'),
    fontSize: wp('3.5%'),
    color: '#000000',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#C6122E',
    borderRadius: wp('4%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    marginTop: hp('3%'),
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: hp('2%'),
    paddingVertical: hp('2%'),
  },
  cancelBtnText: {
    color: '#8E8E8E',
    fontSize: wp('3%'),
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  regIconCircle: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: '#F5F6FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: wp('3.5%'),
    fontWeight: 'bold',
    color: '#C6122E',
  },
});

export default MyGarageScreen;
