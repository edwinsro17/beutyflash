import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function CustomButton({ title, onPress, variant = 'primary' }) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity 
      style={[styles.button, isPrimary ? styles.primaryBg : styles.secondaryBg]} 
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={[styles.text, isPrimary ? styles.primaryText : styles.secondaryText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  primaryBg: { backgroundColor: colors.primary },
  secondaryBg: { backgroundColor: colors.secondary },
  primaryText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '700',
  flexShrink: 1 },
  secondaryText: {
    color: colors.secondaryText,
    fontSize: 16,
    fontWeight: '600',
  flexShrink: 1 },
});