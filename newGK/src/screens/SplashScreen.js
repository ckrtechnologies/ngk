import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, StatusBar } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    // Navigate to Home after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('RoleSelection');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F121C" />
      <View style={styles.logoAndTextContainer}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.textContainer}>
          <Text style={styles.title}>NGK Spark Plugs</Text>
          <Text style={styles.subtitle}>Innovation for All</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F121C', // Dark background as per image
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoAndTextContainer: {
    alignItems: 'center',
  },
  logo: {
    width: wp('35%'),
    height: wp('35%'),
    marginBottom: hp('3%'),
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: wp('7.5%'),
    fontWeight: 'bold',
    marginBottom: hp('0.5%'),
  },
  subtitle: {
    color: '#A0A0A0',
    fontSize: wp('4.5%'),
  },
});

export default SplashScreen;
