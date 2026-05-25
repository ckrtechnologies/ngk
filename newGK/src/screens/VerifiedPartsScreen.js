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
  Image,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { WebView } from 'react-native-webview';
import { ChevronLeft, Home, Heart, Settings, X, Info, Search, ShoppingCart } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiFunction } from '../apis/apiFunction';
import { addVehicleToWatchlistApi, serviceJsonApi } from '../apis/api';
import { setPart, setSelectedVehicle } from '../redux/getData';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';

const VerifiedPartsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  // Hooks must always be called at the top in the same order
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [activeImageTab, setActiveImageTab] = useState('static');
  const [showFullscreen360, setShowFullscreen360] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const { myself } = useSelector((state) => state.getData);

  useEffect(() => {
    const fetchMyself = async () => {
      const userId = await AsyncStorage.getItem("userId");
      dispatch(getMyselfRedux(userId));
    }
    if (!myself) {
      fetchMyself();
    }
  }, [dispatch])



  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);

  const partNum = route.params?.partNumber;
  const vehicle = route.params?.vehicle;

  console.log(vehicle, "partNumberpartNumberpartNumber")

  useEffect(() => {
    const fetchParts = async () => {
      setLoading(true);
      let payload = null;

      if (vehicle) {
        payload = {
          "getArticles": {
            "articleCountry": "ZA",
            "lang": "en",
            "linkageTargetId": vehicle.carId || vehicle.modalId || vehicle.id || vehicle.linkageTargetId,
            "linkageTargetType": vehicle.linkingTargetType || "P",
            "includeAll": true
          }
        };
      } else if (partNum) {
        payload = {
          "getArticles": {
            "articleCountry": "ZA",
            "lang": "en",
            "includeAll": true,
            "searchQuery": partNum
          }
        };
      }

      if (payload) {
        try {
          const res = await apiFunction(serviceJsonApi, [], payload, "POST", true);
          console.log(res, "resssss")
          if (res?.status == 200) {
            const mappedParts = res?.articles?.map((article) => {
              const genericDesc = article.genericArticles && article.genericArticles.length > 0
                ? article.genericArticles[0].genericArticleDescription
                : article.genericArticleDescription;
              const title = genericDesc || article.mfrName || article.dataSupplierName || 'Unknown Part';
              const subtitle = article.articleNumber || '';

              const specs = [];
              if (article.articleCriteria && article.articleCriteria.length > 0) {
                article.articleCriteria.forEach(attr => {
                  specs.push({ label: attr.criteriaDescription, value: attr.formattedValue });
                });
              } else if (article.articleAttributes && article.articleAttributes.array) {
                article.articleAttributes.array.forEach(attr => {
                  specs.push({ label: attr.attrName, value: attr.attrValue });
                });
              }

              let imageUrl = null;
              if (article.images && article.images.length > 0) {
                imageUrl = article.images[0].imageURL800 || article.images[0].imageURL400 || article.images[0].imageURL200;
              } else if (article.images && article.images.array && article.images.array.length > 0) {
                imageUrl = article.images.array[0].imageURL800 || article.images.array[0].imageURL400 || article.images.array[0].imageURL200;
              } else if (article.articleThumbnails && article.articleThumbnails.array && article.articleThumbnails.array.length > 0) {
                imageUrl = article.articleThumbnails.array[0].thumbDocId ? `https://webservice.tecalliance.services/pegasus-3-0/documents/22002/${article.articleThumbnails.array[0].thumbDocId}` : null;
              }

              return {
                id: article.articleId || article.legacyArticleId || Math.random().toString(),
                title: title,
                subtitle: subtitle,
                tag: 'Fits',
                category: genericDesc || 'Part',
                image: imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dcf181934?q=80&w=1000&auto=format&fit=crop',
                specs: specs,
                availability: article.articleStateName || article.misc?.articleStatusDescription || 'CHECK STOCK',
                originalData: article,
                tradeNumbers: article.tradeNumbers || []
              };
            });
            setParts(mappedParts);
          } else {
            setParts([]);
          }
        } catch (error) {
          console.error("Error fetching parts:", error);
          setParts([]);
        }
      }
      setLoading(false);
    };

    fetchParts();
  }, [vehicle, partNum]);

  const handleOpenDetails = (part) => {
    setSelectedPart(part);
    setActiveImageTab('static');
    console.log(part, "partpartpart")
    setShowDetailsModal(true);
  };

  const get360Html = (url, enableFullscreenTap = true) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    body { margin: 0; padding: 0; background: transparent; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; touch-action: none; user-select: none; }
    canvas { max-width: 100%; max-height: 100%; object-fit: contain; cursor: grab; }
    .loading { position: absolute; font-family: sans-serif; font-size: 14px; font-weight: bold; color: #C6122E; text-align: center; }
    .instruction { position: absolute; bottom: 10px; font-family: sans-serif; font-size: 12px; font-weight: bold; color: #888; background: rgba(255,255,255,0.8); padding: 4px 8px; border-radius: 12px; pointer-events: none; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/gifuct-js/dist/gifuct-js.min.js"></script>
</head>
<body>
  <div id="loading" class="loading">DECODING 360° MODEL...</div>
  <canvas id="canvas"></canvas>
  <div id="instruction" class="instruction" style="display: none;">↔ DRAG TO ROTATE 360°</div>
  <script>
    const gifUrl = "${url}";
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const loadingEl = document.getElementById('loading');
    const instructionEl = document.getElementById('instruction');
    let frames = [];
    let currentFrame = 0;
    let isDragging = false;
    let startX = 0;

    fetch(gifUrl)
      .then(resp => resp.arrayBuffer())
      .then(buff => {
        loadingEl.innerText = "RENDERING 360° FRAMES...";
        const GIFClass = window.GIF || window.GIFuct;
        const gif = new GIFClass(buff);
        const rawFrames = gif.decompressFrames(true);
        
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const patchCanvas = document.createElement('canvas');
        const patchCtx = patchCanvas.getContext('2d');
        
        rawFrames.forEach((frame, i) => {
          if (i === 0) {
            canvas.width = frame.dims.width;
            canvas.height = frame.dims.height;
            tempCanvas.width = frame.dims.width;
            tempCanvas.height = frame.dims.height;
          }
          
          if (frame.disposalType === 2) {
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
          }

          patchCanvas.width = frame.dims.width;
          patchCanvas.height = frame.dims.height;
          const imgData = patchCtx.createImageData(frame.dims.width, frame.dims.height);
          imgData.data.set(frame.patch);
          patchCtx.putImageData(imgData, 0, 0);
          
          tempCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);
          
          const frameCanvas = document.createElement('canvas');
          frameCanvas.width = canvas.width;
          frameCanvas.height = canvas.height;
          frameCanvas.getContext('2d').drawImage(tempCanvas, 0, 0);
          frames.push(frameCanvas);
        });

        loadingEl.style.display = 'none';
        instructionEl.style.display = 'block';
        drawFrame(0);
      })
      .catch(err => {
        loadingEl.innerText = "ERROR LOADING 360° VIEW";
        console.error(err);
      });

    function drawFrame(index) {
      if (!frames.length) return;
      currentFrame = (index + frames.length) % frames.length;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frames[currentFrame], 0, 0);
    }

    let dragDistance = 0;
    window.addEventListener('touchstart', e => {
      isDragging = true;
      startX = e.touches[0].clientX;
      dragDistance = 0;
      instructionEl.style.display = 'none';
    });
    window.addEventListener('touchmove', e => {
      if (!isDragging || !frames.length) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - startX;
      dragDistance += Math.abs(dx);
      if (Math.abs(dx) > 6) {
        const direction = dx > 0 ? 1 : -1;
        drawFrame(currentFrame + direction);
        startX = e.touches[0].clientX;
      }
    }, { passive: false });
    window.addEventListener('touchend', () => { 
      isDragging = false; 
      if (${enableFullscreenTap} && dragDistance < 10) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage('openFullscreen');
        }
      }
    });
    
    let mouseDragDistance = 0;
    window.addEventListener('mousedown', e => { 
      isDragging = true; 
      startX = e.clientX; 
      mouseDragDistance = 0;
      instructionEl.style.display = 'none'; 
    });
    window.addEventListener('mousemove', e => {
      if (!isDragging || !frames.length) return;
      const dx = e.clientX - startX;
      mouseDragDistance += Math.abs(dx);
      if (Math.abs(dx) > 6) {
        const direction = dx > 0 ? 1 : -1;
        drawFrame(currentFrame + direction);
        startX = e.clientX;
      }
    });
    window.addEventListener('mouseup', () => { 
      isDragging = false; 
      if (${enableFullscreenTap} && mouseDragDistance < 10) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage('openFullscreen');
        }
      }
    });
  </script>
