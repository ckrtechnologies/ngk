import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { User, ShoppingBag, Truck, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenContainer from '../components/common/ScreenContainer';

const RoleSelectionScreen = ({ navigation }) => {
  useEffect(() => {
    const checkAlreadyLogin = async () => {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      const role = await AsyncStorage.getItem('role');
      if ((token || userId) && role) {
        const lowerRole = role.toLowerCase();
        navigation.replace(
          lowerRole === 'owner'
            ? 'OwnerHome'
            : lowerRole === 'reseller'
            ? 'ResellerHome'
            : 'DistributorHomeScreen'
        );
      }
    };
    checkAlreadyLogin();
  }, [navigation]);

  const roles = [
    {
      id: 'owner',
      title: 'Vehicle Owner',
      description: 'Search parts & track garage maintenance',
      icon: <User size={22} color="#C6122E" />,
      badge: 'Individual',
      badgeBg: '#FEE2E2',
      badgeColor: '#C6122E',
    },
    {
      id: 'reseller',
      title: 'Professional Reseller',
      description: 'Workshop supply, trade catalogue & quotes',
      icon: <ShoppingBag size={22} color="#C6122E" />,
      badge: 'Trade & Workshop',
      badgeBg: '#FEF3C7',
      badgeColor: '#D97706',
    },
    {
      id: 'distributor',
      title: 'Authorized Distributor',
      description: 'Bulk logistics & tier-1 parts provisioning',
      icon: <Truck size={22} color="#111827" />,
      badge: 'Enterprise',
      badgeBg: '#F3F4F6',
      badgeColor: '#374151',
    },
  ];

  const handleRoleSelect = (roleId) => {
    navigation.navigate('Login', { role: roleId });
  };

  return (
    <ScreenContainer
      scrollable={false}
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>NGK SPARK PLUG CO., LTD.</Text>
          <Text style={styles.footerVersion}>Technical Services Mobile • v2.0</Text>
        </View>
      }
    >
      <View style={styles.content}>
        {/* Top Branding */}
        <View style={styles.topSection}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headline}>Select Your Profile</Text>
          <Text style={styles.subheadline}>
            Choose your account type to tailor your technical catalogue and service tools.
          </Text>
        </View>

        {/* 3 Compact Native Role Tiles */}
        <View style={styles.rolesList}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={styles.roleCard}
              activeOpacity={0.7}
              onPress={() => handleRoleSelect(role.id)}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: role.id === 'distributor' ? '#F3F4F6' : '#FEF2F2' },
                ]}
              >
                {role.icon}
              </View>

              <View style={styles.infoBox}>
                <View style={styles.titleRow}>
                  <Text style={styles.roleTitle}>{role.title}</Text>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: role.badgeBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleBadgeText,
                        { color: role.badgeColor },
                      ]}
                    >
                      {role.badge}
                    </Text>
                  </View>
                </View>
                <Text style={styles.roleDescription} numberOfLines={1}>
                  {role.description}
                </Text>
              </View>

              <ChevronRight size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 8,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 140,
    height: 48,
    marginBottom: 16,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  subheadline: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  rolesList: {
    width: '100%',
    gap: 12,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoBox: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  roleDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  footerBrand: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
  },
  footerVersion: {
    fontSize: 10,
    color: '#D1D5DB',
    marginTop: 2,
  },
});

export default RoleSelectionScreen;
