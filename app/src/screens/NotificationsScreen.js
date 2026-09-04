import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { ChevronLeft, Home, MessageSquare, Search, Settings } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = React.useState([
    {
      id: '1',
      title: 'TECHNICAL APPROVAL',
      description: 'Your enquiry ENQ-BB21 for part BKR6EIX-11 has been verified and approved.',
      time: '12M AGO',
      unread: true,
      icon: <MessageSquare size={wp('5%')} color="#D0142C" fill="#D0142C" />,
      iconBg: '#FFF1F3',
    },
    {
      id: '2',
      title: 'CATALOG UPDATE',
      description: '342 new part numbers for 2024 model year vehicles have been added to the database.',
      time: '2H AGO',
      unread: true,
      icon: <Search size={wp('5%')} color="#D0142C" />,
      iconBg: '#FFF1F3',
    },
    {
      id: '3',
      title: 'INVENTORY SYNC',
      description: 'Your local depot stock levels were successfully synchronized with the regional hub.',
      time: '5H AGO',
      unread: false,
      icon: <Settings size={wp('5%')} color="#D1D1D1" />,
      iconBg: '#F5F6FA',
    },
    {
      id: '4',
      title: 'NEW SERVICE GUIDE',
      description: 'Learn how to properly inspect Iridium IX plugs in high-performance engines.',
      time: '1D AGO',
      unread: false,
      icon: <Settings size={wp('5%')} color="#D1D1D1" />,
      iconBg: '#F5F6FA',
    },
  ]);

  const handleReadAll = () => {
    const updated = notifications.map((item) => ({
      ...item,
      unread: false,
    }));

    setNotifications(updated);
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#D0142C" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
          <ChevronLeft color="#FFFFFF" size={wp('7%')} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>NOTIFICATIONS</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.readAllButton}
            onPress={handleReadAll}
          >
            <Text style={styles.readAllText}>READ ALL</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('OwnerHome')} style={styles.homeIconButton}>
            <Home color="#D0142C" size={wp('5%')} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>LATEST UPDATES</Text>

        {notifications.map((item) => (
          <TouchableOpacity key={item.id} style={styles.notificationCard}>
            <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
              {item.icon}
            </View>

            <View style={styles.textContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{item.time}</Text>
                  {item.unread && <View style={styles.unreadDot} />}
                </View>
              </View>
              <Text style={styles.descriptionText}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  header: {
    backgroundColor: '#D0142C',
    height: hp('9%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
  },
  headerIconButton: {
    padding: wp('1%'),
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readAllButton: {
    marginRight: wp('4%'),
  },
  readAllText: {
    color: '#FFFFFF',
    fontSize: wp('3%'),
    fontWeight: 'bold',
  },
  homeIconButton: {
    backgroundColor: '#FFFFFF',
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('5%'),
  },
  sectionTitle: {
    fontSize: wp('3%'),
    fontWeight: 'bold',
    color: '#8E8E8E',
    marginTop: hp('2.5%'),
    marginBottom: hp('1.5%'),
    letterSpacing: 1,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('6%'),
    padding: wp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('4%'),
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
  },
  cardTitle: {
    fontSize: wp('3.8%'),
    fontWeight: 'bold',
    color: '#000000',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: wp('2.5%'),
    color: '#8E8E8E',
    fontWeight: 'bold',
    marginRight: wp('1.5%'),
  },
  unreadDot: {
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
    backgroundColor: '#D0142C',
  },
  descriptionText: {
    fontSize: wp('3%'),
    color: '#666666',
    lineHeight: hp('2%'),
  },
});

export default NotificationsScreen;
