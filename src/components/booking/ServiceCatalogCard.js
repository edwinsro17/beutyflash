import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors } from '../../theme/palette';
import { formatCOP } from '../../utils/formatters';

export default function ServiceCatalogCard({
  servicio,
  widthStyle,
  onSelectSalon,
  onSelectDomicilio,
}) {
  return (
    <View style={[styles.card, widthStyle]}>
      <View style={styles.topRow}>
        {servicio.image ? (
          <Image source={{ uri: servicio.image }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, { backgroundColor: '#F3EFEA' }]} />
        )}
        <View style={styles.infoCol}>
          <Text style={styles.category} numberOfLines={1}>
            {servicio.categoryLabel}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {servicio.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {servicio.duration} • {servicio.proName}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.price}>{formatCOP(servicio.priceCop)} COP</Text>
        <View style={styles.btns}>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={onSelectSalon}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineText}>En salón</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onSelectDomicilio}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryText}>A domicilio</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#1F1A17',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: 14,
  },
  infoCol: {
    flex: 1,
    flexShrink: 1,
    marginLeft: 12,
  },
  category: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 2,
    lineHeight: 20,
  },
  meta: {
    fontSize: 12,
    color: colors.textGray,
    marginTop: 3,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2ECE6',
    paddingTop: 12,
    marginTop: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textDark,
    flexShrink: 1,
  },
  btns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  outlineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: colors.primary,
  },
  outlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  flexShrink: 1 },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  primaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  flexShrink: 1 },
});
