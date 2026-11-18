import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/palette';

export default function EmptyStateCard({ icon = 'inbox', title, subtitle }) {
  return (
    <View style={styles.card}>
      <Feather name={icon} size={26} color={colors.textGray} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  title: { fontSize: 14.5, fontWeight: '800', color: colors.textDark, marginTop: 8, textAlign: 'center' },
  subtitle: { fontSize: 12.5, color: colors.textGray, marginTop: 4, textAlign: 'center', lineHeight: 18 },
});
