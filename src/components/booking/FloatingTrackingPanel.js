import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/palette';
import { formatCOP } from '../../utils/formatters';
import { formatearEtiquetaEstado } from '../../patterns/RequestStateFactory';

export function FloatingTopEtaBanner({ solicitud }) {
  const mismaUbicacion =
    solicitud.distancia_estimada_km === 0 ||
    (solicitud.distancia_estimada_km !== null && solicitud.distancia_estimada_km <= 0.03);

  const textoDistancia = mismaUbicacion
    ? 'En ubicación (0 m)'
    : solicitud.tiempo_estimado_minutos === null || solicitud.tiempo_estimado_minutos === undefined
    ? `Distancia aprox.: ${solicitud.distancia_estimada_km ?? '--'} km • Tiempo estimado no disponible`
    : `Distancia: ${solicitud.distancia_estimada_km} km • Estimación: ~${solicitud.tiempo_estimado_minutos} min`;

  return (
    <View style={styles.topBar}>
      <View style={styles.dot} />
      <View style={styles.topBarTextWrap}>
        <Text style={styles.status} numberOfLines={1}>
          {formatearEtiquetaEstado(solicitud.estado).toUpperCase()}
        </Text>
        <Text style={styles.eta} numberOfLines={2}>
          {textoDistancia}
        </Text>
      </View>
    </View>
  );
}

export function FloatingBottomTrackingCard({
  personaNombre,
  personaFoto,
  personaTelefono,
  servicioNombre,
  direccion,
  precioTotalCop,
  codigoReserva,
  onOpenChat,
  actionButtons = null,
}) {
  return (
    <View style={styles.bottomCard}>
      <View style={styles.row}>
        {personaFoto ? (
          <Image source={{ uri: personaFoto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Feather name="user" size={20} color={colors.primary} />
          </View>
        )}
        <View style={styles.infoCol}>
          <Text style={styles.name} numberOfLines={1}>
            {personaNombre}
          </Text>
          <Text style={styles.service} numberOfLines={1}>
            {servicioNombre}
          </Text>
          {direccion ? (
            <Text style={styles.meta} numberOfLines={2}>
              {direccion}
            </Text>
          ) : (
            <Text style={styles.meta} numberOfLines={1}>
              {formatCOP(precioTotalCop)} COP • #{codigoReserva}
            </Text>
          )}
        </View>
        <View style={styles.commBtns}>
          <TouchableOpacity style={styles.circleBtn} onPress={onOpenChat}>
            <Feather name="message-square" size={18} color={colors.primary} />
          </TouchableOpacity>
          {personaTelefono ? (
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => Linking.openURL(`tel:${personaTelefono}`)}
            >
              <Feather name="phone" size={18} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      {actionButtons ? <View style={styles.actionsWrap}>{actionButtons}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(26,23,21,0.94)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' },
  topBarTextWrap: { flex: 1, flexShrink: 1 },
  status: { color: colors.primaryLight, fontSize: 10.5, fontWeight: '800' },
  eta: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginTop: 2, lineHeight: 16 },
  bottomCard: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#1F1A17',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: { flex: 1, flexShrink: 1, marginLeft: 12, marginRight: 8 },
  name: { fontSize: 14.5, fontWeight: '800', color: colors.textDark },
  service: { fontSize: 12, color: colors.primary, fontWeight: '700', marginTop: 1 },
  meta: { fontSize: 11.5, color: colors.textGray, marginTop: 2, lineHeight: 15 },
  commBtns: { flexDirection: 'row', gap: 8 },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6EFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsWrap: { marginTop: 12 },
});
