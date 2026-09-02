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
    Platform,
    PermissionsAndroid,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { apiFunction } from '../apis/apiFunction';
import { registerApi } from '../apis/api';
import Toast from 'react-native-toast-message';

const RegisterScreen = ({ route, navigation }) => {
    const role = route?.params?.role || 'owner'; // Default to owner if not passed

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [address, setAdress] = useState('');
    const [locationLoading, setLocationLoading] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);

    // Configuration based on role (similar to login)
    const config = {
        owner: {
            title: 'Create Account',
            subtitle: 'SECURE PORTAL ACCESS FOR END USER',
            emailPlaceholder: 'name@company.com',
            passwordLabel: 'SECURE PASSWORD',
            buttonColor: '#C6122E', // Red
            logo: require('../assets/images/logo.png'),
        },
        reseller: {
            title: 'Create Account',
            subtitle: 'SECURE PORTAL ACCESS FOR RESELLER',
            emailPlaceholder: 'reseller@company.com',
            passwordLabel: 'SECURE PASSWORD',
            buttonColor: '#C6122E', // Red
            logo: require('../assets/images/logo.png'),
        },
        distributor: {
            title: 'Distributor Registration',
            subtitle: 'SECURE ACCESS • ADMIN PROVISIONED CREDENTIALS',
            emailPlaceholder: 'admin@distributor.com',
            passwordLabel: 'PORTAL KEY',
            buttonColor: '#000000', // Black
            logo: require('../assets/images/logo_black.png'),
        },
    }[role];

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

        return passwordRegex.test(password);
    };


    const requestLocationPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    fetchCurrentLocation();
                } else {
                    Toast.show({ type: 'error', text1: 'Location permission denied' });
                }
            } catch (err) {
                console.warn(err);
            }
        } else {
            fetchCurrentLocation();
        }
    };

    const fetchCurrentLocation = () => {
        setLocationLoading(true);
        Geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                console.log(latitude, longitude, "location");
                try {
                    // Try Nominatim first with standard browser headers
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Referer': 'https://www.openstreetmap.org/',
                            'Accept': 'application/json'
                        }
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.display_name) {
                            setAdress(data.display_name);
                            Toast.show({ type: 'success', text1: 'Location detected successfully' });
                            setLocationLoading(false);
                            return;
                        }
                    }

                    // Fallback to BigDataCloud free reverse geocoding API if Nominatim returns 403 Forbidden
                    console.log("Nominatim failed with status:", res.status, "Trying BigDataCloud fallback...");
                    const bdcRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                    if (bdcRes.ok) {
                        const bdcData = await bdcRes.json();
                        const addressParts = [bdcData.locality, bdcData.city, bdcData.principalSubdivision, bdcData.countryName].filter(Boolean);
                        const fallbackAddress = addressParts.length > 0 ? Array.from(new Set(addressParts)).join(', ') : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
                        setAdress(fallbackAddress);
                        Toast.show({ type: 'success', text1: 'Location detected successfully' });
                    } else {
                        setAdress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                        Toast.show({ type: 'success', text1: 'Coordinates detected successfully' });
                    }
                } catch (e) {
                    console.log("Reverse geocoding error", e);
                    setAdress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                    Toast.show({ type: 'success', text1: 'Coordinates detected successfully' });
                }
                setLocationLoading(false);
            },
            (error) => {
                console.log(error.code, error.message);
                Toast.show({ type: 'error', text1: 'Failed to get current coordinates' });
                setLocationLoading(false);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
        );
    };

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !password) {
            Toast.show({ type: 'error', text1: 'All fields are required' });
            return;
        }

        if (!validateEmail(email.trim())) {
            Toast.show({ type: 'error', text1: 'Please enter a valid email address' });
            return;
        }

        if (!validatePassword(password)) {
            Toast.show({
                type: 'error',
                text1: 'Password must be 8+ chars with uppercase, digit & symbol',
            });
            return;
        }

        if (confirmPassword !== password) {
            Toast.show({ type: 'error', text1: 'Passwords do not match' });
            return;
        }

        setLoading(true);

        const body = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            address,
            role,
        };

        try {
            const response = await apiFunction(registerApi, [], body, 'POST', false);

            if (response?.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Account created successfully! Please login.',
                });
                setLoading(false);
                navigation.navigate('Login', { role });
            } else {
                setLoading(false);
                Toast.show({
                    type: 'error',
                    text1: response?.message || 'Registration failed. Please try again.',
                });
            }
        } catch (err) {
            setLoading(false);
            Toast.show({
                type: 'error',
                text1: err?.response?.data?.message || 'Network error. Please try again.',
            });
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
                        <Text style={styles.inputLabel}>FULL NAME</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="John Doe"
                            placeholderTextColor="#C0C0C0"
                            autoCapitalize="words"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

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
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="#C0C0C0"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="#C0C0C0"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    </View>

                    {role.toLowerCase() === "reseller" && (
                        <View style={styles.inputGroup}>
                            <View style={[styles.labelRow, { marginBottom: hp('1%') }]}>
                                <Text style={[styles.inputLabel, { marginBottom: 0 }]}>ADDRESS</Text>
                                <TouchableOpacity
                                    style={styles.locationBtn}
                                    onPress={requestLocationPermission}
                                    disabled={locationLoading}
                                >
                                    {locationLoading ? (
                                        <ActivityIndicator size="small" color={config.buttonColor} />
                                    ) : (
                                        <>
                                            <MapPin color={config.buttonColor} size={wp('3.5%')} />
                                            <Text style={[styles.locationBtnText, { color: config.buttonColor }]}>
                                                Use Current Location
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder={"Enter your address"}
                                placeholderTextColor="#C0C0C0"
                                keyboardType="default"
                                autoCapitalize="none"
                                value={address}
                                onChangeText={setAdress}
                            />
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.mainButton, { backgroundColor: config.buttonColor }]}
                        activeOpacity={0.8}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainButtonText}>CREATE ACCOUNT</Text>}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        ALREADY HAVE AN ACCOUNT?{' '}
                        <Text style={[styles.footerAction, { color: config.buttonColor }]} onPress={() => navigation.navigate('Login', { role })}>
                            LOGIN
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
    locationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: wp('3%'),
        paddingVertical: hp('0.6%'),
        borderRadius: wp('4%'),
        borderWidth: 1,
        borderColor: '#EAEAEA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    locationBtnText: {
        fontSize: wp('2.8%'),
        fontWeight: '800',
        marginLeft: wp('1.5%'),
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
    footer: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: hp('5%'),
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

export default RegisterScreen;
