/**
 * Archivo: src/services/notificationRouterService.js
 * Módulo 3.4: Sistema Centralizado de Resolución de Rutas y Direccionamiento de Notificaciones
 * - Valida permisos y rol/modo antes de abrir información privada
 * - Resuelve cada tipo de notificación hacia su pantalla exacta
 */

import { sessionStore } from './sessionStore';
import { cambiarModalidadSinCerrarSesion } from './sessionService';

export const NOTIFICATION_ROUTE_MAP = Object.freeze({
  // Clientes
  solicitud_enviada: { screen: 'SearchResults', requiredMode: 'cliente' },
  aceptada_profesional: { screen: 'SearchResults', requiredMode: 'cliente' },
  rechazada_profesional: { screen: 'SearchResults', requiredMode: 'cliente' },
  confirmada_cliente_vista: { screen: 'BookingTracking', requiredMode: 'cliente' },
  en_camino: { screen: 'BookingTracking', requiredMode: 'cliente' },
  profesional_proximo: { screen: 'BookingTracking', requiredMode: 'cliente' },
  profesional_llego: { screen: 'BookingTracking', requiredMode: 'cliente' },
  en_servicio: { screen: 'BookingTracking', requiredMode: 'cliente' },
  finalizada: { screen: 'SearchResults', requiredMode: 'cliente' },
  cancelada: { screen: 'SearchResults', requiredMode: 'cliente' },
  mensaje_chat: { screen: 'SearchResults', requiredMode: null },
  recordatorio_cita: { screen: 'SearchResults', requiredMode: null },
  CLIENT_REQUEST_SENT: { screen: 'SearchResults', requiredMode: 'cliente' },
  CLIENT_PRO_ACCEPTED: { screen: 'SearchResults', requiredMode: 'cliente' },
  CLIENT_PRO_REJECTED: { screen: 'SearchResults', requiredMode: 'cliente' },
  CLIENT_BOOKING_CONFIRMED: { screen: 'BookingTracking', requiredMode: 'cliente' },
  CLIENT_PRO_EN_ROUTE: { screen: 'BookingTracking', requiredMode: 'cliente' },
  CLIENT_PRO_ARRIVING_SOON: { screen: 'BookingTracking', requiredMode: 'cliente' },
  CLIENT_PRO_ARRIVED: { screen: 'BookingTracking', requiredMode: 'cliente' },
  CLIENT_SERVICE_STARTED: { screen: 'BookingTracking', requiredMode: 'cliente' },
  CLIENT_SERVICE_COMPLETED: { screen: 'SearchResults', requiredMode: 'cliente' },
  CLIENT_BOOKING_CANCELLED: { screen: 'SearchResults', requiredMode: 'cliente' },
  CLIENT_NEW_MESSAGE: { screen: 'SearchResults', requiredMode: null },
  // Profesionales
  solicitud_recibida: { screen: 'ProDashboard', requiredMode: 'profesional' },
  confirmada_cliente: { screen: 'BookingTracking', requiredMode: 'profesional' },
  PRO_NEW_REQUEST: { screen: 'ProDashboard', requiredMode: 'profesional' },
  PRO_CLIENT_CONFIRMED: { screen: 'BookingTracking', requiredMode: 'profesional' },
  PRO_BOOKING_CANCELLED: { screen: 'ProDashboard', requiredMode: 'profesional' },
  PRO_APPOINTMENT_REMINDER: { screen: 'Agenda', requiredMode: 'profesional' },
  PRO_CLIENT_STARTED_SERVICE: { screen: 'BookingTracking', requiredMode: 'profesional' },
  PRO_NEW_RATING: { screen: 'MiPerfil', requiredMode: 'profesional' },
  PRO_RECHARGE_APPROVED: { screen: 'WalletHistory', requiredMode: 'profesional' },
  PRO_RECHARGE_REJECTED: { screen: 'Billetera', requiredMode: 'profesional' },
  PRO_COMMISSION_DEDUCTED: { screen: 'WalletHistory', requiredMode: 'profesional' },
  PRO_INSUFFICIENT_BALANCE: { screen: 'WalletRecharge', requiredMode: 'profesional' },
});

export function resolverRutaNotificacion(notificacion) {
  if (!notificacion) return { screen: 'Home', params: {}, authorized: false };

  const currentUserId =
    sessionStore.userId ||
    sessionStore.clientUser?.id ||
    sessionStore.proUser?.usuario_id ||
    sessionStore.proUser?.id;

  // Verificar que la notificación pertenezca al usuario autenticado si especifica destinatario
  const recipientId = notificacion.recipient_user_id || notificacion.usuario_id;
  if (recipientId && currentUserId && String(recipientId) !== String(currentUserId)) {
    return {
      screen: null,
      params: {},
      authorized: false,
      reason: 'Esta notificación pertenece a otro usuario.',
    };
  }

  const tipo = notificacion.type || notificacion.tipo || 'estado_solicitud';
  const mapped = NOTIFICATION_ROUTE_MAP[tipo] || {
    screen: notificacion.target_screen || 'SearchResults',
    requiredMode: notificacion.rol_destino === 'profesional' ? 'profesional' : 'cliente',
  };

  return {
    screen: mapped.screen,
    requiredMode: mapped.requiredMode,
    authorized: true,
    params: {
      codigo_reserva: notificacion.codigo_reserva || notificacion.entity_id || null,
      entity_id: notificacion.entity_id || notificacion.codigo_reserva || null,
      openChat: tipo === 'mensaje_chat' || tipo === 'CLIENT_NEW_MESSAGE',
      notificationId: notificacion.id,
    },
  };
}

export async function navegarDesdeNotificacion(notificacion, navigation) {
  const resolved = resolverRutaNotificacion(notificacion);
  if (!resolved.authorized || !resolved.screen) {
    return resolved;
  }

  if (
    resolved.requiredMode &&
    resolved.requiredMode !== sessionStore.activeRoleSession &&
    (resolved.requiredMode === 'cliente' ||
      (sessionStore.roles || []).includes('PROFESSIONAL'))
  ) {
    await cambiarModalidadSinCerrarSesion(resolved.requiredMode, null);
  }

  if (navigation?.navigate) {
    navigation.navigate(resolved.screen, resolved.params);
  }
  return resolved;
}
