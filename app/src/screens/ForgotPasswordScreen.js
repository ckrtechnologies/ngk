import React, { useState } from 'react';
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
import { ArrowLeft, Mail, KeyRound, Lock, Eye, EyeOff } from 'lucide-react-native';
import { apiFunction } from '../apis/apiFunction';
import { sendOtpApi, verifyOtpApi, updatePasswordApi } from '../apis/api';
import Toast from 'react-native-toast-message';

const ForgotPasswordScreen = ({ route, navigation }) => {
  const role = route?.params?.role || 'owner';
  
  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP, 3: Reset Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Configuration based on role to keep brand consistency
  const config = {
    owner: {
      buttonColor: '#C6122E', // Red
      logo: require('../assets/images/logo.png'),
    },
    reseller: {
      buttonColor: '#C6122E', // Red
      logo: require('../assets/images/logo.png'),
    },
    distributor: {
      buttonColor: '#000000', // Black
      logo: require('../assets/images/logo_black.png'),
    },
  }[role];

  const validateEmail = (emailVal) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailVal);
  };

  const handleSendOtp = async () => {
    if (!email) {
      Toast.show({ type: 'error', text1: 'Email is required' });
      return;
    }
    if (!validateEmail(email)) {
      Toast.show({ type: 'error', text1: 'Please enter a valid email' });
      return;
    }

    setLoading(true);
    try {
      const response = await apiFunction(sendOtpApi, [], { email }, 'POST', false);
      setLoading(false);
      
      if (response?.success) {
        Toast.show({
          type: 'success',
          text1: 'Verification code sent!',
          text2: `For testing, OTP code is: ${response.otp}`,
          visibilityTime: 6000,
        });
        setStep(2);
      } else {
        Toast.show({
          type: 'error',
          text1: response?.message || 'Failed to send OTP code',
        });
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Something went wrong. Please try again.',
      });
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Toast.show({ type: 'error', text1: 'OTP is required' });
      return;
    }
    if (otp.length < 6) {
      Toast.show({ type: 'error', text1: 'OTP must be 6 digits' });
      return;
    }

    setLoading(true);
    try {
      const response = await apiFunction(verifyOtpApi, [], { email, otp }, 'POST', false);
      setLoading(false);

      if (response?.success) {
        Toast.show({
          type: 'success',
          text1: 'OTP Verified successfully',
          text2: 'Please set your new password',
        });
        setStep(3);
      } else {
        Toast.show({
          type: 'error',
          text1: response?.message || 'Invalid or expired OTP',
        });
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Failed to verify OTP',
      });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'All fields are required' });
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters long' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const response = await apiFunction(updatePasswordApi, [], { email, password: newPassword }, 'PUT', false);
      setLoading(false);

      if (response?.success) {
        Toast.show({
          type: 'success',
          text1: 'Password updated successfully!',
          text2: 'Please log in with your new credentials',
        });
        setTimeout(() => {
          navigation.navigate('Login', { role });
        }, 1500);
      } else {
        Toast.show({
          type: 'error',
          text1: response?.message || 'Failed to reset password',
        });
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Failed to reset password',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={wp('6%')} color="#B0B0B0" />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={config.logo} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Password Recovery</Text>
          <Text style={styles.subtitle}>
            {step === 1 && 'ENTER REGISTERED EMAIL TO RECEIVE VERIFICATION CODE'}
            {step === 2 && 'ENTER THE 6-DIGIT VERIFICATION CODE SENT TO YOUR EMAIL'}
            {step === 3 && 'SET A SECURE NEW PASSWORD FOR YOUR ACCOUNT'}
          </Text>
        </View>

        {/* Step 1: Send OTP */}
        {step === 1 && (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Mail size={wp('5%')} color="#BDBDBD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@company.com"
                  placeholderTextColor="#C0C0C0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: config.buttonColor }]}
              activeOpacity={0.8}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mainButtonText}>SEND VERIFICATION CODE</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>VERIFICATION CODE (OTP)</Text>
              </View>
              <View style={styles.inputWrapper}>
                <KeyRound size={wp('5%')} color="#BDBDBD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor="#C0C0C0"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: config.buttonColor }]}
              activeOpacity={0.8}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mainButtonText}>VERIFY CODE</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              activeOpacity={0.7}
              onPress={() => setStep(1)}
            >
              <Text style={[styles.resendText, { color: config.buttonColor }]}>BACK TO EMAIL ENTRY</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>NEW PASSWORD</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Lock size={wp('5%')} color="#BDBDBD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#C0C0C0"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={wp('5%')} color="#BDBDBD" />
                  ) : (
                    <Eye size={wp('5%')} color="#BDBDBD" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Lock size={wp('5%')} color="#BDBDBD" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#C0C0C0"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: config.buttonColor }]}
              activeOpacity={0.8}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mainButtonText}>UPDATE PASSWORD</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            BACK TO{' '}
            <Text
              style={[styles.footerAction, { color: config.buttonColor }]}
              onPress={() => navigation.navigate('Login', { role })}
            >
              SECURE PORTAL LOGIN
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
  },
  logo: {
    width: wp('50%'),
    height: wp('50%'),
  },
  header: {
    alignItems: 'center',
    marginBottom: hp('4%'),
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
    paddingHorizontal: wp('5%'),
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F9',
    borderRadius: wp('4%'),
    height: hp('9%'),
    paddingHorizontal: wp('5%'),
  },
  inputIcon: {
    marginRight: wp('3%'),
  },
  input: {
    flex: 1,
    fontSize: wp('4%'),
    color: '#000000',
    fontWeight: '600',
    height: '100%',
  },
  eyeIcon: {
    padding: wp('2%'),
  },
  mainButton: {
    height: hp('9%'),
    borderRadius: wp('4%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('2%'),
    shadowColor: '#C6122E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: wp('3.2%'),
    fontWeight: '900',
    letterSpacing: 1,
  },
  resendButton: {
    marginTop: hp('3%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendText: {
    fontSize: wp('3.2%'),
    fontWeight: '800',
    letterSpacing: 0.5,
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

export default ForgotPasswordScreen;
