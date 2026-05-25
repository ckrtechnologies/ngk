import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    TextInput,
    Keyboard,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { ChevronLeft, Search, Truck, ChevronRight, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getVehiclesRedux } from '../redux/getData';

const SEARCH_TYPES = {
    GENERAL: 'GENERAL',
    VIN: 'VIN',
    PLATE: 'PLATE',
};

const VehiclesListScreen = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { vehicles, loading } = useSelector(state => state.getData);

    const [searchType, setSearchType] = useState("GENERAL");
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredVehicles, setFilteredVehicles] = useState([]);

    useEffect(() => {
        if (searchType === SEARCH_TYPES.GENERAL) {
            const getLinkageTargets = {
                "linkageTargetCountry": "ZA",
                "lang": "en",
                "linkageTargetType": "P",
                "perPage": 0,
                "page": 1,
                "includeMfrFacets": true
            };
            dispatch(getVehiclesRedux({ getLinkageTargets }));
        }
    }, [dispatch, searchType]);

    console.log("vehicles", vehicles, searchType);


    const getExtractedList = () => {
        if (searchType === SEARCH_TYPES.GENERAL) {
            return vehicles?.mfrFacets?.counts || [];
        }
        return vehicles?.data?.array || vehicles?.data || vehicles || [];
    };

    const vehicleList = useMemo(() => {
        return getExtractedList();
    }, [vehicles])


    useEffect(() => {
        if (searchType === SEARCH_TYPES.GENERAL && Array.isArray(vehicleList)) {
            if (searchQuery) {
                const lowerCaseQuery = searchQuery?.toLowerCase();
                const filtered = vehicleList.filter(item => {
                    const name = item?.name?.toLowerCase();
                    const count = item?.count?.toString()?.toLowerCase();
                    return name?.includes(lowerCaseQuery) || count?.includes(lowerCaseQuery);
                });
                setFilteredVehicles(filtered);
            } else {
                setFilteredVehicles(vehicleList);
            }
        } else if (searchType !== SEARCH_TYPES.GENERAL) {

            setFilteredVehicles(Array.isArray(vehicleList) ? vehicleList : []);
        }
    }, [searchQuery, vehicles, searchType]);

    const executeApiSearch = () => {
        Keyboard.dismiss();
        if (!searchQuery.trim()) return;

        if (searchType === SEARCH_TYPES.VIN) {
            const payload = {
                "getVehiclesByVIN": {
                    "vin": searchQuery.trim(),
                    "country": "ZA",
                    "lang": "en"
                }
            };
            dispatch(getVehiclesRedux(payload));
        } else if (searchType === SEARCH_TYPES.PLATE) {
            const payload = {
                "getVehiclesByKeyNumberPlates": {
                    "numberPlate": searchQuery.trim(),
                    "countryGroupFlag": false,
                    "country": "ZA",
                    "lang": "en"
                }
            };
            dispatch(getVehiclesRedux(payload));
        }
    };

    const handleSelect = (vehicle) => {

        console.log("Vehicle selected:", vehicle);
        navigation.navigate('ModalsScreen', {
            manuId: vehicle.manuId || vehicle.id || vehicle.name,
            mfrName: vehicle.mfrName || vehicle.name || 'Vehicle'
        });
    };

    const clearSearch = () => {
        setSearchQuery('');
        if (searchType !== SEARCH_TYPES.GENERAL) {
            setFilteredVehicles([]);
        }
    };

    const renderVehicleItem = ({ item }) => {

        let title = '';
        let subtitle = '';
        let year = '';

        if (searchType === SEARCH_TYPES.GENERAL) {
            title = item.name || 'Unknown Make';
            subtitle = item.count ? `${item.count} models available` : '';
        } else {
            title = item.mfrName || item.manuName || item.description || 'Unknown Make';
            subtitle = item.modelName || item.modelSeriesName || item.carName || item.description || 'Unknown Model';
            year = item.yearOfConstrFrom ? `${item.yearOfConstrFrom.toString().substring(0, 4)}` : '';
        }

        return (
            <TouchableOpacity style={styles.vehicleCard} onPress={() => handleSelect(item)}>
                <View style={styles.iconBox}>
                    <Truck color="#C6122E" size={wp('6%')} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.vehicleTitle} numberOfLines={1}>{title}</Text>
                    <Text style={styles.vehicleSubtitle} numberOfLines={1}>
                        {year ? `${year} • ` : ''}{subtitle}
                    </Text>
                </View>
                <ChevronRight color="#D1D1D1" size={wp('6%')} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#C6122E" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ChevronLeft size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Vehicles</Text>
                </View>
            </View>

            <View style={styles.searchContainer}>
                {/* Search Type Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, searchType === SEARCH_TYPES.GENERAL && styles.activeTabButton]}
                        onPress={() => { setSearchType(SEARCH_TYPES.GENERAL); setSearchQuery(''); }}
                    >
                        <Text style={[styles.tabText, searchType === SEARCH_TYPES.GENERAL && styles.activeTabText]}>Make/Model</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, searchType === SEARCH_TYPES.VIN && styles.activeTabButton]}
                        onPress={() => { setSearchType(SEARCH_TYPES.VIN); setSearchQuery(''); setFilteredVehicles([]); }}
                    >
                        <Text style={[styles.tabText, searchType === SEARCH_TYPES.VIN && styles.activeTabText]}>VIN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, searchType === SEARCH_TYPES.PLATE && styles.activeTabButton]}
                        onPress={() => { setSearchType(SEARCH_TYPES.PLATE); setSearchQuery(''); setFilteredVehicles([]); }}
                    >
                        <Text style={[styles.tabText, searchType === SEARCH_TYPES.PLATE && styles.activeTabText]}>Number Plate</Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchBoxRow}>
                    <View style={styles.searchBox}>
                        <Search color="#8E8E8E" size={wp('5%')} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={
                                searchType === SEARCH_TYPES.VIN ? "Enter VIN..." :
                                    searchType === SEARCH_TYPES.PLATE ? "Enter Number Plate..." :
                                        "Search vehicles..."
                            }
                            placeholderTextColor="#8E8E8E"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={searchType !== SEARCH_TYPES.GENERAL ? executeApiSearch : null}
                            returnKeyType={searchType === SEARCH_TYPES.GENERAL ? "done" : "search"}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={clearSearch}>
                                <X color="#8E8E8E" size={wp('5%')} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {searchType !== SEARCH_TYPES.GENERAL && (
                        <TouchableOpacity style={styles.searchActionButton} onPress={executeApiSearch}>
                            <Text style={styles.searchActionText}>Find</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* List */}
            <FlatList
                data={filteredVehicles}
                keyExtractor={(item, index) => item.linkageTargetId?.toString() || item.id?.toString() || item.carId?.toString() || index.toString()}
                renderItem={renderVehicleItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {loading ? "Searching..." :
                                (searchType !== SEARCH_TYPES.GENERAL && !searchQuery) ? `Enter a ${searchType === SEARCH_TYPES.VIN ? 'VIN' : 'Number Plate'} to search` :
                                    "No vehicles found."}
                        </Text>
                    </View>
                }
            />
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
        paddingHorizontal: wp('4%'),
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: wp('5%'),
        fontWeight: 'bold',
        marginLeft: wp('4%'),
    },
    searchContainer: {
        paddingHorizontal: wp('6%'),
        paddingBottom: hp('2%'),
        paddingTop: hp('1%'),
        backgroundColor: '#C6122E',
        borderBottomLeftRadius: wp('6%'),
        borderBottomRightRadius: wp('6%'),
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: wp('2%'),
        marginBottom: hp('1.5%'),
        padding: wp('1%'),
    },
    tabButton: {
        flex: 1,
        paddingVertical: hp('0.8%'),
        alignItems: 'center',
        borderRadius: wp('1.5%'),
    },
    activeTabButton: {
        backgroundColor: '#FFFFFF',
    },
    tabText: {
        color: '#FFFFFF',
        fontSize: wp('3.2%'),
        fontWeight: '600',
    },
    activeTabText: {
        color: '#C6122E',
    },
    searchBoxRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: wp('4%'),
        paddingHorizontal: wp('4%'),
        height: hp('6%'),
    },
    searchIcon: {
        marginRight: wp('2%'),
    },
    searchInput: {
        flex: 1,
        fontSize: wp('3.8%'),
        color: '#000000',
        height: '100%',
    },
    searchActionButton: {
        backgroundColor: '#000000',
        marginLeft: wp('2%'),
        height: hp('6%'),
        paddingHorizontal: wp('5%'),
        justifyContent: 'center',
        borderRadius: wp('4%'),
    },
    searchActionText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: wp('3.8%'),
    },
    listContent: {
        paddingHorizontal: wp('6%'),
        paddingTop: hp('2%'),
        paddingBottom: hp('5%'),
    },
    vehicleCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: wp('5%'),
        padding: wp('4%'),
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp('2%'),
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    iconBox: {
        backgroundColor: '#FFF1F3',
        padding: wp('3%'),
        borderRadius: wp('4%'),
        marginRight: wp('4%'),
    },
    textContainer: {
        flex: 1,
    },
    vehicleTitle: {
        fontSize: wp('4.5%'),
        fontWeight: 'bold',
        color: '#000000',
    },
    vehicleSubtitle: {
        fontSize: wp('3.2%'),
        color: '#8E8E8E',
        marginTop: hp('0.5%'),
    },
    emptyContainer: {
        paddingVertical: hp('10%'),
        alignItems: 'center',
    },
    emptyText: {
        fontSize: wp('4%'),
        color: '#8E8E8E',
        textAlign: 'center',
        paddingHorizontal: wp('10%'),
    },
});

export default VehiclesListScreen;