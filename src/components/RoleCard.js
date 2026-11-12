/**
 * Archivo: src/components/RoleCard.js
 * Bloque visual minimalista y comercial para «Elige tu experiencia»,
 * sin fotografías ni ilustraciones genéricas, utilizando exclusivamente iconografía vectorial.
 */

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function RoleCard({
  selected,
  onPress,
  roleLabel,
  iconName,
  title,
  description,
  highlights = [],
}) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.topRow}>
        <View style={styles.identityGroup}>
          <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
            <Feather
              name={iconName}
              size={22}
              color={selected ? '#FFFFFF' : colors.primary}
            />
          </View>
          <View>
            <Text style={[styles.roleTag, selected && styles.roleTagSelected]}>
              {roleLabel}
            </Text>
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>

        <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
          {selected && <Feather name="check" size={14} color="#FFFFFF" />}
        </View>
      </View>
      
      <Text style={styles.description}>{description}</Text>

      {highlights.length > 0 && (
        <View style={styles.highlightsContainer}>
          {highlights.map((item, idx) => (
            <View key={idx} style={styles.highlightPill}>
              <Feather name={item.icon} size={12} color={colors.primary} />
              <Text style={styles.highlightText}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FCF9F7',
    shadowColor: '#844D3B',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  identityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    paddingRight: 10,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F6EFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: colors.primary,
  },
  roleTag: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textGray,
    marginBottom: 3,
  },
  roleTagSelected: {
    color: colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D0C8C0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F6F4',
  },
  radioCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  description: {
    fontSize: 13.5,
    color: colors.textGray,
    lineHeight: 20,
    marginBottom: 14,
  },
  highlightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3EFEA',
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F6EFEB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  highlightText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textDark,
  },
});