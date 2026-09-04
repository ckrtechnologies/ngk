import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { User, Mail, Lock, MapPin, Eye, EyeOff, Navigation as NavigationIcon } from 'lucide-react-native';
import { apiFunction } from '../apis/apiFunction';
import { registerApi } from '../apis/api';
import Toast from 'react-native-toast-message';
import ScreenContainer from '../components/common/ScreenContainer';
import AppHeader from '../components/common/AppHeader';
import AppInput from '../components/common/AppInput';
import AppButton from '../components/common/AppButton';

const RegisterScreen = ({ route, navigation }) => {
  const role = route?.params?.role || 'owner';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const buttonColor = role === 'distributor' ? '#111827' : '#D0142C';

  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) errs.name = 'Full name is required';
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Enter a valid email address';
    }

    if (!address.trim()) errs.address = 'Service address or workshop location is required';

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const requestLocation = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          fetchCoords();
        } else {
          Toast.show({ type: 'error', text1: 'Location permission required' });
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      fetchCoords();
    }
  };

  const fetchCoords = () => {
    setLocationLoading(true);
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });

        let prefetchedAddress = `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'User-Agent': 'NGKApp/1.0' } }
          );
          const geoData = await geoRes.json();
          if (geoData && geoData.display_name) {
            prefetchedAddress = geoData.display_name;
          }
        } catch (geoErr) {
          console.warn('Reverse geocode prefetch error:', geoErr.message);
        }

        setAddress(prefetchedAddress);
        setLocationLoading(false);
        Toast.show({
          type: 'success',
          text1: 'Location & Address Prefetched',
          text2: 'You can adjust or edit the address text below.',
        });
      },
      (error) => {
        setLocationLoading(false);
        Toast.show({
          type: 'error',
          text1: 'Unable to acquire location',
          text2: error.message,
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        address: address.trim(),
        role,
        ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
      };

      const response = await apiFunction(registerApi, [], payload, 'POST', false);

      if (response?.success) {
        setLoading(false);
        Toast.show({
          type: 'success',
          text1: 'Account Created',
          text2: 'Please sign in with your credentials.',
        });
        navigation.navigate('Login', { role });
      } else {
        setLoading(false);
        Toast.show({
          type: 'error',
          text1: 'Registration Failed',
          text2: response?.message || 'Email may already be in use.',
        });
      }
    } catch (error) {
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Registration Error',
        text2: error?.response?.data?.message || 'Server connection error.',
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <AppHeader
        title="Create Account"
        subtitle={`Register as ${role === 'owner' ? 'Vehicle Owner' : role}`}
        onBack={() => navigation.goBack()}
      />

      <ScreenContainer
        scrollable={true}
        includeTopInset={false}
        showStatusBar={false}
        footer={
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={styles.loginRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Login', { role })}
            >
              <Text style={styles.loginPrompt}>Already have an account? </Text>
              <Text style={[styles.loginLink, { color: buttonColor }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        }
      >

      <View style={styles.formCard}>
        <AppInput
          label="Full Name"
          placeholder="e.g. Johnathan Smith"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
          }}
          leftIcon={<User size={18} color="#9CA3AF" />}
          error={errors.name}
        />

        <AppInput
          label="Email Address"
          placeholder="name@example.com"
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
          label="Location / Workshop Address"
          placeholder="Enter address or tap GPS"
          value={address}
          onChangeText={(text) => {
            setAddress(text);
            if (errors.address) setErrors((prev) => ({ ...prev, address: null }));
          }}
          leftIcon={<MapPin size={18} color="#9CA3AF" />}
          rightActionText={locationLoading ? 'Locating...' : '📍 Locate Me'}
          rightActionColor={buttonColor}
          onRightActionPress={requestLocation}
          error={errors.address}
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
          error={errors.password}
        />

        <AppInput
          label="Confirm Password"
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (errors.confirmPassword)
              setErrors((prev) => ({ ...prev, confirmPassword: null }));
          }}
          secureTextEntry={!showPassword}
          leftIcon={<Lock size={18} color="#9CA3AF" />}
          error={errors.confirmPassword}
        />

        <AppButton
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
          backgroundColor={buttonColor}
          style={styles.submitBtn}
        />
      </View>
    </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
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
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  loginPrompt: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default RegisterScreen;
