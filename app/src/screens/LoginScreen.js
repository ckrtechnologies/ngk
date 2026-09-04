import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { apiFunction } from '../apis/apiFunction';
import { loginApi } from '../apis/api';
import Toast from 'react-native-toast-message';
import ScreenContainer from '../components/common/ScreenContainer';
import AppHeader from '../components/common/AppHeader';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';
import { useAuth } from '../core/auth/useAuth';

const LoginScreen = ({ route, navigation }) => {
  const { signIn } = useAuth();
  const { role = 'owner' } = route.params || {};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Role Configuration
  const roleConfig = useMemo(() => {
    switch (role?.toLowerCase()) {
      case 'distributor':
        return {
          title: 'Distributor Portal',
          subtitle: 'Enterprise Provisioned Access',
          emailPlaceholder: 'admin@distributor.com',
          buttonColor: '#111827',
          badgeText: 'Distributor',
          badgeBg: '#F3F4F6',
          badgeColor: '#111827',
          showRegister: false,
          showGoogle: false,
        };
      case 'reseller':
        return {
          title: 'Reseller Portal',
          subtitle: 'Workshop & Trade Access',
          emailPlaceholder: 'reseller@workshop.com',
          buttonColor: '#C6122E',
          badgeText: 'Reseller',
          badgeBg: '#FEF3C7',
          badgeColor: '#D97706',
          showRegister: true,
          showGoogle: false,
        };
      default:
        return {
          title: 'Welcome Back',
          subtitle: 'Sign in to access your garage & parts catalog',
          emailPlaceholder: 'owner@example.com',
          buttonColor: '#C6122E',
          badgeText: 'Vehicle Owner',
          badgeBg: '#FEE2E2',
          badgeColor: '#C6122E',
          showRegister: true,
          showGoogle: false,
        };
    }
  }, [role]);

  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 4) {
      errs.password = 'Password must be at least 4 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await apiFunction(
        loginApi,
        [],
        { email: email.trim(), password, role },
        'POST',
        false
      );

      if (response?.success) {
        const userObj =
          response.profile || (response.user && response.user[0]) || response.user;
        const userId = userObj?.id || response.user?.[0]?.id;

        await signIn({
          token: response.token,
          role,
          user: userObj,
          userId: userId ? String(userId) : undefined,
        });

        setLoading(false);
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: `Welcome back, ${userObj?.name || 'User'}!`,
        });
      } else {
        setLoading(false);
        Toast.show({
          type: 'error',
          text1: 'Authentication Failed',
          text2: response?.message || 'Invalid credentials. Please try again.',
        });
      }
    } catch (error) {
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Connection Error',
        text2:
          error?.response?.data?.message || 'Unable to connect to server.',
      });
    }
  };

  return (
    <ScreenContainer
      scrollable={false}
      footer={
        <View style={styles.footerContainer}>
          {roleConfig.showRegister && (
            <TouchableOpacity
              style={styles.registerRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Register', { role })}
            >
              <Text style={styles.registerPrompt}>Don't have an account? </Text>
              <Text style={[styles.registerLink, { color: roleConfig.buttonColor }]}>
                Register
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.copyrightText}>
            Protected by NGK Technical Security System
          </Text>
        </View>
      }
    >
      <AppHeader onBack={() => navigation.goBack()} />

      <View style={styles.body}>
        {/* Top Header & Role Badge */}
        <View style={styles.headerBox}>
          <Image
            source={
              role === 'distributor'
                ? require('../assets/images/logo_black.png')
                : require('../assets/images/logo.png')
            }
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <View style={styles.titleWithBadge}>
            <Text style={styles.mainTitle}>{roleConfig.title}</Text>
            <View
              style={[styles.badgePill, { backgroundColor: roleConfig.badgeBg }]}
            >
              <Text
                style={[
                  styles.badgePillText,
                  { color: roleConfig.badgeColor },
                ]}
              >
                {roleConfig.badgeText}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitleText}>{roleConfig.subtitle}</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formCard}>
          <AppInput
            label="Email Address"
            placeholder={roleConfig.emailPlaceholder}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={18} color="#9CA3AF" />}
            error={errors.email}
          />

          <AppInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password)
                setErrors((prev) => ({ ...prev, password: null }));
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
            rightActionText="Forgot?"
            rightActionColor={roleConfig.buttonColor}
            onRightActionPress={() =>
              navigation.navigate('ForgotPassword', { role })
            }
            error={errors.password}
          />

          <AppButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            backgroundColor={roleConfig.buttonColor}
            style={styles.submitBtn}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 10,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandLogo: {
    width: 120,
    height: 40,
    marginBottom: 12,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  subtitleText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
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
  submitBtn: {
    marginTop: 6,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginBottom: 4,
  },
  registerPrompt: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  copyrightText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default LoginScreen;
