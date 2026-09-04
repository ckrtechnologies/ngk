import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import DistributorHomeScreen from '../../../screens/Distributor/DistributorHomeScreen';
import DistributorProfileScreen from '../screens/DistributorProfileScreen';
import PartsFinderScreen from '../../../screens/PartsFinderScreen';
import VerifiedPartsScreen from '../../../screens/VerifiedPartsScreen';
import TechnicalEnquiryScreen from '../../../screens/TechnicalEnquiryScreen';
import MyEnquiriesScreen from '../../../screens/MyEnquiriesScreen';
import DealerLocatorScreen from '../../../screens/DealerLocatorScreen';
import CustomDrawer from '../../../screens/CustomDrawer';

const Stack = createStackNavigator();

export default function DistributorNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="DistributorHome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DistributorHome" component={DistributorHomeScreen} />
      <Stack.Screen name="DistributorHomeScreen" component={DistributorHomeScreen} />
      <Stack.Screen name="Profile" component={DistributorProfileScreen} />
      <Stack.Screen name="PartsFinder" component={PartsFinderScreen} />
      <Stack.Screen name="CatalogSearch" component={PartsFinderScreen} />
      <Stack.Screen name="VerifiedParts" component={VerifiedPartsScreen} />
      <Stack.Screen name="TechnicalEnquiry" component={TechnicalEnquiryScreen} />
      <Stack.Screen name="MyEnquiries" component={MyEnquiriesScreen} />
      <Stack.Screen name="DealerLocator" component={DealerLocatorScreen} />
      <Stack.Screen name="DealerLocatorScreen" component={DealerLocatorScreen} />
      <Stack.Screen name="CustomDrawer" component={CustomDrawer} />
    </Stack.Navigator>
  );
}
