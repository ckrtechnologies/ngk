import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Tag,
  ShieldCheck,
  MessageSquare,
  Bookmark,
  X,
  Info,
  Layers,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFunction } from '../apis/apiFunction';
import { serviceJsonApi, addVehicleToWatchlistApi } from '../apis/api';
import { setPart, setSelectedVehicle, getMyselfRedux } from '../redux/getData';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import AppHeader from '../components/common/AppHeader';
import AppButton from '../components/common/AppButton';

const VerifiedPartsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [parts, setParts] = useState(route.params?.articles || []);
  const [loading, setLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [specsModalVisible, setSpecsModalVisible] = useState(false);

  const vehicle = route.params?.vehicle;
  const searchQuery = route.params?.searchQuery;

  useEffect(() => {
    if ((!parts || parts.length === 0) && vehicle) {
      const fetchPartsForVehicle = async () => {
        setLoading(true);
        const payload = {
          getArticles: {
            articleCountry: 'ZA',
            dataSupplierIds: ['5567', '7729'],
            linkageTargetId: vehicle.linkageTargetId || vehicle.id || vehicle.manuId,
            linkingTargetType: 'P',
            lang: 'en',
            perPage: 30,
            page: 1,
            includeAll: true,
          },
        };

        try {
          const res = await apiFunction(serviceJsonApi, [], payload, 'POST', false);
          const list =
            res?.data?.array || res?.getArticles?.array || res?.data || [];
          setParts(list);
        } catch (err) {
          console.warn('Failed to load parts for vehicle', err);
        } finally {
          setLoading(false);
        }
      };

      fetchPartsForVehicle();
    }
  }, [vehicle, parts]);

  const handleEnquirePart = (item) => {
    dispatch(setPart(item));
    if (vehicle) dispatch(setSelectedVehicle(vehicle));
    navigation.navigate('TechnicalEnquiry', { part: item, vehicle });
  };

  const handleOpenSpecs = (item) => {
    setSelectedPart(item);
    setSpecsModalVisible(true);
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
        title="Verified Parts"
        subtitle={
          vehicle
            ? `${vehicle.manuName || ''} ${vehicle.modelname || vehicle.name || ''}`
            : searchQuery
            ? `Search: "${searchQuery}"`
            : `${parts.length} Matching Components`
        }
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
      >
        {/* Verification Guarantee Banner */}
        <View style={styles.verifiedBanner}>
          <ShieldCheck size={18} color="#059669" />
          <Text style={styles.verifiedBannerText}>
            100% Genuine NGK Components • OEM Fitment Guaranteed
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#C6122E" />
            <Text style={styles.loadingText}>Fetching technical specifications...</Text>
          </View>
        ) : parts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Tag size={36} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Matching Parts Found</Text>
            <Text style={styles.emptySub}>
              Please check your part number or try searching with a different vehicle trim.
            </Text>
          </View>
        ) : (
          <View style={styles.partsList}>
            {parts.map((item, idx) => {
              const partNo = item.articleNo || item.partNumber || item.number || 'NGK-PART';
              const partName = item.articleName || item.name || 'Ignition / Sensor Component';
              const brand = item.dataSupplierName || item.brand || 'NGK SPARK PLUGS';

              return (
                <View key={item.articleId || idx} style={styles.partCard}>
                  <View style={styles.partCardTop}>
                    <View style={styles.partBadge}>
                      <Text style={styles.partBadgeText}>{brand}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.specsBtn}
                      onPress={() => handleOpenSpecs(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Info size={14} color="#6B7280" />
                      <Text style={styles.specsBtnText}>Specs</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.partNumberText}>{partNo}</Text>
                  <Text style={styles.partNameText}>{partName}</Text>

                  {/* Actions Row */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.enquireBtn}
                      onPress={() => handleEnquirePart(item)}
                      activeOpacity={0.75}
                    >
                      <MessageSquare size={14} color="#FFFFFF" />
                      <Text style={styles.enquireBtnText}>Request Support / Quote</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Part Specifications Modal */}
      <Modal
        visible={specsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSpecsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Technical Specifications</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedPart?.articleNo || selectedPart?.partNumber}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSpecsModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.specsTable}>
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Part Number</Text>
                  <Text style={styles.specVal}>
                    {selectedPart?.articleNo || selectedPart?.partNumber || 'N/A'}
                  </Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Category</Text>
                  <Text style={styles.specVal}>
                    {selectedPart?.articleName || selectedPart?.name || 'Standard'}
                  </Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Supplier</Text>
                  <Text style={styles.specVal}>
                    {selectedPart?.dataSupplierName || 'NGK SPARK PLUG CO., LTD.'}
                  </Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specKey}>Standard</Text>
                  <Text style={styles.specVal}>ISO 9001 / IATF 16949</Text>
                </View>
              </View>

              <AppButton
                title="Enquire About This Part"
                onPress={() => {
                  setSpecsModalVisible(false);
                  if (selectedPart) handleEnquirePart(selectedPart);
                }}
                style={{ marginTop: 16 }}
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
  scrollBody: {
    padding: 16,
    paddingBottom: 24,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  verifiedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyBox: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  emptySub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  partsList: {
    gap: 12,
  },
  partCard: {
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
  partCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  partBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  partBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C6122E',
    letterSpacing: 0.4,
  },
  specsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  specsBtnText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  partNumberText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  partNameText: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
    marginBottom: 12,
  },
  cardActionsRow: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  enquireBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#C6122E',
    height: 38,
    borderRadius: 10,
  },
  enquireBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  specsTable: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  specKey: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  specVal: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
  },
});

export default VerifiedPartsScreen;
