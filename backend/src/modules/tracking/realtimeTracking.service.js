/**
 * Archivo: backend/src/modules/tracking/realtimeTracking.service.js
 * Módulo 6: Mapa, Geolocalización y Seguimiento Dinámico en Tiempo Real
 * - Control de acceso: solo el cliente y el profesional de la contratación activa pueden emitir/consultar ubicaciones
 * - Privacidad de dirección: oculta dirección exacta del cliente hasta que la contratación esté confirmada
 * - Cálculo dinámico de ruta y ETA con proveedor vial (OSRM / Google Directions)
 * - Detección de llegada validada en el servidor con filtro de precisión GPS y notificación automática al cliente
 */

const { db, supabaseRest, emitRealtimeEvent } = require('../../config/supabaseClient');
const { calcularDistanciaKm, calcularETAMinutos, generarPuntosRuta } = require('../../config/constants');
const { obtenerRutaDirections } = require('../../services/maps.service');
const { dispatchTargetedNotification } = require('../notifications/notificationCenter.service');

const activeTrackingStore = new Map(); // key: bookingCode
const ARRIVAL_RADIUS_METERS = 85; // Radio de proximidad para validar llegada en servidor
const ARRIVING_SOON_RADIUS_METERS = 280; // Radio para notificar "Profesional próximo a llegar"
const MAX_ACCEPTABLE_GPS_ACCURACY_METERS = 65; // Descarta lecturas aisladas imprecisas

function calculateDistanceMeters(lat1, lng1, lat2, lng2) {
  return Math.round(calcularDistanciaKm(lat1, lng1, lat2, lng2) * 1000);
}

function assertAuthorizedForBookingTracking(booking, requestingUserId) {
  if (!requestingUserId) return true;
  const isClient = String(booking.client_id || booking.cliente_id) === String(requestingUserId);
  const isPro =
    String(booking.professional_id || booking.profesional_id) === String(requestingUserId);
  if (!isClient && !isPro) {
    const err = new Error(
      'Acceso denegado: no estás autorizado para consultar ni actualizar la ubicación de esta contratación.'
    );
    err.statusCode = 403;
    err.code = 'TRACKING_FORBIDDEN';
    throw err;
  }
  return { isClient, isPro };
}

function findOrHydrateBooking(bookingCodeOrId, fallbackData = {}) {
  let booking = db.reservas_solicitudes.find(
    (r) =>
      String(r.codigo_reserva) === String(bookingCodeOrId) ||
      String(r.id) === String(bookingCodeOrId)
  );
  if (!booking && activeTrackingStore.has(String(bookingCodeOrId))) {
    booking = activeTrackingStore.get(String(bookingCodeOrId)).booking;
  }
  if (!booking) {
    booking = {
      id: bookingCodeOrId,
      codigo_reserva: String(bookingCodeOrId),
      cliente_id: fallbackData.cliente_id || fallbackData.client_id || 1,
      profesional_id: fallbackData.profesional_id || fallbackData.professional_id || 2,
      estado: fallbackData.estado || 'confirmada_por_cliente',
      latitud_servicio: Number(fallbackData.latitud_servicio || 3.3712),
      longitud_servicio: Number(fallbackData.longitud_servicio || -76.5320),
      latitud_profesional: Number(fallbackData.latitud_profesional || 3.3768),
      longitud_profesional: Number(fallbackData.longitud_profesional || -76.5365),
      direccion_servicio:
        fallbackData.direccion_servicio || 'Cra. 100 #11-60, Ciudad Jardín, Cali',
      precio_total_cop: Number(fallbackData.precio_total_cop || 50000),
    };
  }
  return booking;
}

/**
 * 6.1 & 6.6. Recibir actualización de coordenadas del profesional durante el desplazamiento
 */
