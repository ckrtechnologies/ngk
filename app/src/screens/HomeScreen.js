import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome to NGK</Text>
        <Text style={styles.descriptionText}>
          Leading the way in spark plug innovation.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('10%'),
  },
  welcomeText: {
    fontSize: wp('8%'),
    fontWeight: 'bold',
    color: '#0F121C',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  descriptionText: {
    fontSize: wp('4.5%'),
    color: '#555',
    textAlign: 'center',
  },
});

export default HomeScreen;
