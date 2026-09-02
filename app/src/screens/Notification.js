import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, Home, Bell, BellOff, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { getMyselfRedux } from '../redux/getData';
import { apiFunction } from '../apis/apiFunction';
import { readNotificationsApi } from '../apis/api';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Toast from 'react-native-toast-message';

const Notification = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const { myself } = useSelector((state) => state.getData);
  const [loading, setLoading] = useState(false);

  const getMyself = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        dispatch(getMyselfRedux(userId));
      }
    } catch (e) {
      console.log('Error fetching user profile:', e);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!myself) {
      getMyself();
    }
  }, [myself, getMyself]);

  // Memoize all notifications, reversed to show the latest first
  const allNotifications = useMemo(() => {
    if (!myself?.notifications) return [];
    return [...myself.notifications].reverse();
  }, [myself]);

  // Filter out only unread notifications
  const unreadNotifications = useMemo(() => {
    if (!myself?.notifications) return [];
    return myself.notifications.filter((item) => item.isRead === false);
  }, [myself]);

  const markAllAsRead = async () => {
    if (unreadNotifications.length === 0) return;

    setLoading(true);
    try {
      const res = await apiFunction(readNotificationsApi, [myself?.id], {}, 'PUT', true);
      setLoading(false);

      if (res?.success) {
        Toast.show({
          type: 'success',
          text1: 'Notifications updated',
          text2: 'All notifications marked as read',
        });
        getMyself();
      } else {
        Toast.show({
          type: 'error',
          text1: res?.message || 'Failed to update notifications',
        });
      }
    } catch (error) {
      setLoading(false);
      console.log('Error marking notifications as read:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update notifications. Please try again.',
      });
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'JUST NOW';
    try {
      const date = new Date(timestamp);
      
      // Calculate relative time (e.g. "5M AGO", "2H AGO", "1D AGO")
      const seconds = Math.floor((new Date() - date) / 1000);
      
      if (seconds < 60) return 'JUST NOW';
      
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}M AGO`;
      
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}H AGO`;
      
      const days = Math.floor(hours / 24);
      if (days === 1) return '1D AGO';
      if (days < 30) return `${days}D AGO`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }).toUpperCase();
    } catch (e) {
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#C6122E" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
          <ChevronLeft color="#FFFFFF" size={wp('7%')} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>NOTIFICATIONS</Text>

        <View style={styles.headerRight}>
          {unreadNotifications.length > 0 && (
            <TouchableOpacity
              style={styles.readAllButton}
              onPress={markAllAsRead}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.readAllText}>READ ALL</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => navigation.navigate('OwnerHome')} style={styles.homeIconButton}>
            <Home color="#C6122E" size={wp('5%')} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>
          {unreadNotifications.length > 0 
            ? `${unreadNotifications.length} UNREAD UPDATE${unreadNotifications.length !== 1 ? 'S' : ''}` 
            : 'LATEST UPDATES'}
        </Text>

        {allNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <BellOff color="#D1D1D1" size={wp('8%')} />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>
              No notifications at the moment. We will notify you when there are new updates.
            </Text>
          </View>
        ) : (
          allNotifications.map((item, index) => (
            <View 
              key={index} 
              style={[
                styles.notificationCard, 
                !item.isRead && styles.unreadCard
              ]}
            >
              <View 
                style={[
                  styles.iconContainer, 
                  !item.isRead ? styles.unreadIconContainer : styles.readIconContainer
                ]}
              >
                <Bell size={wp('5%')} color={!item.isRead ? '#C6122E' : '#D1D1D1'} />
              </View>

              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text style={[styles.cardTitle, !item.isRead && styles.unreadTitle]}>
                    {!item.isRead ? 'NEW UPDATE' : 'NOTIFICATION'}
                  </Text>
                  <View style={styles.timeRow}>
                    <Clock size={wp('3%')} color="#8E8E8E" style={styles.timeIcon} />
                    <Text style={styles.timeText}>{formatTimestamp(item.timestamp)}</Text>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </View>
                </View>
                <Text style={[styles.descriptionText, !item.isRead && styles.unreadDescription]}>
                  {item.message}
                </Text>
              </View>
            </View>
          ))
        )}
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
    backgroundColor: '#C6122E',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  unreadCard: {
    borderColor: '#FFD1D6',
    backgroundColor: '#FFFDFD',
  },
  iconContainer: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('4%'),
  },
  unreadIconContainer: {
    backgroundColor: '#FFF1F3',
  },
  readIconContainer: {
    backgroundColor: '#F5F6FA',
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
    fontSize: wp('3.2%'),
    fontWeight: 'bold',
    color: '#8E8E8E',
    letterSpacing: 0.5,
  },
  unreadTitle: {
    color: '#C6122E',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: wp('1%'),
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
    backgroundColor: '#C6122E',
  },
  descriptionText: {
    fontSize: wp('3%'),
    color: '#666666',
    lineHeight: hp('2.2%'),
  },
  unreadDescription: {
    color: '#000000',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp('10%'),
    paddingHorizontal: wp('10%'),
  },
  emptyIconContainer: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('10%'),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('3%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: hp('1%'),
  },
  emptySubtitle: {
    fontSize: wp('3%'),
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: hp('2.2%'),
  },
});

export default Notification;