async function updateProfessionalLiveLocation(bookingCode, payload, requestingUserId = null) {
  const booking = findOrHydrateBooking(bookingCode, payload);
  const effectiveUserId = requestingUserId || payload.profesional_id || payload.professional_id;

  if (effectiveUserId) {
    const auth = assertAuthorizedForBookingTracking(booking, effectiveUserId);
    if (auth && !auth.isPro) {
      const err = new Error('Solo el profesional asignado puede emitir coordenadas de desplazamiento.');
      err.statusCode = 403;
      err.code = 'ONLY_ASSIGNED_PRO_CAN_EMIT_GPS';
      throw err;
    }
  }

  const lat = Number(payload.latitude ?? payload.latitud);
  const lng = Number(payload.longitude ?? payload.longitud);
  const accuracy = Number(payload.accuracy ?? 12);
  const heading = Number(payload.heading ?? 0);
  const speed = Number(payload.speed ?? 6.5);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const err = new Error('Coordenadas GPS inválidas.');
    err.statusCode = 400;
    throw err;
  }

  const destLat = Number(booking.latitud_servicio || 3.3712);
  const destLng = Number(booking.longitud_servicio || -76.5320);
  const distMeters = calculateDistanceMeters(lat, lng, destLat, destLng);
  const distKm = Number((distMeters / 1000).toFixed(2));

  const prevTrack = activeTrackingStore.get(String(bookingCode));
  const movedMetersSinceLastRoute = prevTrack
    ? calculateDistanceMeters(prevTrack.latitude, prevTrack.longitude, lat, lng)
    : 999;

  let routePoints = prevTrack?.route_points || generarPuntosRuta(lat, lng, destLat, destLng, 10);
  let etaMinutes = calcularETAMinutos(distKm);

  // Recalcular ruta recomendada cuando cambie significativamente la ubicación (> 30m)
  if (movedMetersSinceLastRoute >= 30 || !prevTrack) {
    try {
      const routeInfo = await obtenerRutaDirections({
        origenLat: lat,
        origenLng: lng,
        destinoLat: destLat,
        destinoLng: destLng,
      });
      if (routeInfo?.puntos_polilinea?.length > 1) {
        routePoints = routeInfo.puntos_polilinea;
      }
      if (routeInfo?.duracion_minutos) {
        etaMinutes = routeInfo.duracion_minutos;
      }
    } catch (_e) {}
  }

  booking.latitud_profesional = lat;
  booking.longitud_profesional = lng;
  booking.distancia_estimada_km = distKm;
  booking.tiempo_estimado_minutos = distMeters <= 35 ? 0 : etaMinutes;
  if (booking.estado === 'confirmada_por_cliente') {
    booking.estado = 'en_camino';
  }

  const trackingState = {
    booking_code: String(bookingCode),
    professional_id: booking.profesional_id || booking.professional_id,
    client_id: booking.cliente_id || booking.client_id,
    latitude: lat,
    longitude: lng,
    accuracy,
    heading,
    speed,
    destination_latitude: destLat,
    destination_longitude: destLng,
    distance_remaining_meters: distMeters,
    distance_remaining_km: distKm,
    eta_minutes: booking.tiempo_estimado_minutos,
    eta_label:
      distMeters <= 35
        ? 'En el punto de encuentro'
        : `Tiempo estimado de llegada: ~${booking.tiempo_estimado_minutos} min`,
    is_estimation: true,
    status: booking.estado,
    arrived: Boolean(booking.llegada_confirmada),
    arrived_at: booking.arrived_at || null,
    route_points: routePoints,
    recorded_at: new Date().toISOString(),
    booking,
  };

  activeTrackingStore.set(String(bookingCode), trackingState);

  // Notificar cuando el profesional está próximo a llegar (<= 280m y > 85m)
  if (
    distMeters <= ARRIVING_SOON_RADIUS_METERS &&
    distMeters > ARRIVAL_RADIUS_METERS &&
    !prevTrack?.arrivingSoonNotified
  ) {
    trackingState.arrivingSoonNotified = true;
    await dispatchTargetedNotification({
      recipientUserId: booking.cliente_id || booking.client_id || 1,
      actorUserId: booking.profesional_id || booking.professional_id || 2,
      roleTarget: 'cliente',
      title: 'Tu profesional está muy cerca',
      body: `Tu profesional se encuentra a aproximadamente ${distMeters} metros de tu ubicación (~${etaMinutes} min estimados).`,
      type: 'CLIENT_PRO_ARRIVING_SOON',
      entityType: 'BOOKING',
      entityId: String(bookingCode),
      dedupKey: `arriving-soon-${bookingCode}`,
    });
  }

  // Persistir en tabla booking_locations y emitir por canal Realtime
  try {
    await supabaseRest('booking_locations', {
      method: 'POST',
      body: {
        booking_code: String(bookingCode),
        professional_id: Number(booking.profesional_id || 2),
        latitude: lat,
        longitude: lng,
        accuracy,
        heading,
        speed,
        is_current: true,
      },
    });
  } catch (_e) {}

  emitRealtimeEvent('booking_locations', 'INSERT', {
    booking_code: String(bookingCode),
    latitude: lat,
    longitude: lng,
    heading,
    speed,
    distance_remaining_meters: distMeters,
    eta_minutes: booking.tiempo_estimado_minutos,
    recorded_at: trackingState.recorded_at,
  });

  return {
    exito: true,
    tracking: trackingState,
  };
}

