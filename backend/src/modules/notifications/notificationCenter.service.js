/**
 * Archivo: backend/src/modules/notifications/notificationCenter.service.js
 * Módulo 3: Sistema Unificado de Notificaciones con Direccionamiento Independiente
 * - Cada notificación va dirigida exclusivamente a `recipient_user_id` (nunca broadcast global para eventos privados)
 * - Gestión de múltiples `device_tokens` por usuario y desactivación selectiva al cerrar sesión
 * - Resolución centralizada de rutas de destino (`target_screen`)
 * - Coordinación entre Realtime in-app y Push Notification con deduplicación (`dedup_key`)
 */

const crypto = require('crypto');
const { db, supabaseRest, emitRealtimeEvent } = require('../../config/supabaseClient');

const deviceTokensStore = new Map(); // key: `${userId}:${token}`
const notificationsStore = [];
const dedupKeysSeen = new Set();

const ROUTE_BY_NOTIFICATION_TYPE = Object.freeze({
  // Clientes
  CLIENT_REQUEST_SENT: 'SearchResults',
  CLIENT_PRO_ACCEPTED: 'SearchResults',
  CLIENT_PRO_REJECTED: 'SearchResults',
  CLIENT_BOOKING_CONFIRMED: 'BookingTracking',
  CLIENT_PRO_EN_ROUTE: 'BookingTracking',
  CLIENT_PRO_ARRIVING_SOON: 'BookingTracking',
  CLIENT_PRO_ARRIVED: 'BookingTracking',
  CLIENT_SERVICE_STARTED: 'BookingTracking',
  CLIENT_SERVICE_COMPLETED: 'SearchResults',
  CLIENT_BOOKING_CANCELLED: 'SearchResults',
  CLIENT_NEW_MESSAGE: 'SearchResults',
  CLIENT_REMINDER: 'SearchResults',
  // Profesionales
  PRO_NEW_REQUEST: 'ProDashboard',
  PRO_CLIENT_CONFIRMED: 'BookingTracking',
  PRO_BOOKING_CANCELLED: 'ProDashboard',
  PRO_APPOINTMENT_REMINDER: 'Agenda',
  PRO_CLIENT_STARTED_SERVICE: 'BookingTracking',
  PRO_NEW_RATING: 'MiPerfil',
  PRO_RECHARGE_APPROVED: 'Billetera',
  PRO_RECHARGE_REJECTED: 'Billetera',
  PRO_COMMISSION_DEDUCTED: 'WalletHistory',
  PRO_INSUFFICIENT_BALANCE: 'Billetera',
});

function resolveNotificationTargetScreen(type, explicitScreen = null) {
  if (explicitScreen) return explicitScreen;
  return ROUTE_BY_NOTIFICATION_TYPE[type] || 'NotificationsCenter';
}

/**
 * 3.2. Registrar o actualizar token de dispositivo para un usuario
 */
