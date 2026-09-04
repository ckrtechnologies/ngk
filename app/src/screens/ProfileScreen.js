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
  Briefcase,
  ChevronRight,
  LogOut,
  Car,
  MessageSquare,
  Wrench,
  CheckCircle2,
  Pencil,
  Phone,
  User,
  X,
  Check,
  Trash2,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import {
  getMyselfRedux,
  getEnquiryRedux,
  updateUserRedux,
  deleteUserRedux,
} from '../redux/getData';
import Toast from 'react-native-toast-message';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { myself, enquiry } = useSelector((state) => state.getData);

  const [role, setRole] = useState('owner');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const storedRole = await AsyncStorage.getItem('role');
      const userId = await AsyncStorage.getItem('userId');
      if (storedRole) setRole(storedRole);
      if (userId) {
        dispatch(getMyselfRedux(userId));
        dispatch(getEnquiryRedux(userId));
      }
    };
    loadProfile();
  }, [dispatch]);

  // Sync form state when modal opens or myself updates
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
          text2: 'Your account credentials have been saved.',
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
        text2: err?.message || 'Failed to update user profile',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'userId', 'role', 'user']);
    Toast.show({ type: 'success', text1: 'Signed Out Successfully' });
    navigation.reset({
      index: 0,
      routes: [{ name: 'RoleSelection' }],
    });
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account and all associated vehicles, enquiries, and data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            const userId = myself?.id;
            if (userId) {
              await dispatch(deleteUserRedux(userId));
            }
            await AsyncStorage.multiRemove(['token', 'userId', 'role', 'user']);
            Toast.show({
              type: 'info',
              text1: 'Account Deleted',
              text2: 'Your account has been deleted from our system.',
            });
            navigation.reset({
              index: 0,
              routes: [{ name: 'RoleSelection' }],
            });
          },
        },
      ]
    );
  };

  const userName = myself?.name || '';
  const userEmail = myself?.email || '';
  const userPhone = myself?.phone || '';
  const userAddress = myself?.address || '';
  const userRole = (myself?.role || role || 'owner').toLowerCase();
  const carsCount =
    myself?.garage?.length ||
    myself?.cars?.length ||
    myself?.vehicleId?.length ||
    0;
  const enquiriesCount = enquiry?.length || 0;

  // Generate 2-letter initials monogram without image CDN
  const getInitials = (name) => {
    if (!name || !name.trim()) return 'U';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleLabel = (r) => {
    switch (r) {
      case 'reseller':
        return 'Authorized Reseller & Workshop';
      case 'distributor':
        return 'Wholesale Distribution Partner';
      case 'admin':
        return 'System Administrator';
      default:
        return 'Vehicle Owner & Fleet Operator';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#D0142C" />

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
          <Text style={styles.headerTitle}>Account Profile</Text>
          <Text style={styles.headerSubtitle}>NGK TECHNICAL NETWORK</Text>
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
        {/* Executive Profile Card (No CDN Image, No Client ID) */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardTop}>
            {/* Monogram Badge */}
            <View style={styles.monogramBadge}>
              <Text style={styles.monogramText}>{getInitials(userName)}</Text>
            </View>

            <View style={styles.profileInfoCol}>
              <Text style={styles.profileName} numberOfLines={1}>
                {userName || 'Account User'}
              </Text>
              <View style={styles.roleRow}>
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>
                    {userRole.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.verifiedRow}>
                  <CheckCircle2 size={13} color="#10B981" />
                  <Text style={styles.verifiedLabel}>Verified Account</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Edit CTA Pill */}
          <TouchableOpacity
            style={styles.editPillBtn}
            onPress={openEditModal}
            activeOpacity={0.75}
          >
            <Pencil size={14} color="#D0142C" />
            <Text style={styles.editPillText}>Edit Profile Details</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid (Clean 2-card layout, No OEM) */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('MyGarage')}
            activeOpacity={0.75}
          >
            <View style={styles.statIconBadgeBlue}>
              <Car size={20} color="#2563EB" />
            </View>
            <Text style={styles.statNumber}>{carsCount}</Text>
            <Text style={styles.statLabel}>Garage Fleet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('MyEnquiries')}
            activeOpacity={0.75}
          >
            <View style={styles.statIconBadgeGreen}>
              <MessageSquare size={20} color="#059669" />
            </View>
            <Text style={styles.statNumber}>{enquiriesCount}</Text>
            <Text style={styles.statLabel}>Tech Enquiries</Text>
          </TouchableOpacity>
        </View>

        {/* Account Details Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>ACCOUNT CREDENTIALS</Text>
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
              <Text style={styles.detailLabel}>Full Name</Text>
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
              <Text style={styles.detailLabel}>Email Address</Text>
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
              <Text style={styles.detailLabel}>Phone Number</Text>
              <Text style={styles.detailValue}>{userPhone || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Address Item */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconWrapper}>
              <MapPin size={16} color="#4B5563" />
            </View>
            <View style={styles.detailTextWrapper}>
              <Text style={styles.detailLabel}>Location / Workshop</Text>
              <Text style={styles.detailValue}>{userAddress || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Role Item */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconWrapper}>
              <Briefcase size={16} color="#4B5563" />
            </View>
            <View style={styles.detailTextWrapper}>
              <Text style={styles.detailLabel}>Platform Role</Text>
              <Text style={styles.detailValue}>{getRoleLabel(userRole)}</Text>
            </View>
          </View>
        </View>

        {/* Technical Direct Access */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>CONNECTED SERVICES</Text>

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation.navigate('MyGarage')}
            activeOpacity={0.7}
          >
            <View style={styles.navIconBadgeBlue}>
              <Car size={16} color="#2563EB" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Manage Garage Fleet</Text>
              <Text style={styles.navSubtitle}>
                Add or remove vehicles for exact fitment lookup
              </Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation.navigate('MyEnquiries')}
            activeOpacity={0.7}
          >
            <View style={styles.navIconBadgeGreen}>
              <MessageSquare size={16} color="#059669" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>Technical Enquiries & Support</Text>
              <Text style={styles.navSubtitle}>
                Review expert engineering advice & quote requests
              </Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation.navigate('CatalogSearch')}
            activeOpacity={0.7}
          >
            <View style={styles.navIconBadgeRed}>
              <Wrench size={16} color="#D0142C" />
            </View>
            <View style={styles.navTextCol}>
              <Text style={styles.navTitle}>TecDoc Parts & Catalog</Text>
              <Text style={styles.navSubtitle}>
                Instant part verification across 50,000+ items
              </Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Sign Out CTA Button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.signOutText}>Sign Out of NGK Technical</Text>
        </TouchableOpacity>

        {/* Delete Account CTA (Full CRUD coverage) */}
        <TouchableOpacity
          style={styles.deleteAccountBtn}
          onPress={confirmDeleteAccount}
          activeOpacity={0.8}
        >
          <Trash2 size={16} color="#9CA3AF" />
          <Text style={styles.deleteAccountText}>Delete Account Data</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          NGK SPARK PLUGS (PTY) LTD • TECHNICAL PROFILE 2026
        </Text>
      </ScrollView>

      {/* Edit Profile Modal */}
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
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <Text style={styles.modalSubtitle}>
                  Update your contact & workshop details
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
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="Enter your email address"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Phone Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Workshop / Location Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location / Workshop Address</Text>
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
                    placeholder="Enter workshop or delivery address"
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
    backgroundColor: '#D0142C',
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 1.1,
    marginTop: 2,
  },
  headerEditBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  profileCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monogramBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#D0142C',
    borderWidth: 2.5,
    borderColor: '#FDE047',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#D0142C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  monogramText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  profileInfoCol: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rolePill: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  editPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginTop: 14,
    gap: 6,
  },
  editPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D0142C',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconBadgeBlue: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconBadgeGreen: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
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
    letterSpacing: 0.8,
  },
  sectionEditLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D0142C',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailTextWrapper: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  navIconBadgeBlue: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  navIconBadgeGreen: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  navIconBadgeRed: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  navTextCol: {
    flex: 1,
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  navSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    borderRadius: 14,
    paddingVertical: 15,
    gap: 8,
    marginBottom: 10,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    marginBottom: 14,
  },
  deleteAccountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
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
    backgroundColor: '#D0142C',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D0142C',
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
});
