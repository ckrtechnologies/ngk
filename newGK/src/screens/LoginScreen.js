import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { ArrowLeft } from 'lucide-react-native';
import Config from "react-native-config";
import { apiFunction } from '../apis/apiFunction';
import { loginApi, serviceJsonApi } from '../apis/api';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const LoginScreen = ({ route, navigation }) => {

  const { role } = route.params;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);



  // Configuration based on role
  const config = {
    owner: {
      title: 'Welcome Back',
      subtitle: 'SECURE PORTAL ACCESS FOR END USER',
      emailPlaceholder: 'name@company.com',
      passwordLabel: 'SECURE PASSWORD',
      passwordAction: 'RECOVERY',
      buttonColor: '#C6122E', // Red
      logo: require('../assets/images/logo.png'),
      showGoogle: true,
      footerText: 'REQUEST ACCESS? ',
      footerAction: 'SUPPORT DESK',
    },
    reseller: {
      title: 'Welcome Back',
      subtitle: 'SECURE PORTAL ACCESS FOR RESELLER',
      emailPlaceholder: 'reseller@company.com',
      passwordLabel: 'SECURE PASSWORD',
      passwordAction: 'RECOVERY',
      buttonColor: '#C6122E', // Red
      logo: require('../assets/images/logo.png'),
      showGoogle: false,
      footerText: 'REQUEST ACCESS? ',
      footerAction: 'SUPPORT DESK',
    },
    distributor: {
      title: 'Distributor Portal',
      subtitle: 'SECURE ACCESS • ADMIN PROVISIONED CREDENTIALS ONLY',
      emailPlaceholder: 'admin@distributor.com',
      passwordLabel: 'PORTAL KEY',
      passwordAction: 'FORGOT?',
      buttonColor: '#000000', // Black
      logo: require('../assets/images/logo_black.png'),
      showGoogle: false,
      footerText: 'NEED ACCESS? CONTACT YOUR REGIONAL ',
      footerAction: 'NGK CORPORATE ADMINISTRATOR',
    },
  }[role];
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };


  const handleLogin = async () => {

    if (!email || !password) {
      alert("All fields are required");
      return;
    }

    if (!validateEmail(email)) {
      alert("Please enter a valid email");
      return;
    }

    if (!validatePassword(password)) {
      alert("Please enter a valid password");
      return;
    }

    setLoading(true);

    try {

    const response = await apiFunction(loginApi, [], { email, password, role }, "POST", false)

    if (response?.success) {


      const res = await axios.get("https://api.ipify.org?format=json")
      const ip = res.data.ip;

      console.log("ip", ip)

      const addDynamicAddress = {
        "provider": 25690,
        "address": ip,
        "validityHours": 2

      }

      const whiteListingIp = await apiFunction(serviceJsonApi, [], { addDynamicAddress }, "POST", false)

      console.log("whiteListingIp", whiteListingIp)

      if (whiteListingIp?.status !== 200) {
        Toast.show({
          type: 'error',
          text1: 'Your IP Address is not whitelisted. Please contact your distributor to whitelist your IP address.',
        });
        setLoading(false);
        return
      } else {
        const addDynamicAPIKey = {
          "provider": 25690,
          "validityHours": 2
        }
        const validApi = await apiFunction(serviceJsonApi, [], { addDynamicAPIKey }, "POST", false)
        console.log(validApi)
        if (validApi?.status !== 200) {
          Toast.show({
            type: 'error',
            text1: 'Could not get the token. Please try again.',
          });
          setLoading(false);
          return
        } else {
          await AsyncStorage.setItem("apiKey", validApi?.apiKey)
          await AsyncStorage.setItem("role", role)
          await AsyncStorage.setItem("userId", response?.user[0]?.id)
          
          setLoading(false);
          Toast.show({
            type: 'success',
            text1: 'Login successful',
          });
          if (role === "owner") {
            navigation.replace("OwnerHome");
          }
          else if (role === "reseller") {
            navigation.replace("ResellerHome");
          }
          else if (role === "distributor") {
            navigation.replace("DistributorHomeScreen");
          }
        }
      }


    }
    else {
      Toast.show({
        type: 'error',
        text1: 'Login failed',
      });
      setLoading(false);
    }
    } catch (error) {
      console.log(error);
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Something went wrong. Please try again.',
      });
      setLoading(false);
    }

  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={wp('6%')} color="#B0B0B0" />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={config.logo}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>WORK EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder={config.emailPlaceholder}
              placeholderTextColor="#C0C0C0"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>{config.passwordLabel}</Text>
              <TouchableOpacity>
                <Text style={[styles.passwordAction, { color: config.buttonColor }]}>
                  {config.passwordAction}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#C0C0C0"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              showPassword={true}
            />
          </View>

          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: config.buttonColor }]}
            activeOpacity={0.8}
            onPress={handleLogin}
          >
            {loading ? <ActivityIndicator color={"#fff"} /> : <Text style={styles.mainButtonText}>AUTHORIZE PORTAL ACCESS</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: "#fff", marginTop: 20, justifyContent: 'center', alignItems: 'center', borderRadius: 50 }}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Register', { role })}
          >
            <Text style={[styles.mainButtonText, { color: config.buttonColor }]}>REGISTER ACCOUNT</Text>
          </TouchableOpacity>
        </View>

        {/* Social Login / Divider */}
        {config.showGoogle && (
          <View style={styles.socialSection}>
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>CORPORATE ID</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.googleButton}>
              <Image
                source={require('../assets/images/image.png')}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>GOOGLE SIGN IN</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {config.footerText}
            <Text style={[styles.footerAction, { color: config.buttonColor }]}>
              {config.footerAction}
            </Text>
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp('10%'),
    paddingBottom: hp('4%'),
  },
  backButton: {
    marginTop: hp('2%'),
    width: wp('10%'),
    height: wp('10%'),
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: hp('2%'),
    // marginBottom: hp('3%'),
  },
  logo: {
    width: wp('50%'),
    height: wp('50%'),
  },
  header: {
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  title: {
    fontSize: wp('7.5%'),
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: '#BDBDBD',
    textAlign: 'center',
    marginTop: hp('0.8%'),
    letterSpacing: 0.5,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: hp('3%'),
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: '#A0A0A0',
    marginBottom: hp('1%'),
  },
  passwordAction: {
    fontSize: wp('2.8%'),
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#F3F4F9',
    height: hp('9%'),
    borderRadius: wp('4%'),
    paddingHorizontal: wp('5%'),
    fontSize: wp('4%'),
    color: '#000000',
    fontWeight: '600',
  },
  mainButton: {
    height: hp('9%'),
    borderRadius: wp('4%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('2%'),
    // iOS Shadow
    shadowColor: '#C6122E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    // Android Elevation
    elevation: 8,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: wp('3.2%'),
    fontWeight: '900',
    letterSpacing: 1,
  },
  socialSection: {
    marginTop: hp('6%'),
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('4%'),
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  dividerText: {
    marginHorizontal: wp('4%'),
    fontSize: wp('2.8%'),
    fontWeight: '700',
    color: '#D0D0D0',
    letterSpacing: 1.5,
  },
  googleButton: {
    flexDirection: 'row',
    height: hp('9%'),
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  googleIcon: {
    width: wp('10%'),
    height: wp('10%'),
    marginRight: wp('3%'),
  },
  googleButtonText: {
    fontSize: wp('3%'),
    fontWeight: '900',
    color: '#000000',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: hp('10%'),
  },
  footerText: {
    fontSize: wp('2.5%'),
    fontWeight: '700',
    color: '#D0D0D0',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  footerAction: {
    fontWeight: '900',
  },
});

export default LoginScreen;
