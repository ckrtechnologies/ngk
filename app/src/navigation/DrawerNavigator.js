import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import OwnerHomeScreen from "../screens/OwnerHomeScreen";
import CustomDrawer from "../components/CustomDrawer";

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: true,
        drawerType: "slide",
      }}
    >
      <Drawer.Screen name="Home" component={OwnerHomeScreen} />
    </Drawer.Navigator>
  );
}