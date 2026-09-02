import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Menu, Bell, Home, Search, Heart, MessageSquare, Truck, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { apiFunction } from '../apis/apiFunction';
import { serviceJsonApi } from '../apis/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { getArticlesRedux, getMyselfRedux, getVehiclesRedux } from '../redux/getData';

const { width } = Dimensions.get('window');

const OwnerHomeScreen = ({ prop }) => {
  const navigation = useNavigation();
  const { articles, vehicles, myself } = useSelector(state => state.getData)
  const dispatch = useDispatch()
  const scrollCards = [
    {
      id: '1',
      tag: 'New Release',
      title: 'Version 4.2.0',
      description: '342 new parts added this week',
      buttonText: 'Check Updates',
      bgColor: '#000000',
    },
    {
      id: '2',
      tag: 'Technical',
      title: 'Wider Range',
      description: 'Check out our latest sensor snapshots',
      buttonText: 'Read More',
      bgColor: '#1E2554',
    },
  ];



  useEffect(() => {
    const checkAPIKey = async () => {
      const apiKey = await AsyncStorage.getItem("apiKey")
      console.log(apiKey, "apiKey")
      if (!apiKey) {
        navigation.navigate("Login")
      }
    }
    checkAPIKey()
  }, []);

  const getMyself = async () => {
    const userId = await AsyncStorage.getItem("userId")
    dispatch(getMyselfRedux(userId))
  }


  useEffect(() => {
    const getArticles = {
      "articleCountry": "ZA",
      "dataSupplierIds": ["5567", "7729"],
      "lang": "en",
      "perPage": 10,
      "page": 1,
      "includeAll": true
    }
    dispatch(getArticlesRedux({ getArticles }))

    const getLinkageTargets = {
      "linkageTargetCountry": "ZA",
      "lang": "en",
      "linkageTargetType": "P",
      "perPage": 0,
      "page": 1,
      "includeMfrFacets": true
    }
    dispatch(getVehiclesRedux({ getLinkageTargets }))
    getMyself()
  }, [dispatch]);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='dark-content' />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('CustomDrawer')}>
            <Menu size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NGK <Text style={{ fontWeight: '300' }}>Technical</Text></Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
            <View style={styles.notificationBadge} />
            <Bell color="#FFFFFF" size={wp('6%')} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeIconContainer}>
            <Home color="#C6122E" size={wp('5%')} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Horizontal Scroll Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={width * 0.85}
          decelerationRate="fast"
          contentContainerStyle={styles.horizontalScroll}
        >
          {scrollCards.map((item) => (
            <View key={item.id} style={[styles.promoCard, { backgroundColor: item.bgColor }]}>
              <View style={styles.tagContainer}>
                <Text style={styles.tagText}>{item.tag}</Text>
              </View>
              <Text style={styles.promoTitle}>{item.title}</Text>
              <Text style={styles.promoDesc}>{item.description}</Text>
              <TouchableOpacity style={styles.promoButton}>
                <Text style={styles.promoButtonText}>{item.buttonText}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Saved Garage Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Garage</Text>
          <TouchableOpacity onPress={() => navigation.navigate('VehiclesList')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {myself?.vehicleId?.length > 0 ? <TouchableOpacity style={styles.garageCard} onPress={() => navigation.navigate('MyGarage')}>
          <View style={styles.garageIconBox}>
            <Truck color="#C6122E" size={wp('6%')} />
          </View>
          <View style={styles.garageTextContainer}>
            <Text style={styles.garageTitle}>{myself?.vehicleId[0]?.vehicleDescription}</Text>
            <Text style={styles.garageSubtitle}>{myself?.vehicleId[0]?.yearOfConstrFrom} - {myself?.vehicleId[0]?.yearOfConstrTo} </Text>
          </View>
          <ChevronRight color="#D1D1D1" size={wp('6%')} />
        </TouchableOpacity> : (
          <TouchableOpacity onPress={() => navigation.navigate('VehiclesList')}
            style={{ height: hp("6%"), margin: hp("3%"), borderRadius: hp("1%"), backgroundColor: "#C6122E", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "white", fontWeight: "bold" }}>Please add vehicle</Text>
          </TouchableOpacity>
        )}

        {/* Quick Actions (Grid) */}
        <View style={styles.gridContainer}>
          <View style={styles.gridItemContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('CatalogSearch')} style={styles.gridCard}>
              <Search color="#C6122E" size={wp('8%')} />
            </TouchableOpacity>
            <Text style={styles.gridText}>Catalog Search</Text>
          </View>
          <View style={styles.gridItemContainer}>
            <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Watchlist')}>
              <View style={styles.heartBadge}>
                <Text style={styles.heartBadgeText}>{myself?.watchList?.length || 0}</Text>
              </View>
              <Heart color="#000000" fill="#000000" size={wp('8%')} />
            </TouchableOpacity>
            <Text style={styles.gridText}>Watchlist</Text>
          </View>
        </View>

        {/* Technical Enquiry */}
        <TouchableOpacity style={styles.enquiryCard} onPress={() => navigation.navigate('TechnicalEnquiry')}>
          <View style={styles.enquiryIconBox}>
            <MessageSquare color="#C6122E" fill="#C6122E" size={wp('6%')} />
          </View>
          <View style={styles.garageTextContainer}>
            <Text style={styles.garageTitle}>Technical Enquiry</Text>
            <Text style={styles.enquirySubtitle}>Direct contact with NGK engineers</Text>
          </View>
          <ChevronRight color="#D1D1D1" size={wp('6%')} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    // padding:'20'
  },
  header: {
    backgroundColor: '#C6122E',
    height: hp('8%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    // marginTop:'35'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: wp('5%'),
    fontWeight: 'bold',
    marginLeft: wp('4%'),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: wp('2%'),
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: hp('1.5%'),
    right: wp('1.5%'),
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C6122E',
    zIndex: 1,
  },
  homeIconContainer: {
    backgroundColor: '#FFFFFF',
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp('2%'),
  },
  scrollContent: {
    paddingBottom: hp('5%'),
  },
  horizontalScroll: {
    paddingLeft: wp('6%'),
    paddingVertical: hp('3%'),
    paddingRight: wp('6%'),
  },
  promoCard: {
    width: width * 0.75,
    borderRadius: wp('8%'),
    padding: wp('6%'),
    marginRight: wp('4%'),
    height: hp('24%'),
    justifyContent: 'center',
  },
  tagContainer: {
    backgroundColor: '#C6122E',
    alignSelf: 'flex-start',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
    marginBottom: hp('1.5%'),
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: wp('2.8%'),
    fontWeight: 'bold',
  },
  promoTitle: {
    color: '#FFFFFF',
    fontSize: wp('7%'),
    fontWeight: 'bold',
    marginBottom: hp('0.5%'),
  },
  promoDesc: {
    color: '#D0D0D0',
    fontSize: wp('3.5%'),
    marginBottom: hp('2.5%'),
  },
  promoButton: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('3%'),
  },
  promoButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: wp('3.5%'),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('6%'),
    marginTop: hp('1%'),
    marginBottom: hp('1.5%'),
  },
  sectionTitle: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#000000',
  },
  viewAll: {
    color: '#C6122E',
    fontSize: wp('3.5%'),
    fontWeight: '600',
  },
  garageCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp('6%'),
    borderRadius: wp('6%'),
    padding: wp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: hp('2.5%'),
  },
  garageIconBox: {
    backgroundColor: '#FFF1F3',
    padding: wp('3%'),
    borderRadius: wp('4%'),
    marginRight: wp('4%'),
  },
  garageTextContainer: {
    flex: 1,
  },
  garageTitle: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#000000',
  },
  garageSubtitle: {
    fontSize: wp('3.2%'),
    color: '#8E8E8E',
    marginTop: hp('0.5%'),
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp('6%'),
    marginBottom: hp('3%'),
  },
  gridItemContainer: {
    width: wp('42%'),
    alignItems: 'center',
  },
  gridCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: hp('18%'),
    borderRadius: wp('8%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    position: 'relative',
  },
  gridText: {
    fontSize: wp('3.8%'),
    fontWeight: 'bold',
    color: '#000000',
  },
  heartBadge: {
    position: 'absolute',
    top: hp('2%'),
    right: wp('4%'),
    backgroundColor: '#C6122E',
    width: wp('6%'),
    height: wp('6%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heartBadgeText: {
    color: '#FFFFFF',
    fontSize: wp('2.8%'),
    fontWeight: 'bold',
  },
  enquiryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp('6%'),
    borderRadius: wp('6%'),
    padding: wp('5%'),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: hp('10%'),
  },
  enquiryIconBox: {
    backgroundColor: '#F0F5FF',
    padding: wp('3.5%'),
    borderRadius: wp('4.5%'),
    marginRight: wp('4%'),
  },
  enquirySubtitle: {
    fontSize: wp('3.2%'),
    color: '#8E8E8E',
    marginTop: hp('0.5%'),
  },
});

export default OwnerHomeScreen;
