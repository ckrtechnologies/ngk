import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import OwnerTabNavigator from './OwnerTabNavigator';
import OwnerProfileScreen from '../screens/OwnerProfileScreen';
import MyGarageScreen from '../../../screens/MyGarageScreen';
import PartsFinderScreen from '../../../screens/PartsFinderScreen';
import VerifiedPartsScreen from '../../../screens/VerifiedPartsScreen';
import TechnicalEnquiryScreen from '../../../screens/TechnicalEnquiryScreen';
import MyEnquiriesScreen from '../../../screens/MyEnquiriesScreen';
import DealerLocatorScreen from '../../../screens/DealerLocatorScreen';
import MyFavoritesScreen from '../../../screens/MyFavoritesScreen';
import Notification from '../../../screens/Notification';
import VehiclesListScreen from '../../../screens/vehiclesListScreen';
import ModalsScreen from '../../../screens/modalsScreen';
import SuccessScreen from '../../../screens/SuccessScreen';
import CustomDrawer from '../../../screens/CustomDrawer';

const Stack = createStackNavigator();

export default function OwnerNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="OwnerHome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="OwnerHome" component={OwnerTabNavigator} />
      <Stack.Screen name="Profile" component={OwnerProfileScreen} />
      <Stack.Screen name="MyGarage" component={MyGarageScreen} />
      <Stack.Screen name="PartsFinder" component={PartsFinderScreen} />
      <Stack.Screen name="CatalogSearch" component={PartsFinderScreen} />
      <Stack.Screen name="VerifiedParts" component={VerifiedPartsScreen} />
      <Stack.Screen name="TechnicalEnquiry" component={TechnicalEnquiryScreen} />
      <Stack.Screen name="MyEnquiries" component={MyEnquiriesScreen} />
      <Stack.Screen name="DealerLocator" component={DealerLocatorScreen} />
      <Stack.Screen name="DealerLocatorScreen" component={DealerLocatorScreen} />
      <Stack.Screen name="Watchlist" component={MyFavoritesScreen} />
      <Stack.Screen name="Notifications" component={Notification} />
      <Stack.Screen name="VehiclesList" component={VehiclesListScreen} />
      <Stack.Screen name="vehiclesListScreen" component={VehiclesListScreen} />
      <Stack.Screen name="ModalsScreen" component={ModalsScreen} />
      <Stack.Screen name="Success" component={SuccessScreen} />
      <Stack.Screen name="CustomDrawer" component={CustomDrawer} />
    </Stack.Navigator>
  );
}