</body>
</html>
  `;

  const imagesList = selectedPart?.originalData?.images || [];
  const gifImageObj = imagesList.find(img => img.fileName?.toLowerCase().includes('360') || img.fileName?.toLowerCase().includes('.gif') || img.imageURL800?.toLowerCase().includes('.gif'));
  const staticImageObj = imagesList.find(img => !img.fileName?.toLowerCase().includes('360') && !img.imageURL800?.toLowerCase().includes('.gif')) || imagesList[0];
 
  const gifUrl = gifImageObj ? (gifImageObj.imageURL800 || gifImageObj.imageURL400 || gifImageObj.imageURL200) : null;
  const baseUrl = gifUrl ? gifUrl.split('/').slice(0, 3).join('/') : '';
  const staticUrl = staticImageObj ? (staticImageObj.imageURL800 || staticImageObj.imageURL400 || staticImageObj.imageURL200) : selectedPart?.image;

  const toggleFavorite = (part) => {
    const exists = favorites.find((f) => f.id === part.id);

    if (exists) {
      setFavorites(favorites.filter((f) => f.id !== part.id)); // unlike
    } else {
      setFavorites([...favorites, part]); // like
    }
  };

  const addPartTowatchList = async (part) => {
    const res = await apiFunction(addVehicleToWatchlistApi, [myself?.id], { vehicle: part }, "PUT", true);
    if (res?.success) {
      Toast.show({
        type: 'success',
        text1: 'Part added to watchlist successfully',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Failed to add part to watchlist',
      });
    }

  }

  console.log(gifUrl, '-------------gifUrl')

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#C6122E" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#FFFFFF" size={wp('6%')} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verified Parts</Text>
        <TouchableOpacity style={styles.homeIconContainer} onPress={() => navigation.navigate('OwnerHome')}>
          <Home color="#C6122E" size={wp('5%')} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Active Search Info */}
        <View style={styles.searchInfoCard}>
          <View>
            <Text style={styles.activeSearchLabel}>ACTIVE SEARCH</Text>
            <Text style={styles.activeSearchValue}>
              {vehicle ? `Vehicle: ${vehicle.typeName || vehicle.modelName || 'Selected Vehicle'}` : `Part: ${partNum}`}
            </Text>
          </View>
          <TouchableOpacity>
            <Settings color="#D1D1D1" size={wp('5%')} />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={{ padding: hp('5%'), alignItems: 'center' }}>
            <Text style={{ fontSize: wp('4%'), color: '#8E8E8E' }}>Loading parts...</Text>
          </View>
        )}

        {!loading && parts.length === 0 && (
          <View style={{ padding: hp('5%'), alignItems: 'center' }}>
            <Text style={{ fontSize: wp('4%'), color: '#8E8E8E' }}>No parts found.</Text>
          </View>
        )}

        {/* Parts List Grid */}
        <View style={styles.partsGrid}>
          {parts.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridCard}
              onPress={() => handleOpenDetails(item)}
            >
              <View style={styles.cardImageContainer}>
                <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="contain" />
                <TouchableOpacity style={styles.favoriteBtn} onPress={() => toggleFavorite(item)}>
                  <Heart
                    size={wp('5%')}
                    color={favorites.some((f) => f.id === item.id) ? '#C6122E' : '#D1D1D1'}
                    fill={favorites.some((f) => f.id === item.id) ? '#C6122E' : 'none'}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.tagBadgeSmall}>
                  <Text style={styles.tagTextSmall}>{item.tag}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                {item.tradeNumbers && item.tradeNumbers.length > 0 && (
                  <Text style={styles.cardTradeNo}>Ref: {item.tradeNumbers[0]}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

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
                <TouchableOpacity
                  style={[styles.dotBtn, activeImageTab === 'static' ? styles.dotActive : styles.dotInactive]}
                  onPress={() => setActiveImageTab('static')}
                />
                {gifUrl ? (
                  <TouchableOpacity
                    style={[styles.dotBtn, activeImageTab === '360' ? styles.dotActive : styles.dotInactive]}
                    onPress={() => setActiveImageTab('360')}
                  />
                ) : null}
              </View>

              <View style={styles.productImageCard}>
                <View style={styles.magnifyBadge}>
                  <View style={styles.magnifyDot} />
                  <Text style={styles.magnifyText}>{activeImageTab === '360' ? '360° INTERACTIVE' : 'STATIC MAGNIFY'}</Text>
                </View>
                {activeImageTab === '360' && gifUrl ? (
                  <View style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: wp('8%') }}>
                    <WebView
                      source={{ html: get360Html(gifUrl, true), baseUrl: baseUrl }}
                      style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                      originWhitelist={['*']}
                      scrollEnabled={false}
                      bounces={false}
                      showsHorizontalScrollIndicator={false}
                      showsVerticalScrollIndicator={false}
                      onMessage={(event) => {
                        if (event.nativeEvent.data === 'openFullscreen') {
                          setShowFullscreen360(true);
                        }
                      }}
                    />
                  </View>
                ) : (
                  <TouchableOpacity 
                    onPress={() => setShowFullscreen360(true)} 
                    activeOpacity={0.9} 
                    style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Image
                      source={{ uri: staticUrl }}
                      style={styles.productImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
              </View>

              {gifUrl ? (
                <View style={styles.viewToggleContainer}>
                  <TouchableOpacity
                    style={[styles.viewToggleBtn, activeImageTab === 'static' && styles.viewToggleBtnActive]}
                    onPress={() => setActiveImageTab('static')}
                  >
                    <Text style={[styles.viewToggleText, activeImageTab === 'static' && styles.viewToggleTextActive]}>📸 Static View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.viewToggleBtn, activeImageTab === '360' && styles.viewToggleBtnActive]}
                    onPress={() => setActiveImageTab('360')}
                  >
                    <Text style={[styles.viewToggleText, activeImageTab === '360' && styles.viewToggleTextActive]}>🔄 360° Interactive View</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Info Section */}
              <View style={styles.modalInfoContainer}>
                <View style={styles.badgeRow}>
                  <View style={styles.verifiedFitBadge}>
                    <Text style={styles.verifiedFitBadgeText}>VERIFIED FIT</Text>
                  </View>
                  <Text style={styles.categoryText}>{selectedPart?.category}</Text>
                </View>

                <Text style={styles.modalPartTitle}>{selectedPart?.title}</Text>
                <Text style={styles.modalPartSubtitle}>{selectedPart?.subtitle}</Text>

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
                    <View key={index} style={[styles.specRow, index === selectedPart.specs.length - 1 && { borderBottomWidth: 0 }]}>
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
                onPress={async () => {
                  await addPartTowatchList(selectedPart)
                  setShowDetailsModal(false);
                  navigation.navigate('TechnicalEnquiry', { part: selectedPart, vehicle: vehicle });
                }}
              >
                <Settings color="#FFFFFF" size={wp('5%')} />
                <Text style={styles.footerBtnTextEnquiry}>ENQUIRY</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerBtnDealers}
                onPress={async () => {
                  await addPartTowatchList(selectedPart)
                  setShowDetailsModal(false);
                  dispatch(setPart(selectedPart));
                  dispatch(setSelectedVehicle(vehicle))
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

      {/* Fullscreen 360 Modal */}
      <Modal
        visible={showFullscreen360}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setShowFullscreen360(false)}
      >
        <SafeAreaView style={styles.fullscreenContainer}>
          <View style={styles.fullscreenHeader}>
            <TouchableOpacity onPress={() => setShowFullscreen360(false)} style={styles.fullscreenBackBtn}>
              <ChevronLeft color="#000000" size={wp('8%')} />
              <Text style={styles.fullscreenBackText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.fullscreenTitle} numberOfLines={1}>
              {selectedPart?.title}
            </Text>
            <View style={{ width: wp('12%') }} />
          </View>

          <View style={styles.fullscreenBody}>
            {gifUrl && activeImageTab === '360' ? (
              <WebView
                source={{ html: get360Html(gifUrl, false), baseUrl: baseUrl }}
                style={{ flex: 1, width: wp('100%'), height: hp('80%'), backgroundColor: 'transparent' }}
                originWhitelist={['*']}
                scrollEnabled={false}
                bounces={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <Image
                source={{ uri: staticUrl }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            )}
          </View>

          <View style={styles.fullscreenFooter}>
            <Text style={styles.fullscreenFooterText}>
              {gifUrl && activeImageTab === '360' ? '↔ DRAG TO ROTATE 360°' : 'STATIC IMAGE VIEW'}
            </Text>
          </View>
        </SafeAreaView>
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
  scrollContent: {
    paddingTop: hp('2%'),
    paddingBottom: hp('5%'),
  },
  searchInfoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp('6%'),
    padding: wp('4%'),
    borderRadius: wp('3%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('3%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  activeSearchLabel: {
    fontSize: wp('2.5%'),
    color: '#8E8E8E',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  activeSearchValue: {
    fontSize: wp('3.5%'),
    fontWeight: 'bold',
    color: '#000000',
    marginTop: hp('0.2%'),
  },
  partsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: wp('6%'),
  },
  gridCard: {
    backgroundColor: '#FFFFFF',
    width: wp('42%'),
    borderRadius: wp('5%'),
    marginBottom: hp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImageContainer: {
    height: hp('15%'),
    backgroundColor: '#FFFFFF',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cardImage: {
    width: '80%',
    height: '80%',
  },
  favoriteBtn: {
    position: 'absolute',
    top: wp('2%'),
    right: wp('2%'),
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: wp('1.5%'),
    borderRadius: wp('4%'),
  },
  cardInfo: {
    padding: wp('3%'),
    backgroundColor: '#F9F9F9',
  },
  tagBadgeSmall: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.3%'),
    borderRadius: wp('1%'),
    alignSelf: 'flex-start',
    marginBottom: hp('0.5%'),
  },
  tagTextSmall: {
    color: '#FFFFFF',
    fontSize: wp('2.2%'),
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.2,
    marginBottom: hp('0.2%'),
  },
  cardSubtitle: {
    fontSize: wp('2.8%'),
    color: '#C6122E',
    fontWeight: 'bold',
  },
  cardTradeNo: {
    fontSize: wp('2.5%'),
    color: '#8E8E8E',
    marginTop: hp('0.5%'),
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
    backgroundColor: '#C6122E',
    borderRadius: 3,
    marginRight: wp('1.5%'),
  },
  dotInactive: {
    width: wp('1.5%'),
    height: wp('1.5%'),
    backgroundColor: '#D1D1D1',
    borderRadius: wp('0.75%'),
  },
  dotBtn: {
    padding: wp('1%'),
  },
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F1F5',
    marginHorizontal: wp('6%'),
    borderRadius: wp('4%'),
    padding: wp('1%'),
    marginBottom: hp('3%'),
  },
  viewToggleBtn: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
    borderRadius: wp('3%'),
  },
  viewToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  viewToggleText: {
    fontSize: wp('3.2%'),
    color: '#8E8E8E',
    fontWeight: 'bold',
  },
  viewToggleTextActive: {
    color: '#000000',
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
    backgroundColor: '#C6122E',
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
    color: '#C6122E',
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
    backgroundColor: '#C6122E',
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
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fullscreenHeader: {
    height: hp('8%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  fullscreenBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullscreenBackText: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: wp('1%'),
  },
  fullscreenTitle: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
    color: '#000000',
    maxWidth: wp('50%'),
  },
  fullscreenBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  fullscreenImage: {
    width: wp('90%'),
    height: wp('90%'),
  },
  fullscreenFooter: {
    height: hp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  fullscreenFooterText: {
    fontSize: wp('3.5%'),
    fontWeight: 'bold',
    color: '#888888',
  },
});

export default VerifiedPartsScreen;
