import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MessageSquare,
  ChevronRight,
  Send,
  X,
  Store,
  Plus,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { getEnquiryRedux } from '../redux/getData';
import { apiFunction } from '../apis/apiFunction';
import { addEnquiryMessageApi } from '../apis/api';
import AppHeader from '../components/common/AppHeader';

const MyEnquiriesScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { enquiry } = useSelector((state) => state.getData);

  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshEnquiries = useCallback(async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (userId) dispatch(getEnquiryRedux(userId));
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshEnquiries();
    setRefreshing(false);
  };

  useEffect(() => {
    refreshEnquiries();
  }, [refreshEnquiries]);

  const filterTabs = ['ALL', 'PENDING', 'IN PROGRESS', 'RESOLVED'];

  const getFilteredList = () => {
    if (!enquiry) return [];
    if (activeFilter === 'ALL') return enquiry;
    return enquiry.filter(
      (e) => (e.status || 'Pending').toUpperCase() === activeFilter
    );
  };

  const getStatusBadge = (status) => {
    const s = (status || 'Pending').toLowerCase();
    switch (s) {
      case 'resolved':
      case 'approved':
        return {
          bg: '#D1FAE5',
          color: '#059669',
          label: 'Resolved',
        };
      case 'in progress':
        return {
          bg: '#DBEAFE',
          color: '#2563EB',
          label: 'In Progress',
        };
      case 'closed':
        return {
          bg: '#F3F4F6',
          color: '#4B5563',
          label: 'Closed',
        };
      default:
        return {
          bg: '#FEF3C7',
          color: '#D97706',
          label: 'Pending',
        };
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    setSendingReply(true);
    const userId = await AsyncStorage.getItem('userId');
    const role = await AsyncStorage.getItem('role');

    const payload = {
      enquiryId: selectedTicket.id,
      senderId: userId,
      senderRole: role || 'owner',
      message: replyMessage.trim(),
    };

    try {
      const res = await apiFunction(addEnquiryMessageApi, [], payload, 'POST', false);
      setSendingReply(false);
      if (res?.success) {
        setReplyMessage('');
        Toast.show({ type: 'success', text1: 'Reply Sent' });
        refreshEnquiries();
        setSelectedTicket(null);
      }
    } catch (err) {
      setSendingReply(false);
      Toast.show({ type: 'error', text1: 'Failed to send reply' });
    }
  };

  const filtered = getFilteredList();

  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <AppHeader
        title="Technical Enquiries"
        subtitle={`${enquiry?.length || 0} Total Requests`}
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.newTicketHeaderBtn}
            onPress={() => navigation.navigate('TechnicalEnquiry')}
            activeOpacity={0.8}
          >
            <Plus size={15} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.newTicketHeaderBtnText}>New</Text>
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filterTabs.map((tab) => {
            const isSelected = activeFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabPill, isSelected && styles.tabPillSelected]}
                onPress={() => setActiveFilter(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    isSelected && styles.tabPillTextSelected,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#C6122E']}
            tintColor="#C6122E"
          />
        }
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MessageSquare size={32} color="#C6122E" />
            </View>
            <Text style={styles.emptyTitle}>No Enquiries Found</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any tickets matching the "{activeFilter}" filter.
            </Text>
          </View>
        ) : (
          <View style={styles.ticketList}>
            {filtered.map((item, idx) => {
              const statusStyle = getStatusBadge(item.status);
              return (
                <TouchableOpacity
                  key={item.id || idx}
                  style={styles.ticketCard}
                  onPress={() => setSelectedTicket(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.ticketTop}>
                    <Text style={styles.ticketId}>TICKET #{item.id || idx + 1}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusStyle.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: statusStyle.color },
                        ]}
                      >
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.partTitle} numberOfLines={1}>
                    {item.part_name || item.car_name || item.enquiry_details || 'Technical Support'}
                  </Text>

                  {item.part_number && (
                    <Text style={styles.partNo}>Part #: {item.part_number}</Text>
                  )}

                  <View style={styles.ticketFooter}>
                    <View style={styles.dealerInfo}>
                      <Store size={13} color="#6B7280" />
                      <Text style={styles.dealerName} numberOfLines={1}>
                        {item.dealer?.name || 'Assigned Reseller'}
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Ticket Detail & Thread Modal */}
      <Modal
        visible={!!selectedTicket}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTicket(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Ticket #{selectedTicket?.id}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {selectedTicket?.created_at
                    ? new Date(selectedTicket.created_at).toLocaleDateString()
                    : 'Recent'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedTicket(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Context Details */}
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>REQUEST DETAILS</Text>
                <Text style={styles.detailBody}>
                  {selectedTicket?.enquiry_details || 'No description provided.'}
                </Text>

                {selectedTicket?.image_url && (
                  <Image
                    source={{ uri: selectedTicket.image_url }}
                    style={styles.attachedImage}
                    resizeMode="cover"
                  />
                )}
              </View>

              {/* Reply Box */}
              <Text style={[styles.detailLabel, styles.replyMargin]}>
                SEND MESSAGE / REPLY
              </Text>
              <View style={styles.replyRow}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Type message to technical support..."
                  placeholderTextColor="#9CA3AF"
                  value={replyMessage}
                  onChangeText={setReplyMessage}
                />
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={handleSendReply}
                  disabled={sendingReply || !replyMessage.trim()}
                  activeOpacity={0.7}
                >
                  {sendingReply ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Send size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  tabPillSelected: {
    backgroundColor: '#C6122E',
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  tabPillTextSelected: {
    color: '#FFFFFF',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  ticketList: {
    gap: 12,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ticketId: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  partTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  partNo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 10,
    paddingTop: 8,
  },
  dealerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dealerName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailBody: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  attachedImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginTop: 10,
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: '#111827',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#C6122E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newTicketHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#C6122E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newTicketHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  replyMargin: {
    marginTop: 14,
  },
});

export default MyEnquiriesScreen;
