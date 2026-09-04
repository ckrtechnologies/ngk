import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Tag,
  ShieldCheck,
  MessageSquare,
  X,
  Info,
  RotateCw,
  RotateCcw,
  Eye,
  Sliders,
  ZoomIn,
  ZoomOut,
  LayoutGrid,
  List,
  Zap,
  FileText,
  Maximize2,
  Minimize2,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiFunction } from '../apis/apiFunction';
import {
  serviceJsonApi,
  articlesByPartApi,
  articlesByVehicleApi,
} from '../apis/api';
import { setPart, setSelectedVehicle } from '../redux/getData';
import { useDispatch } from 'react-redux';
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
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [specsModalVisible, setSpecsModalVisible] = useState(false);
  const [modalMainTab, setModalMainTab] = useState('studio'); // 'studio' | 'specs'
  const [isStudioFullscreen, setIsStudioFullscreen] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState('3d'); // '3d' | 'photo'
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [isAutoSpinning, setIsAutoSpinning] = useState(true);

  // Cards layout & Peek View States
  const [layoutMode, setLayoutMode] = useState('cards'); // 'cards' | 'compact'
  const [peekPart, setPeekPart] = useState(null);
  const [peekModalVisible, setPeekModalVisible] = useState(false);

  const vehicle = route.params?.vehicle;
  const searchQuery = route.params?.searchQuery;
  const appType = route.params?.appType || 'P';
  const selectedManufacturer = route.params?.selectedManufacturer;
  const selectedSeries = route.params?.selectedSeries;
  const [fallbackSiblingName, setFallbackSiblingName] = useState(null);
  const fetchedTargetRef = useRef(null);

  const reloadParts = useCallback(async () => {
    setRefreshing(true);
    try {
      if (searchQuery) {
        const restRes = await apiFunction(
          `${articlesByPartApi}?searchQuery=${encodeURIComponent(searchQuery)}`,
          [],
          {},
          'GET',
          false
        );
        const list = restRes?.articles || restRes?.data?.array || restRes?.data || [];
        setParts(Array.isArray(list) ? list : []);
      } else if (vehicle) {
        const targetId = Number(
          vehicle.linkageTargetId ||
          vehicle.linkageTargetID ||
          vehicle.carId ||
          vehicle.carID ||
          vehicle.id ||
          vehicle.targetId
        );
        const incomingType = vehicle.linkageTargetType || appType || 'P';
        // In TecDoc Pegasus ZA catalog (NGK/NTK/KYB), articles are indexed under 'P' (and 'V').
        // Queries with 'O' or 'C' return 0 articles.
        const primaryType = (incomingType === 'O' || incomingType === 'C') ? 'P' : incomingType;

        const fetchWithPegasus = async (tType, id = targetId) => {
          const payload = {
            getArticles: {
              articleCountry: 'ZA',
              linkageTargetId: id,
              linkageTargetType: tType,
              lang: 'en',
              perPage: 40,
              page: 1,
              includeAll: true,
            },
          };
          const res = await apiFunction(serviceJsonApi, [], payload, 'POST', false);
          const arr = res?.articles || res?.data?.array || res?.getArticles?.array || res?.data || [];
          return Array.isArray(arr) ? arr : [];
        };

        let list = await fetchWithPegasus(primaryType);

        if (!list || list.length === 0) {
          for (const altType of ['P', 'V', incomingType]) {
            if (altType === primaryType) continue;
            list = await fetchWithPegasus(altType);
            if (list && list.length > 0) break;
          }
        }

        if (!list || list.length === 0) {
          try {
            const restRes = await apiFunction(
              `${articlesByVehicleApi}?vehicleId=${targetId}&type=${primaryType}`,
              [],
              {},
              'GET',
              false
            );
            list = restRes?.articles || restRes?.data?.array || restRes?.data || [];
          } catch (e) {
            // Ignore REST fallback error
          }
        }

        // Fallback: Sibling platform fallback in the same series
        if (!list || list.length === 0) {
          const mfrId = selectedManufacturer?.id || selectedManufacturer?.manuId || vehicle.mfrId;
          const seriesId = selectedSeries?.modelId || selectedSeries?.id || vehicle.vehicleModelSeriesId;
          if (mfrId && seriesId) {
            try {
              const siblingPayload = {
                getLinkageTargets: {
                  linkageTargetCountry: 'ZA',
                  lang: 'en',
                  linkageTargetType: incomingType || 'O',
                  mfrIds: [Number(mfrId)],
                  vehicleModelSeriesIds: [Number(seriesId)],
                  perPage: 15,
                  page: 1,
                },
              };
              const sibRes = await apiFunction(serviceJsonApi, [], siblingPayload, 'POST', false);
              const siblings = sibRes?.linkageTargets || sibRes?.data?.array || [];
              for (const sib of siblings) {
                const sibId = Number(sib.linkageTargetId || sib.id);
                if (sibId && sibId !== targetId) {
                  const sibParts = await fetchWithPegasus(primaryType, sibId);
                  if (sibParts && sibParts.length > 0) {
                    list = sibParts;
                    setFallbackSiblingName(sib.description || sib.typeName || 'Compatible Trim');
                    break;
                  }
                }
              }
            } catch (sibErr) {
              console.warn('Sibling fallback error:', sibErr);
            }
          }
        }

        setParts(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.warn('Failed to reload parts:', err);
    } finally {
      setRefreshing(false);
    }
  }, [searchQuery, vehicle, appType, selectedManufacturer, selectedSeries]);

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
          setParts(Array.isArray(list) ? list : []);
        } catch (err) {
          console.warn('Failed to fetch articles by searchQuery:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchByQuery();
    }
  }, [searchQuery, parts]);

  useEffect(() => {
    if (!vehicle) return;

    const targetId = Number(
      vehicle.linkageTargetId ||
      vehicle.linkageTargetID ||
      vehicle.carId ||
      vehicle.carID ||
      vehicle.id ||
      vehicle.targetId
    );

    if (fetchedTargetRef.current === targetId) return;
    fetchedTargetRef.current = targetId;

    const fetchPartsForVehicle = async () => {
      setLoading(true);
      const incomingType = vehicle.linkageTargetType || appType || 'P';
      // In TecDoc Pegasus ZA catalog (NGK/NTK/KYB), articles are indexed under 'P' (and 'V').
      // Queries with 'O' or 'C' return 0 articles.
      const primaryType = (incomingType === 'O' || incomingType === 'C') ? 'P' : incomingType;

      const fetchWithPegasus = async (tType, id = targetId) => {
        const payload = {
          getArticles: {
            articleCountry: 'ZA',
            linkageTargetId: id,
            linkageTargetType: tType,
            lang: 'en',
            perPage: 40,
            page: 1,
            includeAll: true,
          },
        };
        const res = await apiFunction(serviceJsonApi, [], payload, 'POST', false);
        const arr = res?.articles || res?.data?.array || res?.getArticles?.array || res?.data || [];
        return Array.isArray(arr) ? arr : [];
      };

      try {
        let list = await fetchWithPegasus(primaryType);

        // Fallback: If primary target type returned empty, try alternatives
        if (!list || list.length === 0) {
          for (const altType of ['P', 'V', incomingType]) {
            if (altType === primaryType) continue;
            list = await fetchWithPegasus(altType);
            if (list && list.length > 0) break;
          }
        }

        // Fallback: If direct Pegasus returns empty, attempt REST endpoint
        if (!list || list.length === 0) {
          try {
            const restRes = await apiFunction(
              `${articlesByVehicleApi}?vehicleId=${targetId}&type=${primaryType}`,
              [],
              {},
              'GET',
              false
            );
            list = restRes?.articles || restRes?.data?.array || restRes?.data || [];
          } catch (e) {
            // Ignore REST fallback error
          }
        }

        // Fallback: Sibling platform fallback in the same series
        if (!list || list.length === 0) {
          const mfrId = selectedManufacturer?.id || selectedManufacturer?.manuId || vehicle.mfrId;
          const seriesId = selectedSeries?.modelId || selectedSeries?.id || vehicle.vehicleModelSeriesId;
          if (mfrId && seriesId) {
            try {
              const siblingPayload = {
                getLinkageTargets: {
                  linkageTargetCountry: 'ZA',
                  lang: 'en',
                  linkageTargetType: incomingType || 'O',
                  mfrIds: [Number(mfrId)],
                  vehicleModelSeriesIds: [Number(seriesId)],
                  perPage: 15,
                  page: 1,
                },
              };
              const sibRes = await apiFunction(serviceJsonApi, [], siblingPayload, 'POST', false);
              const siblings = sibRes?.linkageTargets || sibRes?.data?.array || [];
              for (const sib of siblings) {
                const sibId = Number(sib.linkageTargetId || sib.id);
                if (sibId && sibId !== targetId) {
                  const sibParts = await fetchWithPegasus(primaryType, sibId);
                  if (sibParts && sibParts.length > 0) {
                    list = sibParts;
                    setFallbackSiblingName(sib.description || sib.typeName || 'Compatible Trim');
                    break;
                  }
                }
              }
            } catch (sibErr) {
              console.warn('Sibling fallback error:', sibErr);
            }
          }
        }

        setParts(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('Failed to load parts for vehicle', err);
        setParts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPartsForVehicle();
  }, [vehicle, appType, selectedManufacturer, selectedSeries]);

  const handleEnquirePart = (item) => {
    dispatch(setPart(item));
    if (vehicle) dispatch(setSelectedVehicle(vehicle));
    navigation.navigate('TechnicalEnquiry', { part: item, vehicle });
  };

  const handleOpenSpecs = (item) => {
    setSelectedPart(item);
    const allImgs = item?.images || item?.raw?.images || item?.articleMedia || [];
    const has360 = allImgs.some(
      (img) =>
        img.fileName?.toLowerCase()?.includes('360') ||
        img.headerDescription?.toLowerCase()?.includes('360')
    );
    setActiveMediaTab(has360 ? '3d' : 'photo');
    setSelectedImageIndex(0);
    setRotationY(0);
    setZoomScale(1);
    setIsAutoSpinning(has360);
    setModalMainTab('studio');
    setIsStudioFullscreen(true);
    setSpecsModalVisible(true);
  };

  const handleOpenPeek = (item) => {
    setPeekPart(item);
    setPeekModalVisible(true);
  };

  const getPartImage = (item) => {
    if (!item) return null;
    const images = item.images || item.raw?.images || item.articleMedia || [];
    const staticImg = images.find(
      (img) =>
        !img.fileName?.toLowerCase()?.includes('360') &&
        !img.headerDescription?.toLowerCase()?.includes('360')
    );
    if (staticImg) {
      return staticImg.imageURL400 || staticImg.imageURL200 || staticImg.imageURL800;
    }
    if (images[0]) {
      return images[0].imageURL400 || images[0].imageURL200 || images[0].imageURL800;
    }
    return item.imageUrl || null;
  };

  const getBriefSpecs = (item) => {
    if (!item) return [];
    const raw = item.articleCriteria || item.specs || [];
    const priorityTerms = [
      'connector', 'pin', 'spanner', 'thread', 'electrode', 'gap', 'inlet',
      'cable', 'length', 'fitting position', 'torque', 'mount', 'resistance',
      'circuits', 'system', 'voltage'
    ];
    const list = [];
    for (const crit of raw) {
      const desc = (crit.criteriaDescription || crit.label || crit.attrName || '').trim();
      const val = (crit.formattedValue || crit.value || crit.rawValue || crit.attrValue || '').trim();
      if (!desc || !val || val === '-') continue;
      const lower = desc.toLowerCase();
      if (priorityTerms.some((term) => lower.includes(term))) {
        list.push({ label: desc, value: val });
        if (list.length >= 3) break;
      }
    }
    if (list.length < 2) {
      for (const crit of raw) {
        const desc = (crit.criteriaDescription || crit.label || crit.attrName || '').trim();
        const val = (crit.formattedValue || crit.value || crit.rawValue || crit.attrValue || '').trim();
        if (!desc || !val || val === '-') continue;
        if (!list.some((l) => l.label === desc)) {
          list.push({ label: desc, value: val });
          if (list.length >= 3) break;
        }
      }
    }
    return list.slice(0, 3);
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

  // Always use the real, verified static 2D photo for the initial placeholder
  // so remote animated GIFs are NEVER used as placeholders, eliminating decode jitter.
  const verifiedStaticPhoto =
    regularImages[selectedImageIndex]?.imageURL400 ||
    regularImages[selectedImageIndex]?.imageURL800 ||
    regularImages[selectedImageIndex]?.imageURL200 ||
    getPartImage(selectedPart) ||
    selectedPart?.imageUrl ||
    allImages[0]?.imageURL400 ||
    null;

  const activeImageUrl =
    activeMediaTab === '3d' && gif360
      ? gif360.imageURL400 || gif360.imageURL800 || gif360.imageURL200
      : verifiedStaticPhoto;

  const criteriaList = selectedPart?.articleCriteria || selectedPart?.specs || [];

  // Dynamically extract up to 4 meaningful highlight specifications for the selected part.
  // Never show hardcoded spark plug values on Ignition Coils, Sensors, or Shock Absorbers!
  const highlightKpis = useMemo(() => {
    if (!selectedPart) return [];
    const raw = selectedPart?.articleCriteria || selectedPart?.specs || [];
    const formatted = raw
      .map((c) => ({
        label: c.criteriaDescription || c.label || c.attrName || '',
        value: c.formattedValue || c.value || c.rawValue || c.attrValue || '',
      }))
      .filter((c) => c.label && c.value && c.value !== '-');

    if (formatted.length > 0) {
      return formatted.slice(0, 4);
    }

    // Dynamic fallbacks from actual part metadata if criteria list is empty
    const items = [];
    const brand = selectedPart.mfrName || selectedPart.brandName || selectedPart.dataSupplierName;
    if (brand) items.push({ label: 'Brand', value: brand });
    const category =
      selectedPart.genericArticles?.[0]?.genericArticleDescription ||
      selectedPart.articleName ||
      selectedPart.directArticle?.articleName;
    if (category) items.push({ label: 'Category', value: category });
    if (selectedPart.misc?.quantityPerPackage) {
      items.push({ label: 'Package Qty', value: `${selectedPart.misc.quantityPerPackage} pc` });
    }
    const tradeNo = selectedPart.tradeNumbers?.[0] || selectedPart.articleNumber || selectedPart.articleNo;
    if (tradeNo) {
      items.push({ label: 'Part / Trade No.', value: tradeNo });
    }
    return items.slice(0, 4);
  }, [selectedPart]);

  const oeNumbers = selectedPart?.oenNumbers || selectedPart?.raw?.oenNumbers || [];

  // Peek computed properties
  const peekPhotoUrl = peekPart ? getPartImage(peekPart) : null;
  const peekBrand =
    peekPart?.mfrName ||
    peekPart?.brandName ||
    peekPart?.dataSupplierName ||
    peekPart?.directArticle?.brandName ||
    'NGK';
  const isPeekKyb = String(peekBrand).toUpperCase().includes('KYB');
  const peekPartNo =
    peekPart?.tradeNumbers?.[0] ||
    peekPart?.articleNumber ||
    peekPart?.articleNo ||
    peekPart?.partNumber ||
    peekPart?.directArticle?.articleNo ||
    'GENUINE-PART';
  const peekPartName =
    peekPart?.genericArticles?.[0]?.genericArticleDescription ||
    peekPart?.articleName ||
    peekPart?.directArticle?.articleName ||
    peekPart?.name ||
    'Ignition / Sensor Component';
  const peekSpecs = peekPart ? getBriefSpecs(peekPart) : [];
  const peekOeNumbers = peekPart?.oenNumbers || peekPart?.raw?.oenNumbers || [];

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={reloadParts}
            colors={['#C6122E']}
            tintColor="#C6122E"
          />
        }
      >
        {/* Verification Guarantee Banner */}
        <View style={styles.verifiedBanner}>
          <ShieldCheck size={18} color="#059669" />
          <Text style={styles.verifiedBannerText}>
            {fallbackSiblingName
              ? `OEM Series Verified • Shared fitment across ${selectedSeries?.modelname || selectedSeries?.name || 'Platform'} (${fallbackSiblingName})`
              : '100% Genuine NGK Components • OEM Fitment Guaranteed'}
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
            <Text style={styles.emptyTitle}>No Direct Catalog Matches</Text>
            <Text style={styles.emptySub}>
              {vehicle?.description || vehicle?.typeName || vehicle?.modelName
                ? `No standard retail NGK/NTK/KYB parts are directly cataloged for ${vehicle.manuName || ''} ${vehicle.description || vehicle.typeName || vehicle.modelName} in South Africa.`
                : 'No verified components found for this vehicle in the catalog. You can request a manual part lookup or quote from an authorized distributor.'}
            </Text>
            <Text style={[styles.emptySub, { marginTop: 6, fontSize: 12, color: '#6B7280' }]}>
              {appType === 'O' && (vehicle?.manuName || '').toUpperCase().includes('VOLVO')
                ? 'Tip: High-coverage Volvo Commercial models include FH (16 parts), FM (12 parts), FL (15 parts), B9 (13 parts), and B12 (8 parts).'
                : 'Heavy commercial vehicles with specialized 24V industrial engines can be quoted via technical enquiry.'}
            </Text>
            {vehicle && (
              <View style={{ width: '100%', alignItems: 'center', marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.enquireBtn, { paddingHorizontal: 20, width: '100%' }]}
                  onPress={() => {
                    dispatch(setSelectedVehicle(vehicle));
                    navigation.navigate('TechnicalEnquiry', { vehicle });
                  }}
                  activeOpacity={0.8}
                >
                  <MessageSquare size={16} color="#FFFFFF" />
                  <Text style={styles.enquireBtnText}>Request Support / Quote for this Vehicle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    marginTop: 10,
                    width: '100%',
                    paddingVertical: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    alignItems: 'center',
                    backgroundColor: '#F9FAFB',
                  }}
                  onPress={() => navigation.navigate('PartsFinder')}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
                    Select Another Series / Trim
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.partsList}>
            {/* Layout Mode Switcher & Counter */}
            <View style={styles.listToolbar}>
              <View style={styles.toolbarCountBox}>
                <ShieldCheck size={14} color="#059669" />
                <Text style={styles.toolbarCountText}>
                  {parts.length} {parts.length === 1 ? 'Component' : 'Components'} Verified
                </Text>
              </View>
              <View style={styles.layoutToggleGroup}>
                <TouchableOpacity
                  style={[
                    styles.layoutToggleBtn,
                    layoutMode === 'cards' && styles.layoutToggleBtnActive,
                  ]}
                  onPress={() => setLayoutMode('cards')}
                  activeOpacity={0.7}
                >
                  <LayoutGrid
                    size={13}
                    color={layoutMode === 'cards' ? '#C6122E' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.layoutToggleText,
                      layoutMode === 'cards' && styles.layoutToggleTextActive,
                    ]}
                  >
                    Cards
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.layoutToggleBtn,
                    layoutMode === 'compact' && styles.layoutToggleBtnActive,
                  ]}
                  onPress={() => setLayoutMode('compact')}
                  activeOpacity={0.7}
                >
                  <List
                    size={13}
                    color={layoutMode === 'compact' ? '#C6122E' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.layoutToggleText,
                      layoutMode === 'compact' && styles.layoutToggleTextActive,
                    ]}
                  >
                    Compact
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

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
              const isKyb = String(brand).toUpperCase().includes('KYB');
              const fitPos = (item.articleCriteria || item.specs || []).find((c) =>
                (c.criteriaDescription || c.label || c.attrName || '').toLowerCase().includes('fitting position')
              );
              const fitPosVal = fitPos?.formattedValue || fitPos?.value || fitPos?.rawValue;
              const photoUrl = getPartImage(item);
              const briefSpecs = getBriefSpecs(item);

              if (layoutMode === 'cards') {
                return (
                  <View key={item.articleId || idx} style={styles.richCard}>
                    {/* Card Top: Brand Badge, Fitment, Peek Trigger */}
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderBadges}>
                        <View style={[styles.brandBadge, isKyb && styles.kybBadge]}>
                          <Text style={[styles.brandBadgeText, isKyb && styles.kybBadgeText]}>{brand}</Text>
                        </View>
                        {fitPosVal && (
                          <View style={styles.fitPosPill}>
                            <Text style={styles.fitPosPillText} numberOfLines={1}>{fitPosVal}</Text>
                          </View>
                        )}
                        <View style={styles.verifiedMicroPill}>
                          <ShieldCheck size={11} color="#059669" />
                          <Text style={styles.verifiedMicroText}>OEM Fit</Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.peekHeaderBtn}
                        onPress={() => handleOpenPeek(item)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Eye size={13} color="#C6122E" />
                        <Text style={styles.peekHeaderBtnText}>Peek View</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Card Middle: Product Photo & Identity */}
                    <View style={styles.cardMiddleRow}>
                      <TouchableOpacity
                        style={styles.productThumbContainer}
                        onPress={() => handleOpenPeek(item)}
                        activeOpacity={0.8}
                      >
                        {photoUrl ? (
                          <Image
                            source={{ uri: photoUrl }}
                            style={styles.productThumbImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={styles.thumbPlaceholder}>
                            <Zap size={26} color="#C6122E" />
                            <Text style={styles.thumbPlaceholderText}>{brand}</Text>
                          </View>
                        )}
                        <View style={styles.thumbPeekOverlay}>
                          <Eye size={10} color="#FFFFFF" />
                          <Text style={styles.thumbPeekOverlayText}>Peek</Text>
                        </View>
                      </TouchableOpacity>

                      <View style={styles.cardDetailsCol}>
                        <Text style={styles.cardPartNumber} numberOfLines={1}>{partNo}</Text>
                        <Text style={styles.cardPartName} numberOfLines={2}>{partName}</Text>
                        {item.tradeNumbers?.[0] && item.tradeNumbers[0] !== partNo && (
                          <Text style={styles.cardTradeNo}>Stock No: {item.tradeNumbers[0]}</Text>
                        )}
                      </View>
                    </View>

                    {/* Brief Info Specs Chips */}
                    {briefSpecs.length > 0 && (
                      <View style={styles.briefSpecsContainer}>
                        {briefSpecs.map((spec, sIdx) => (
                          <View key={sIdx} style={styles.specChip}>
                            <Text style={styles.specChipLabel} numberOfLines={1}>{spec.label}:</Text>
                            <Text style={styles.specChipValue} numberOfLines={1}>{spec.value}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Action Buttons Row */}
                    <View style={styles.cardActionButtonsRow}>
                      <TouchableOpacity
                        style={styles.cardSpecsBtn}
                        onPress={() => handleOpenSpecs(item)}
                        activeOpacity={0.75}
                      >
                        <Sliders size={13} color="#374151" />
                        <Text style={styles.cardSpecsBtnText}>Full Specs & 360°</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cardEnquireBtn}
                        onPress={() => handleEnquirePart(item)}
                        activeOpacity={0.8}
                      >
                        <MessageSquare size={13} color="#FFFFFF" />
                        <Text style={styles.cardEnquireBtnText}>Request Quote</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }

              // Compact Layout
              return (
                <View key={item.articleId || idx} style={styles.partCard}>
                  <View style={styles.partCardTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                      <View style={[styles.partBadge, isKyb && styles.kybBadge]}>
                        <Text style={[styles.partBadgeText, isKyb && styles.kybBadgeText]}>{brand}</Text>
                      </View>
                      {fitPosVal && (
                        <View style={styles.fitPosPill}>
                          <Text style={styles.fitPosPillText} numberOfLines={1}>
                            {fitPosVal}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TouchableOpacity
                        style={styles.specsBtn}
                        onPress={() => handleOpenPeek(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Eye size={13} color="#C6122E" />
                        <Text style={[styles.specsBtnText, { color: '#C6122E' }]}>Peek</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.specsBtn}
                        onPress={() => handleOpenSpecs(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Info size={14} color="#6B7280" />
                        <Text style={styles.specsBtnText}>Specs</Text>
                      </TouchableOpacity>
                    </View>
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

      {/* Quick Peek Modal */}
      <Modal
        visible={peekModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPeekModalVisible(false)}
      >
        <View style={styles.peekModalOverlay}>
          <TouchableOpacity
            style={styles.peekModalBackdrop}
            activeOpacity={1}
            onPress={() => setPeekModalVisible(false)}
          />
          <View style={styles.peekModalCard}>
            {/* Header */}
            <View style={styles.peekModalHeader}>
              <View style={styles.peekModalTitleWrap}>
                <View style={[styles.brandBadge, isPeekKyb && styles.kybBadge]}>
                  <Text style={[styles.brandBadgeText, isPeekKyb && styles.kybBadgeText]}>
                    {peekBrand}
                  </Text>
                </View>
                <Text style={styles.peekModalPartNo} numberOfLines={1}>
                  {peekPartNo}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.peekModalCloseBtn}
                onPress={() => setPeekModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.peekModalBody}>
              {/* Photo Stage */}
              <View style={styles.peekPhotoStage}>
                {peekPhotoUrl ? (
                  <Image
                    source={{ uri: peekPhotoUrl }}
                    style={styles.peekLargeImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.peekLargePlaceholder}>
                    <Zap size={44} color="#C6122E" />
                    <Text style={styles.peekPlaceholderTitle}>Genuine {peekBrand} Component</Text>
                  </View>
                )}
                <View style={styles.peekFitmentBadge}>
                  <ShieldCheck size={12} color="#059669" />
                  <Text style={styles.peekFitmentText}>OEM Verified Fitment</Text>
                </View>
              </View>

              {/* Product Identity */}
              <Text style={styles.peekCategoryTitle}>{peekPartName}</Text>

              {/* Quick Technical Specs Grid */}
              {peekSpecs.length > 0 && (
                <View style={styles.peekSpecsCard}>
                  <Text style={styles.peekSpecsHeading}>Key Technical Specifications</Text>
                  <View style={styles.peekSpecsGrid}>
                    {peekSpecs.map((spec, pIdx) => (
                      <View key={pIdx} style={styles.peekSpecItem}>
                        <Text style={styles.peekSpecItemLabel} numberOfLines={1}>
                          {spec.label}
                        </Text>
                        <Text style={styles.peekSpecItemVal} numberOfLines={1}>
                          {spec.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* OE Cross References Preview */}
              {peekOeNumbers.length > 0 && (
                <View style={styles.peekOeBox}>
                  <Text style={styles.peekOeHeading}>OE Cross References</Text>
                  <View style={styles.peekOeWrap}>
                    {peekOeNumbers.slice(0, 6).map((oe, oIdx) => (
                      <View key={oIdx} style={styles.peekOeChip}>
                        <Text style={styles.peekOeMfr}>{oe.mfrName || 'OEM'}:</Text>
                        <Text style={styles.peekOeVal}>{oe.articleNumber || oe.oeNumber}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Action Footer */}
            <View style={styles.peekFooter}>
              <TouchableOpacity
                style={styles.peek360Btn}
                onPress={() => {
                  setPeekModalVisible(false);
                  if (peekPart) handleOpenSpecs(peekPart);
                }}
                activeOpacity={0.8}
              >
                <RotateCw size={14} color="#C6122E" />
                <Text style={styles.peek360BtnText}>360° & Specs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.peekEnquireBtn}
                onPress={() => {
                  setPeekModalVisible(false);
                  if (peekPart) handleEnquirePart(peekPart);
                }}
                activeOpacity={0.8}
              >
                <MessageSquare size={14} color="#FFFFFF" />
                <Text style={styles.peekEnquireBtnText}>Request Quote</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full-Screen Technical Specifications & 3D Interactive Model Modal */}
      <Modal
        visible={specsModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
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
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={true} />

          {/* Top Modal Navigation Header - Clean Light Theme */}
          {!isStudioFullscreen && (
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
          )}

          {/* Subheader: Segmented Tab Switcher (Studio vs Specs) */}
          {!isStudioFullscreen && (
            <View style={styles.modalSubHeaderTabRow}>
              <TouchableOpacity
                style={[
                  styles.modalSubHeaderTab,
                  modalMainTab === 'studio' && styles.modalSubHeaderTabActive,
                ]}
                onPress={() => {
                  setModalMainTab('studio');
                  setIsStudioFullscreen(true);
                }}
                activeOpacity={0.8}
              >
                <RotateCw
                  size={13}
                  color={modalMainTab === 'studio' ? '#C6122E' : '#64748B'}
                />
                <Text
                  style={[
                    styles.modalSubHeaderTabText,
                    modalMainTab === 'studio' && styles.modalSubHeaderTabTextActive,
                  ]}
                >
                  3D Interactive Studio
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubHeaderTab,
                  modalMainTab === 'specs' && styles.modalSubHeaderTabActive,
                ]}
                onPress={() => setModalMainTab('specs')}
                activeOpacity={0.8}
              >
                <FileText
                  size={13}
                  color={modalMainTab === 'specs' ? '#C6122E' : '#64748B'}
                />
                <Text
                  style={[
                    styles.modalSubHeaderTabText,
                    modalMainTab === 'specs' && styles.modalSubHeaderTabTextActive,
                  ]}
                >
                  Technical Specifications
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {isStudioFullscreen ? (
            /* True Full-Screen Studio Mode */
            <View style={styles.fullScreenStudioContainer}>
              <View style={styles.fullScreenStudioTopBar}>
                <View style={styles.fullScreenStudioTopLeft}>
                  <TouchableOpacity
                    style={styles.fullScreenExitBtn}
                    onPress={() => setSpecsModalVisible(false)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <X size={18} color="#1E293B" />
                  </TouchableOpacity>

                  <View style={{ marginLeft: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={styles.modalBrandPillLight}>
                        <Text style={styles.modalBrandTextLight}>
                          {selectedPart?.mfrName || selectedPart?.brandName || 'NGK'}
                        </Text>
                      </View>
                      <Text style={styles.fullScreenStudioPartNo}>
                        {selectedPart?.tradeNumbers?.[0] || selectedPart?.articleNumber || 'Component'}
                      </Text>
                    </View>
                    <Text style={styles.modalPartSubLight} numberOfLines={1}>
                      {selectedPart?.genericArticles?.[0]?.genericArticleDescription ||
                        selectedPart?.articleName ||
                        'Genuine OEM Component'}
                    </Text>
                  </View>
                </View>

                <View style={styles.fullScreenStudioTopActions}>
                  {/* Media Toggle: 360 vs Photos if both available */}
                  {gif360 && regularImages.length > 0 && (
                    <View style={styles.mediaToggleBoxLight}>
                      <TouchableOpacity
                        style={[
                          styles.mediaToggleBtnLight,
                          activeMediaTab === '3d' && styles.mediaToggleBtnActiveLight,
                          { paddingHorizontal: 7, paddingVertical: 4 },
                        ]}
                        onPress={() => {
                          setActiveMediaTab('3d');
                          setIsAutoSpinning(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <RotateCw size={11} color={activeMediaTab === '3d' ? '#FFFFFF' : '#4B5563'} />
                        <Text
                          style={[
                            styles.mediaToggleTextLight,
                            activeMediaTab === '3d' && styles.mediaToggleTextActiveLight,
                            { fontSize: 10 },
                          ]}
                        >
                          360°
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.mediaToggleBtnLight,
                          activeMediaTab === 'photo' && styles.mediaToggleBtnActiveLight,
                          { paddingHorizontal: 7, paddingVertical: 4 },
                        ]}
                        onPress={() => {
                          setActiveMediaTab('photo');
                          setIsAutoSpinning(false);
                          setZoomScale(1);
                        }}
                        activeOpacity={0.8}
                      >
                        <Eye size={11} color={activeMediaTab === 'photo' ? '#FFFFFF' : '#4B5563'} />
                        <Text
                          style={[
                            styles.mediaToggleTextLight,
                            activeMediaTab === 'photo' && styles.mediaToggleTextActiveLight,
                            { fontSize: 10 },
                          ]}
                        >
                          Photo
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Button to switch to Technical Specs */}
                  <TouchableOpacity
                    style={styles.fullScreenSpecsBtn}
                    onPress={() => {
                      setIsStudioFullscreen(false);
                      setModalMainTab('specs');
                    }}
                    activeOpacity={0.8}
                  >
                    <Sliders size={12} color="#C6122E" />
                    <Text style={styles.fullScreenSpecsBtnText}>Specs</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fullScreenStudioViewport}>
                <Product360Viewer
                  isStatic={activeMediaTab === 'photo' || !gif360}
                  gifUrl={activeMediaTab === '3d' && gif360 ? gif360.imageURL400 || gif360.imageURL800 || gif360.imageURL200 : null}
                  staticImageUrl={verifiedStaticPhoto}
                  height={undefined}
                  containerStyle={{ flex: 1, borderRadius: 0, backgroundColor: '#F8FAFC' }}
                  angle={activeMediaTab === '3d' ? rotationY : 0}
                  isAutoSpinning={activeMediaTab === '3d' && gif360 && isAutoSpinning}
                  zoomScale={zoomScale}
                  onAngleChange={(deg) => setRotationY(deg)}
                  onAutoSpinChange={(spinning) => setIsAutoSpinning(spinning)}
                  onScaleChange={(scale) => setZoomScale(scale)}
                />
              </View>

              <View style={styles.fullScreenStudioBottomBar}>
                {/* Drag hint */}
                <View style={[styles.dragHintBox, { paddingVertical: 3 }]}>
                  <Text style={[styles.dragHintText, { fontSize: 10 }]}>
                    👆 Swipe to rotate 360° • Pinch or double-tap to zoom • Drag to pan
                  </Text>
                </View>

                {/* Main controls row */}
                <View style={styles.toolActionButtonsRow}>
                  {gif360 && (
                    <TouchableOpacity
                      style={[styles.toolBtn, isAutoSpinning && styles.toolBtnActive]}
                      onPress={() => setIsAutoSpinning((prev) => !prev)}
                      activeOpacity={0.7}
                    >
                      <RotateCw size={13} color={isAutoSpinning ? '#FFFFFF' : '#374151'} />
                      <Text style={[styles.toolBtnText, isAutoSpinning && styles.toolBtnTextActive]}>
                        {isAutoSpinning ? 'Pause' : 'Auto-Spin'}
                      </Text>
                    </TouchableOpacity>
                  )}

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
                    onPress={() => setZoomScale((s) => Math.min(3.5, s + 0.3))}
                    activeOpacity={0.7}
                  >
                    <ZoomIn size={15} color="#374151" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.toolBtnIcon}
                    onPress={() => setZoomScale((s) => Math.max(0.7, s - 0.3))}
                    activeOpacity={0.7}
                  >
                    <ZoomOut size={15} color="#374151" />
                  </TouchableOpacity>

                  {/* Degree indicator badge */}
                  {activeMediaTab === '3d' && gif360 && (
                    <View style={styles.active3DBadgeLight}>
                      <RotateCw size={11} color="#059669" />
                      <Text style={styles.active3DBadgeTextLight}>
                        {isAutoSpinning ? 'SPINNING' : `${((rotationY % 360) + 360) % 360}°`}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Preset Angle Buttons */}
                {gif360 && (
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
                          style={[styles.anglePresetChip, isNear && styles.anglePresetChipActive]}
                          onPress={() => {
                            setIsAutoSpinning(false);
                            setRotationY(p.deg);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.anglePresetChipText, isNear && styles.anglePresetChipTextActive]}>
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Direct Quote Request CTA in Full Screen */}
                <AppButton
                  title="Request Support / Quote from Dealer"
                  onPress={() => {
                    setSpecsModalVisible(false);
                    if (selectedPart) handleEnquirePart(selectedPart);
                  }}
                  backgroundColor="#059669"
                  rightIcon={<MessageSquare size={15} color="#FFFFFF" />}
                  height={44}
                />
              </View>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBodyLight}>
              {modalMainTab === 'studio' ? (
                <>
                  {/* 3D Interactive Showroom Stage */}
                  <View style={styles.showroomStageLight}>
                    {/* Top stage controls: Media toggle, Fullscreen button, Orbit badge */}
                    <View style={styles.showroomControlsLight}>
                      <View style={styles.mediaToggleBoxLight}>
                        {gif360 ? (
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
                        ) : null}

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
                            {regularImages.length > 1 ? `HD Photos (${regularImages.length})` : 'HD Photo'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity
                          style={styles.fullScreenExpandBtn}
                          onPress={() => setIsStudioFullscreen(true)}
                          activeOpacity={0.7}
                        >
                          <Maximize2 size={12} color="#475569" />
                          <Text style={styles.fullScreenExpandBtnText}>Fullscreen</Text>
                        </TouchableOpacity>

                        {activeMediaTab === '3d' && gif360 && (
                          <View style={styles.active3DBadgeLight}>
                            <RotateCw size={11} color="#059669" />
                            <Text style={styles.active3DBadgeTextLight}>
                              {isAutoSpinning ? 'AUTO-SPINNING' : `${((rotationY % 360) + 360) % 360}° ORBIT`}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Touch-to-Rotate 360 Product Stage / HD Static Photo Stage */}
                    <View style={styles.viewportCenterLight}>
                      <Product360Viewer
                        isStatic={activeMediaTab === 'photo' || !gif360}
                        gifUrl={activeMediaTab === '3d' && gif360 ? gif360.imageURL400 || gif360.imageURL800 || gif360.imageURL200 : null}
                        staticImageUrl={verifiedStaticPhoto}
                        height={340}
                        angle={activeMediaTab === '3d' ? rotationY : 0}
                        isAutoSpinning={activeMediaTab === '3d' && gif360 && isAutoSpinning}
                        zoomScale={zoomScale}
                        onAngleChange={(deg) => setRotationY(deg)}
                        onAutoSpinChange={(spinning) => setIsAutoSpinning(spinning)}
                        onScaleChange={(scale) => setZoomScale(scale)}
                      />
                    </View>

                    {/* Interactive 3D Control Strip */}
                    {activeMediaTab === '3d' && gif360 && (
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
                            onPress={() => setZoomScale((s) => Math.min(3.5, s + 0.25))}
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
                            onPress={() => setZoomScale((s) => Math.min(3.5, s + 0.25))}
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
                        {`TecAlliance Pegasus 3.0 • Genuine ${selectedPart?.mfrName || selectedPart?.brandName || 'Automotive'} Component`}
                      </Text>
                    </View>
                  </View>

                  {/* Quick KPI Spec Highlights */}
                  {highlightKpis.length > 0 && (
                    <View style={styles.kpiGrid}>
                      {highlightKpis.map((kpi, kIdx) => (
                        <View key={kIdx} style={styles.kpiCardLight}>
                          <Text style={styles.kpiLabelLight} numberOfLines={1}>{kpi.label}</Text>
                          <Text style={styles.kpiValueLight} numberOfLines={1}>{kpi.value}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Quick Switch Banner to Full Specifications */}
                  <TouchableOpacity
                    style={styles.viewFullSpecsBanner}
                    onPress={() => setModalMainTab('specs')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.viewFullSpecsBannerContent}>
                      <Sliders size={18} color="#C6122E" />
                      <View>
                        <Text style={styles.viewFullSpecsBannerTitle}>Complete Technical Specifications</Text>
                        <Text style={styles.viewFullSpecsBannerSub}>Dimensions, electrical criteria & OEM part references</Text>
                      </View>
                    </View>
                    <Text style={styles.viewFullSpecsBannerAction}>View Specs →</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
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

                  {/* Return to 3D Studio Banner */}
                  <TouchableOpacity
                    style={styles.viewFullSpecsBanner}
                    onPress={() => {
                      setModalMainTab('studio');
                      setIsStudioFullscreen(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.viewFullSpecsBannerContent}>
                      <RotateCw size={18} color="#059669" />
                      <View>
                        <Text style={styles.viewFullSpecsBannerTitle}>Return to 3D Interactive Studio</Text>
                        <Text style={styles.viewFullSpecsBannerSub}>360° rotation, full zoom & HD photography</Text>
                      </View>
                    </View>
                    <Text style={[styles.viewFullSpecsBannerAction, { color: '#059669' }]}>Open Studio ↗</Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={{ height: 95 }} />
            </ScrollView>
          )}

          {/* Sticky Bottom Action Bar (Only in Specs / Standard view) */}
          {!isStudioFullscreen && (
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
          )}
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
  kybBadge: {
    backgroundColor: '#EFF6FF',
  },
  kybBadgeText: {
    color: '#1D4ED8',
  },
  fitPosPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxWidth: 160,
  },
  fitPosPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
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
  listToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  toolbarCountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolbarCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  layoutToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 2,
  },
  layoutToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  layoutToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  layoutToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  layoutToggleTextActive: {
    color: '#C6122E',
    fontWeight: '700',
  },
  // Rich Visual Card Styles
  richCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeaderBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  brandBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C6122E',
    letterSpacing: 0.4,
  },
  verifiedMicroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedMicroText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065F46',
  },
  peekHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  peekHeaderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C6122E',
  },
  cardMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  productThumbContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  productThumbImage: {
    width: 80,
    height: 80,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  thumbPlaceholderText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  thumbPeekOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  thumbPeekOverlayText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardDetailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  cardPartNumber: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
  },
  cardPartName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 2,
  },
  cardTradeNo: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  briefSpecsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specChipLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  specChipValue: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '700',
  },
  cardActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  cardSpecsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardSpecsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  cardEnquireBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#C6122E',
  },
  cardEnquireBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Quick Peek Modal Styles
  peekModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  peekModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  peekModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  peekModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  peekModalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  peekModalPartNo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  peekModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  peekModalBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  peekPhotoStage: {
    height: 190,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 12,
  },
  peekLargeImage: {
    width: '85%',
    height: '85%',
  },
  peekLargePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  peekPlaceholderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  peekFitmentBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  peekFitmentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  peekCategoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  peekSpecsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  peekSpecsHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  peekSpecsGrid: {
    gap: 6,
  },
  peekSpecItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  peekSpecItemLabel: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  peekSpecItemVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  peekOeBox: {
    marginBottom: 16,
  },
  peekOeHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  peekOeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  peekOeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  peekOeMfr: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
  },
  peekOeVal: {
    fontSize: 10,
    fontWeight: '600',
    color: '#111827',
  },
  peekFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  peek360Btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  peek360BtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C6122E',
  },
  peekEnquireBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#C6122E',
  },
  peekEnquireBtnText: {
    fontSize: 13,
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
  modalSubHeaderTabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  modalSubHeaderTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 8,
  },
  modalSubHeaderTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  modalSubHeaderTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSubHeaderTabTextActive: {
    fontWeight: '800',
    color: '#0F172A',
  },
  fullScreenExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fullScreenExpandBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  fullScreenStudioContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  fullScreenStudioTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  fullScreenStudioTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fullScreenStudioPartNo: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  fullScreenStudioTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fullScreenExitBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fullScreenStudioViewport: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  fullScreenStudioBottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  viewFullSpecsBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  viewFullSpecsBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  viewFullSpecsBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewFullSpecsBannerSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  viewFullSpecsBannerAction: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C6122E',
    marginLeft: 8,
  },
  fullScreenSpecsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  fullScreenSpecsBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C6122E',
  },
});

export default VerifiedPartsScreen;
