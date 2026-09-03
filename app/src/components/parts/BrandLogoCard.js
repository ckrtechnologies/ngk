import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Car, Check } from 'lucide-react-native';

const BrandLogoCard = ({ item, isSelected, onPress }) => {
  const [imageFailed, setImageFailed] = useState(false);

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
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  cardSelected: {
    borderColor: '#C6122E',
    backgroundColor: '#FEF2F2',
    shadowColor: '#C6122E',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#C6122E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: '100%',
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  logoImage: {
    width: 38,
    height: 22,
  },
  fallbackCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 10,
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
