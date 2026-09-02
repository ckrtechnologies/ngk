import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import {
  Car,
  Search,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AppHeader from '../components/common/AppHeader';

const VehiclesListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedManufacturer, selectedSeries } = route.params || {};

  const { vehicles } = useSelector((state) => state.getData);
  const [searchQuery, setSearchQuery] = useState('');

  const rawList = useMemo(() => {
    return vehicles?.mfrFacets?.counts || vehicles?.data?.array || vehicles?.data || [];
  }, [vehicles]);

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return rawList;
    return rawList.filter((item) => {
      const name = item.matchCode || item.manuName || item.modelname || item.name || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [rawList, searchQuery]);

  const handleSelectVehicle = (item) => {
    navigation.navigate('VerifiedParts', {
      vehicle: item,
      selectedManufacturer,
      selectedSeries,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <AppHeader
        title={selectedManufacturer?.manuName || selectedSeries?.modelname || 'Vehicle Variants'}
        subtitle="Select exact engine & year trim"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.container}>
        {/* Search Filter Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search variant, engine, or kW..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredList}
          keyExtractor={(item, index) => String(item.manuId || item.id || index)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const title =
              item.matchCode || item.manuName || item.modelname || item.name || 'Standard Variant';
            const count = item.count;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleSelectVehicle(item)}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Car size={18} color="#C6122E" />
                </View>

                <View style={styles.infoCol}>
                  <Text style={styles.cardTitle}>{title}</Text>
                  <Text style={styles.cardSubtitle}>
                    {count ? `${count} linked parts available` : '100% verified compatibility'}
                  </Text>
                </View>

                <ChevronRight size={18} color="#9CA3AF" />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No matching vehicle trims found</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  listContent: {
    paddingBottom: 24,
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});

export default VehiclesListScreen;