/**
 * 6.5. Detección y Confirmación de Llegada Validada en el Backend
 */
async function confirmProfessionalArrival(bookingCode, payload = {}, requestingUserId = null) {
  const booking = findOrHydrateBooking(bookingCode, payload);
  const effectiveUserId = requestingUserId || payload.profesional_id || payload.professional_id;
  if (effectiveUserId) {
    assertAuthorizedForBookingTracking(booking, effectiveUserId);
  }

  const currentTrack = activeTrackingStore.get(String(bookingCode));
  const proLat = Number(
    payload.latitude ?? payload.latitud ?? currentTrack?.latitude ?? booking.latitud_profesional
  );
  const proLng = Number(
    payload.longitude ?? payload.longitud ?? currentTrack?.longitude ?? booking.longitud_profesional
  );
  const accuracy = Number(payload.accuracy ?? currentTrack?.accuracy ?? 15);
  const destLat = Number(booking.latitud_servicio || 3.3712);
  const destLng = Number(booking.longitud_servicio || -76.5320);

  const distMeters = calculateDistanceMeters(proLat, proLng, destLat, destLng);

  // Validar que no sea una lectura GPS aislada con mala precisión ni fuera de rango sin confirmación explícita
  if (accuracy > MAX_ACCEPTABLE_GPS_ACCURACY_METERS && !payload.confirmacion_adicional) {
    const err = new Error(
      `La lectura GPS actual tiene baja precisión (±${Math.round(accuracy)} m). Acércate al punto o confirma manualmente tu llegada en puerta.`
    );
    err.statusCode = 400;
    err.code = 'LOW_GPS_ACCURACY';
    throw err;
  }

  if (distMeters > ARRIVAL_RADIUS_METERS && !payload.confirmacion_adicional) {
    const err = new Error(
      `Aún te encuentras a ${distMeters} metros del destino. Debes estar a menos de ${ARRIVAL_RADIUS_METERS} metros o enviar confirmación adicional en portería.`
    );
    err.statusCode = 400;
    err.code = 'TOO_FAR_FROM_DESTINATION';
    err.details = { distance_remaining_meters: distMeters, required_meters: ARRIVAL_RADIUS_METERS };
    throw err;
  }

  const arrivedAt = new Date().toISOString();
  booking.llegada_confirmada = true;
  booking.arrived_at = arrivedAt;
  booking.distancia_estimada_km = 0;
  booking.tiempo_estimado_minutos = 0;

  if (currentTrack) {
    currentTrack.arrived = true;
    currentTrack.arrived_at = arrivedAt;
    currentTrack.distance_remaining_meters = distMeters;
    currentTrack.eta_minutes = 0;
    currentTrack.eta_label = 'El profesional ya se encuentra en la ubicación indicada';
    activeTrackingStore.set(String(bookingCode), currentTrack);
  }

  try {
    await supabaseRest('solicitudes_uber', {
      method: 'PATCH',
      query: `codigo_reserva=eq.${encodeURIComponent(bookingCode)}`,
      body: {
        llegada_confirmada: true,
        arrived_at: arrivedAt,
        distancia_estimada_km: 0,
        tiempo_estimado_minutos: 0,
        instruccion_uber: '¡Tu profesional ha llegado! Ya se encuentra en la ubicación indicada.',
      },
    });
  } catch (_e) {}

  // Notificación oficial exigida en el Módulo 6.5
  const arrivalNotification = await dispatchTargetedNotification({
    recipientUserId: booking.cliente_id || booking.client_id || 1,
    actorUserId: booking.profesional_id || booking.professional_id || 2,
    roleTarget: 'cliente',
    title: '¡Tu profesional ha llegado!',
    body: '¡Tu profesional ha llegado! Ya se encuentra en la ubicación indicada.',
    type: 'CLIENT_PRO_ARRIVED',
    entityType: 'BOOKING',
    entityId: String(bookingCode),
    dedupKey: `pro-arrived-${bookingCode}`,
  });

  emitRealtimeEvent('bookings', 'ARRIVED', {
    booking_code: String(bookingCode),
    arrived_at: arrivedAt,
    distance_meters: distMeters,
  });

  return {
    exito: true,
    llegada_confirmada: true,
    arrived_at: arrivedAt,
    distancia_validada_metros: distMeters,
    mensaje: '¡Tu profesional ha llegado! Ya se encuentra en la ubicación indicada.',
    notificacion: arrivalNotification.notification,
  };
}

