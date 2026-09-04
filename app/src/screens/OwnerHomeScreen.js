import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Menu,
  Bell,
  Search,
  Car,
  ChevronRight,
  Plus,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { getMyselfRedux } from '../redux/getData';
import LiveFeatureTicker from '../components/common/LiveFeatureTicker';
import {
  FindParts3DIcon,
  MyGarage3DIcon,
  TechEnquiry3DIcon,
  DealerLocator3DIcon,
  GenuineGuarantee3DIcon,
  TickerLiveRadarIcon,
  TickerCatalogIcon,
  Ticker360Icon,
  TickerDealerIcon,
  TickerQuoteIcon,
} from '../components/icons/HomeIcons';

// Static Live Feature Ticker items (auto-cycles every 3.6s with spring-back animation)
const TICKER_ITEMS = [
  {
    id: 'oem_fit',
    IconComponent: TickerLiveRadarIcon,
    themeColor: '#C6122E',
    badgeBg: '#FEE2E2',
    countHighlight: '100% Genuine',
    text: 'OEM spark plugs & coils',
    highlight: 'Live Fit',
    route: 'PartsFinder',
  },
  {
    id: 'tecdoc_catalog',
    IconComponent: TickerCatalogIcon,
    themeColor: '#2563EB',
    badgeBg: '#DBEAFE',
    countHighlight: '50,000+ Parts',
    text: 'TecDoc Pegasus catalog',
    highlight: 'Catalog',
    route: 'PartsFinder',
  },
  {
    id: '360_showroom',
    IconComponent: Ticker360Icon,
    themeColor: '#7C3AED',
    badgeBg: '#EDE9FE',
    countHighlight: '360° Showroom',
    text: 'Inspect pins & gap in 3D',
    highlight: '3D View',
    route: 'PartsFinder',
  },
  {
    id: 'dealers_nearby',
    IconComponent: TickerDealerIcon,
    themeColor: '#D97706',
    badgeBg: '#FEF3C7',
    countHighlight: 'Stockists Nearby',
    text: 'Verified NGK dealers',
    highlight: 'Dealers',
    route: 'DealerLocator',
  },
  {
    id: 'tech_quote',
    IconComponent: TickerQuoteIcon,
    themeColor: '#059669',
    badgeBg: '#D1FAE5',
    countHighlight: 'Direct Support',
    text: 'Instant technical quotes',
    highlight: 'Quotes',
    route: 'MyEnquiries',
  },
];

const OwnerHomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { myself } = useSelector((state) => state.getData);

  const [refreshing, setRefreshing] = useState(false);

  const fetchInitialData = useCallback(async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      dispatch(getMyselfRedux(userId));
    }
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const activeCar = myself?.garage?.[0] || null;

  // Upgraded Quick Tools with bespoke multi-layered 3D SVG icons
  const quickActions = [
    {
      id: 'parts',
      title: 'Find Parts',
      subtitle: 'Spark plugs, sensors & ignition coils',
      IconComponent: FindParts3DIcon,
      bg: '#FEF2F2',
      accentColor: '#C6122E',
      tag: '50k+ Parts',
      route: 'PartsFinder',
    },
    {
      id: 'garage',
      title: 'My Garage',
      subtitle: 'Saved cars & exact fitment guarantee',
      IconComponent: MyGarage3DIcon,
      bg: '#EFF6FF',
      accentColor: '#2563EB',
      tag: activeCar ? 'Active' : 'Add Car',
      route: 'MyGarage',
    },
    {
      id: 'enquiry',
      title: 'Tech Enquiry',
      subtitle: 'Track tickets & expert advice',
      IconComponent: TechEnquiry3DIcon,
      bg: '#ECFDF5',
      accentColor: '#059669',
      tag: 'Tickets',
      route: 'MyEnquiries',
    },
    {
      id: 'dealers',
      title: 'Dealer Locator',
      subtitle: 'Find authorized stockists nearby',
      IconComponent: DealerLocator3DIcon,
      bg: '#FFFBEB',
      accentColor: '#D97706',
      tag: 'Stockists',
      route: 'DealerLocator',
    },
  ];

  return (
    <View style={[styles.rootContainer, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#C6122E" />

      {/* Solid Branded NGK Crimson Header */}
      <View style={[styles.solidHeader, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('CustomDrawer')}
          activeOpacity={0.75}
        >
          <Menu size={22} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>

        {/* Elevated Crisp White Capsule for Iconic NGK Logo */}
        <View style={styles.logoBadgeContainer}>
          <Image
            source={require('../assets/images/ngk_emblem_clean.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerBrandText}>SPARK PLUGS</Text>
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.75}
        >
          <Bell size={20} color="#FFFFFF" strokeWidth={2.4} />
          <View style={styles.badgeDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#C6122E']}
            tintColor="#C6122E"
          />
        }
      >
        {/* Animated Live Feature Ticker (Fameu Style) */}
        <LiveFeatureTicker
          items={TICKER_ITEMS}
          onItemPress={(item) => {
            if (item.route) navigation.navigate(item.route);
          }}
        />

        {/* Welcome Greeting Section */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingSub}>WELCOME BACK</Text>
              <Text style={styles.greetingName}>
                {myself?.name ? myself.name : 'Vehicle Owner'}
              </Text>
            </View>
            <View style={styles.verifiedDriverPill}>
              <Text style={styles.verifiedDriverText}>Verified Driver</Text>
            </View>
          </View>
        </View>

        {/* Active Garage Vehicle Banner */}
        <View style={styles.garageCard}>
          <View style={styles.garageCardHeader}>
            <View style={styles.garageBadge}>
              <Car size={14} color="#C6122E" strokeWidth={2.2} />
              <Text style={styles.garageBadgeText}>ACTIVE VEHICLE</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('MyGarage')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.manageGarageLink}>
                {activeCar ? 'Switch' : 'Add Car'}
              </Text>
            </TouchableOpacity>
          </View>

          {activeCar ? (
            <View style={styles.activeCarBody}>
              <Text style={styles.carTitle}>
                {activeCar.make} {activeCar.model} ({activeCar.year})
              </Text>
              <Text style={styles.carEngine}>
                {activeCar.engine || 'Standard Trim'} • {activeCar.fuel_type || 'Petrol'}
              </Text>
              <TouchableOpacity
                style={styles.searchForCarBtn}
                onPress={() =>
                  navigation.navigate('PartsFinder', { preselectedVehicle: activeCar })
                }
                activeOpacity={0.8}
              >
                <Search size={14} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.searchForCarText}>View Compatible Parts</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.emptyGaragePrompt}
              onPress={() => navigation.navigate('MyGarage')}
              activeOpacity={0.7}
            >
              <View style={styles.addCarCircle}>
                <Plus size={18} color="#C6122E" strokeWidth={2.4} />
              </View>
              <View style={styles.emptyGarageTextContainer}>
                <Text style={styles.emptyGarageTitle}>Add your vehicle to garage</Text>
                <Text style={styles.emptyGarageSub}>
                  Get 100% verified spark plugs & sensor matches
                </Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" strokeWidth={2.2} />
            </TouchableOpacity>
          )}
        </View>

        {/* 2x2 Tactile Quick Action Grid with 3D Bespoke Icons */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Tools</Text>
          <Text style={styles.sectionSubtitle}>OEM Verified Services</Text>
        </View>

        <View style={styles.gridContainer}>
          {quickActions.map((action) => {
            const IconCmp = action.IconComponent;
            return (
              <TouchableOpacity
                key={action.id}
                style={styles.gridTile}
                onPress={() => navigation.navigate(action.route)}
                activeOpacity={0.75}
              >
                <View style={styles.tileTopRow}>
                  <View
                    style={[
                      styles.tileIconCircle,
                      { backgroundColor: action.bg },
                    ]}
                  >
                    <IconCmp size={34} />
                  </View>
                  <View
                    style={[
                      styles.actionTag,
                      { backgroundColor: action.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionTagText,
                        { color: action.accentColor },
                      ]}
                    >
                      {action.tag}
                    </Text>
                  </View>
                </View>

                <Text style={styles.tileTitle}>{action.title}</Text>
                <Text style={styles.tileSubtitle} numberOfLines={2}>
                  {action.subtitle}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Genuine NGK Guarantee Banner with 3D Seal */}
        <View style={styles.tipBanner}>
          <GenuineGuarantee3DIcon size={30} />
          <View style={styles.tipContent}>
            <View style={styles.tipHeaderRow}>
              <Text style={styles.tipTitle}>Genuine NGK Guarantee</Text>
              <View style={styles.tipBadge}>
                <Text style={styles.tipBadgeText}>100% OEM</Text>
              </View>
            </View>
            <Text style={styles.tipText}>
              Always verify part numbers and electrode gap before installation.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  solidHeader: {
    backgroundColor: '#C6122E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#A50E26',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoBadgeContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 4,
  },
  headerLogo: {
    width: 24,
    height: 24,
    borderRadius: 5,
  },
  headerBrandText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#C6122E',
    letterSpacing: 0.6,
    marginLeft: 6,
  },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7.5,
    height: 7.5,
    borderRadius: 4,
    backgroundColor: '#FBBF24',
    borderWidth: 1.5,
    borderColor: '#C6122E',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },
  greetingSection: {
    marginBottom: 14,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  greetingSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  verifiedDriverPill: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  verifiedDriverText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C6122E',
  },
  garageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  garageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  garageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  garageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C6122E',
    letterSpacing: 0.4,
  },
  manageGarageLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C6122E',
  },
  activeCarBody: {
    marginTop: 4,
  },
  carTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  carEngine: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 12,
  },
  searchForCarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#111827',
    height: 38,
    borderRadius: 10,
  },
  searchForCarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyGaragePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  addCarCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emptyGarageTextContainer: {
    flex: 1,
  },
  emptyGarageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  emptyGarageSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  gridTile: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tileIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  actionTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  tileSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#C6122E',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  tipBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  tipBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#C6122E',
  },
  tipText: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
});

export default OwnerHomeScreen;
