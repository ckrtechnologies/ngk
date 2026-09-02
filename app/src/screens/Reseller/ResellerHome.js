import React, { useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
} from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import {
    Menu,
    Bell,
    Home,
    Search,
    MessageSquare,
    ShoppingCart,
    Settings,
    Truck,
    ChevronRight,
    CheckCircle,
    Clock
} from "lucide-react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getEnquiryRedux, getMyselfRedux, getArticlesRedux } from "../../redux/getData";

const ResellerHomeScreen = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { enquiry, myself, articles } = useSelector((state) => state.getData);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const userId = await AsyncStorage.getItem("userId");
            if (userId) {
                dispatch(getMyselfRedux(userId));
                dispatch(getEnquiryRedux(userId));
            }

            const getArticlesParams = {
                "articleCountry": "ZA",
                "dataSupplierIds": ["5567", "7729"],
                "lang": "en",
                "perPage": 10,
                "page": 1,
                "includeAll": true
            };
            dispatch(getArticlesRedux({ getArticles: getArticlesParams }));
        };

        fetchDashboardData();
    }, [dispatch]);

    const pendingCount = enquiry?.filter(e => (e.vehicle?.status || e.status) === 'Pending')?.length || 0;
    const approvedCount = enquiry?.filter(e => (e.vehicle?.status || e.status) === 'Approved')?.length || 0;
    const recentEnquiries = enquiry?.slice(0, 2) || [];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#D3132A" />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('CustomDrawer')}>
                    <Menu color="#fff" size={wp("6%")} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Reseller Portal</Text>

                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
                        {pendingCount > 0 && <View style={styles.badge} />}
                        <Bell color="#fff" size={wp("6%")} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.homeIcon}>
                        <Home color="#D3132A" size={wp("5%")} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: hp('10%') }}>

                {/* HERO CARD */}
                <View style={styles.heroCard}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>LIVE SYNC ACTIVE</Text>
                    </View>

                    <Text style={styles.heroTitle}>Welcome, {myself?.name || 'Partner'}!</Text>

                    <Text style={styles.heroSub}>
                        {myself?.email || 'Reseller Account'} • {pendingCount} enquiries pending review
                    </Text>
                </View>

                {/* STATS CARDS */}
                <View style={styles.statsRow}>
                    <TouchableOpacity
                        style={styles.statCard}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate("MyEnquiries")}
                    >
                        <View style={styles.iconCircleYellow}>
                            <Clock size={20} color="#D97706" />
                        </View>
                        <Text style={styles.statNumber}>{pendingCount}</Text>
                        <Text style={styles.statLabel}>Pending Requests</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.statCard}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate("MyEnquiries")}
                    >
                        <View style={styles.iconCircleGreen}>
                            <CheckCircle size={20} color="#10B981" />
                        </View>
                        <Text style={styles.statNumber}>{approvedCount}</Text>
                        <Text style={styles.statLabel}>Approved Orders</Text>
                    </TouchableOpacity>
                </View>

                {/* RECENT ENQUIRIES SECTION */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Enquiries</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('MyEnquiries')}>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View>

                {recentEnquiries.map((item, index) => {
                    const v = item.vehicle || {};
                    const status = v.status || item.status || 'Pending';
                    const title = v.title || item.title || 'Technical Enquiry';
                    const date = item.enquiryDate ? new Date(item.enquiryDate).toLocaleDateString() : '';

                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.enquiryCard}
                            onPress={() => navigation.navigate('MyEnquiries')}
                        >
                            <View style={styles.enqCardLeft}>
                                <View style={styles.enqIconBox}>
                                    <MessageSquare color="#D3132A" size={20} />
                                </View>
                                <View style={styles.enqInfo}>
                                    <Text style={styles.enqTitle} numberOfLines={1}>{title}</Text>
                                    <Text style={styles.enqDate}>ENQ-{item.id} • {date}</Text>
                                </View>
                            </View>
                            <View style={[styles.statusBadge, status === 'Approved' ? styles.badgeApproved : styles.badgePending]}>
                                <Text style={styles.statusBadgeText}>{status.toUpperCase()}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {recentEnquiries.length === 0 && (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No recent enquiries available.</Text>
                    </View>
                )}

                {/* CATALOG CARD */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('PartsFinder')}
                    style={styles.catalogCard}
                >
                    <Search color="#D3132A" size={24} />
                    <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={styles.catalogTitle}>Instant Catalog</Text>
                        <Text style={styles.catalogSub}>
                            {articles?.length ? `${articles.length}+ parts loaded` : 'Find part numbers for customers'}
                        </Text>
                    </View>
                    <ChevronRight color="#BDBDBD" size={22} />
                </TouchableOpacity>

            </ScrollView>

            {/* BOTTOM NAVIGATION */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <Home color="#fff" size={22} />
                    <Text style={styles.navText}>Portal</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('PartsFinder')}>
                    <Search color="#fff" size={22} />
                    <Text style={styles.navText}>Search</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('MyEnquiries')} style={styles.navItem}>
                    <MessageSquare color="#fff" size={22} />
                    <Text style={styles.navText}>Inbox</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('DealerLocator')} style={styles.navItem}>
                    <ShoppingCart color="#fff" size={22} />
                    <Text style={styles.navText}>Depots</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default ResellerHomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F6FA"
    },
    header: {
        backgroundColor: "#D3132A",
        height: hp("8%"),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: wp("4%")
    },
    headerTitle: {
        color: "#fff",
        fontSize: wp("4.5%"),
        fontWeight: "bold"
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center"
    },
    headerIcon: {
        marginRight: 10
    },
    badge: {
        position: "absolute",
        right: -2,
        top: -2,
        width: 8,
        height: 8,
        backgroundColor: "#fff",
        borderRadius: 10
    },
    homeIcon: {
        backgroundColor: "#fff",
        width: 36,
        height: 36,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center"
    },
    heroCard: {
        backgroundColor: "#000",
        margin: wp("5%"),
        borderRadius: wp("6%"),
        padding: wp("6%"),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    tag: {
        backgroundColor: "#D3132A",
        alignSelf: "flex-start",
        paddingHorizontal: wp("3%"),
        paddingVertical: hp("0.5%"),
        borderRadius: wp("1.5%"),
        marginBottom: hp("1.5%")
    },
    tagText: {
        color: "#fff",
        fontSize: wp("2.5%"),
        fontWeight: "bold"
    },
    heroTitle: {
        color: "#fff",
        fontSize: wp("6%"),
        fontWeight: "bold"
    },
    heroSub: {
        color: "#aaa",
        marginTop: hp("0.8%"),
        fontSize: wp("3.2%")
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: wp("5%"),
        marginBottom: hp("2.5%")
    },
    statCard: {
        backgroundColor: "#fff",
        width: "48%",
        borderRadius: wp("5%"),
        padding: wp("5%"),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    iconCircleYellow: {
        backgroundColor: "#FEF3C7",
        width: wp("10%"),
        height: wp("10%"),
        borderRadius: wp("2.5%"),
        justifyContent: "center",
        alignItems: "center",
        marginBottom: hp("1.5%")
    },
    iconCircleGreen: {
        backgroundColor: "#D1FAE5",
        width: wp("10%"),
        height: wp("10%"),
        borderRadius: wp("2.5%"),
        justifyContent: "center",
        alignItems: "center",
        marginBottom: hp("1.5%")
    },
    statNumber: {
        fontSize: wp("5.5%"),
        fontWeight: "bold",
        color: "#000"
    },
    statLabel: {
        color: "#9CA3AF",
        marginTop: hp("0.5%"),
        fontSize: wp("3%")
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: wp("5%"),
        marginBottom: hp("1.5%")
    },
    sectionTitle: {
        fontSize: wp("4.5%"),
        fontWeight: "bold",
        color: "#000"
    },
    viewAllText: {
        color: "#D3132A",
        fontSize: wp("3.5%"),
        fontWeight: "bold"
    },
    enquiryCard: {
        backgroundColor: "#fff",
        marginHorizontal: wp("5%"),
        marginBottom: hp("1.5%"),
        borderRadius: wp("4%"),
        padding: wp("4%"),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    enqCardLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: wp("3%")
    },
    enqIconBox: {
        backgroundColor: "#FFF1F2",
        padding: wp("3%"),
        borderRadius: wp("3%"),
        marginRight: wp("3%")
    },
    enqInfo: {
        flex: 1,
    },
    enqTitle: {
        fontSize: wp("3.8%"),
        fontWeight: "bold",
        color: "#000",
        marginBottom: hp("0.3%")
    },
    enqDate: {
        fontSize: wp("2.8%"),
        color: "#8E8E8E"
    },
    statusBadge: {
        paddingHorizontal: wp("3%"),
        paddingVertical: hp("0.6%"),
        borderRadius: wp("2%"),
    },
    badgeApproved: {
        backgroundColor: "#10B981"
    },
    badgePending: {
        backgroundColor: "#D97706"
    },
    statusBadgeText: {
        color: "#fff",
        fontSize: wp("2.5%"),
        fontWeight: "bold"
    },
    emptyCard: {
        backgroundColor: "#fff",
        marginHorizontal: wp("5%"),
        marginBottom: hp("2.5%"),
        borderRadius: wp("4%"),
        padding: wp("6%"),
        alignItems: "center"
    },
    emptyText: {
        color: "#8E8E8E",
        fontSize: wp("3.2%")
    },
    catalogCard: {
        backgroundColor: "#fff",
        marginHorizontal: wp("5%"),
        marginTop: hp("1%"),
        borderRadius: wp("5%"),
        padding: wp("5%"),
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    catalogTitle: {
        fontSize: wp("4.2%"),
        fontWeight: "bold",
        color: "#000"
    },
    catalogSub: {
        color: "#9CA3AF",
        fontSize: wp("3%"),
        marginTop: hp("0.3%")
    },
    bottomNav: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        backgroundColor: "#D3132A",
        height: hp("8%"),
        justifyContent: "space-around",
        alignItems: "center"
    },
    navItem: {
        alignItems: "center"
    },
    navText: {
        color: "#fff",
        fontSize: wp("2.8%"),
        marginTop: hp("0.4%")
    }
});