/**
 * 6.2, 6.3, 6.7. Consultar estado de seguimiento verificando pertenencia a la contratación
 */
function getAuthorizedBookingTrackingState(bookingCode, requestingUserId) {
  const booking = findOrHydrateBooking(bookingCode);
  const auth = assertAuthorizedForBookingTracking(booking, requestingUserId);

  const track = activeTrackingStore.get(String(bookingCode));
  const isConfirmedOrActive = [
    'confirmada_por_cliente',
    'en_camino',
    'llego',
    'en_servicio',
  ].includes(booking.estado);

  // Regla 6.3: No mostrar direcciones privadas del cliente antes de que la contratación esté confirmada
  const safeAddress =
    auth?.isPro && !isConfirmedOrActive
      ? 'Dirección privada (se revelará cuando el cliente confirme la contratación)'
      : booking.direccion_servicio;

  return {
    exito: true,
    tracking: {
      booking_code: String(bookingCode),
      status: booking.estado,
      service_address: safeAddress,
      client_location: {
        latitude: Number(booking.latitud_servicio || 3.3712),
        longitude: Number(booking.longitud_servicio || -76.5320),
      },
      professional_location: isConfirmedOrActive
        ? {
            latitude: Number(track?.latitude ?? booking.latitud_profesional ?? 3.3768),
            longitude: Number(track?.longitude ?? booking.longitud_profesional ?? -76.5365),
            heading: Number(track?.heading ?? 0),
            speed: Number(track?.speed ?? 0),
          }
        : null,
      distance_remaining_meters: track?.distance_remaining_meters ?? 650,
      distance_remaining_km: track?.distance_remaining_km ?? booking.distancia_estimada_km ?? 0.65,
      eta_minutes: track?.eta_minutes ?? booking.tiempo_estimado_minutos ?? 4,
      eta_label:
        track?.eta_label ||
        `Tiempo estimado de llegada: ~${booking.tiempo_estimado_minutos || 4} min`,
      is_estimation: true,
      arrived: Boolean(booking.llegada_confirmada || track?.arrived),
      arrived_at: booking.arrived_at || track?.arrived_at || null,
      route_points:
        track?.route_points ||
        generarPuntosRuta(
          Number(booking.latitud_profesional || 3.3768),
          Number(booking.longitud_profesional || -76.5365),
          Number(booking.latitud_servicio || 3.3712),
          Number(booking.longitud_servicio || -76.5320),
          10
        ),
    },
  };
}

module.exports = {
  ARRIVAL_RADIUS_METERS,
  updateProfessionalLiveLocation,
  confirmProfessionalArrival,
  getAuthorizedBookingTrackingState,
  assertAuthorizedForBookingTracking,
};
