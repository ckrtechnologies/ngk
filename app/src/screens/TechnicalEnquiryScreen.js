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
  ActivityIndicator,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { ChevronLeft, Home, Minus, Plus, UploadCloud, Info, Settings, ShoppingCart } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { apiFunction } from '../apis/apiFunction';
import { addEnquiryApi, uploadApi } from '../apis/api';
import { useDispatch, useSelector } from 'react-redux';
import { getUsersRedux } from '../redux/getData';
import { launchImageLibrary } from 'react-native-image-picker';

const TechnicalEnquiryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const { users, loading: usersLoading } = useSelector((state) => state.getData);

  const part = route.params?.part;
  const vehicle = route.params?.vehicle;
  const dealerId = route.params?.dealerId;

  const [quantity, setQuantity] = useState(1);
  const [enquiryDetails, setEnquiryDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState(dealerId || null);
  const [imageUri, setImageUri] = useState(null);
  const [imageObj, setImageObj] = useState(null);

  React.useEffect(() => {
    if (!users) {
      dispatch(getUsersRedux());
    }
  }, [dispatch, users]);

  const resellers = (users || []).filter(u => u.role?.toLowerCase() === 'reseller' || u.role?.toLowerCase() === 'distributor');

  const increment = () => setQuantity(prev => prev + 1);
  const decrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handleImagePick = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || result.errorCode || !result.assets || result.assets.length === 0) {
      return;
    }
    const asset = result.assets[0];
    setImageUri(asset.uri);
    setImageObj(asset);
  };

  const handleSubmit = async () => {
    if (!selectedDealerId) {
      Toast.show({
        type: 'error',
        text1: 'Please select a reseller dealer',
      });
      return;
    }

    if (!vehicle && !part && !imageUri) {
      Toast.show({
        type: 'error',
        text1: 'Please upload a photo reference before submitting',
      });
      return;
    }

    if (!enquiryDetails.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Please enter enquiry details',
      });
      return;
    }

    setLoading(true);
    try {
      let uploadedImageUrl = null;
      if (imageObj) {
        const ext = imageObj.fileName ? imageObj.fileName.split('.').pop() : 'jpg';
        const fileName = `enquiry_${Date.now()}.${ext}`;
        const formData = new FormData();
        formData.append('file', {
          uri: imageObj.uri,
          name: fileName,
          type: imageObj.type || 'image/jpeg',
        });

        try {
          const uploadRes = await fetch(uploadApi, {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json',
            },
          });
          const uploadJson = await uploadRes.json();
          if (uploadJson?.url || uploadJson?.publicUrl) {
            uploadedImageUrl = uploadJson.url || uploadJson.publicUrl;
          }
        } catch (uploadErr) {
          console.warn('Image upload error:', uploadErr);
        }
      }

      const userId = await AsyncStorage.getItem("userId");
      const title = part?.title || vehicle?.typeName || vehicle?.modelName || vehicle?.vehicleDescription || (uploadedImageUrl ? "Enquiry with Photo Reference" : "General Technical Enquiry");
      const description = part?.subtitle || vehicle?.manuName || (uploadedImageUrl ? "Uploaded part image for verification" : "Direct contact with NGK engineers");

      const body = {
        userId: userId,
        dealer: selectedDealerId,
        enquiryDate: new Date().toISOString(),
        vehicle: (vehicle || part) ? {
          status: "Pending",
          quantity: quantity,
          enquiryDetails: enquiryDetails,
          part: part || null,
          vehicle: vehicle || null,
          title: title,
          description: description,
          imageurl: uploadedImageUrl || null,
          messages: [
            {
              sender: "owner",
              senderName: "Owner",
              text: enquiryDetails,
              timestamp: new Date().toISOString(),
              isSystem: false
            }
          ]
        } : null
      };

      console.log(body, "body");

      const response = await apiFunction(addEnquiryApi, [], body, "POST", false);

      if (response?.success) {
        Toast.show({
          type: 'success',
          text1: 'Enquiry submitted successfully',
        });
        setLoading(false);
        navigation.navigate('Success');
      } else {
        Toast.show({
          type: 'error',
          text1: response?.message || 'Failed to submit enquiry',
        });
        setLoading(false);
      }
    } catch (error) {
      console.log("Error submitting enquiry:", error);
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
      });
      setLoading(false);
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
        <Text style={styles.headerTitle}>Technical Enquiry</Text>
        <TouchableOpacity style={styles.homeIconContainer} onPress={() => navigation.navigate('OwnerHome')}>
          <Home color="#C6122E" size={wp('5%')} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Info color="#000000" size={wp('5%')} />
          <Text style={styles.infoBoxText}>
            This enquiry will be sent directly to NGK's technical department for application verification.
          </Text>
        </View>

        {/* Selected Part/Vehicle Card */}
        {(part || vehicle) && (
          <View style={styles.targetCard}>
            <Text style={styles.targetLabel}>ENQUIRY TARGET</Text>
            {part && (
              <View style={styles.targetInfo}>
                <Text style={styles.targetTitle}>{part.title}</Text>
                <Text style={styles.targetSubtitle}>Part No: {part.partNumber || part.subtitle}</Text>
              </View>
            )}
            {vehicle && !part && (
              <View style={styles.targetInfo}>
                <Text style={styles.targetTitle}>{vehicle.typeName || vehicle.modelName || vehicle.vehicleDescription}</Text>
                <Text style={styles.targetSubtitle}>{vehicle.manuName || vehicle.make} • {vehicle.yearOfConstrFrom || ''} - {vehicle.yearOfConstrTo || ''}</Text>
              </View>
            )}
          </View>
        )}

        {/* Dealer Selection if !dealerId */}
        {!dealerId && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SELECT RESELLER DEALER</Text>
            {usersLoading ? (
               <Text style={{ color: '#8E8E8E', fontSize: wp('3%') }}>Loading resellers...</Text>
            ) : resellers.length > 0 ? (
              resellers.map((dealer) => (
                <TouchableOpacity
                  key={dealer.id}
                  style={[
                    styles.dealerCardSelect,
                    selectedDealerId === dealer.id && styles.selectedDealerCard
                  ]}
                  onPress={() => setSelectedDealerId(dealer.id)}
                >
                  <View>
                    <Text style={[styles.dealerName, selectedDealerId === dealer.id && { color: '#C6122E' }]}>
                      {dealer.name}
                    </Text>
                    <Text style={styles.dealerAddressText}>{dealer.address || dealer.email}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ color: '#8E8E8E', fontSize: wp('3%') }}>No resellers found.</Text>
            )}
          </View>
        )}

        {/* Quantity Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUANTITY REQUIRED</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity style={styles.qtyBtn} onPress={decrement}>
              <Minus color="#000000" size={wp('5%')} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={increment}>
              <Plus color="#000000" size={wp('5%')} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Enquiry Details */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ENQUIRY DETAILS</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe your technical requirement or vehicle modification details..."
            placeholderTextColor="#D1D1D1"
            multiline={true}
            numberOfLines={10}
            value={enquiryDetails}
            onChangeText={setEnquiryDetails}
            textAlignVertical="top"
          />
        </View>

        {/* Photo Reference */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PHOTO REFERENCE {(!vehicle && !part) ? '(REQUIRED)' : '(OPTIONAL)'}</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={handleImagePick}>
            <UploadCloud color="#D1D1D1" size={wp('8%')} />
            <Text style={styles.uploadText}>{imageUri ? 'PHOTO SELECTED (TAP TO CHANGE)' : 'UPLOAD CURRENT PART'}</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit enquiry</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
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
    paddingTop: hp('3%'),
    paddingBottom: hp('5%'),
  },
  infoBox: {
    backgroundColor: '#F8F8F8',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('3%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoBoxText: {
    fontSize: wp('2.8%'),
    color: '#000000',
    fontWeight: '500',
    marginLeft: wp('3%'),
    flexShrink: 1,
    lineHeight: wp('4%'),
  },
  targetCard: {
    backgroundColor: '#FFF9FA',
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('3%'),
    borderWidth: 1,
    borderColor: '#FFE0E6',
  },
  targetLabel: {
    fontSize: wp('2.5%'),
    color: '#C6122E',
    fontWeight: 'bold',
    marginBottom: hp('0.5%'),
    letterSpacing: 0.5,
  },
  targetTitle: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#000000',
  },
  targetSubtitle: {
    fontSize: wp('3.2%'),
    color: '#666666',
    marginTop: hp('0.2%'),
  },
  dealerCardSelect: {
    backgroundColor: '#F8F8F8',
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  selectedDealerCard: {
    backgroundColor: '#FFF9FA',
    borderColor: '#C6122E',
  },
  dealerName: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
    color: '#000000',
  },
  dealerAddressText: {
    fontSize: wp('3%'),
    color: '#666666',
    marginTop: hp('0.5%'),
  },
  section: {
    marginBottom: hp('4%'),
  },
  sectionLabel: {
    fontSize: wp('2.8%'),
    color: '#8E8E8E',
    fontWeight: 'bold',
    marginBottom: hp('1.5%'),
    letterSpacing: 0.5,
  },
  quantityContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: wp('4%'),
    height: hp('8%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('2%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  qtyBtn: {
    width: wp('12%'),
    height: hp('6%'),
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  qtyText: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#000000',
  },
  textArea: {
    backgroundColor: '#F8F8F8',
    borderRadius: wp('4%'),
    padding: wp('4%'),
    height: hp('15%'),
    fontSize: wp('3.5%'),
    color: '#000000',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#D1D1D1',
    borderStyle: 'dashed',
    borderRadius: wp('4%'),
    height: hp('12%'),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  uploadText: {
    fontSize: wp('2.5%'),
    color: '#8E8E8E',
    fontWeight: 'bold',
    marginTop: hp('1%'),
    letterSpacing: 0.5,
  },
  submitBtn: {
    backgroundColor: '#C6122E',
    borderRadius: wp('4%'),
    height: hp('8%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('2%'),
    shadowColor: '#C6122E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
});

export default TechnicalEnquiryScreen;
