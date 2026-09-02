import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Menu,
  Bell,
  Search,
  MessageSquare,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEnquiryRedux, getMyselfRedux } from '../../redux/getData';

const ResellerHomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { enquiry, myself } = useSelector((state) => state.getData);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        dispatch(getMyselfRedux(userId));
        dispatch(getEnquiryRedux(userId));
      }
    };
    fetchDashboardData();
  }, [dispatch]);

  const pendingCount =
    enquiry?.filter((e) => (e.status || 'Pending').toLowerCase() === 'pending')
      ?.length || 0;
  const inProgressCount =
    enquiry?.filter(
      (e) => (e.status || '').toLowerCase() === 'in progress'
    )?.length || 0;

  const quickActions = [
    {
      id: 'lookup',
      title: 'Parts Lookup',
      subtitle: 'Fast OE & cross-reference',
      icon: <Search size={22} color="#C6122E" />,
      bg: '#FEE2E2',
      route: 'PartsFinder',
    },
    {
      id: 'enquiries',
      title: 'Active Tickets',
      subtitle: `${pendingCount} pending customer requests`,
      icon: <MessageSquare size={22} color="#2563EB" />,
      bg: '#DBEAFE',
      route: 'MyEnquiries',
    },
    {
      id: 'orders',
      title: 'Trade Supply',
      subtitle: 'Distributor order requests',
      icon: <Package size={22} color="#059669" />,
      bg: '#D1FAE5',
      route: 'PartsFinder',
    },
    {
      id: 'dealers',
      title: 'Stockists',
      subtitle: 'Regional supplier network',
      icon: <MapPin size={22} color="#D97706" />,
      bg: '#FEF3C7',
      route: 'DealerLocator',
    },
  ];

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
          source={require('../../assets/images/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <Bell size={20} color="#111827" />
          {pendingCount > 0 && <View style={styles.badgeDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Workshop Header */}
        <View style={styles.greetingSection}>
          <View style={styles.resellerBadge}>
            <Text style={styles.resellerBadgeText}>RESELLER & WORKSHOP</Text>
          </View>
          <Text style={styles.greetingName}>
            {myself?.name ? myself.name : 'Workshop Partner'}
          </Text>
        </View>

        {/* KPI Metric Chips */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconWrapper}>
              <Clock size={16} color="#D97706" />
            </View>
            <Text style={styles.kpiValue}>{pendingCount}</Text>
            <Text style={styles.kpiLabel}>Pending Tickets</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#DBEAFE' }]}>
              <TrendingUp size={16} color="#2563EB" />
            </View>
            <Text style={styles.kpiValue}>{inProgressCount}</Text>
            <Text style={styles.kpiLabel}>In Progress</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#D1FAE5' }]}>
              <CheckCircle2 size={16} color="#059669" />
            </View>
            <Text style={styles.kpiValue}>
              {enquiry?.length || 0}
            </Text>
            <Text style={styles.kpiLabel}>Total Queries</Text>
          </View>
        </View>

        {/* 2x2 Quick Action Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Workshop Tools</Text>
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
  resellerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  resellerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
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
});

export default ResellerHomeScreen;