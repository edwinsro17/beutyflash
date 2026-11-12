/**
 * Archivo: backend/src/services/notification.service.js
 * Notificaciones Push mediante Expo Push Service (SIN FIREBASE) e In-App vía Supabase Realtime
 */

const crypto = require('crypto');
const { env } = require('../config/env');
const { db, emitRealtimeEvent } = require('../config/supabaseClient');

function esExpoPushTokenValido(token) {
  if (!token || typeof token !== 'string') return false;
  return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
}

async function enviarNotificacion({
  usuarioId,
  reservaId = null,
  titulo,
  mensaje,
  tipo = 'general',
  datosExtra = {},
}) {
  const usuario = db.usuarios.find((u) => u.id === usuarioId);
  const pushToken = usuario ? usuario.expo_push_token : null;

  let enviadoPush = false;
  if (esExpoPushTokenValido(pushToken)) {
    enviadoPush = true;
    if (env.NODE_ENV === 'production' && env.EXPO_ACCESS_TOKEN) {
      try {
        await fetch(env.EXPO_PUSH_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.EXPO_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            to: pushToken,
            sound: 'default',
            title: titulo,
            body: mensaje,
            data: { tipo, reservaId, ...datosExtra },
          }),
        });
      } catch (_err) {
        enviadoPush = false;
      }
    }
  }

  const nuevaNotificacion = {
    id: crypto.randomUUID(),
    usuario_id: usuarioId,
    reserva_id: reservaId,
    titulo,
    mensaje,
    tipo,
    leida: false,
    enviada_push: enviadoPush,
    datos_extra: datosExtra,
    creado_en: new Date().toISOString(),
  };

  db.notificaciones.unshift(nuevaNotificacion);
  emitRealtimeEvent('notificaciones', 'INSERT', nuevaNotificacion);
  return nuevaNotificacion;
}

module.exports = {
  enviarNotificacion,
  esExpoPushTokenValido,
};
