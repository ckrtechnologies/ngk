import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { User, ShoppingCart, Truck, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RoleSelectionScreen = ({ navigation }) => {

   useEffect(() => {
    const checkAlreadyLogin = async () => {
      const apiKey = await AsyncStorage.getItem("apiKey")
      const role = await AsyncStorage.getItem("role")
      if (apiKey && role) {
        navigation.replace(role === "owner" ? "OwnerHome" : role === "reseller" ? "ResellerHome" : "DistributorHomeScreen");
      }
    }
    checkAlreadyLogin()
  }, [])
  const roles = [
    {
      id: 'owner',
      title: 'Vehicle Owner',
      description: 'Find parts for your personal vehicle',
      icon: <User size={wp('6%')} color="#C6122E" />,
    },
    {
      id: 'reseller',
      title: 'Professional Reseller',
      description: 'Inventory lookup & workshop supply',
      icon: <ShoppingCart size={wp('6%')} color="#C6122E" />,
    },
    {
      id: 'distributor',
      title: 'Authorized Distributor',
      description: 'Bulk ordering & logistics management',
      icon: <Truck size={wp('6%')} color="#C6122E" />,
    },
  ];

  const handleRoleSelect = (roleId) => {
    // Navigate to Login screen with the selected role
    navigation.navigate('Login', { role: roleId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Path</Text>
          <Text style={styles.subtitle}>Select a profile to tailor your experience</Text>
        </View>

        <View style={styles.cardsContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => handleRoleSelect(role.id)}
            >
              <View style={styles.iconWrapper}>
                {role.icon}
              </View>
              <View style={styles.textWrapper}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </View>
              <ChevronRight size={wp('5%')} color="#D1D1D1" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>NGK SPARK PLUG CO., LTD.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('6%'),
    paddingTop: hp('8%'),
  },
  header: {
    marginBottom: hp('5%'),
  },
  title: {
    fontSize: wp('8%'),
    fontWeight: '800',
    color: '#000000',
    marginBottom: hp('1%'),
  },
  subtitle: {
    fontSize: wp('4.2%'),
    color: '#666666',
    lineHeight: wp('6%'),
  },
  cardsContainer: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: wp('5%'),
    borderRadius: wp('4%'),
    marginBottom: hp('2.5%'),
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // Android Elevation
    elevation: 5,
  },
  iconWrapper: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('3%'),
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('4%'),
  },
  textWrapper: {
    flex: 1,
  },
  roleTitle: {
    fontSize: wp('4.8%'),
    fontWeight: '700',
    color: '#000000',
    marginBottom: hp('0.5%'),
  },
  roleDescription: {
    fontSize: wp('3.8%'),
    color: '#666666',
    paddingRight: wp('5%'),
  },
  footer: {
    paddingVertical: hp('3%'),
    alignItems: 'center',
  },
  footerText: {
    fontSize: wp('3%'),
    color: '#D1D1D1',
    letterSpacing: 0.5,
  },
});

export default RoleSelectionScreen;
