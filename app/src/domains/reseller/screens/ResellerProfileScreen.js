import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Mail,
  MapPin,
  ChevronRight,
  LogOut,
  MessageSquare,
  Wrench,
  CheckCircle2,
  Clock,
  Pencil,
  Phone,
  User,
  X,
  Check,
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  getMyselfRedux,
  getEnquiryRedux,
  updateUserRedux,
} from '../../../redux/getData';
import { useAuth } from '../../../core/auth/AuthContext';
import Toast from 'react-native-toast-message';

export default function ResellerProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { myself, enquiry } = useSelector((state) => state.getData);
  const { signOut } = useAuth();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Workshop & Reseller edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const userId = myself?.id;
      if (userId) {
        dispatch(getMyselfRedux(userId));
        dispatch(getEnquiryRedux(userId));
      }
    };
    loadProfile();
  }, [dispatch, myself?.id]);

  const openEditModal = () => {
    setEditName(myself?.name || '');
    setEditEmail(myself?.email || '');
    setEditPhone(myself?.phone || '');
    setEditAddress(myself?.address || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim().toLowerCase();
    const trimmedPhone = editPhone.trim();
    const trimmedAddress = editAddress.trim();

    if (!trimmedName || trimmedName.length < 2) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Full name must be at least 2 characters.',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please provide a valid email address.',
      });
      return;
    }

    const userId = myself?.id;
    if (!userId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User session not found.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone || null,
        address: trimmedAddress || null,
      };

      const result = await dispatch(
        updateUserRedux({ userId, userData: payload })
      ).unwrap();

      if (result) {
        Toast.show({
          type: 'success',
          text1: 'Profile Updated',
          text2: 'Workshop credentials have been saved.',
        });
        setEditModalVisible(false);
        dispatch(getMyselfRedux(userId));
      } else {
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: 'Could not update profile. Please try again.',
        });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: err?.message || 'Failed to update profile',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const userName = myself?.name || '';
  const userEmail = myself?.email || '';
  const userPhone = myself?.phone || '';
  const userAddress = myself?.address || '';
  const enquiriesCount = enquiry?.length || 0;

  const getInitials = (name) => {
    if (!name || !name.trim()) return 'RW';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#C6122E" />

      {/* Solid Crimson Header */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Reseller Profile</Text>
          <Text style={styles.headerSubtitle}>NGK TRADE & WORKSHOP</Text>
        </View>

        <TouchableOpacity
          style={styles.headerEditBtn}
          onPress={openEditModal}
          activeOpacity={0.75}
        >
          <Pencil size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Executive Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardTop}>
            <View style={styles.monogramBadge}>
              <Text style={styles.monogramText}>{getInitials(userName)}</Text>
            </View>

            <View style={styles.profileInfoCol}>
              <Text style={styles.profileName} numberOfLines={1}>
                {userName || 'Workshop Partner'}
              </Text>
              <View style={styles.roleRow}>
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>RESELLER & WORKSHOP</Text>
                </View>
                {myself?.is_approved !== false && myself?.approval_status !== 'pending_approval' ? (
                  <View style={styles.verifiedRow}>
                    <CheckCircle2 size={13} color="#10B981" />
                    <Text style={styles.verifiedLabel}>Live & Approved</Text>
                  </View>
                ) : (
                  <View style={[styles.verifiedRow, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}>
                    <Clock size={13} color="#D97706" />
                    <Text style={[styles.verifiedLabel, { color: '#B45309' }]}>Pending Approval</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Quick Edit CTA Pill */}
          <TouchableOpacity
            style={styles.editPillBtn}
            onPress={openEditModal}
            activeOpacity={0.75}
          >
            <Pencil size={14} color="#C6122E" />
            <Text style={styles.editPillText}>Edit Workshop Details</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Review Informational Banner */}
        {(myself?.is_approved === false || myself?.approval_status === 'pending_approval') && (
          <View style={styles.pendingNoticeCard}>
            <View style={styles.pendingNoticeIconBox}>
              <Clock size={18} color="#B45309" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingNoticeTitle}>Awaiting Admin Approval</Text>
              <Text style={styles.pendingNoticeBody}>
                Your reseller account is currently being vetted by NGK administration. Once verified, your workshop will automatically be activated on the live Authorized Stockists directory.
              </Text>
            </View>
          </View>
        )}

        {/* Account Details Section (Includes Workshop Location) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>WORKSHOP CREDENTIALS</Text>
            <TouchableOpacity onPress={openEditModal} activeOpacity={0.7}>
              <Text style={styles.sectionEditLink}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Full Name Item */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconWrapper}>
              <User size={16} color="#4B5563" />
            </View>
            <View style={styles.detailTextWrapper}>
              <Text style={styles.detailLabel}>Workshop Representative</Text>
              <Text style={styles.detailValue}>{userName || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Email Item */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconWrapper}>
              <Mail size={16} color="#4B5563" />
            </View>
            <View style={styles.detailTextWrapper}>
              <Text style={styles.detailLabel}>Trade Email</Text>
              <Text style={styles.detailValue}>{userEmail || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Phone Item */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconWrapper}>
              <Phone size={16} color="#4B5563" />
            </View>
            <View style={styles.detailTextWrapper}>
              <Text style={styles.detailLabel}>Direct Workshop Phone</Text>
              <Text style={styles.detailValue}>{userPhone || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Workshop Location Item */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconWrapper}>
              <MapPin size={16} color="#4B5563" />
            </View>
            <View style={styles.detailTextWrapper}>
              <Text style={styles.detailLabel}>Operating Workshop Location</Text>
              <Text style={styles.detailValue}>{userAddress || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* Technical Direct Access */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>TRADE SERVICES</Text>

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation.navigate('MyEnquiries')}
            activeOpacity={0.7}
          >
            <View style={styles.navIconBadgeGreen}>
              <MessageSquare size={16} color="#059669" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Commercial Quotes & Enquiries</Text>
              <Text style={styles.navSubtitle}>
                {enquiriesCount} active technical requests & commercial inquiries
              </Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation.navigate('PartsFinder')}
            activeOpacity={0.7}
          >
            <View style={styles.navIconBadgeRed}>
              <Wrench size={16} color="#C6122E" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>TecDoc Parts & Catalog</Text>
              <Text style={styles.navSubtitle}>
                Batch lookup & OEM fitment verification
              </Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          NGK SPARK PLUGS (PTY) LTD • TRADE & RESELLER NETWORK
        </Text>
      </ScrollView>

      {/* Edit Workshop Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setEditModalVisible(false)}
          />
          <View
            style={[
              styles.modalContainer,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Workshop Details</Text>
                <Text style={styles.modalSubtitle}>
                  Update your contact & workshop location
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.7}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Name Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Workshop Representative</Text>
                <View style={styles.inputWrapper}>
                  <User size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter full name"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Trade Email</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="Enter email address"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Phone Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Workshop Phone</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="Enter phone number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Workshop / Location Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Workshop Operating Address</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <MapPin
                    size={18}
                    color="#9CA3AF"
                    style={[styles.inputIcon, styles.textAreaIcon]}
                  />
                  <TextInput
                    style={[styles.textInput, styles.textAreaInput]}
                    value={editAddress}
                    onChangeText={setEditAddress}
                    placeholder="Enter workshop address"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
                disabled={isSaving}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSaveBtn,
                  isSaving && styles.modalSaveBtnDisabled,
                ]}
                onPress={handleSaveProfile}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={18} color="#FFFFFF" style={styles.saveIcon} />
                    <Text style={styles.modalSaveText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    backgroundColor: '#C6122E',
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  headerEditBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  monogramBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#C6122E',
    borderWidth: 2,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#C6122E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  monogramText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileInfoCol: {
    flex: 1,
  },
  profileName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rolePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.4,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  editPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 10,
  },
  editPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
  },
  sectionEditLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C6122E',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTextWrapper: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  navIconBadgeGreen: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  navIconBadgeRed: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  navTextCol: {
    flex: 1,
    marginRight: 8,
  },
  navTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  navSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  footerNote: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalScrollContent: {
    paddingBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  textAreaIcon: {
    marginTop: 4,
  },
  textAreaInput: {
    height: 72,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  modalSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#C6122E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C6122E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  modalSaveBtnDisabled: {
    opacity: 0.65,
  },
  saveIcon: {
    marginRight: 6,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pendingNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  pendingNoticeIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pendingNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 3,
  },
  pendingNoticeBody: {
    fontSize: 11,
    fontWeight: '500',
    color: '#B45309',
    lineHeight: 16,
  },
});
