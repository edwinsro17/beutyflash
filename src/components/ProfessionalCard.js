import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { formatCOP } from '../theme/colors';

export default function ProfessionalCard({
  imageUri,
  name,
  rating,
  reviews,
  role,
  priceCop = 55000,
  price,
  onPress,
}) {
  const formatted = priceCop ? formatCOP(priceCop) : price || '$55.000';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <ImageBackground
        source={{ uri: imageUri }}
        style={styles.imageBackground}
        imageStyle={{ borderRadius: 16 }}
      >
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.gradientOverlay}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            <MaterialIcons name="verified" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </View>
          <View style={styles.ratingRow}>
            <Feather name="star" size={12} color="#F5A623" />
            <Text style={styles.ratingText}>
              {rating} <Text style={styles.reviewsText}>({reviews})</Text>
            </Text>
          </View>
          <Text style={styles.role} numberOfLines={1}>{role}</Text>
          <View style={styles.footerRow}>
            <Text style={styles.priceLabel}>
              Desde <Text style={styles.priceValue}>{formatted}</Text>
            </Text>
            <TouchableOpacity style={styles.reserveButton} onPress={onPress}>
              <Text style={styles.reserveText}>Pedir</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 225,
    height: 295,
    marginRight: 16,
    borderRadius: 16,
    elevation: 4,
  },
  imageBackground: { width: '100%', height: '100%', justifyContent: 'flex-end' },
  gradientOverlay: { padding: 16, borderRadius: 16, height: '60%', justifyContent: 'flex-end' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginLeft: 4 },
  reviewsText: { fontWeight: '400', color: '#E0E0E0' },
  role: { fontSize: 12.5, color: '#E0E0E0', marginBottom: 14 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 12.5, color: '#FFFFFF' },
  priceValue: { fontWeight: '800', color: '#F5A623' },
  reserveButton: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reserveText: { fontSize: 12.5, fontWeight: '700', color: '#2D221E' },
});