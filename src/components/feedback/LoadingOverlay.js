import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../theme/palette';

export default function LoadingOverlay({ message = 'Cargando...' }) {
  return (
    <View style={styles.box}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: 24, alignItems: 'center', justifyContent: 'center' },
  text: { marginTop: 10, fontSize: 13, fontWeight: '600', color: colors.textGray },
});
