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
import {
  Home,
  Search,
  Car,
  MessageSquare,
  MapPin,
  LogOut,
  X,
  User,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { getMyselfRedux } from '../redux/getData';
import Toast from 'react-native-toast-message';

export default function CustomDrawer({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { myself } = useSelector((state) => state.getData);
  const [role, setRole] = useState('owner');

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
    await AsyncStorage.multiRemove(['token', 'userId', 'role', 'user']);
    Toast.show({ type: 'success', text1: 'Signed Out' });
    navigation.reset({
      index: 0,
      routes: [{ name: 'RoleSelection' }],
    });
  };

  const menuItems = [
    {
      id: 'home',
      label: 'Home Dashboard',
      icon: Home,
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
      id: 'parts',
      label: 'Parts & Catalog Lookup',
      icon: Search,
      action: () => navigation.navigate('PartsFinder'),
    },
    {
      id: 'garage',
      label: 'My Garage Vehicles',
      icon: Car,
      action: () => navigation.navigate('MyGarage'),
    },
    {
      id: 'enquiries',
      label: 'Technical Enquiries',
      icon: MessageSquare,
      action: () => navigation.navigate('MyEnquiries'),
    },
    {
      id: 'dealers',
      label: 'Authorized Stockists',
      icon: MapPin,
      action: () => navigation.navigate('DealerLocatorScreen'),
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

      {/* Drawer Header */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <View style={styles.avatarCircle}>
            <User size={22} color="#C6122E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {myself?.name || 'Technical User'}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {role.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

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
          const IconComp = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrapper}>
                <IconComp size={18} color="#C6122E" />
              </View>
              <Text style={styles.menuItemText}>{item.label}</Text>
              <ChevronRight size={16} color="#9CA3AF" />
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
          <LogOut size={16} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out Account</Text>
        </TouchableOpacity>

        <Text style={styles.copyrightText}>
          NGK SPARK PLUGS (PTY) LTD • v2.0
        </Text>
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
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C6122E',
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
    gap: 6,
  },
  menuSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  menuIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    height: 44,
    borderRadius: 10,
    marginBottom: 10,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  copyrightText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});