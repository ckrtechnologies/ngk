import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Image,
  RefreshControl,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { ChevronLeft, Home, Heart, Search, X, Info, Settings, ShoppingCart } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { getMyselfRedux, setPart } from '../redux/getData';
import { removeFromWatchlistApi } from '../apis/api';
import { apiFunction } from '../apis/apiFunction';
import AppHeader from '../components/common/AppHeader';

const MyFavoritesScreen = () => {
  const navigation = useNavigation();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { myself } = useSelector((state) => state.getData);
  const [selectedPart, setSelectedPart] = useState(null);
  const dispatch = useDispatch();

  const [refreshing, setRefreshing] = useState(false);

  const fetchMyself = async () => {
    const userId = await AsyncStorage.getItem("userId");
    if (userId) dispatch(getMyselfRedux(userId));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyself();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!myself) {
      fetchMyself();
    }
  }, [dispatch]);

  const favorites = useMemo(() => {
    if (myself?.watchList) {
      return myself.watchList.map((item) => {
        return {
          ...item,
          isFavorite: true,
          partNumber: item.subtitle || item.originalData?.articleNumber || item.tradeNumbers?.[0] || '',
        };
      });
    } else {
      return [];
    }
  }, [myself]);

  const toggleFavorite = async (partId) => {
    if (!myself?.id) return;
    try {
      const res = await apiFunction(`${removeFromWatchlistApi}/${myself.id}/${partId}`, [], {}, "DELETE", true);
      if (res?.success) {
        Toast.show({
          type: 'success',
          text1: 'Part removed from watchlist successfully',
        });
        dispatch(getMyselfRedux(myself.id));
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to remove part from watchlist',
        });
      }
    } catch (err) {
      console.log("Error removing part:", err);
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
      });
    }
  };

  const handleOpenDetails = (part) => {
    setSelectedPart(part);
    setShowDetailsModal(true);
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="My Favorites"
        subtitle={`${favorites.filter(item => item.isFavorite).length} Items Saved`}
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            onPress={() => navigation.navigate('OwnerHome')}
            style={styles.headerHomeBtn}
            activeOpacity={0.8}
          >
            <Home color="#FFFFFF" size={18} />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* Count and Edit Section */}
        <View style={styles.listHeader}>
          <Text style={styles.itemsSavedText}>
            {favorites.filter(item => item.isFavorite).length} ITEMS SAVED
          </Text>
          {/* <TouchableOpacity>
            <Text style={styles.editListText}>EDIT LIST</Text>
          </TouchableOpacity> */}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#D0142C']}
              tintColor="#D0142C"
            />
          }
        >
          {favorites.map((item) => (
            item.isFavorite && (
              <View key={item.id} style={styles.favoriteCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                    <Heart
                      size={wp('6%')}
                      color="#EF4444"
                      fill={item.isFavorite ? "#EF4444" : "transparent"}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.partNumber}>{item.partNumber}</Text>
                </View>

                <TouchableOpacity
                  style={styles.viewDetailsButton}
                  onPress={() => handleOpenDetails(item)}
                >
                  <Search size={wp('4.5%')} color="#FFFFFF" style={styles.searchIcon} />
                  <Text style={styles.viewDetailsText}>VIEW DETAILS</Text>
                </TouchableOpacity>
              </View>
            )
          ))}
          {favorites.filter(item => item.isFavorite).length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Your watchlist is empty</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Product Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitleText}>PRODUCT DETAILS</Text>
                <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                  <X color="#000" size={wp('6%')} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* Image Section */}
              <View style={styles.paginationDots}>
                <View style={styles.dotActive} />
                <View style={styles.dotInactive} />
              </View>

              <View style={styles.productImageCard}>
                <View style={styles.magnifyBadge}>
                  <View style={styles.magnifyDot} />
                  <Text style={styles.magnifyText}>360° MAGNIFY</Text>
                </View>
                <Image
                  source={{ uri: selectedPart?.image }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              </View>

              {/* Info Section */}
              <View style={styles.modalInfoContainer}>
                <View style={styles.badgeRow}>
                  <View style={styles.verifiedFitBadge}>
                    <Text style={styles.verifiedFitBadgeText}>VERIFIED FIT</Text>
                  </View>
                  <Text style={styles.categoryText}>{selectedPart?.category}</Text>
                </View>

                <Text style={styles.modalPartTitle}>{selectedPart?.title}</Text>
                <Text style={styles.modalPartSubtitle}>{selectedPart?.partNumber}</Text>

                <View style={styles.quickSpecsLabelRow}>
                  <Info color="#D1D1D1" size={wp('4%')} />
                  <Text style={styles.quickSpecsLabel}>QUICK SPECS</Text>
                </View>

                <View style={styles.availabilityCard}>
                  <Text style={styles.availabilityLabel}>AVAILABILITY</Text>
                  <Text style={styles.availabilityValue}>{selectedPart?.availability}</Text>
                </View>

                {/* Specs Table */}
                <View style={styles.specsTable}>
                  {selectedPart?.specs?.map((spec, index) => (
                    <View key={index} style={[styles.specRow, index === (selectedPart.specs.length - 1) && { borderBottomWidth: 0 }]}>
                      <Text style={styles.specLabel}>{spec.label}</Text>
                      <Text style={styles.specValue}>{spec.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.footerBtnStock}>
                <Search color="#1A1A1A" size={wp('5%')} />
                <Text style={styles.footerBtnTextStock}>STOCK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerBtnEnquiry}
                onPress={() => {
                  setShowDetailsModal(false);
                  navigation.navigate('TechnicalEnquiry', { part: selectedPart });
                }}
              >
                <Settings color="#FFFFFF" size={wp('5%')} />
                <Text style={styles.footerBtnTextEnquiry}>ENQUIRY</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerBtnDealers}
                onPress={() => {
                  setShowDetailsModal(false);
                  dispatch(setPart(selectedPart));
                  navigation.navigate('DealerLocator');
                }}
              >
                <ShoppingCart color="#FFFFFF" size={wp('5%')} />
                <Text style={styles.footerBtnTextDealers}>DEALERS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Light gray background
  },
  headerHomeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
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
  homeIconButton: {
    backgroundColor: '#FFFFFF',
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('5%'),
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp('2.5%'),
    marginBottom: hp('1.5%'),
  },
  itemsSavedText: {
    fontSize: wp('3.2%'),
    fontWeight: 'bold',
    color: '#666666',
  },
  editListText: {
    fontSize: wp('3.2%'),
    fontWeight: 'bold',
    color: '#D0142C',
  },
  scrollContent: {
    paddingBottom: hp('5%'),
  },
  favoriteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('6%'),
    padding: wp('5%'),
    marginBottom: hp('2.5%'),
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // Elevation for Android
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp('1.5%'),
  },
  categoryBadge: {
    backgroundColor: '#1E40AF', // Dark blue
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('1.5%'),
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: wp('2.8%'),
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: hp('2.5%'),
  },
  itemTitle: {
    fontSize: wp('4.8%'),
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: hp('0.5%'),
  },
  partNumber: {
    fontSize: wp('3.5%'),
    fontWeight: 'bold',
    color: '#D0142C',
  },
  viewDetailsButton: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.5%'),
    borderRadius: wp('10%'),
  },
  searchIcon: {
    marginRight: wp('2%'),
  },
  viewDetailsText: {
    color: '#FFFFFF',
    fontSize: wp('3.5%'),
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    marginTop: hp('10%'),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: wp('4%'),
    color: '#8E8E8E',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: wp('10%'),
    borderTopRightRadius: wp('10%'),
    height: hp('95%'),
  },
  modalHeader: {
    paddingTop: hp('1%'),
    paddingHorizontal: wp('6%'),
    paddingBottom: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalHandle: {
    width: wp('15%'),
    height: hp('0.6%'),
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: hp('1.5%'),
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleText: {
    fontSize: wp('4.2%'),
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  modalScroll: {
    paddingBottom: hp('15%'),
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('2%'),
  },
  dotActive: {
    width: wp('8%'),
    height: hp('0.6%'),
    backgroundColor: '#D0142C',
    borderRadius: 3,
    marginRight: wp('1.5%'),
  },
  dotInactive: {
    width: wp('1.5%'),
    height: wp('1.5%'),
    backgroundColor: '#D1D1D1',
    borderRadius: wp('0.75%'),
  },
  productImageCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp('6%'),
    borderRadius: wp('12%'),
    height: hp('38%'),
    padding: wp('6%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('3%'),
    marginBottom: hp('4%'),
  },
  magnifyBadge: {
    position: 'absolute',
    top: wp('6%'),
    left: wp('6%'),
    backgroundColor: '#D0142C',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('3%'),
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  magnifyDot: {
    width: wp('1.5%'),
    height: wp('1.5%'),
    backgroundColor: '#FFFFFF',
    borderRadius: wp('0.75%'),
    marginRight: wp('2%'),
  },
  magnifyText: {
    color: '#FFFFFF',
    fontSize: wp('2.5%'),
    fontWeight: 'bold',
  },
  productImage: {
    width: wp('65%'),
    height: wp('65%'),
  },
  modalInfoContainer: {
    paddingHorizontal: wp('6%'),
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  verifiedFitBadge: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
    borderRadius: wp('1.5%'),
    marginRight: wp('3%'),
  },
  verifiedFitBadgeText: {
    color: '#FFFFFF',
    fontSize: wp('2.4%'),
    fontWeight: 'bold',
  },
  categoryText: {
    color: '#8E8E8E',
    fontSize: wp('3%'),
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalPartTitle: {
    fontSize: wp('6%'),
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.2,
  },
  modalPartSubtitle: {
    fontSize: wp('4.5%'),
    color: '#D0142C',
    fontWeight: 'bold',
    marginTop: hp('0.5%'),
    marginBottom: hp('3%'),
  },
  quickSpecsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  quickSpecsLabel: {
    fontSize: wp('3%'),
    color: '#8E8E8E',
    fontWeight: 'bold',
    marginLeft: wp('2%'),
    letterSpacing: 1,
  },
  availabilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('8%'),
    paddingVertical: hp('3.5%'),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: hp('3%'),
  },
  availabilityLabel: {
    fontSize: wp('2.8%'),
    color: '#8E8E8E',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: hp('0.5%'),
  },
  availabilityValue: {
    fontSize: wp('6.5%'),
    color: '#2E8B57',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  specsTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('8%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: hp('12%'),
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('2.5%'),
    paddingHorizontal: wp('6%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  specLabel: {
    fontSize: wp('3.5%'),
    color: '#000000',
    fontWeight: 'bold',
  },
  specValue: {
    fontSize: wp('3.5%'),
    color: '#000000',
    fontWeight: '600',
  },
  modalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('4%'),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerBtnStock: {
    flex: 1,
    flexDirection: 'row',
    height: hp('7.5%'),
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#D1D1D1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('2%'),
  },
  footerBtnTextStock: {
    color: '#1A1A1A',
    fontSize: wp('3%'),
    fontWeight: 'bold',
    marginLeft: wp('2%'),
    letterSpacing: 1,
  },
  footerBtnEnquiry: {
    flex: 1,
    flexDirection: 'row',
    height: hp('7.5%'),
    backgroundColor: '#000000',
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('2%'),
  },
  footerBtnTextEnquiry: {
    color: '#FFFFFF',
    fontSize: wp('3%'),
    fontWeight: 'bold',
    marginLeft: wp('2%'),
    letterSpacing: 1,
  },
  footerBtnDealers: {
    flex: 1,
    flexDirection: 'row',
    height: hp('7.5%'),
    backgroundColor: '#D0142C',
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerBtnTextDealers: {
    color: '#FFFFFF',
    fontSize: wp('3%'),
    fontWeight: 'bold',
    marginLeft: wp('2%'),
    letterSpacing: 1,
  },
});

export default MyFavoritesScreen;
