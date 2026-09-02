import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Home, Search, MessageSquare, ShoppingBag } from 'lucide-react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import SplashScreen from '../screens/SplashScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import LoginScreen from '../screens/LoginScreen';
import OwnerHomeScreen from '../screens/OwnerHomeScreen';
import HomeScreen from '../screens/HomeScreen';
import MyGarageScreen from '../screens/MyGarageScreen';
import PartsFinderScreen from '../screens/PartsFinderScreen';
import VerifiedPartsScreen from '../screens/VerifiedPartsScreen';
import TechnicalEnquiryScreen from '../screens/TechnicalEnquiryScreen';
import SuccessScreen from '../screens/SuccessScreen';
import DealerLocatorScreen from '../screens/DealerLocatorScreen';
import MyEnquiriesScreen from '../screens/MyEnquiriesScreen';
import ResellerHomeScreen from '../screens/Reseller/ResellerHome';
import DistributorHomeScreen from '../screens/Distributor/DistributorHomeScreen'
import CustomDrawer from '../screens/CustomDrawer';
import MyFavoritesScreen from '../screens/MyFavoritesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import RegisterScreen from '../screens/register';
import VehiclesListScreen from '../screens/vehiclesListScreen';
import ModalsScreen from '../screens/modalsScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import Notification from "../screens/Notification";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Placeholder screens for other tabs
const SearchPlaceholder = () => <View style={styles.center}><Text>Search Screen</Text></View>;
const EnquiriesPlaceholder = () => <View style={styles.center}><Text>Enquiries Screen</Text></View>;
const DealersPlaceholder = () => <View style={styles.center}><Text>Dealers Screen</Text></View>;

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Portal') return <Home size={size} color={color} />;
          if (route.name === 'Search') return <Search size={size} color={color} />;
          if (route.name === 'Enquiries') return <MessageSquare size={size} color={color} />;
          if (route.name === 'Dealers') return <ShoppingBag size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Portal"
        component={OwnerHomeScreen}
      />
      <Tab.Screen
        name="Search"
        component={PartsFinderScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('PartsFinder');
          },
        })}
      />
      <Tab.Screen
        name="Enquiries"
        component={MyEnquiriesScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('MyEnquiries');
          },
        })}
      />
      <Tab.Screen
        name="Dealers"
        component={DealerLocatorScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('DealerLocator');
          },
        })}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OwnerHome" component={BottomTabNavigator} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="MyGarage" component={MyGarageScreen} />
      <Stack.Screen name="PartsFinder" component={PartsFinderScreen} />
      <Stack.Screen name="VerifiedParts" component={VerifiedPartsScreen} />
      <Stack.Screen name="TechnicalEnquiry" component={TechnicalEnquiryScreen} />
      <Stack.Screen name="Success" component={SuccessScreen} />
      <Stack.Screen name="DealerLocator" component={DealerLocatorScreen} />
      <Stack.Screen name="DealerLocatorScreen" component={DealerLocatorScreen} />
      <Stack.Screen name="MyEnquiries" component={MyEnquiriesScreen} />
      <Stack.Screen name='ResellerHome' component={ResellerHomeScreen} />
      <Stack.Screen name='DistributorHomeScreen' component={DistributorHomeScreen} />
      <Stack.Screen name="CustomDrawer" component={CustomDrawer} />
      <Stack.Screen name="Watchlist" component={MyFavoritesScreen} />
      <Stack.Screen name="Notifications" component={Notification} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VehiclesList" component={VehiclesListScreen} />
      <Stack.Screen name="vehiclesListScreen" component={VehiclesListScreen} />
      <Stack.Screen name="ModalsScreen" component={ModalsScreen} />
      <Stack.Screen name="CatalogSearch" component={PartsFinderScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>

  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    backgroundColor: '#C6122E', // Red background from image
    height: hp('10%'),
    borderTopLeftRadius: wp('8%'),
    borderTopRightRadius: wp('8%'),
    position: 'absolute',
    borderTopWidth: 0,
    paddingBottom: hp('2%'),
    paddingTop: hp('1%'),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tabBarLabel: {
    fontSize: wp('3%'),
    fontWeight: '600',
    marginBottom: hp('0.5%'),
  },
});

export default AppNavigator;
