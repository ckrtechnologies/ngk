import React, { useEffect, useState, useRef } from 'react';
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
  PanResponder,
  Animated,
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
  RotateCcw,
  Eye,
  Box,
  Sliders,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Sparkles,
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
import Product360Viewer from '../components/common/Product360Viewer';

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
  const [rotationY, setRotationY] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [isAutoSpinning, setIsAutoSpinning] = useState(true);

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
    setRotationY(0);
    setZoomScale(1);
    setIsAutoSpinning(true);
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
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          {/* Top Modal Navigation Header - Clean Light Theme */}
          <View style={styles.modalHeaderLight}>
            <View style={styles.modalHeaderInfo}>
              <View style={styles.modalBrandPillLight}>
                <Text style={styles.modalBrandTextLight}>
                  {selectedPart?.mfrName || selectedPart?.brandName || 'NGK SPARK PLUG'}
                </Text>
              </View>
              <Text style={styles.modalPartNumberLight}>
                {selectedPart?.tradeNumbers?.[0] ||
                  selectedPart?.articleNumber ||
                  selectedPart?.articleNo ||
                  selectedPart?.partNumber ||
                  'GENUINE NGK'}
              </Text>
              <Text style={styles.modalPartSubLight}>
                {selectedPart?.genericArticles?.[0]?.genericArticleDescription ||
                  selectedPart?.articleName ||
                  'Ignition Component'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtnLight}
              onPress={() => setSpecsModalVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBodyLight}>
            {/* 3D Interactive Showroom Stage (Light Theme) */}
            <View style={styles.showroomStageLight}>
              {/* Media Mode Switcher (360° 3D vs HD Photo) */}
              <View style={styles.showroomControlsLight}>
                <View style={styles.mediaToggleBoxLight}>
                  <TouchableOpacity
                    style={[
                      styles.mediaToggleBtnLight,
                      activeMediaTab === '3d' && styles.mediaToggleBtnActiveLight,
                    ]}
                    onPress={() => {
                      setActiveMediaTab('3d');
                      setIsAutoSpinning(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <RotateCw
                      size={13}
                      color={activeMediaTab === '3d' ? '#FFFFFF' : '#4B5563'}
                    />
                    <Text
                      style={[
                        styles.mediaToggleTextLight,
                        activeMediaTab === '3d' && styles.mediaToggleTextActiveLight,
                      ]}
                    >
                      360° 3D Model
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.mediaToggleBtnLight,
                      activeMediaTab === 'photo' && styles.mediaToggleBtnActiveLight,
                    ]}
                    onPress={() => {
                      setActiveMediaTab('photo');
                      setIsAutoSpinning(false);
                      setZoomScale(1);
                    }}
                    activeOpacity={0.8}
                  >
                    <Eye
                      size={13}
                      color={activeMediaTab === 'photo' ? '#FFFFFF' : '#4B5563'}
                    />
                    <Text
                      style={[
                        styles.mediaToggleTextLight,
                        activeMediaTab === 'photo' && styles.mediaToggleTextActiveLight,
                      ]}
                    >
                      HD Photo
                    </Text>
                  </TouchableOpacity>
                </View>

                {activeMediaTab === '3d' && (
                  <View style={styles.active3DBadgeLight}>
                    <RotateCw size={11} color="#059669" />
                    <Text style={styles.active3DBadgeTextLight}>
                      {isAutoSpinning ? 'AUTO-SPINNING' : `${((rotationY % 360) + 360) % 360}° ORBIT`}
                    </Text>
                  </View>
                )}
              </View>

              {/* Touch-to-Rotate 360 Product Stage / HD Static Photo Stage */}
              <View style={styles.viewportCenterLight}>
                <Product360Viewer
                  isStatic={activeMediaTab === 'photo'}
                  gifUrl={activeMediaTab === '3d' && gif360 ? gif360.imageURL800 || gif360.imageURL400 || gif360.imageURL200 : null}
                  staticImageUrl={activeImageUrl}
                  angle={activeMediaTab === '3d' ? rotationY : 0}
                  isAutoSpinning={activeMediaTab === '3d' && isAutoSpinning}
                  zoomScale={zoomScale}
                  onAngleChange={(deg) => setRotationY(deg)}
                  onAutoSpinChange={(spinning) => setIsAutoSpinning(spinning)}
                  onScaleChange={(scale) => setZoomScale(scale)}
                />
              </View>

              {/* Interactive 3D Control Strip */}
              {activeMediaTab === '3d' && (
                <View style={styles.interactive3DToolbar}>
                  <View style={styles.dragHintBox}>
                    <Text style={styles.dragHintText}>
                      👆 Swipe to rotate • Pinch or double-tap to zoom • Drag to pan
                    </Text>
                  </View>

                  {/* Actions: Auto-Spin, Reset, Zoom In, Zoom Out */}
                  <View style={styles.toolActionButtonsRow}>
                    <TouchableOpacity
                      style={[
                        styles.toolBtn,
                        isAutoSpinning && styles.toolBtnActive,
                      ]}
                      onPress={() => setIsAutoSpinning((prev) => !prev)}
                      activeOpacity={0.7}
                    >
                      <RotateCw
                        size={13}
                        color={isAutoSpinning ? '#FFFFFF' : '#374151'}
                      />
                      <Text
                        style={[
                          styles.toolBtnText,
                          isAutoSpinning && styles.toolBtnTextActive,
                        ]}
                      >
                        {isAutoSpinning ? 'Pause' : 'Auto-Spin'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.toolBtn}
                      onPress={() => {
                        setRotationY(0);
                        setZoomScale(1);
                        setIsAutoSpinning(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <RotateCcw size={13} color="#374151" />
                      <Text style={styles.toolBtnText}>Reset</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.toolBtnIcon}
                      onPress={() => setZoomScale((s) => Math.min(1.8, s + 0.2))}
                      activeOpacity={0.7}
                    >
                      <ZoomIn size={14} color="#374151" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.toolBtnIcon}
                      onPress={() => setZoomScale((s) => Math.max(0.7, s - 0.2))}
                      activeOpacity={0.7}
                    >
                      <ZoomOut size={14} color="#374151" />
                    </TouchableOpacity>
                  </View>

                  {/* Quick Preset Angles */}
                  <View style={styles.anglePresetRow}>
                    {[
                      { label: '0° Front', deg: 0 },
                      { label: '90° Side', deg: 90 },
                      { label: '180° Back', deg: 180 },
                      { label: '270° Side', deg: 270 },
                    ].map((p) => {
                      const currentNorm = ((rotationY % 360) + 360) % 360;
                      const isNear = Math.abs(currentNorm - p.deg) < 15;
                      return (
                        <TouchableOpacity
                          key={p.deg}
                          style={[
                            styles.anglePresetChip,
                            isNear && styles.anglePresetChipActive,
                          ]}
                          onPress={() => {
                            setIsAutoSpinning(false);
                            setRotationY(p.deg);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.anglePresetChipText,
                              isNear && styles.anglePresetChipTextActive,
                            ]}
                          >
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* HD Photo Zoom Controls */}
              {activeMediaTab === 'photo' && (
                <View style={styles.interactive3DToolbar}>
                  <View style={styles.dragHintBox}>
                    <Text style={styles.dragHintText}>
                      🔍 Pinch or double-tap to zoom • Drag in any direction to pan
                    </Text>
                  </View>

                  <View style={styles.toolActionButtonsRow}>
                    <TouchableOpacity
                      style={styles.toolBtn}
                      onPress={() => setZoomScale(1)}
                      activeOpacity={0.7}
                    >
                      <RotateCcw size={13} color="#374151" />
                      <Text style={styles.toolBtnText}>Reset Zoom</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.toolBtnIcon}
                      onPress={() => setZoomScale((s) => Math.min(2.5, s + 0.25))}
                      activeOpacity={0.7}
                    >
                      <ZoomIn size={14} color="#374151" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.toolBtnIcon}
                      onPress={() => setZoomScale((s) => Math.max(0.7, s - 0.25))}
                      activeOpacity={0.7}
                    >
                      <ZoomOut size={14} color="#374151" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Photo Thumbnails if multiple regular photos exist */}
              {activeMediaTab === 'photo' && regularImages.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailRowLight}
                >
                  {regularImages.map((img, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.thumbBoxLight,
                        selectedImageIndex === idx && styles.thumbBoxActiveLight,
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
              <View style={styles.stageFooterRowLight}>
                <ShieldCheck size={14} color="#059669" />
                <Text style={styles.stageFooterTextLight}>
                  TecAlliance Pegasus 3.0 • Genuine NGK Component
                </Text>
              </View>
            </View>

            {/* Quick KPI Spec Highlights (4 Pillar Cards) */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCardLight}>
                <Text style={styles.kpiLabelLight}>Spanner Size</Text>
                <Text style={styles.kpiValueLight}>{spannerSize || '16 mm'}</Text>
              </View>
              <View style={styles.kpiCardLight}>
                <Text style={styles.kpiLabelLight}>Thread Size</Text>
                <Text style={styles.kpiValueLight}>{threadSize || 'M14 x 1.25'}</Text>
              </View>
              <View style={styles.kpiCardLight}>
                <Text style={styles.kpiLabelLight}>Thread Length</Text>
                <Text style={styles.kpiValueLight}>{threadLength || '19 mm'}</Text>
              </View>
              <View style={styles.kpiCardLight}>
                <Text style={styles.kpiLabelLight}>Spark / Gap</Text>
                <Text style={styles.kpiValueLight}>{sparkPosition || '3.0 mm'}</Text>
              </View>
            </View>

            {/* Complete Technical Specifications Table */}
            <View style={styles.specsCardLight}>
              <View style={styles.specsSectionHeader}>
                <Sliders size={15} color="#C6122E" />
                <Text style={styles.specsSectionTitleLight}>Technical Specifications</Text>
              </View>

              <View style={styles.specsTableLight}>
                <View style={[styles.specTableRowLight, styles.specTableZebraLight]}>
                  <Text style={styles.specTableKeyLight}>Part / Trade Number</Text>
                  <Text style={styles.specTableValLight}>
                    {selectedPart?.tradeNumbers?.[0] ||
                      selectedPart?.articleNumber ||
                      selectedPart?.articleNo ||
                      selectedPart?.partNumber ||
                      'N/A'}
                  </Text>
                </View>

                <View style={styles.specTableRowLight}>
                  <Text style={styles.specTableKeyLight}>Category</Text>
                  <Text style={styles.specTableValLight}>
                    {selectedPart?.genericArticles?.[0]?.genericArticleDescription ||
                      selectedPart?.articleName ||
                      'Automotive Ignition'}
                  </Text>
                </View>

                <View style={[styles.specTableRowLight, styles.specTableZebraLight]}>
                  <Text style={styles.specTableKeyLight}>Brand / Manufacturer</Text>
                  <Text style={styles.specTableValLight}>
                    {selectedPart?.mfrName || selectedPart?.brandName || 'NGK SPARK PLUG'}
                  </Text>
                </View>

                {criteriaList.map((crit, cIdx) => (
                  <View
                    key={cIdx}
                    style={[
                      styles.specTableRowLight,
                      cIdx % 2 === 1 ? styles.specTableZebraLight : null,
                    ]}
                  >
                    <Text style={styles.specTableKeyLight}>
                      {crit.criteriaDescription || crit.label || crit.attrName}
                    </Text>
                    <Text style={styles.specTableValLight}>
                      {crit.formattedValue || crit.value || crit.attrValue || crit.rawValue}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* OE Cross Reference Numbers */}
            {oeNumbers.length > 0 && (
              <View style={styles.oeCardLight}>
                <Text style={styles.oeTitleLight}>Original Equipment (OE) Cross-References</Text>
                <View style={styles.oePillWrap}>
                  {oeNumbers.slice(0, 16).map((oe, oIdx) => (
                    <View key={oIdx} style={styles.oePillLight}>
                      <Text style={styles.oeMfrNameLight}>{oe.mfrName || 'OEM'}:</Text>
                      <Text style={styles.oeArticleNoLight}>{oe.articleNumber || oe.oeNumber}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={{ height: 95 }} />
          </ScrollView>

          {/* Sticky Bottom Action Bar */}
          <View style={styles.modalBottomBarLight}>
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
  // Full-Screen 3D Showroom Modal Styles - Clean Light OEM Theme
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeaderLight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalHeaderInfo: {
    flex: 1,
    marginRight: 12,
  },
  modalBrandPillLight: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  modalBrandTextLight: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C6122E',
    letterSpacing: 0.5,
  },
  modalPartNumberLight: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 0.5,
  },
  modalPartSubLight: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCloseBtnLight: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBodyLight: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  showroomStageLight: {
    backgroundColor: '#F8FAFC',
    margin: 16,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  showroomControlsLight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mediaToggleBoxLight: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mediaToggleBtnLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  mediaToggleBtnActiveLight: {
    backgroundColor: '#C6122E',
  },
  mediaToggleTextLight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  mediaToggleTextActiveLight: {
    color: '#FFFFFF',
  },
  active3DBadgeLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  active3DBadgeTextLight: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.4,
  },
  viewportCenterLight: {
    height: 230,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
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
  noImageTextLight: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  interactive3DToolbar: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  dragHintBox: {
    alignItems: 'center',
    marginBottom: 8,
  },
  dragHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  toolActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  toolBtnActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  toolBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  toolBtnTextActive: {
    color: '#FFFFFF',
  },
  toolBtnIcon: {
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  anglePresetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  anglePresetChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  anglePresetChipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  anglePresetChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  anglePresetChipTextActive: {
    color: '#C6122E',
  },
  thumbnailRowLight: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  thumbBoxLight: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 4,
  },
  thumbBoxActiveLight: {
    borderColor: '#C6122E',
    borderWidth: 2,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  stageFooterRowLight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  stageFooterTextLight: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  kpiCardLight: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiLabelLight: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiValueLight: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  specsCardLight: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  specsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  specsSectionTitleLight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  specsTableLight: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  specTableRowLight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  specTableZebraLight: {
    backgroundColor: '#F9FAFB',
  },
  specTableKeyLight: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
    flex: 1,
  },
  specTableValLight: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  oeCardLight: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  oeTitleLight: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  oePillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  oePillLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  oeMfrNameLight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  oeArticleNoLight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  modalBottomBarLight: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
});

export default VerifiedPartsScreen;
