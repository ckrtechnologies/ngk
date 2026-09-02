import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  ActivityIndicator,
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
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyselfRedux } from '../redux/getData';
import { apiFunction } from '../apis/apiFunction';
import {
  addVehicleToWatchlistApi,
  removeFromWatchlistApi,
} from '../apis/api';
import Toast from 'react-native-toast-message';
import AppHeader from '../components/common/AppHeader';
import AppButton from '../components/common/AppButton';
import AppInput from '../components/common/AppInput';

const MyGarageScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { myself } = useSelector((state) => state.getData);

  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states for adding vehicle
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [engine, setEngine] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');

  const refreshUser = async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (userId) dispatch(getMyselfRedux(userId));
  };

  useEffect(() => {
    refreshUser();
  }, [dispatch]);

  const garageVehicles = myself?.garage || [];

  const handleAddVehicle = async () => {
    if (!make.trim() || !model.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Required Fields',
        text2: 'Please enter Make and Model of the vehicle.',
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
    };

    try {
      const res = await apiFunction(addVehicleToWatchlistApi, [], payload, 'POST', false);
      setSubmitting(false);
      if (res?.success) {
        Toast.show({
          type: 'success',
          text1: 'Vehicle Added to Garage',
          text2: `${payload.make} ${payload.model}`,
        });
        setModalVisible(false);
        setMake('');
        setModel('');
        setYear('');
        setEngine('');
        setLicensePlate('');
        setVin('');
        refreshUser();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to Add',
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
        title="My Garage"
        subtitle={`${garageVehicles.length} Saved Vehicle${garageVehicles.length === 1 ? '' : 's'}`}
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.addIconBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
      >
        {garageVehicles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Car size={36} color="#C6122E" />
            </View>
            <Text style={styles.emptyTitle}>Your Garage is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Save your vehicles here to instantly find 100% verified spark plugs, glow plugs, and oxygen sensors.
            </Text>
            <AppButton
              title="Add Your First Vehicle"
              leftIcon={<Plus size={18} color="#FFFFFF" />}
              onPress={() => setModalVisible(true)}
              style={{ marginTop: 18 }}
            />
          </View>
        ) : (
          <View style={styles.vehicleList}>
            {garageVehicles.map((car, idx) => (
              <View key={car.id || idx} style={styles.carCard}>
                <View style={styles.carCardTop}>
                  <View style={styles.carIconBox}>
                    <Car size={20} color="#C6122E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.carMakeModel}>
                      {car.make} {car.model}
                    </Text>
                    <Text style={styles.carSpecs}>
                      {car.year || 'N/A'} • {car.engine || 'Standard'}
                      {car.license_plate ? ` • ${car.license_plate}` : ''}
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
                    onPress={() =>
                      navigation.navigate('PartsFinder', { preselectedVehicle: car })
                    }
                    activeOpacity={0.75}
                  >
                    <Search size={14} color="#C6122E" />
                    <Text style={styles.findPartsText}>Lookup Compatible Parts</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Vehicle Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Vehicle to Garage</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
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

              <AppButton
                title="Save Vehicle"
                onPress={handleAddVehicle}
                loading={submitting}
                style={{ marginTop: 8 }}
              />
            </ScrollView>
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
  addIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#C6122E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 24,
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
    color: '#C6122E',
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
    maxHeight: '80%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
});

export default MyGarageScreen;
