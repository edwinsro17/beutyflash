import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/palette';
import { formatCOP } from '../../utils/formatters';
import { ESTADOS_SOLICITUD_OFICIALES, formatearEtiquetaEstado } from '../../patterns/RequestStateFactory';

export default function ActiveRequestCard({
  solicitud,
  onConfirmDefinitive,
  onCancel,
  onOpenChat,
}) {
  if (!solicitud) return null;
  const pendienteConfirmacion =
    solicitud.estado === ESTADOS_SOLICITUD_OFICIALES.ACEPTADA_POR_PRO ||
    solicitud.estado === ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_CONFIRMACION_CLIENTE;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.badge}>
          SOLICITUD #{solicitud.codigo_reserva} • {formatearEtiquetaEstado(solicitud.estado).toUpperCase()}
        </Text>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>{solicitud.servicio_nombre}</Text>
      <Text style={styles.sub}>
        Profesional: {solicitud.profesional_nombre} • {formatCOP(solicitud.precio_total_cop)} COP
      </Text>

      {pendienteConfirmacion && (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmHint}>
            El profesional aceptó tu solicitud. Confirma definitivamente para activar el servicio.
          </Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={onConfirmDefinitive}>
            <Feather name="check-circle" size={16} color="#FFFFFF" />
            <Text style={styles.confirmBtnText}>Confirmar Definitivamente el Servicio</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.chatBtn} onPress={onOpenChat}>
        <Feather name="message-square" size={14} color="#FFFFFF" />
        <Text style={styles.chatBtnText}>
          Abrir conversación ({(solicitud.mensajes_chat || []).length})
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryLight,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { fontSize: 10, fontWeight: '800', color: colors.primaryLight, flex: 1, paddingRight: 8 },
  cancelText: { fontSize: 11.5, fontWeight: '700', color: '#FCA5A5' , flexShrink: 1 },
  title: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },
  sub: { fontSize: 12, color: '#D6CEC7', marginTop: 2 },
  confirmBox: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  confirmHint: { fontSize: 12, color: '#E5DCD4', marginBottom: 8 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 12,
    borderRadius: 10,
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' , flexShrink: 1 },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  chatBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' , flexShrink: 1 },
});
