import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Menu,
  Bell,
  Search,
  Car,
  MessageSquare,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Plus,
  RotateCw,
  Wrench,
  Flame,
  X,
  Zap,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { getMyselfRedux } from '../redux/getData';

const OwnerHomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { myself } = useSelector((state) => state.getData);

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Modals
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [showroomModalVisible, setShowroomModalVisible] = useState(false);
  const [diagModalVisible, setDiagModalVisible] = useState(false);
  const [torqueModalVisible, setTorqueModalVisible] = useState(false);

  const fetchInitialData = useCallback(async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      dispatch(getMyselfRedux(userId));
    }
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const activeCar = myself?.garage?.[0] || null;

  const handleSearchSubmit = () => {
    const query = searchQuery.trim();
    if (query) {
      navigation.navigate('PartsFinder', { initialQuery: query, initialMode: 'part' });
    } else {
      navigation.navigate('PartsFinder');
    }
  };

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

      {/* 52px Native App Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('CustomDrawer')}
          activeOpacity={0.7}
        >
          <Menu size={22} color="#111827" />
        </TouchableOpacity>

        <Image
          source={require('../assets/images/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <Bell size={20} color="#111827" />
          <View style={styles.badgeDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#C6122E']}
            tintColor="#C6122E"
          />
        }
      >
        {/* Welcome Greeting */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingHeaderRow}>
            <View>
              <Text style={styles.greetingSub}>WELCOME BACK</Text>
              <Text style={styles.greetingName}>
                {myself?.name ? myself.name : 'Vehicle Owner'}
              </Text>
            </View>
            <View style={styles.memberBadge}>
              <ShieldCheck size={13} color="#16A34A" />
              <Text style={styles.memberBadgeText}>NGK VERIFIED</Text>
            </View>
          </View>

          {/* High-Velocity Search Bar */}
          <View style={styles.searchBarContainer}>
            <Search size={18} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search part # (e.g. BKR6E-11), VIN..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              autoCapitalize="characters"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.searchClearBtn}
              >
                <X size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.searchSubmitBtn}
              onPress={handleSearchSubmit}
              activeOpacity={0.8}
            >
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. Garage Command Center (Active Vehicle Cockpit) */}
        <View style={styles.cockpitCard}>
          <View style={styles.cockpitHeader}>
            <View style={styles.cockpitBadge}>
              <Car size={14} color="#C6122E" />
              <Text style={styles.cockpitBadgeText}>ACTIVE VEHICLE COCKPIT</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('MyGarage')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.manageGarageLink}>
                {activeCar ? 'Switch Car' : '+ Add Car'}
              </Text>
            </TouchableOpacity>
          </View>

          {activeCar ? (
            <View style={styles.activeCarContent}>
              <View style={styles.carIdentityRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.carTitle}>
                    {activeCar.year} {activeCar.make} {activeCar.model}
                  </Text>
                  <Text style={styles.carEngine}>
                    {activeCar.engine || 'Standard Trim'} • {activeCar.fuel_type || 'Petrol'}
                    {activeCar.licensePlate ? ` • ${activeCar.licensePlate}` : ''}
                  </Text>
                </View>
              </View>

              {/* Component Readiness Pills */}
              <View style={styles.fitmentPillsRow}>
                <View style={styles.fitmentPill}>
                  <Zap size={12} color="#C6122E" />
                  <Text style={styles.fitmentPillText}>
                    {activeCar.fuel_type === 'Diesel' ? 'Glow Plugs' : 'Spark Plugs'}
                  </Text>
                </View>
                <View style={styles.fitmentPill}>
                  <RotateCw size={12} color="#2563EB" />
                  <Text style={styles.fitmentPillText}>Lambda Sensor</Text>
                </View>
                <View style={styles.fitmentPill}>
                  <Sliders size={12} color="#059669" />
                  <Text style={styles.fitmentPillText}>Ignition Coils</Text>
                </View>
              </View>

              {/* Maintenance Cycle Advisory */}
              <View style={styles.maintenanceRow}>
                <ShieldCheck size={14} color="#16A34A" />
                <Text style={styles.maintenanceText}>
                  OEM Verified Match • Service Cycle: Laser Iridium (100,000 km)
                </Text>
              </View>

              {/* 1-Tap Explore Verified Fitments Button */}
              <TouchableOpacity
                style={styles.viewFitmentsBtn}
                onPress={() =>
                  navigation.navigate('PartsFinder', { preselectedVehicle: activeCar })
                }
                activeOpacity={0.8}
              >
                <Search size={15} color="#FFFFFF" />
                <Text style={styles.viewFitmentsText}>Explore Verified Fitments</Text>
                <ChevronRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.emptyCockpitPrompt}
              onPress={() => navigation.navigate('MyGarage')}
              activeOpacity={0.7}
            >
              <View style={styles.emptyCarCircle}>
                <Plus size={20} color="#C6122E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyCarTitle}>Select your vehicle for guaranteed fitment</Text>
                <Text style={styles.emptyCarSub}>
                  Get 100% verified spark plugs, sensors & torque ratings for your engine.
                </Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* 2. Automotive Essentials (Dual High-Value Cards) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Automotive Essentials</Text>
        </View>

        <View style={styles.dualCardsRow}>
          {/* Card A: Anti-Counterfeit Authenticator */}
          <TouchableOpacity
            style={[styles.featureCard, { borderColor: '#E5E7EB' }]}
            onPress={() => setAuthModalVisible(true)}
            activeOpacity={0.75}
          >
            <View style={[styles.featureIconBadge, { backgroundColor: '#FEF2F2' }]}>
              <ShieldCheck size={22} color="#C6122E" />
            </View>
            <View style={styles.featurePill}>
              <Text style={styles.featurePillText}>PROTECTION</Text>
            </View>
            <Text style={styles.featureTitle}>Genuine NGK Check</Text>
            <Text style={styles.featureDesc}>
              Learn how to spot counterfeit plugs & protect your engine.
            </Text>
            <View style={styles.featureActionRow}>
              <Text style={styles.featureActionText}>Check Guidelines</Text>
              <ChevronRight size={14} color="#C6122E" />
            </View>
          </TouchableOpacity>

          {/* Card B: 360° Tech Showroom */}
          <TouchableOpacity
            style={[styles.featureCard, { borderColor: '#E5E7EB' }]}
            onPress={() => setShowroomModalVisible(true)}
            activeOpacity={0.75}
          >
            <View style={[styles.featureIconBadge, { backgroundColor: '#EFF6FF' }]}>
              <RotateCw size={22} color="#2563EB" />
            </View>
            <View style={[styles.featurePill, { backgroundColor: '#DBEAFE' }]}>
              <Text style={[styles.featurePillText, { color: '#1E40AF' }]}>3D TECH</Text>
            </View>
            <Text style={styles.featureTitle}>3D Tech Showroom</Text>
            <Text style={styles.featureDesc}>
              Explore Laser Iridium & NTK sensors in interactive 360°.
            </Text>
            <View style={styles.featureActionRow}>
              <Text style={[styles.featureActionText, { color: '#2563EB' }]}>Open 3D View</Text>
              <ChevronRight size={14} color="#2563EB" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 3. Quotes & Technical Support Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quotes & Technical Support</Text>
        </View>

        <TouchableOpacity
          style={styles.supportCard}
          onPress={() => navigation.navigate('TechnicalEnquiry')}
          activeOpacity={0.8}
        >
          <View style={styles.supportIconCol}>
            <View style={styles.supportIconCircle}>
              <MessageSquare size={22} color="#059669" />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.supportBadgeRow}>
              <Text style={styles.supportBadgeText}>TECHNICAL DESK</Text>
            </View>
            <Text style={styles.supportTitle}>Need Help or a Part Quote?</Text>
            <Text style={styles.supportDesc}>
              Upload a photo of your existing spark plug or sensor for expert fitment assistance.
            </Text>
            <View style={styles.supportActionRow}>
              <Text style={styles.supportActionLink}>Ask an NGK Specialist</Text>
              <ArrowRight size={14} color="#059669" />
            </View>
          </View>
        </TouchableOpacity>

        {/* 4. Authorized Dealer Locator Banner */}
        <TouchableOpacity
          style={styles.dealerBanner}
          onPress={() => navigation.navigate('DealerLocator')}
          activeOpacity={0.8}
        >
          <View style={styles.dealerIconCircle}>
            <MapPin size={22} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dealerBannerTitle}>Authorized Dealer Radar</Text>
            <Text style={styles.dealerBannerSub}>
              Find official stockists (AutoZone, Midas, Goldwagen) with genuine stock.
            </Text>
          </View>
          <ChevronRight size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {/* 5. Expert Diagnostics & Care Hub */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expert Knowledge & Care</Text>
        </View>

        <View style={styles.dualCardsRow}>
          {/* Card: Reading Spark Plugs */}
          <TouchableOpacity
            style={styles.guideCard}
            onPress={() => setDiagModalVisible(true)}
            activeOpacity={0.75}
          >
            <View style={styles.guideHeader}>
              <View style={[styles.guideIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Flame size={18} color="#D97706" />
              </View>
              <Text style={styles.guideCategory}>DIAGNOSTICS</Text>
            </View>
            <Text style={styles.guideTitle}>Reading Firing Ends</Text>
            <Text style={styles.guideDesc}>
              Identify engine issues: Normal tan, carbon fouling, overheating & oil deposits.
            </Text>
            <Text style={styles.guideAction}>View Diagnostic Guide →</Text>
          </TouchableOpacity>

          {/* Card: Torque Specs */}
          <TouchableOpacity
            style={styles.guideCard}
            onPress={() => setTorqueModalVisible(true)}
            activeOpacity={0.75}
          >
            <View style={styles.guideHeader}>
              <View style={[styles.guideIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <Wrench size={18} color="#7E22CE" />
              </View>
              <Text style={[styles.guideCategory, { color: '#7E22CE' }]}>INSTALLATION</Text>
            </View>
            <Text style={styles.guideTitle}>Torque & Gap Guide</Text>
            <Text style={styles.guideDesc}>
              Correct tightening angles & torque specs to prevent thread and head damage.
            </Text>
            <Text style={[styles.guideAction, { color: '#7E22CE' }]}>View Torque Table →</Text>
          </TouchableOpacity>
        </View>

        {/* Genuine Guarantee Footer */}
        <View style={styles.guaranteeCard}>
          <ShieldCheck size={20} color="#C6122E" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.guaranteeTitle}>Genuine NGK / NTK Guarantee</Text>
            <Text style={styles.guaranteeText}>
              Always verify part numbers and electrode gap before installation. Manufactured by NGK SPARK PLUG CO., LTD.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 1: Anti-Counterfeit Verification Guide */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={authModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <ShieldCheck size={22} color="#C6122E" />
                <Text style={styles.modalTitle}>Spot Counterfeit NGK Plugs</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAuthModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalIntro}>
                Counterfeit spark plugs can crack, melt, and destroy engine pistons. Check these 4 genuine NGK checkpoints:
              </Text>

              <View style={styles.checkpointCard}>
                <View style={styles.checkpointNumber}>
                  <Text style={styles.checkpointNumText}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkpointTitle}>Laser-Welded Firing Tip</Text>
                  <Text style={styles.checkpointDesc}>
                    Genuine Iridium / Platinum tips feature a microscopic, seamless laser weld. Fakes have rough stamped or glued metal tips.
                  </Text>
                </View>
              </View>

              <View style={styles.checkpointCard}>
                <View style={styles.checkpointNumber}>
                  <Text style={styles.checkpointNumText}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkpointTitle}>Metallic Hexagon Crimp</Text>
                  <Text style={styles.checkpointDesc}>
                    Genuine NGK uses a precision rolling process leaving clean, uniform crimp lines. Counterfeits have rough machining or painted marks.
                  </Text>
                </View>
              </View>

              <View style={styles.checkpointCard}>
                <View style={styles.checkpointNumber}>
                  <Text style={styles.checkpointNumText}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkpointTitle}>Trivalent Metal Shell Plating</Text>
                  <Text style={styles.checkpointDesc}>
                    Genuine shells have a bright, silvery-chrome trivalent coating providing anti-seize and corrosion protection. Fakes look dull yellow or dark zinc.
                  </Text>
                </View>
              </View>

              <View style={styles.checkpointCard}>
                <View style={styles.checkpointNumber}>
                  <Text style={styles.checkpointNumText}>4</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkpointTitle}>Captive Gasket Washer</Text>
                  <Text style={styles.checkpointDesc}>
                    The genuine gasket is rolled on and cannot be unscrewed by hand. Fake washers slide easily off the threads.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={() => {
                  setAuthModalVisible(false);
                  navigation.navigate('DealerLocator');
                }}
                activeOpacity={0.8}
              >
                <MapPin size={16} color="#FFFFFF" />
                <Text style={styles.modalActionBtnText}>Buy from Authorized Stockists</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 2: 3D Technology Showroom Preview */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={showroomModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowroomModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { maxHeight: '88%' }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <RotateCw size={22} color="#2563EB" />
                <Text style={styles.modalTitle}>360° Technology Showroom</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowroomModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.showroomStage}>
                <Image
                  source={require('../assets/images/sparkplug_iridium.jpg')}
                  style={styles.showroomHeroImage}
                  resizeMode="cover"
                />
                <View style={styles.showroomOverlayBadge}>
                  <RotateCw size={14} color="#FFFFFF" />
                  <Text style={styles.showroomOverlayText}>360° INTERACTIVE TURNTABLE</Text>
                </View>
              </View>

              <View style={styles.showroomSpecsBox}>
                <Text style={styles.showroomPartCode}>NGK Laser Iridium (ILKAR7B11)</Text>
                <Text style={styles.showroomSubtitle}>0.6mm Ultra-Fine Laser Welded Iridium Tip</Text>

                <View style={styles.specFeatureRow}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <Text style={styles.specFeatureText}>Maximum ignitability & fuel efficiency</Text>
                </View>
                <View style={styles.specFeatureRow}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <Text style={styles.specFeatureText}>Platinum disc ground electrode for 100,000 km lifespan</Text>
                </View>
                <View style={styles.specFeatureRow}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <Text style={styles.specFeatureText}>Corrugated ribs prevent flashover</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#111827' }]}
                onPress={() => {
                  setShowroomModalVisible(false);
                  navigation.navigate('PartsFinder');
                }}
                activeOpacity={0.8}
              >
                <Search size={16} color="#FFFFFF" />
                <Text style={styles.modalActionBtnText}>Find Laser Iridium for My Car</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 3: Spark Plug Condition Diagnostics Guide */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={diagModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDiagModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Flame size={22} color="#D97706" />
                <Text style={styles.modalTitle}>Spark Plug Diagnosis</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDiagModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalIntro}>
                Inspecting your spark plug's firing end reveals the combustion health of your engine:
              </Text>

              <View style={styles.diagConditionCard}>
                <View style={[styles.diagColorDot, { backgroundColor: '#B45309' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.diagConditionTitle}>Normal Operation (Healthy)</Text>
                  <Text style={styles.diagConditionDesc}>
                    Light tan or grey color on the insulator tip. Minimal electrode wear. Air-fuel mixture and heat range are correct.
                  </Text>
                </View>
              </View>

              <View style={styles.diagConditionCard}>
                <View style={[styles.diagColorDot, { backgroundColor: '#1F2937' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.diagConditionTitle}>Carbon Fouling (Dry Black Soot)</Text>
                  <Text style={styles.diagConditionDesc}>
                    Rich fuel mixture, weak ignition coil, clogged air filter, or excessive idling. Check air filters and ignition leads.
                  </Text>
                </View>
              </View>

              <View style={styles.diagConditionCard}>
                <View style={[styles.diagColorDot, { backgroundColor: '#EF4444' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.diagConditionTitle}>Overheating (Blistered White Tip)</Text>
                  <Text style={styles.diagConditionDesc}>
                    Insulator tip is glazed white with eroded electrodes. Causes: lean fuel mixture, loose spark plug installation, or incorrect heat range.
                  </Text>
                </View>
              </View>

              <View style={styles.diagConditionCard}>
                <View style={[styles.diagColorDot, { backgroundColor: '#374151' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.diagConditionTitle}>Oil Fouling (Wet Glossy Black)</Text>
                  <Text style={styles.diagConditionDesc}>
                    Oil entering the combustion chamber due to worn piston rings or defective valve stem seals. Engine repair needed.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#D97706' }]}
                onPress={() => {
                  setDiagModalVisible(false);
                  navigation.navigate('TechnicalEnquiry');
                }}
                activeOpacity={0.8}
              >
                <MessageSquare size={16} color="#FFFFFF" />
                <Text style={styles.modalActionBtnText}>Ask Tech Support About My Plugs</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 4: Torque & Tightening Guide */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={torqueModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTorqueModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Wrench size={22} color="#7E22CE" />
                <Text style={styles.modalTitle}>Torque & Tightening Guide</Text>
              </View>
              <TouchableOpacity
                onPress={() => setTorqueModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalIntro}>
                Under-tightening causes gas leakage and heat buildup. Over-tightening damages cylinder head threads:
              </Text>

              <View style={styles.torqueTable}>
                <View style={styles.torqueTableRowHeader}>
                  <Text style={styles.torqueTh}>Thread Size</Text>
                  <Text style={styles.torqueTh}>Cast Iron</Text>
                  <Text style={styles.torqueTh}>Aluminium Head</Text>
                </View>
                <View style={styles.torqueTableRow}>
                  <Text style={styles.torqueTdBold}>M10 (10 mm)</Text>
                  <Text style={styles.torqueTd}>10 - 15 Nm</Text>
                  <Text style={styles.torqueTd}>10 - 12 Nm</Text>
                </View>
                <View style={[styles.torqueTableRow, { backgroundColor: '#F9FAFB' }]}>
                  <Text style={styles.torqueTdBold}>M12 (12 mm)</Text>
                  <Text style={styles.torqueTd}>15 - 25 Nm</Text>
                  <Text style={styles.torqueTd}>15 - 20 Nm</Text>
                </View>
                <View style={styles.torqueTableRow}>
                  <Text style={styles.torqueTdBold}>M14 (14 mm)</Text>
                  <Text style={styles.torqueTd}>25 - 35 Nm</Text>
                  <Text style={styles.torqueTd}>25 - 30 Nm</Text>
                </View>
              </View>

              <View style={styles.angleAdviceBox}>
                <Info size={18} color="#7E22CE" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.angleAdviceTitle}>No Torque Wrench? Rule of Thumb:</Text>
                  <Text style={styles.angleAdviceText}>
                    Screw in hand-tight until the gasket touches the cylinder head, then tighten with a wrench: 1/2 turn (180°) for new gasket.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#7E22CE' }]}
                onPress={() => setTorqueModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalActionBtnText}>Close Guide</Text>
              </TouchableOpacity>
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
  header: {
    height: 52,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#C6122E',
  },
  headerLogo: {
    width: 100,
    height: 32,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },
  greetingSection: {
    marginBottom: 16,
  },
  greetingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  greetingSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  memberBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.3,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  searchClearBtn: {
    padding: 4,
    marginRight: 6,
  },
  searchSubmitBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#C6122E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cockpitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cockpitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cockpitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cockpitBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C6122E',
    letterSpacing: 0.4,
  },
  manageGarageLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C6122E',
  },
  activeCarContent: {
    marginTop: 2,
  },
  carIdentityRow: {
    marginBottom: 10,
  },
  carTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  carEngine: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  fitmentPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  fitmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fitmentPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  maintenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  maintenanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
    flex: 1,
  },
  viewFitmentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#111827',
    height: 42,
    borderRadius: 10,
  },
  viewFitmentsText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCockpitPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  emptyCarCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emptyCarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  emptyCarSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 15,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.2,
  },
  dualCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  featureIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featurePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  featurePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C6122E',
    letterSpacing: 0.4,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
    marginBottom: 10,
  },
  featureActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 'auto',
  },
  featureActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C6122E',
  },
  supportCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  supportIconCol: {
    marginRight: 12,
  },
  supportIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportBadgeRow: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  supportBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.4,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  supportDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
    marginBottom: 8,
  },
  supportActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  supportActionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  dealerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  dealerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dealerBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  dealerBannerSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  guideCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  guideIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.4,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  guideDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
    marginBottom: 10,
  },
  guideAction: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 'auto',
  },
  guaranteeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#C6122E',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  guaranteeText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    marginTop: 12,
  },
  modalIntro: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 14,
  },
  checkpointCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  checkpointNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#C6122E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  checkpointNumText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  checkpointTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  checkpointDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C6122E',
    height: 44,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 8,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  showroomStage: {
    width: '100%',
    height: 220,
    backgroundColor: '#111827',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    position: 'relative',
  },
  showroomHeroImage: {
    width: '100%',
    height: '100%',
  },
  showroomOverlayBadge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  showroomOverlayText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  showroomSpecsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  showroomPartCode: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  showroomSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 2,
    marginBottom: 10,
  },
  specFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  specFeatureText: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  diagConditionCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'flex-start',
  },
  diagColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
    marginTop: 3,
  },
  diagConditionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  diagConditionDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  torqueTable: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 14,
  },
  torqueTableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  torqueTh: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  torqueTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  torqueTdBold: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  torqueTd: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
  },
  angleAdviceBox: {
    flexDirection: 'row',
    backgroundColor: '#FAF5FF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 10,
  },
  angleAdviceTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7E22CE',
  },
  angleAdviceText: {
    fontSize: 11,
    color: '#581C87',
    marginTop: 2,
    lineHeight: 15,
  },
});

export default OwnerHomeScreen;
