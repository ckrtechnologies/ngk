import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Menu,
  Bell,
  Search,
  Car,
  MessageSquare,
  MapPin,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Plus,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { getArticlesRedux, getMyselfRedux, getVehiclesRedux } from '../redux/getData';

const OwnerHomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { myself, vehicles } = useSelector((state) => state.getData);

  useEffect(() => {
    const fetchInitialData = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        dispatch(getMyselfRedux(userId));
      }
    };
    fetchInitialData();
  }, [dispatch]);

  const quickActions = [
    {
      id: 'parts',
      title: 'Find Parts',
      subtitle: 'Spark plugs, sensors & cables',
      icon: <Search size={22} color="#C6122E" />,
      bg: '#FEE2E2',
      route: 'PartsFinder',
    },
    {
      id: 'garage',
      title: 'My Garage',
      subtitle: 'Saved cars & exact compatibility',
      icon: <Car size={22} color="#2563EB" />,
      bg: '#DBEAFE',
      route: 'MyGarage',
    },
    {
      id: 'enquiry',
      title: 'Tech Enquiry',
      subtitle: 'Photo upload & expert advice',
      icon: <MessageSquare size={22} color="#059669" />,
      bg: '#D1FAE5',
      route: 'TechnicalEnquiry',
    },
    {
      id: 'dealers',
      title: 'Dealer Locator',
      subtitle: 'Find authorized stockists nearby',
      icon: <MapPin size={22} color="#D97706" />,
      bg: '#FEF3C7',
      route: 'DealerLocator',
    },
  ];

  const activeCar = myself?.garage?.[0] || null;

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

      {/* 52px Native App Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('CustomDrawer')}
          activeOpacity={0.7}
        >
          <Menu size={22} color="#111827" />
        </TouchableOpacity>

        <Image
          source={require('../assets/images/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <Bell size={20} color="#111827" />
          <View style={styles.badgeDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingSub}>WELCOME BACK</Text>
          <Text style={styles.greetingName}>
            {myself?.name ? myself.name : 'Vehicle Owner'}
          </Text>
        </View>

        {/* Active Garage Vehicle Banner */}
        <View style={styles.garageCard}>
          <View style={styles.garageCardHeader}>
            <View style={styles.garageBadge}>
              <Car size={14} color="#C6122E" />
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
                <Search size={14} color="#FFFFFF" />
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
                <Plus size={18} color="#C6122E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyGarageTitle}>Add your vehicle to garage</Text>
                <Text style={styles.emptyGarageSub}>
                  Get 100% verified spark plugs & sensor matches
                </Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* 2x2 Tactile Quick Action Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Tools</Text>
        </View>

        <View style={styles.gridContainer}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.gridTile}
              onPress={() => navigation.navigate(action.route)}
              activeOpacity={0.75}
            >
              <View style={[styles.tileIconCircle, { backgroundColor: action.bg }]}>
                {action.icon}
              </View>
              <Text style={styles.tileTitle}>{action.title}</Text>
              <Text style={styles.tileSubtitle} numberOfLines={2}>
                {action.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Technical Highlights / Tip Banner */}
        <View style={styles.tipBanner}>
          <ShieldCheck size={20} color="#C6122E" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.tipTitle}>Genuine NGK Guarantee</Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    height: 52,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#C6122E',
  },
  headerLogo: {
    width: 100,
    height: 32,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greetingSection: {
    marginBottom: 14,
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
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
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
  tileIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
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
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#C6122E',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  tipText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default OwnerHomeScreen;
