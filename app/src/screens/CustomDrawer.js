import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { getMyselfRedux } from '../redux/getData';
import {
  HomeDashboard3DIcon,
  FindParts3DIcon,
  MyGarage3DIcon,
  TechEnquiry3DIcon,
  DealerLocator3DIcon,
  Profile3DIcon,
  DrawerSignOut3DIcon,
} from '../components/icons/HomeIcons';

import { useAuth } from '../core/auth/useAuth';

export default function CustomDrawer({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { signOut, userRole } = useAuth();
  const { myself } = useSelector((state) => state.getData);
  const [role, setRole] = useState(userRole || 'owner');

  useEffect(() => {
    const fetchUser = async () => {
      const storedRole = await AsyncStorage.getItem('role');
      const userId = await AsyncStorage.getItem('userId');
      if (storedRole) setRole(storedRole);
      if (userId && !myself) dispatch(getMyselfRedux(userId));
    };
    fetchUser();
  }, [dispatch, myself]);

  const handleLogout = async () => {
    await signOut();
  };

  const menuItems = [
    {
      id: 'home',
      label: 'Home Dashboard',
      subtitle: 'Main portal & live status',
      Icon: HomeDashboard3DIcon,
      bgColor: '#FFF1F2',
      borderColor: '#FFE4E6',
      action: () => {
        const homeRoute =
          role === 'reseller'
            ? 'ResellerHome'
            : role === 'distributor'
            ? 'DistributorHomeScreen'
            : 'OwnerHome';
        navigation.navigate(homeRoute);
      },
    },
    {
      id: 'profile',
      label: 'My Profile',
      subtitle: 'Account info & credentials',
      Icon: Profile3DIcon,
      bgColor: '#EEF2FF',
      borderColor: '#C7D2FE',
      action: () => navigation.navigate('Profile'),
    },
    {
      id: 'parts',
      label: 'Parts & Catalog Lookup',
      subtitle: 'TecDoc verified database',
      Icon: FindParts3DIcon,
      bgColor: '#FEF2F2',
      borderColor: '#FECACA',
      action: () => navigation.navigate('PartsFinder'),
    },
    {
      id: 'garage',
      label: 'My Garage Vehicles',
      subtitle: 'Saved fleet & compatibility',
      Icon: MyGarage3DIcon,
      bgColor: '#EFF6FF',
      borderColor: '#DBEAFE',
      action: () => navigation.navigate('MyGarage'),
    },
    {
      id: 'enquiries',
      label: 'Technical Enquiries',
      subtitle: 'Direct engineering support',
      Icon: TechEnquiry3DIcon,
      bgColor: '#ECFDF5',
      borderColor: '#A7F3D0',
      action: () => navigation.navigate('MyEnquiries'),
    },
    {
      id: 'dealers',
      label: 'Authorized Stockists',
      subtitle: 'Official certified network',
      Icon: DealerLocator3DIcon,
      bgColor: '#FFFBEB',
      borderColor: '#FDE68A',
      action: () => navigation.navigate('DealerLocator'),
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Drawer Header (No Avatar Image CDN required) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileRow}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <View style={styles.profileTextCol}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {myself?.name || 'Account User'}
              </Text>
              <ChevronRight size={16} color="#9CA3AF" />
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {role.toUpperCase()}
                </Text>
              </View>
              <View style={styles.verifiedDot} />
              <Text style={styles.verifiedText}>View Profile</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Menu List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuList}
      >
        <Text style={styles.menuSectionHeader}>NAVIGATION</Text>

        {menuItems.map((item) => {
          const IconComp = item.Icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIconWrapper,
                  {
                    backgroundColor: item.bgColor,
                    borderColor: item.borderColor,
                  },
                ]}
              >
                <IconComp size={24} />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemText}>{item.label}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
              <View style={styles.chevronWrapper}>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Drawer Footer & Logout */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.75}
        >
          <DrawerSignOut3DIcon size={18} />
          <Text style={styles.logoutText}>Sign Out Account</Text>
        </TouchableOpacity>

        <View style={styles.brandFooterRow}>
          <Text style={styles.copyrightText}>
            NGK SPARK PLUGS (PTY) LTD
          </Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionBadgeText}>v2.0 PRO</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  profileTextCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 6,
  },
  roleBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#C6122E',
    letterSpacing: 0.5,
  },
  verifiedDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#9CA3AF',
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuList: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 8,
  },
  menuSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemTextCol: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.1,
  },
  menuItemSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 1.5,
  },
  chevronWrapper: {
    paddingLeft: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    height: 46,
    borderRadius: 12,
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.1,
  },
  brandFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  copyrightText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  versionBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  versionBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#6B7280',
  },
});