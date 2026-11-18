import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/palette';

export default function NotificationBannerList({ notificaciones = [], onClose }) {
  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>Notificaciones ({notificaciones.length})</Text>
        <TouchableOpacity onPress={onClose}>
          <Feather name="x" size={18} color={colors.textGray} />
        </TouchableOpacity>
      </View>
      {notificaciones.length === 0 ? (
        <Text style={styles.emptyText}>No hay notificaciones nuevas.</Text>
      ) : (
        notificaciones.map((n) => (
          <View key={n.id} style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{n.titulo}</Text>
              <Text style={styles.itemTime}>{n.hora}</Text>
            </View>
            <Text style={styles.itemMsg}>{n.mensaje}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 13.5, fontWeight: '800', color: colors.textDark },
  emptyText: { fontSize: 12, color: colors.textGray, paddingVertical: 8 , flexShrink: 1 },
  item: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  itemTitle: { fontSize: 12, fontWeight: '800', color: colors.textDark, flex: 1, paddingRight: 8 , flexShrink: 1 },
  itemTime: { fontSize: 10, color: colors.textGray },
  itemMsg: { fontSize: 11.5, color: colors.textGray, marginTop: 2 },
});