async function registerDeviceToken({ userId, token, platform = 'android', deviceId = null }) {
  if (!userId || !token) {
    const err = new Error('user_id y token son obligatorios para registrar el dispositivo.');
    err.statusCode = 400;
    throw err;
  }

  const key = `${userId}:${token}`;
  const entry = {
    id: deviceTokensStore.size + 1,
    user_id: Number(userId),
    token: String(token),
    platform: String(platform || 'android'),
    device_id: deviceId || null,
    is_active: true,
    last_used_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  deviceTokensStore.set(key, entry);

  try {
    await supabaseRest('device_tokens', {
      method: 'POST',
      single: true,
      body: {
        user_id: Number(userId),
        token: String(token),
        platform: entry.platform,
        device_id: entry.device_id,
        is_active: true,
        last_used_at: entry.last_used_at,
      },
    });
  } catch (_e) {}

  return { exito: true, device_token: entry };
}

/**
 * 3.2. Desactivar únicamente el token del dispositivo que cierra sesión (sin borrar otros dispositivos del usuario)
 */
async function deactivateDeviceTokenOnLogout({ userId, token, deviceId = null }) {
  if (!userId) return { exito: true, deactivated: 0 };

  let deactivatedCount = 0;
  for (const [k, v] of deviceTokensStore.entries()) {
    const matchesUser = String(v.user_id) === String(userId);
    const matchesDevice =
      (token && v.token === token) || (deviceId && v.device_id === deviceId);
    if (matchesUser && matchesDevice && v.is_active) {
      v.is_active = false;
      v.last_used_at = new Date().toISOString();
      deviceTokensStore.set(k, v);
      deactivatedCount += 1;
    }
  }

  try {
    if (token) {
      await supabaseRest('device_tokens', {
        method: 'PATCH',
        query: `user_id=eq.${encodeURIComponent(userId)}&token=eq.${encodeURIComponent(token)}`,
        body: { is_active: false, last_used_at: new Date().toISOString() },
      });
    } else if (deviceId) {
      await supabaseRest('device_tokens', {
        method: 'PATCH',
        query: `user_id=eq.${encodeURIComponent(userId)}&device_id=eq.${encodeURIComponent(deviceId)}`,
        body: { is_active: false, last_used_at: new Date().toISOString() },
      });
    }
  } catch (_e) {}

  return {
    exito: true,
    deactivated: deactivatedCount,
    mensaje: 'Token del dispositivo actual desactivado sin afectar otros dispositivos.',
  };
}

function getActiveDeviceTokensForUser(userId) {
  const result = [];
  for (const v of deviceTokensStore.values()) {
    if (String(v.user_id) === String(userId) && v.is_active) {
      result.push(v);
    }
  }
  return result;
}

/**
 * 3.1, 3.3, 3.4, 3.5. Emitir notificación direccionada exclusivamente al usuario destinatario
 */
async function dispatchTargetedNotification({
  recipientUserId,
  actorUserId = null,
  roleTarget = 'cliente',
  title,
  body,
  type = 'CLIENT_REQUEST_SENT',
  entityType = 'BOOKING',
  entityId = null,
  targetScreen = null,
  data = {},
  dedupKey = null,
}) {
  if (!recipientUserId) {
    const err = new Error('recipient_user_id es obligatorio para direccionar la notificación.');
    err.statusCode = 400;
    throw err;
  }

  const effectiveDedup =
    dedupKey ||
    `${recipientUserId}:${type}:${entityId || 'none'}:${Math.floor(Date.now() / 4000)}`;

  if (dedupKeysSeen.has(effectiveDedup)) {
    const existing = notificationsStore.find((n) => n.dedup_key === effectiveDedup);
    return { exito: true, idempotente: true, notification: existing };
  }
  dedupKeysSeen.add(effectiveDedup);

  const resolvedScreen = resolveNotificationTargetScreen(type, targetScreen);
  const activeDevices = getActiveDeviceTokensForUser(recipientUserId);

  const notificationRecord = {
    id: `notif-${Date.now()}-${crypto.randomInt(100, 999)}`,
    recipient_user_id: Number(recipientUserId),
    actor_user_id: actorUserId ? Number(actorUserId) : null,
    rol_destino: roleTarget === 'profesional' || String(type).startsWith('PRO_') ? 'profesional' : 'cliente',
    title,
    body,
    titulo: title,
    mensaje: body,
    type,
    tipo: type,
    entity_type: entityType,
    entity_id: entityId ? String(entityId) : null,
    codigo_reserva: entityType === 'BOOKING' ? entityId : data?.codigo_reserva || null,
    target_screen: resolvedScreen,
    data: {
      ...data,
      target_screen: resolvedScreen,
      entity_type: entityType,
      entity_id: entityId,
    },
    dedup_key: effectiveDedup,
    is_read: false,
    leida: false,
    channels_delivered: {
      realtime_in_app: true,
      push_os_devices: activeDevices.map((d) => ({
        device_id: d.device_id,
        platform: d.platform,
        token_preview: `${String(d.token).slice(0, 12)}...`,
      })),
    },
    created_at: new Date().toISOString(),
  };

  notificationsStore.unshift(notificationRecord);
  db.notificaciones.unshift(notificationRecord);

  // Emitir evento Realtime exclusivamente con recipient_user_id
  emitRealtimeEvent('notifications', 'INSERT', notificationRecord);

  try {
    await supabaseRest('notifications', {
      method: 'POST',
      body: {
        recipient_user_id: notificationRecord.recipient_user_id,
        actor_user_id: notificationRecord.actor_user_id,
        title: notificationRecord.title,
        body: notificationRecord.body,
        type: notificationRecord.type,
        entity_type: notificationRecord.entity_type,
        entity_id: notificationRecord.entity_id,
        target_screen: notificationRecord.target_screen,
        data: notificationRecord.data,
        dedup_key: notificationRecord.dedup_key,
        is_read: false,
      },
    });
    await supabaseRest('notificaciones', {
      method: 'POST',
      body: {
        usuario_id: notificationRecord.recipient_user_id,
        actor_user_id: notificationRecord.actor_user_id,
        rol_destino: notificationRecord.rol_destino,
        codigo_reserva: notificationRecord.codigo_reserva,
        titulo: notificationRecord.title,
        mensaje: notificationRecord.body,
        tipo: notificationRecord.type,
        entity_type: notificationRecord.entity_type,
        entity_id: notificationRecord.entity_id,
        target_screen: notificationRecord.target_screen,
        data: notificationRecord.data,
        dedup_key: notificationRecord.dedup_key,
        leida: false,
      },
    });
  } catch (_e) {}

  return {
    exito: true,
    idempotente: false,
    notification: notificationRecord,
  };
}

/**
 *Consultar notificaciones exclusivamente del usuario autenticado
 */
async function listNotificationsForUser({ userId, unreadOnly = false }) {
  if (!userId) return { exito: true, notifications: [] };

  let items = notificationsStore.filter(
    (n) => String(n.recipient_user_id) === String(userId)
  );

  try {
    const rows = await supabaseRest('notifications', {
      method: 'GET',
      query: `recipient_user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=40`,
    });
    if (Array.isArray(rows) && rows.length > 0) {
      const existingIds = new Set(items.map((i) => i.dedup_key || String(i.id)));
      rows.forEach((r) => {
        const key = r.dedup_key || String(r.id);
        if (!existingIds.has(key)) {
          items.push({
            ...r,
            titulo: r.title,
            mensaje: r.body,
            leida: Boolean(r.is_read),
          });
        }
      });
    }
  } catch (_e) {}

  if (unreadOnly) {
    items = items.filter((n) => !n.is_read && !n.leida);
  }

  return {
    exito: true,
    unread_count: items.filter((n) => !n.is_read && !n.leida).length,
    notifications: items,
  };
}

async function markNotificationAsRead({ userId, notificationId, markAll = false }) {
  let updated = 0;
  notificationsStore.forEach((n) => {
    if (
      String(n.recipient_user_id) === String(userId) &&
      (markAll || String(n.id) === String(notificationId))
    ) {
      n.is_read = true;
      n.leida = true;
      updated += 1;
    }
  });

  try {
    const query = markAll
      ? `recipient_user_id=eq.${encodeURIComponent(userId)}`
      : `id=eq.${encodeURIComponent(notificationId)}&recipient_user_id=eq.${encodeURIComponent(userId)}`;
    await supabaseRest('notifications', {
      method: 'PATCH',
      query,
      body: { is_read: true },
    });
  } catch (_e) {}

  return { exito: true, updated };
}

module.exports = {
  ROUTE_BY_NOTIFICATION_TYPE,
  resolveNotificationTargetScreen,
  registerDeviceToken,
  deactivateDeviceTokenOnLogout,
  getActiveDeviceTokensForUser,
  dispatchTargetedNotification,
  listNotificationsForUser,
  markNotificationAsRead,
};
