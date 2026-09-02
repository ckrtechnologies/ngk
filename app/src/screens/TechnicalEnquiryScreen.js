import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import {
  UploadCloud,
  Car,
  Tag,
  Store,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { apiFunction } from '../apis/apiFunction';
import { addEnquiryApi, uploadApi } from '../apis/api';
import { useDispatch, useSelector } from 'react-redux';
import { getUsersRedux } from '../redux/getData';
import { launchImageLibrary } from 'react-native-image-picker';
import ScreenContainer from '../components/common/ScreenContainer';
import AppHeader from '../components/common/AppHeader';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';

const TechnicalEnquiryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const { users } = useSelector((state) => state.getData);

  const part = route.params?.part;
  const vehicle = route.params?.vehicle;
  const dealerId = route.params?.dealerId;

  const [quantity, setQuantity] = useState(1);
  const [enquiryDetails, setEnquiryDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState(dealerId || null);
  const [imageUri, setImageUri] = useState(null);
  const [imageObj, setImageObj] = useState(null);

  useEffect(() => {
    if (!users || users.length === 0) {
      dispatch(getUsersRedux());
    }
  }, [dispatch, users]);

  const resellers = (users || []).filter(
    (u) =>
      u.role?.toLowerCase() === 'reseller' ||
      u.role?.toLowerCase() === 'distributor'
  );

  // Auto-select first reseller if none selected
  useEffect(() => {
    if (!selectedDealerId && resellers.length > 0) {
      setSelectedDealerId(resellers[0].id);
    }
  }, [resellers, selectedDealerId]);

  const handleImagePick = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (
      result.didCancel ||
      result.errorCode ||
      !result.assets ||
      result.assets.length === 0
    ) {
      return;
    }
    const asset = result.assets[0];
    setImageUri(asset.uri);
    setImageObj(asset);
  };

  const handleRemoveImage = () => {
    setImageUri(null);
    setImageObj(null);
  };

  const handleSubmit = async () => {
    if (!selectedDealerId) {
      Toast.show({
        type: 'error',
        text1: 'Dealer Required',
        text2: 'Please select a reseller or distributor dealer.',
      });
      return;
    }

    if (!enquiryDetails.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Details Required',
        text2: 'Please enter details or describe your technical inquiry.',
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

        const uploadRes = await apiFunction(uploadApi, [], formData, 'POST', true);
        if (uploadRes?.success && uploadRes?.file?.url) {
          uploadedImageUrl = uploadRes.file.url;
        }
      }

      const userId = await AsyncStorage.getItem('userId');
      const payload = {
        userId: userId ? Number(userId) : null,
        dealerId: selectedDealerId ? Number(selectedDealerId) : null,
        partName: part?.articleName || part?.name || null,
        partNumber: part?.articleNo || part?.partNumber || null,
        carName: vehicle?.model || vehicle?.name || null,
        quantity: Number(quantity) || 1,
        enquiryDetails: enquiryDetails.trim(),
        imageUrl: uploadedImageUrl,
      };

      const response = await apiFunction(addEnquiryApi, [], payload, 'POST', false);

      if (response?.success) {
        setLoading(false);
        Toast.show({
          type: 'success',
          text1: 'Enquiry Submitted',
          text2: 'Your technical ticket has been assigned to the dealer.',
        });
        navigation.navigate('MyEnquiries');
      } else {
        setLoading(false);
        Toast.show({
          type: 'error',
          text1: 'Submission Failed',
          text2: response?.message || 'Error submitting technical enquiry.',
        });
      }
    } catch (err) {
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.response?.data?.message || 'Network connection failed.',
      });
    }
  };

  return (
    <ScreenContainer
      scrollable={true}
      footer={
        <AppButton
          title="Submit Technical Ticket"
          onPress={handleSubmit}
          loading={loading}
          backgroundColor="#059669"
        />
      }
    >
      <AppHeader
        title="Technical Enquiry"
        subtitle="Support & Verification Request"
        onBack={() => navigation.goBack()}
      />

      {/* Linked Part / Vehicle Context Chip */}
      {(part || vehicle) && (
        <View style={styles.contextCard}>
          {part && (
            <View style={styles.contextRow}>
              <Tag size={15} color="#C6122E" />
              <Text style={styles.contextText}>
                {part.articleName || 'Part'}:{' '}
                <Text style={{ fontWeight: '700' }}>
                  {part.articleNo || part.partNumber}
                </Text>
              </Text>
            </View>
          )}
          {vehicle && (
            <View style={styles.contextRow}>
              <Car size={15} color="#2563EB" />
              <Text style={styles.contextText}>
                Vehicle:{' '}
                <Text style={{ fontWeight: '700' }}>
                  {vehicle.make} {vehicle.model}
                </Text>
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Reseller / Dealer Selector */}
      <Text style={styles.sectionLabel}>ASSIGN TO AUTHORIZED DEALER</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dealerPillRow}
      >
        {resellers.map((r) => {
          const isSelected = selectedDealerId === r.id;
          return (
            <TouchableOpacity
              key={r.id}
              style={[
                styles.dealerPill,
                isSelected && styles.dealerPillSelected,
              ]}
              onPress={() => setSelectedDealerId(r.id)}
              activeOpacity={0.7}
            >
              <Store
                size={14}
                color={isSelected ? '#FFFFFF' : '#4B5563'}
              />
              <Text
                style={[
                  styles.dealerPillText,
                  isSelected && styles.dealerPillTextSelected,
                ]}
              >
                {r.name || r.email}
              </Text>
              {isSelected && <CheckCircle2 size={13} color="#FFFFFF" />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Quantity Selector */}
      <View style={styles.quantityCard}>
        <Text style={styles.quantityLabel}>Requested Quantity</Text>
        <View style={styles.stepperBox}>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            activeOpacity={0.7}
          >
            <Minus size={16} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{quantity}</Text>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => setQuantity((q) => q + 1)}
            activeOpacity={0.7}
          >
            <Plus size={16} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Multi-line Description Field */}
      <AppInput
        label="Description / Issue Details"
        placeholder="Describe the vehicle symptom, VIN number, or fitment question..."
        value={enquiryDetails}
        onChangeText={setEnquiryDetails}
        multiline={true}
        numberOfLines={4}
      />

      {/* Photo Attachment Bar */}
      <Text style={styles.sectionLabel}>PHOTO REFERENCE (OPTIONAL)</Text>
      <View style={styles.photoContainer}>
        {imageUri ? (
          <View style={styles.photoPreviewWrapper}>
            <Image source={{ uri: imageUri }} style={styles.photoPreview} />
            <TouchableOpacity
              style={styles.photoDeleteBtn}
              onPress={handleRemoveImage}
              activeOpacity={0.7}
            >
              <Trash2 size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.photoUploadBtn}
            onPress={handleImagePick}
            activeOpacity={0.7}
          >
            <UploadCloud size={20} color="#6B7280" />
            <Text style={styles.photoUploadText}>Tap to attach photo or diagram</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  contextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contextText: {
    fontSize: 13,
    color: '#374151',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dealerPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  dealerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dealerPillSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  dealerPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  dealerPillTextSelected: {
    color: '#FFFFFF',
  },
  quantityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  quantityLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  stepperValue: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  photoContainer: {
    marginBottom: 14,
  },
  photoUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    paddingVertical: 16,
  },
  photoUploadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  photoPreviewWrapper: {
    position: 'relative',
    width: 100,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TechnicalEnquiryScreen;
