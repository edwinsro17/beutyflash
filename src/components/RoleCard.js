import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function RoleCard({ 
  selected, 
  onPress, 
  tagText, 
  iconName, 
  imageUri, 
  imageBadgeText, 
  imageBadgeIcon,
  title, 
  description,
  feature1Icon,
  feature1Text,
  feature2Icon,
  feature2Text
}) {
  return (
    <TouchableOpacity 
      style={[styles.card, selected && styles.cardSelected]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Cabecera de la tarjeta: Icono cuadrado y Tag */}
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[styles.iconSquare, selected && styles.iconSquareSelected]}>
            <MaterialCommunityIcons 
              name={iconName} 
              size={20} 
              color={selected ? colors.surface : colors.primary} 
            />
          </View>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{tagText}</Text>
          </View>
        </View>
        
        {/* Círculo de selección (Check) */}
        <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
          {selected && <Feather name="check" size={14} color={colors.surface} />}
        </View>
      </View>

      {/* Imagen con Badge superpuesto */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <View style={styles.imageBadge}>
          <Feather name={imageBadgeIcon} size={12} color={colors.surface} />
          <Text style={styles.imageBadgeText}>{imageBadgeText}</Text>
        </View>
      </View>

      {/* Textos Principales */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {/* Características (Features) inferiores */}
      <View style={styles.featuresRow}>
        <View style={styles.featureItem}>
          <Feather name={feature1Icon} size={14} color={colors.accent} />
          <Text style={styles.featureText}>{feature1Text}</Text>
        </View>
        <Text style={styles.featureDot}>•</Text>
        <View style={styles.featureItem}>
          <Feather name={feature2Icon} size={14} color={colors.accent} />
          <Text style={styles.featureText}>{feature2Text}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#E8DED8', // Borde sutil cuando está seleccionado
    backgroundColor: '#FCF9F7', // Fondo ligeramente más cálido
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F6EFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSquareSelected: {
    backgroundColor: colors.primary,
  },
  tagPill: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textGray,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EAE6E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: colors.primary,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  imageBadgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: colors.textGray,
    lineHeight: 20,
    marginBottom: 16,
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 11,
    color: colors.textGray,
    fontWeight: '500',
  },
  featureDot: {
    fontSize: 10,
    color: '#CCC',
  },
});