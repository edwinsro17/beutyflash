import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/palette';

export default function PhotoUploaderCard({
  title = 'Fotografía de perfil *',
  fotoUrl,
  subiendo = false,
  progreso = 0,
  onSelect,
  onRemove,
}) {
  return (
    <View style={styles.card}>
      {fotoUrl ? (
        <Image source={{ uri: fotoUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.placeholder}>
          <Feather name="image" size={24} color={colors.textGray} />
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>
          {subiendo
            ? `Subiendo (${progreso}%)...`
            : fotoUrl
            ? 'Imagen cargada desde el dispositivo'
            : 'Selecciona una fotografía desde tu galería'}
        </Text>
        {subiendo && (
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${progreso}%` }]} />
          </View>
        )}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btn} onPress={onSelect} disabled={subiendo}>
            <Feather name="upload" size={13} color={colors.primary} />
            <Text style={styles.btnText}>{fotoUrl ? 'Cambiar' : 'Seleccionar del dispositivo'}</Text>
          </TouchableOpacity>
          {fotoUrl && !subiendo && onRemove ? (
            <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
              <Feather name="trash-2" size={13} color="#C0392B" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  placeholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 13.5, fontWeight: '700', color: colors.textDark },
  sub: { fontSize: 11.5, color: colors.textGray, marginTop: 2 },
  barBg: { width: '100%', height: 5, backgroundColor: '#EAE4DC', borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F6EFEB',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  btnText: { fontSize: 12, fontWeight: '700', color: colors.primary , flexShrink: 1 },
  removeBtn: { backgroundColor: '#FDEDEC', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
});
