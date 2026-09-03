import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Car, Check } from 'lucide-react-native';

const BrandLogoCard = ({ item, isSelected, onPress }) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [item?.logoUrl]);

  const name = item.name || item.manuName || 'Brand';
  const logoUrl = item.logoUrl;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      {isSelected && (
        <View style={styles.selectedBadge}>
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
        </View>
      )}

      <View style={styles.logoContainer}>
        {logoUrl && !imageFailed ? (
          <Image
            source={{ uri: logoUrl }}
            style={styles.logoImage}
            resizeMode="contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.fallbackCircle}>
            <Car size={18} color={isSelected ? '#C6122E' : '#6B7280'} />
          </View>
        )}
      </View>

      <Text
        style={[
          styles.brandName,
          isSelected && styles.brandNameSelected,
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '29%',
    maxWidth: '32%',
    height: 68,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    position: 'relative',
  },
  cardSelected: {
    borderColor: '#C6122E',
    backgroundColor: '#FEF2F2',
    shadowColor: '#C6122E',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C6122E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: '100%',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoImage: {
    width: 44,
    height: 28,
  },
  fallbackCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  brandNameSelected: {
    color: '#C6122E',
  },
});

export default BrandLogoCard;
