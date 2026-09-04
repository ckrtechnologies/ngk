import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Mail,
  MapPin,
  ShieldCheck,
  Briefcase,
  ChevronRight,
  LogOut,
  Car,
  MessageSquare,
  Wrench,
  CheckCircle2,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { getMyselfRedux, getEnquiryRedux } from '../redux/getData';
import Toast from 'react-native-toast-message';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { myself, enquiry } = useSelector((state) => state.getData);
  const [role, setRole] = useState('owner');

  useEffect(() => {
    const loadProfile = async () => {
      const storedRole = await AsyncStorage.getItem('role');
      const userId = await AsyncStorage.getItem('userId');
      if (storedRole) setRole(storedRole);
      if (userId) {
        dispatch(getMyselfRedux(userId));
        dispatch(getEnquiryRedux(userId));
      }
    };
    loadProfile();
  }, [dispatch]);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'userId', 'role', 'user']);
    Toast.show({ type: 'success', text1: 'Signed Out Successfully' });
    navigation.reset({
      index: 0,
      routes: [{ name: 'RoleSelection' }],
    });
  };

  const userName = myself?.name || 'Chandan Mallik';
  const userEmail = myself?.email || 'chandan@example.com';
  const userAddress = myself?.address || 'Johannesburg, South Africa';
  const carsCount = myself?.cars?.length || 0;
  const enquiriesCount = enquiry?.length || 0;

  // Generate 2-letter initials monogram without image CDN
  const getInitials = (name) => {
    if (!name) return 'NG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#C6122E" />

      {/* Solid Crimson Header */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Account Profile</Text>
          <Text style={styles.headerSubtitle}>NGK TECHNICAL NETWORK</Text>
        </View>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Executive Profile Card (No CDN Image) */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardTop}>
            {/* Monogram Badge */}
            <View style={styles.monogramBadge}>
              <Text style={styles.monogramText}>{getInitials(userName)}</Text>
            </View>

            <View style={styles.profileInfoCol}>
              <Text style={styles.profileName} numberOfLines={1}>
                {userName}
              </Text>
              <View style={styles.roleRow}>
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{role.toUpperCase()}</Text>
                </View>
                <View style={styles.verifiedRow}>
                  <CheckCircle2 size={13} color="#10B981" />
                  <Text style={styles.verifiedLabel}>Verified Account</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Member ID Bar */}
          <View style={styles.memberIdBar}>
            <Text style={styles.memberIdLabel}>CLIENT ID</Text>
            <Text style={styles.memberIdValue}>
              NGK-ZA-2026-0{myself?.id || '842'}
            </Text>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('MyGarage')}
            activeOpacity={0.75}
          >
            <View style={styles.statIconBadgeBlue}>
              <Car size={18} color="#2563EB" />
            </View>
            <Text style={styles.statNumber}>{carsCount}</Text>
            <Text style={styles.statLabel}>Garage Fleet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('MyEnquiries')}
            activeOpacity={0.75}
          >
            <View style={styles.statIconBadgeGreen}>
              <MessageSquare size={18} color="#059669" />
            </View>
            <Text style={styles.statNumber}>{enquiriesCount}</Text>
            <Text style={styles.statLabel}>Tech Enquiries</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <View style={styles.statIconBadgeRed}>
              <ShieldCheck size={18} color="#C6122E" />
            </View>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>OEM Verified</Text>
          </View>
        </View>

        {/* Account Details Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>ACCOUNT CREDENTIALS</Text>

          {/* Email Item */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconWrapper}>
              <Mail size={16} color="#4B5563" />
            </View>
            <View style={styles.detailTextWrapper}>
              <Text style={styles.detailLabel}>Email Address</Text>
              <Text style={styles.detailValue}>{userEmail}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Address Item */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconWrapper}>
              <MapPin size={16} color="#4B5563" />
            </View>
            <View style={styles.detailTextWrapper}>
              <Text style={styles.detailLabel}>Location / Workshop</Text>
              <Text style={styles.detailValue}>{userAddress}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Role Item */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconWrapper}>
              <Briefcase size={16} color="#4B5563" />
            </View>
            <View style={styles.detailTextWrapper}>
              <Text style={styles.detailLabel}>Platform Role</Text>
              <Text style={styles.detailValue}>
                {role === 'reseller'
                  ? 'Authorized Reseller'
                  : role === 'distributor'
                  ? 'Official Wholesale Distributor'
                  : 'Vehicle Owner & Fleet Operator'}
              </Text>
            </View>
          </View>
        </View>

        {/* Technical Direct Access */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>CONNECTED SERVICES</Text>

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation.navigate('MyGarage')}
            activeOpacity={0.7}
          >
            <View style={styles.navIconBadgeBlue}>
              <Car size={16} color="#2563EB" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Manage Garage Fleet</Text>
              <Text style={styles.navSubtitle}>
                Add or remove vehicles for exact fitment lookup
              </Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation.navigate('MyEnquiries')}
            activeOpacity={0.7}
          >
            <View style={styles.navIconBadgeGreen}>
              <MessageSquare size={16} color="#059669" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Technical Enquiries & Support</Text>
              <Text style={styles.navSubtitle}>
                Review expert engineering advice & quote requests
              </Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation.navigate('PartsFinder')}
            activeOpacity={0.7}
          >
            <View style={styles.navIconBadgeRed}>
              <Wrench size={16} color="#C6122E" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>TecDoc Parts & Catalog</Text>
              <Text style={styles.navSubtitle}>
                Instant part verification across 50,000+ OEM items
              </Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Action Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Sign Out of NGK Technical</Text>
        </TouchableOpacity>

        <Text style={styles.footerBranding}>
          NGK SPARK PLUGS (PTY) LTD • TEC-DOC CERTIFIED 2026
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    backgroundColor: '#C6122E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  profileCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  monogramBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#C6122E',
    borderWidth: 2,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monogramText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileInfoCol: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  rolePill: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C6122E',
    letterSpacing: 0.5,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  memberIdBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  memberIdLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  memberIdValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    fontVariant: ['tabular-nums'],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIconBadgeBlue: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconBadgeGreen: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconBadgeRed: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  detailIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTextWrapper: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  detailValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  navIconBadgeBlue: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIconBadgeGreen: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIconBadgeRed: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTextCol: {
    flex: 1,
  },
  navTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  navSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    height: 48,
    borderRadius: 14,
    marginTop: 4,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.1,
  },
  footerBranding: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
});
