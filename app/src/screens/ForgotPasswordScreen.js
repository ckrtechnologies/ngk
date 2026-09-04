import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Mail, KeyRound, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import { apiFunction } from '../apis/apiFunction';
import { sendOtpApi, verifyOtpApi, updatePasswordApi } from '../apis/api';
import Toast from 'react-native-toast-message';
import ScreenContainer from '../components/common/ScreenContainer';
import AppHeader from '../components/common/AppHeader';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';

const ForgotPasswordScreen = ({ route, navigation }) => {
  const role = route?.params?.role || 'owner';
  const buttonColor = role === 'distributor' ? '#111827' : '#D0142C';

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (emailVal) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailVal);
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await apiFunction(sendOtpApi, [], { email: email.trim() }, 'POST', false);
      setLoading(false);

      if (response?.success) {
        Toast.show({
          type: 'success',
          text1: 'Verification Code Sent',
          text2: `OTP is: ${response.otp || '123456'}`,
          visibilityTime: 6000,
        });
        setStep(2);
      } else {
        setError(response?.message || 'Failed to send OTP code');
      }
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.message || 'Server connection error');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await apiFunction(verifyOtpApi, [], { email: email.trim(), otp: otp.trim() }, 'POST', false);
      setLoading(false);

      if (response?.success) {
        Toast.show({
          type: 'success',
          text1: 'Code Verified',
          text2: 'Please set your new password',
        });
        setStep(3);
      } else {
        setError(response?.message || 'Invalid or expired verification code');
      }
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.message || 'Server connection error');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      setError('New password is required');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await apiFunction(
        updatePasswordApi,
        [],
        { email: email.trim(), newPassword },
        'POST',
        false
      );
      setLoading(false);

      if (response?.success) {
        Toast.show({
          type: 'success',
          text1: 'Password Updated',
          text2: 'You can now sign in with your new password',
        });
        navigation.navigate('Login', { role });
      } else {
        setError(response?.message || 'Failed to update password');
      }
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.message || 'Server connection error');
    }
  };

  return (
    <ScreenContainer
      scrollable={true}
      footer={
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.backToLoginBtn}
            onPress={() => navigation.navigate('Login', { role })}
          >
            <Text style={styles.backToLoginText}>
              Remember your password? <Text style={{ color: buttonColor, fontWeight: '700' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      }
    >
      <AppHeader
        variant="light"
        includeTopInset={false}
        showStatusBar={false}
        onBack={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
      />

      <View style={styles.content}>
        {/* Step Indicator / Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: role === 'distributor' ? '#F3F4F6' : '#FEF2F2' }]}>
            {step === 1 ? (
              <Mail size={28} color={buttonColor} />
            ) : step === 2 ? (
              <KeyRound size={28} color={buttonColor} />
            ) : (
              <ShieldCheck size={28} color={buttonColor} />
            )}
          </View>
          <Text style={styles.stepTitle}>
            {step === 1 ? 'Reset Password' : step === 2 ? 'Verify Code' : 'Set New Password'}
          </Text>
          <Text style={styles.stepSubtitle}>
            {step === 1
              ? 'Enter your registered email address to receive a recovery code.'
              : step === 2
              ? `Enter the 6-digit code sent to ${email}`
              : 'Create a new secure password for your account.'}
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {step === 1 && (
            <>
              <AppInput
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail size={18} color="#9CA3AF" />}
                error={error}
              />
              <AppButton
                title="Send Recovery Code"
                onPress={handleSendOtp}
                loading={loading}
                backgroundColor={buttonColor}
                style={styles.actionBtn}
              />
            </>
          )}

          {step === 2 && (
            <>
              <AppInput
                label="6-Digit Verification Code"
                placeholder="123456"
                value={otp}
                onChangeText={(text) => {
                  setOtp(text);
                  setError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                leftIcon={<KeyRound size={18} color="#9CA3AF" />}
                rightActionText="Resend Code"
                rightActionColor={buttonColor}
                onRightActionPress={handleSendOtp}
                error={error}
              />
              <AppButton
                title="Verify Code"
                onPress={handleVerifyOtp}
                loading={loading}
                backgroundColor={buttonColor}
                style={styles.actionBtn}
              />
            </>
          )}

          {step === 3 && (
            <>
              <AppInput
                label="New Password"
                placeholder="••••••••"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setError('');
                }}
                secureTextEntry={!showPassword}
                leftIcon={<Lock size={18} color="#9CA3AF" />}
                rightIcon={
                  showPassword ? (
                    <Eye size={18} color="#6B7280" />
                  ) : (
                    <EyeOff size={18} color="#6B7280" />
                  )
                }
                onRightIconPress={() => setShowPassword((prev) => !prev)}
              />

              <AppInput
                label="Confirm New Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setError('');
                }}
                secureTextEntry={!showPassword}
                leftIcon={<Lock size={18} color="#9CA3AF" />}
                error={error}
              />

              <AppButton
                title="Update Password"
                onPress={handleResetPassword}
                loading={loading}
                backgroundColor={buttonColor}
                style={styles.actionBtn}
              />
            </>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionBtn: {
    marginTop: 6,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backToLoginBtn: {
    paddingVertical: 6,
  },
  backToLoginText: {
    fontSize: 13,
    color: '#6B7280',
  },
});

export default ForgotPasswordScreen;
