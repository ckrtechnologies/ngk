import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { ChevronLeft, Home, ArrowRight, PlusCircle, Send, CheckCircle, XCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { getEnquiryRedux, getMyselfRedux } from '../redux/getData';
import { apiFunction } from '../apis/apiFunction';
import { updateEnquiryStatusApi, addEnquiryMessageApi } from '../apis/api';

const MyEnquiriesScreen = () => {
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const { enquiry, myself } = useSelector((state) => state.getData);
  const [chatVisible, setChatVisible] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [message, setMessage] = useState("");
  const [userRole, setUserRole] = useState("owner");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const getInitialData = async () => {
      const userId = await AsyncStorage.getItem("userId");
      const role = await AsyncStorage.getItem("role");
      if (role) setUserRole(role);

      dispatch(getEnquiryRedux(userId));
      dispatch(getMyselfRedux(userId));
    };

    getInitialData();
  }, [dispatch]);

  const filteredEnquiries = enquiry?.filter(item => {
    const v = item.vehicle || {};
    const status = v.status || item.status || 'Pending';
    if (activeFilter === 'ALL') return true;
    return status.toUpperCase() === activeFilter;
  });

  console.log(enquiry, "enquiry data")

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved': return styles.approvedBadge;
      case 'Pending': return styles.pendingBadge;
      case 'Resolved': return styles.resolvedBadge;
      case 'Rejected': return styles.rejectedBadge;
      default: return styles.pendingBadge;
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedEnquiry) return;
    setUpdatingStatus(true);
    try {
      const body = {
        status: newStatus,
        responderName: myself?.name || (userRole === 'distributor' ? 'Distributor Admin' : 'Reseller Support'),
        role: userRole
      };

      const res = await apiFunction(`${updateEnquiryStatusApi}/${selectedEnquiry.id}`, [], body, "PUT", false);

      if (res?.success) {
        Toast.show({
          type: 'success',
          text1: `Enquiry ${newStatus}`,
        });
        const userId = await AsyncStorage.getItem("userId");
        dispatch(getEnquiryRedux(userId));
        setSelectedEnquiry(res.enquiry[0]);
      } else {
        Toast.show({
          type: 'error',
          text1: res?.message || 'Failed to update status',
        });
      }
    } catch (error) {
      console.log("Error updating status:", error);
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
      });
    }
    setUpdatingStatus(false);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedEnquiry) return;
    setSendingMessage(true);
    try {
      const body = {
        sender: userRole,
        senderName: myself?.name || (userRole === 'owner' ? 'Owner' : userRole === 'distributor' ? 'Distributor' : 'Reseller'),
        text: message
      };

      const res = await apiFunction(`${addEnquiryMessageApi}/${selectedEnquiry.id}`, [], body, "POST", false);

      if (res?.success) {
        setMessage("");
        const userId = await AsyncStorage.getItem("userId");
        dispatch(getEnquiryRedux(userId));
        setSelectedEnquiry(res.enquiry[0]);
      } else {
        Toast.show({
          type: 'error',
          text1: res?.message || 'Failed to send message',
        });
      }
    } catch (error) {
      console.log("Error sending message:", error);
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
      });
    }
    setSendingMessage(false);
  };

  // Helper to extract unpacked or packed vehicle data
  const getSelectedVehicleData = (enq) => {
    if (!enq) return {};
    return enq.vehicle || {};
  };

  const selectedV = getSelectedVehicleData(selectedEnquiry);
  const selectedStatus = selectedV.status || selectedEnquiry?.status || 'Pending';
  const selectedMessages = selectedV.messages || selectedEnquiry?.messages || [];
  const selectedPart = selectedV.part;
  const selectedVehicleObj = selectedV.vehicle;
  const selectedQuantity = selectedV.quantity || 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#FFFFFF" size={wp('6%')} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userRole === 'owner' ? 'MY ENQUIRIES' : 'ENQUIRIES INBOX'}</Text>
        <TouchableOpacity style={styles.homeIconContainer} onPress={() => navigation.navigate(userRole === 'owner' ? 'OwnerHome' : userRole === 'reseller' ? 'ResellerHome' : 'DistributorHomeScreen')}>
          <Home color="#C6122E" size={wp('5%')} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['ALL', 'APPROVED', 'PENDING', 'RESOLVED', 'REJECTED'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, activeFilter === filter && styles.activeFilterTab]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterTabText, activeFilter === filter && styles.activeFilterTabText]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionLabel}>{userRole === 'owner' ? 'YOUR ENQUIRIES' : 'ALL RECEIVED ENQUIRIES'}</Text>

        {filteredEnquiries?.map((item, index) => {
          const v = item.vehicle || {};
          const status = v.status || item.status || 'Pending';
          const title = v.title || item.title || 'Technical Enquiry';
          const description = v.description || item.description || 'No details available';
          const date = item.enquiryDate ? new Date(item.enquiryDate).toLocaleDateString() : (item.created_at ? new Date(item.created_at).toLocaleDateString() : '');

          return (
            <View key={index} style={styles.enquiryCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.enqId}>ENQ-{item.id}</Text>
                <View style={[styles.statusBadge, getStatusStyle(status)]}>
                  <Text style={styles.statusText}>{status.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.enqTitle}>{title}</Text>
              <Text style={styles.enqDesc}>{description}</Text>

              {userRole !== 'owner' && item.users && (
                <Text style={styles.enqAuthor}>From: {item.users.name} ({item.users.email})</Text>
              )}

              <View style={styles.cardSeparator} />

              <View style={styles.cardFooter}>
                <Text style={styles.enqDate}>{date}</Text>
                <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => {
                  setSelectedEnquiry(item);
                  setChatVisible(true);
                }}>
                  <Text style={styles.viewDetailsText}>VIEW DETAILS</Text>
                  <ArrowRight color={status === 'Resolved' ? '#C6122E' : '#000000'} size={wp('4%')} style={{ marginLeft: wp('1%') }} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {!filteredEnquiries?.length && (
          <View style={{ padding: hp('5%'), alignItems: 'center' }}>
            <Text style={{ fontSize: wp('4%'), color: '#8E8E8E' }}>No enquiries found.</Text>
          </View>
        )}

        <View style={{ height: hp('15%') }} />
      </ScrollView>

      {/* Fixed Bottom Button Container (Only for Owner) */}
      {userRole === 'owner' && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => navigation.navigate('TechnicalEnquiry')}
          >
            <PlusCircle color="#FFFFFF" size={wp('5%')} />
            <Text style={styles.submitBtnText}>SUBMIT NEW ENQUIRY</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dynamic Enquiry Details & Chat Modal */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.chatBox}>

            {/* Modal Header */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderTitleRow}>
                <Text style={styles.chatTitle}>ENQ-{selectedEnquiry?.id}</Text>
                <View style={[styles.statusBadgeSmall, getStatusStyle(selectedStatus)]}>
                  <Text style={styles.statusTextSmall}>{selectedStatus.toUpperCase()}</Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setChatVisible(false)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>

            {/* Enquiry Specifications Section */}
            <View style={styles.specsContainer}>
              <Text style={styles.specsSectionTitle}>ENQUIRY SUMMARY</Text>
              <Text style={styles.specItem}><Text style={styles.specLabel}>Target:</Text> {selectedV.title || selectedEnquiry?.title || 'Technical Enquiry'}</Text>
              <Text style={styles.specItem}><Text style={styles.specLabel}>Details:</Text> {selectedV.description || selectedEnquiry?.description || 'None'}</Text>
              <Text style={styles.specItem}><Text style={styles.specLabel}>Quantity Required:</Text> {selectedQuantity}</Text>

              {selectedPart && (
                <Text style={styles.specItem}><Text style={styles.specLabel}>Part Ref:</Text> {selectedPart.partNumber || selectedPart.subtitle || 'N/A'}</Text>
              )}
              {selectedVehicleObj && (
                <Text style={styles.specItem}><Text style={styles.specLabel}>Vehicle Make:</Text> {selectedVehicleObj.manuName || selectedVehicleObj.make || 'N/A'}</Text>
              )}
            </View>

            {/* Reseller / Distributor Action Buttons (Approve / Reject) */}
            {userRole !== 'owner' && selectedStatus === 'Pending' && (
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleUpdateStatus('Approved')}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? <ActivityIndicator color="#FFFFFF" size="small" /> : (
                    <>
                      <CheckCircle color="#FFFFFF" size={wp('4.5%')} />
                      <Text style={styles.actionBtnText}>APPROVE</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleUpdateStatus('Rejected')}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? <ActivityIndicator color="#FFFFFF" size="small" /> : (
                    <>
                      <XCircle color="#FFFFFF" size={wp('4.5%')} />
                      <Text style={styles.actionBtnText}>REJECT</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Chat Messages */}
            <ScrollView style={styles.messagesScroll}>
              {selectedMessages.map((msg, idx) => {
                const isMe = msg.sender === userRole || (userRole === 'owner' && msg.sender === 'owner');
                if (msg.isSystem) {
                  return (
                    <View key={idx} style={styles.systemMessage}>
                      <Text style={styles.systemMsgText}>{msg.text}</Text>
                      <Text style={styles.msgTime}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  );
                }

                return (
                  <View key={idx} style={isMe ? styles.messageRight : styles.messageLeft}>
                    <Text style={styles.msgAuthor}>{msg.senderName || msg.sender}</Text>
                    <Text style={isMe ? styles.msgTextRight : styles.msgTextLeft}>{msg.text}</Text>
                    <Text style={isMe ? styles.msgTimeRight : styles.msgTimeLeft}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            {/* Chat Input Container */}
            <View style={styles.chatInputContainer}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Type your response..."
                placeholderTextColor="#A0A0A0"
                style={styles.chatInput}
              />

              <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} disabled={sendingMessage}>
                {sendingMessage ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Send color="#FFFFFF" size={18} />}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    backgroundColor: '#C6122E',
    height: hp('8%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
  },
  homeIconContainer: {
    backgroundColor: '#FFFFFF',
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterScroll: {
    paddingHorizontal: wp('4%'),
  },
  filterTab: {
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('8%'),
    backgroundColor: '#F5F6FA',
    marginRight: wp('3%'),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeFilterTab: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterTabText: {
    fontSize: wp('2.8%'),
    color: '#8E8E8E',
    fontWeight: 'bold',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: wp('6%'),
    paddingTop: hp('3%'),
  },
  sectionLabel: {
    fontSize: wp('2.8%'),
    color: '#8E8E8E',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: hp('2%'),
    textTransform: 'uppercase',
  },
  enquiryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('8%'),
    padding: wp('6%'),
    marginBottom: hp('2.5%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  enqId: {
    fontSize: wp('2.8%'),
    color: '#C6122E',
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
  },
  approvedBadge: {
    backgroundColor: '#2E8B57',
  },
  pendingBadge: {
    backgroundColor: '#D97706',
  },
  resolvedBadge: {
    backgroundColor: '#1E40AF',
  },
  rejectedBadge: {
    backgroundColor: '#DC2626',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: wp('2.4%'),
    fontWeight: 'bold',
  },
  enqTitle: {
    fontSize: wp('5%'),
    fontWeight: '900',
    color: '#000000',
    marginBottom: hp('1%'),
  },
  enqDesc: {
    fontSize: wp('3.2%'),
    color: '#6B7280',
    lineHeight: wp('5%'),
    fontStyle: 'italic',
    marginBottom: hp('1.5%'),
  },
  enqAuthor: {
    fontSize: wp('2.8%'),
    color: '#374151',
    fontWeight: '600',
    marginBottom: hp('1.5%'),
  },
  cardSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: hp('1.5%'),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  enqDate: {
    fontSize: wp('2.5%'),
    color: '#9CA3AF',
    fontWeight: '700',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: wp('2.8%'),
    color: '#000000',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('6%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('4%'),
    borderTopLeftRadius: wp('10%'),
    borderTopRightRadius: wp('10%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  submitBtn: {
    backgroundColor: '#C6122E',
    borderRadius: wp('5%'),
    height: hp('8%'),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: wp('3.5%'),
    fontWeight: 'bold',
    marginLeft: wp('2%'),
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  chatBox: {
    height: hp('85%'),
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: wp('8%'),
    borderTopRightRadius: wp('8%'),
    paddingHorizontal: wp('6%'),
    paddingTop: hp('3%'),
    paddingBottom: hp('4%'),
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: hp('1.5%'),
  },
  chatHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatTitle: {
    fontWeight: '900',
    fontSize: wp('4.5%'),
    color: '#000000',
    marginRight: wp('3%'),
  },
  statusBadgeSmall: {
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.4%'),
    borderRadius: wp('1.5%'),
  },
  statusTextSmall: {
    color: '#FFFFFF',
    fontSize: wp('2.2%'),
    fontWeight: 'bold',
  },
  closeBtnText: {
    fontWeight: 'bold',
    fontSize: wp('3.5%'),
    color: '#C6122E',
  },
  specsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  specsSectionTitle: {
    fontSize: wp('2.5%'),
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: hp('1%'),
    letterSpacing: 0.5,
  },
  specItem: {
    fontSize: wp('3.2%'),
    color: '#1F2937',
    marginBottom: hp('0.5%'),
  },
  specLabel: {
    fontWeight: 'bold',
    color: '#4B5563',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: hp('6.5%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: wp('1%'),
  },
  approveBtn: {
    backgroundColor: '#2E8B57',
  },
  rejectBtn: {
    backgroundColor: '#DC2626',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: wp('3.2%'),
    fontWeight: 'bold',
    marginLeft: wp('2%'),
    letterSpacing: 0.5,
  },
  messagesScroll: {
    flex: 1,
    marginBottom: hp('2%'),
  },
  systemMessage: {
    backgroundColor: '#FEF3C7',
    padding: wp('3%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
    marginVertical: hp('1%'),
    alignSelf: 'center',
    width: '90%',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  systemMsgText: {
    color: '#92400E',
    fontSize: wp('3%'),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  messageLeft: {
    backgroundColor: '#F1F5F9',
    padding: wp('3.5%'),
    borderRadius: wp('4%'),
    borderTopLeftRadius: wp('1%'),
    marginBottom: hp('1.5%'),
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageRight: {
    backgroundColor: '#C6122E',
    padding: wp('3.5%'),
    borderRadius: wp('4%'),
    borderTopRightRadius: wp('1%'),
    marginBottom: hp('1.5%'),
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  msgAuthor: {
    fontSize: wp('2.5%'),
    fontWeight: 'bold',
    color: '#94A3B8',
    marginBottom: hp('0.5%'),
  },
  msgTextLeft: {
    color: '#0f172a',
    fontSize: wp('3.5%'),
  },
  msgTextRight: {
    color: '#FFFFFF',
    fontSize: wp('3.5%'),
  },
  msgTimeLeft: {
    fontSize: wp('2.2%'),
    color: '#94A3B8',
    alignSelf: 'flex-end',
    marginTop: hp('0.5%'),
  },
  msgTimeRight: {
    fontSize: wp('2.2%'),
    color: '#F1F5F9',
    alignSelf: 'flex-end',
    marginTop: hp('0.5%'),
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingTop: hp('1.5%'),
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: wp('6%'),
    paddingHorizontal: wp('4%'),
    height: hp('6.5%'),
    fontSize: wp('3.5%'),
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    backgroundColor: '#C6122E',
    width: hp('6.5%'),
    height: hp('6.5%'),
    borderRadius: hp('3.25%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp('2.5%'),
  }
});

export default MyEnquiriesScreen;
