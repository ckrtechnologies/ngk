import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, PermissionsAndroid } from "react-native";
import { Home, Heart, Search, Settings, LogOut, MessageSquare, Truck, Camera } from "lucide-react-native";
import * as ImagePicker from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { getMyselfRedux } from "../redux/getData";

export default function CustomDrawer({ navigation }) {
  const [Avatar, setAvatar] = React.useState(null);
  const {myself} = useSelector((state) => state.getData);
  const dispatch = useDispatch()

  useEffect(() => {
    if (!myself) {
      dispatch(getMyselfRedux())
    }
  }, [dispatch]);

  const requestGalleryPermission = async () => {
    if (Platform.OS === "android") {
      try {

        const permission =
          Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const granted = await PermissionsAndroid.request(permission);

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else {
          console.log("Permission denied");
          return false;
        }

      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };
  const AvatarHandler = async () => {

    const hasPermission = await requestGalleryPermission();

    if (!hasPermission) {
      alert("Gallery permission required!");

      return;

    }

    try {
      const result = await ImagePicker.launchImageLibrary({
        mediaType: "photo",
        includeBase64: false,
      });

      if (result.didCancel) {
        console.log("User cancelled image picker");
      } else if (result.errorCode) {
        console.log("ImagePicker Error: ", result.errorMessage);
      } else {
        setAvatar(result.assets[0].uri);
      }

    } catch (error) {
      console.log("ImagePicker error:", error);
    }
  };

  const handleLogout = () => {
    AsyncStorage.removeItem("userId");
    AsyncStorage.removeItem("role");
    AsyncStorage.removeItem("apiKey");
    navigation.replace("RoleSelection");
  };

  const MenuItem = ({ icon, title, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      {icon}
      <Text style={styles.menuText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      {/* Profile */}
      <View style={styles.profileSection}>

        <TouchableOpacity onPress={AvatarHandler}>

          <Image
            source={Avatar ? { uri: Avatar } : { uri: "https://i.pravatar.cc/100" }}
            style={styles.avatar}
          />

          {/* Edit Icon */}
          <View style={styles.editIcon}>
            <Camera size={12} color="#fff" />
          </View>

        </TouchableOpacity>
        <Text style={styles.name}>{myself?.name}</Text>
        <Text style={styles.role}>{myself?.role}</Text>
      </View>

      {/* Navigation */}
      <Text style={styles.section}>Navigation</Text>

      <MenuItem
        icon={<Home color="#fff" size={20} />}
        title="Home"
        onPress={() => navigation.navigate("OwnerHome")}
      />

      <MenuItem
        icon={<Truck color="#fff" size={20} />}
        title="Garage"
        onPress={() => navigation.navigate("MyGarage")}
      />

      {/* Catalog */}
      <Text style={styles.section}>Catalog</Text>

      <MenuItem
        icon={<Search color="#fff" size={20} />}
        title="Parts Finder"
        onPress={() => navigation.navigate("PartsFinder")}
      />

      <MenuItem
        icon={<Heart color="#fff" size={20} />}
        title="Watchlist"
        onPress={() => navigation.navigate("Watchlist")}
      />

      {/* Support */}
      <Text style={styles.section}>Support</Text>

      <MenuItem
        icon={<MessageSquare color="#fff" size={20} />}
        title="Enquiries"
        onPress={() => navigation.navigate("MyEnquiries")}
      />

      {/* More */}
      <Text style={styles.section}>More</Text>

      <MenuItem
        icon={<Settings color="#fff" size={20} />}
        title="Settings"
      />

      <MenuItem
        icon={<LogOut color="#fff" size={20} />}
        onPress={handleLogout}
        title="Sign Out"

      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    padding: 20,
  },

  profileSection: {
    alignItems: "center",
    marginBottom: 30,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 10,
  },

  name: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  role: {
    color: "#EF4444",
    fontSize: 12,
  },

  section: {
    color: "#9CA3AF",
    marginTop: 20,
    marginBottom: 10,
    fontWeight: "600",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  menuText: {
    color: "#fff",
    marginLeft: 15,
    fontSize: 14,
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#EF4444",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  }
});