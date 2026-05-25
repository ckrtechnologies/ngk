import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const SuccessScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.content}>
        <View style={styles.successCircle}>
          <Check color="#FFFFFF" size={wp('15%')} strokeWidth={3} />
        </View>

        <Text style={styles.successTitle}>Enquiry Submitted Successfully!</Text>
        <Text style={styles.successMessage}>
          Our technical team will review your requirement and get back to you shortly.
        </Text>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('OwnerHome')}
        >
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('10%'),
  },
  successCircle: {
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: wp('15%'),
    backgroundColor: '#2E8B57',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('4%'),
    // Subtle shadow
    shadowColor: '#2E8B57',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  successTitle: {
    fontSize: wp('6%'),
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  successMessage: {
    fontSize: wp('3.5%'),
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: wp('5.5%'),
    marginBottom: hp('6%'),
  },
  homeBtn: {
    backgroundColor: '#000000',
    borderRadius: wp('4%'),
    paddingHorizontal: wp('10%'),
    paddingVertical: hp('2.2%'),
    width: '100%',
    alignItems: 'center',
  },
  homeBtnText: {
    color: '#FFFFFF',
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
});

export default SuccessScreen;
