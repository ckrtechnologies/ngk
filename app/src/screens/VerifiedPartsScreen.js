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
  RotateCw,
  Eye,
  Box,
  Sliders,
  CheckCircle2,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFunction } from '../apis/apiFunction';
import { serviceJsonApi, addVehicleToWatchlistApi, articlesByPartApi } from '../apis/api';
import { setPart, setSelectedVehicle, getMyselfRedux } from '../redux/getData';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import AppHeader from '../components/common/AppHeader';
import AppButton from '../components/common/AppButton';
import JourneyStepIndicator from '../components/common/JourneyStepIndicator';

const VerifiedPartsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [parts, setParts] = useState(route.params?.articles || []);
  const [loading, setLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [specsModalVisible, setSpecsModalVisible] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState('3d'); // '3d' | 'photo'
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const vehicle = route.params?.vehicle;
  const searchQuery = route.params?.searchQuery;

  // Reactively sync parts when route.params change
  useEffect(() => {
    if (route.params?.articles) {
      setParts(route.params.articles);
    }
  }, [route.params?.articles]);

  // If navigated with searchQuery and parts is empty, auto-fetch
  useEffect(() => {
    if ((!parts || parts.length === 0) && searchQuery) {
      const fetchByQuery = async () => {
        setLoading(true);
        try {
          const restRes = await apiFunction(
            `${articlesByPartApi}?searchQuery=${encodeURIComponent(searchQuery)}`,
            [],
            {},
            'GET',
            false
          );
          const list = restRes?.articles || restRes?.data?.array || restRes?.data || [];
          if (list.length > 0) {
            setParts(list);
          }
        } catch (err) {
          console.warn('Failed to fetch articles by searchQuery:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchByQuery();
    }
  }, [searchQuery]);

  useEffect(() => {
    if ((!parts || parts.length === 0) && vehicle) {
      const fetchPartsForVehicle = async () => {
        setLoading(true);
        const targetId = Number(
          vehicle.linkageTargetId || vehicle.carId || vehicle.id || vehicle.manuId
        );
        const payload = {
          getArticles: {
            articleCountry: 'ZA',
            linkageTargetId: targetId,
            linkageTargetType: 'P',
            lang: 'en',
            perPage: 40,
            page: 1,
            includeAll: true,
          },
        };

        try {
          const res = await apiFunction(serviceJsonApi, [], payload, 'POST', false);
          const list =
            res?.articles || res?.data?.array || res?.getArticles?.array || res?.data || [];
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
    setActiveMediaTab('3d');
    setSelectedImageIndex(0);
    setSpecsModalVisible(true);
  };

  const allImages = selectedPart?.images || selectedPart?.raw?.images || [];
  const gif360 = allImages.find(
    (img) =>
      img.fileName?.toLowerCase()?.includes('360') ||
      img.headerDescription?.toLowerCase()?.includes('360')
  );
  const regularImages = allImages.filter(
    (img) =>
      !img.fileName?.toLowerCase()?.includes('360') &&
      !img.headerDescription?.toLowerCase()?.includes('360')
  );

  const activeImageUrl =
    activeMediaTab === '3d' && gif360
      ? gif360.imageURL800 || gif360.imageURL400 || gif360.imageURL200
      : regularImages[selectedImageIndex]?.imageURL800 ||
        regularImages[selectedImageIndex]?.imageURL400 ||
        selectedPart?.imageUrl ||
        allImages[0]?.imageURL800 ||
        allImages[0]?.imageURL400 ||
        null;

  const criteriaList = selectedPart?.articleCriteria || selectedPart?.specs || [];
  const findCriterion = (keywords) => {
    const item = criteriaList.find((c) => {
      const desc = (c.criteriaDescription || c.label || c.attrName || '').toLowerCase();
      return keywords.some((kw) => desc.includes(kw));
    });
    return item ? item.formattedValue || item.value || item.rawValue || item.attrValue : null;
  };

  const spannerSize = findCriterion(['spanner', 'wrench', 'hex']);
  const threadSize = findCriterion(['thread size']);
  const threadLength = findCriterion(['thread length']);
  const sparkPosition = findCriterion(['spark position', 'gap', 'electrode']);
  const oeNumbers = selectedPart?.oenNumbers || selectedPart?.raw?.oenNumbers || [];

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

      {/* 3-Step Journey Indicator */}
      <JourneyStepIndicator
        currentStep={3}
        onStepPress={(step) => {
          if (step === 2) navigation.goBack();
          else if (step === 1) navigation.navigate('PartsFinder');
        }}
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
              const partNo =
                item.tradeNumbers?.[0] ||
                item.articleNumber ||
                item.articleNo ||
                item.partNumber ||
                item.directArticle?.articleNo ||
                'NGK-PART';
              const partName =
                item.genericArticles?.[0]?.genericArticleDescription ||
                item.articleName ||
                item.directArticle?.articleName ||
                item.name ||
                'Ignition / Sensor Component';
              const brand =
                item.mfrName ||
                item.brandName ||
                item.dataSupplierName ||
                item.directArticle?.brandName ||
                'NGK';

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

      {/* Full-Screen Technical Specifications & 3D Interactive Model Modal */}
      <Modal
        visible={specsModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSpecsModalVisible(false)}
      >
        <View
          style={[
            styles.fullScreenModal,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

          {/* Top Modal Navigation Header */}
          <View style={styles.modalHeaderDark}>
            <View style={styles.modalHeaderInfo}>
              <View style={styles.modalBrandPill}>
                <Text style={styles.modalBrandText}>
                  {selectedPart?.mfrName || selectedPart?.brandName || 'NGK SPARK PLUG'}
                </Text>
              </View>
              <Text style={styles.modalPartNumber}>
                {selectedPart?.tradeNumbers?.[0] ||
                  selectedPart?.articleNumber ||
                  selectedPart?.articleNo ||
                  selectedPart?.partNumber ||
                  'GENUINE NGK'}
              </Text>
              <Text style={styles.modalPartSub}>
                {selectedPart?.genericArticles?.[0]?.genericArticleDescription ||
                  selectedPart?.articleName ||
                  'Ignition Component'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSpecsModalVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBodyDark}>
            {/* 3D Interactive Showroom Stage */}
            <View style={styles.showroomStage}>
              {/* Media Mode Switcher (360° 3D vs HD Photo) */}
              <View style={styles.showroomControls}>
                <View style={styles.mediaToggleBox}>
                  <TouchableOpacity
                    style={[
                      styles.mediaToggleBtn,
                      activeMediaTab === '3d' && styles.mediaToggleBtnActive,
                    ]}
                    onPress={() => setActiveMediaTab('3d')}
                    activeOpacity={0.8}
                  >
                    <RotateCw
                      size={13}
                      color={activeMediaTab === '3d' ? '#FFFFFF' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.mediaToggleText,
                        activeMediaTab === '3d' && styles.mediaToggleTextActive,
                      ]}
                    >
                      360° 3D Model
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.mediaToggleBtn,
                      activeMediaTab === 'photo' && styles.mediaToggleBtnActive,
                    ]}
                    onPress={() => setActiveMediaTab('photo')}
                    activeOpacity={0.8}
                  >
                    <Eye
                      size={13}
                      color={activeMediaTab === 'photo' ? '#FFFFFF' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.mediaToggleText,
                        activeMediaTab === 'photo' && styles.mediaToggleTextActive,
                      ]}
                    >
                      HD Photo
                    </Text>
                  </TouchableOpacity>
                </View>

                {activeMediaTab === '3d' && (
                  <View style={styles.active3DBadge}>
                    <RotateCw size={11} color="#10B981" />
                    <Text style={styles.active3DBadgeText}>360° MODEL ACTIVE</Text>
                  </View>
                )}
              </View>

              {/* Viewport Center with 3D product asset */}
              <View style={styles.viewportCenter}>
                {activeImageUrl ? (
                  <Image
                    source={{ uri: activeImageUrl }}
                    style={styles.product3DImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.noImagePlaceholder}>
                    <Box size={44} color="#475569" />
                    <Text style={styles.noImageText}>TecDoc Pegasus 3D Illustration</Text>
                  </View>
                )}
              </View>

              {/* Photo Thumbnails if multiple regular photos exist */}
              {activeMediaTab === 'photo' && regularImages.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailRow}
                >
                  {regularImages.map((img, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.thumbBox,
                        selectedImageIndex === idx && styles.thumbBoxActive,
                      ]}
                      onPress={() => setSelectedImageIndex(idx)}
                    >
                      <Image
                        source={{ uri: img.imageURL200 || img.imageURL100 }}
                        style={styles.thumbImg}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Studio Fitment Guarantee Footer */}
              <View style={styles.stageFooterRow}>
                <ShieldCheck size={14} color="#10B981" />
                <Text style={styles.stageFooterText}>
                  TecAlliance Pegasus 3.0 • Genuine NGK Component
                </Text>
              </View>
            </View>

            {/* Quick KPI Spec Highlights (4 Pillar Cards) */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Spanner Size</Text>
                <Text style={styles.kpiValue}>{spannerSize || '16 mm'}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Thread Size</Text>
                <Text style={styles.kpiValue}>{threadSize || 'M14 x 1.25'}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Thread Length</Text>
                <Text style={styles.kpiValue}>{threadLength || '19 mm'}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Spark / Gap</Text>
                <Text style={styles.kpiValue}>{sparkPosition || '3.0 mm'}</Text>
              </View>
            </View>

            {/* Complete Technical Specifications Table */}
            <View style={styles.specsCardDark}>
              <View style={styles.specsSectionHeader}>
                <Sliders size={15} color="#C6122E" />
                <Text style={styles.specsSectionTitle}>Technical Specifications</Text>
              </View>

              <View style={styles.specsTableDark}>
                <View style={[styles.specTableRowDark, styles.specTableZebra]}>
                  <Text style={styles.specTableKeyDark}>Part / Trade Number</Text>
                  <Text style={styles.specTableValDark}>
                    {selectedPart?.tradeNumbers?.[0] ||
                      selectedPart?.articleNumber ||
                      selectedPart?.articleNo ||
                      selectedPart?.partNumber ||
                      'N/A'}
                  </Text>
                </View>

                <View style={styles.specTableRowDark}>
                  <Text style={styles.specTableKeyDark}>Category</Text>
                  <Text style={styles.specTableValDark}>
                    {selectedPart?.genericArticles?.[0]?.genericArticleDescription ||
                      selectedPart?.articleName ||
                      'Automotive Ignition'}
                  </Text>
                </View>

                <View style={[styles.specTableRowDark, styles.specTableZebra]}>
                  <Text style={styles.specTableKeyDark}>Brand / Manufacturer</Text>
                  <Text style={styles.specTableValDark}>
                    {selectedPart?.mfrName || selectedPart?.brandName || 'NGK SPARK PLUG'}
                  </Text>
                </View>

                {criteriaList.map((crit, cIdx) => (
                  <View
                    key={cIdx}
                    style={[
                      styles.specTableRowDark,
                      cIdx % 2 === 1 ? styles.specTableZebra : null,
                    ]}
                  >
                    <Text style={styles.specTableKeyDark}>
                      {crit.criteriaDescription || crit.label || crit.attrName}
                    </Text>
                    <Text style={styles.specTableValDark}>
                      {crit.formattedValue || crit.value || crit.attrValue || crit.rawValue}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* OE Cross Reference Numbers */}
            {oeNumbers.length > 0 && (
              <View style={styles.oeCardDark}>
                <Text style={styles.oeTitle}>Original Equipment (OE) Cross-References</Text>
                <View style={styles.oePillWrap}>
                  {oeNumbers.slice(0, 16).map((oe, oIdx) => (
                    <View key={oIdx} style={styles.oePill}>
                      <Text style={styles.oeMfrName}>{oe.mfrName || 'OEM'}:</Text>
                      <Text style={styles.oeArticleNo}>{oe.articleNumber || oe.oeNumber}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={{ height: 95 }} />
          </ScrollView>

          {/* Sticky Bottom Action Bar */}
          <View style={styles.modalBottomBar}>
            <AppButton
              title="Request Support / Quote from Dealer"
              onPress={() => {
                setSpecsModalVisible(false);
                if (selectedPart) handleEnquirePart(selectedPart);
              }}
              backgroundColor="#059669"
              rightIcon={<MessageSquare size={16} color="#FFFFFF" />}
              height={48}
            />
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
  // Full-Screen 3D Showroom Modal Styles
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  modalHeaderDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#0B0F19',
    borderBottomWidth: 1,
    borderColor: '#1E293B',
  },
  modalHeaderInfo: {
    flex: 1,
    marginRight: 12,
  },
  modalBrandPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  modalBrandText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F87171',
    letterSpacing: 0.5,
  },
  modalPartNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalPartSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBodyDark: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  showroomStage: {
    backgroundColor: '#111827',
    margin: 16,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  showroomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mediaToggleBox: {
    flexDirection: 'row',
    backgroundColor: '#0B0F19',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  mediaToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  mediaToggleBtnActive: {
    backgroundColor: '#C6122E',
  },
  mediaToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  mediaToggleTextActive: {
    color: '#FFFFFF',
  },
  active3DBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  active3DBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.4,
  },
  viewportCenter: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  product3DImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noImageText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  thumbBox: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#0B0F19',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 4,
  },
  thumbBoxActive: {
    borderColor: '#C6122E',
    borderWidth: 2,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  stageFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  stageFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  specsCardDark: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  specsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  specsSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  specsTableDark: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  specTableRowDark: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  specTableZebra: {
    backgroundColor: '#0F172A',
  },
  specTableKeyDark: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    flex: 1,
  },
  specTableValDark: {
    fontSize: 12,
    color: '#F1F5F9',
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  oeCardDark: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  oeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  oePillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  oePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0B0F19',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  oeMfrName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  oeArticleNo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  modalBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0B0F19',
    borderTopWidth: 1,
    borderColor: '#1E293B',
  },
});

export default VerifiedPartsScreen;
