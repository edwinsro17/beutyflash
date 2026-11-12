/**
 * Archivo: backend/src/controllers/booking.controller.js
 * Solicitudes a domicilio estilo Uber/DiDi, reservas en local, estados en tiempo real, GPS y reseñas
 */

const crypto = require('crypto');
const {
  db,
  emitRealtimeEvent,
  aceptarServicioConComisionTransaccional,
  buscarProfesionalesCercanos,
  VALID_STATE_TRANSITIONS,
} = require('../config/supabaseClient');
const {
  BOOKING_STATES,
  SERVICE_MODALITIES,
  formatCOP,
  calcularComisionCOP,
  calcularDistanciaKm,
  calcularETAMinutos,
  generarPuntosRuta,
} = require('../config/constants');
const { enviarNotificacion } = require('../services/notification.service');
const { enviarAvisoSMS } = require('../services/sms.service');

function enriquecerReserva(reserva) {
  if (!reserva) return null;
  const servicio = db.servicios.find((s) => s.id === reserva.servicio_id);
  const cliente = db.clientes.find((c) => c.id === reserva.cliente_id);
  const usuarioCliente = cliente ? db.usuarios.find((u) => u.id === cliente.usuario_id) : null;
  const profesional = reserva.profesional_id
    ? db.profesionales.find((p) => p.id === reserva.profesional_id)
    : null;
  const usuarioPro = profesional ? db.usuarios.find((u) => u.id === profesional.usuario_id) : null;
  const local = reserva.local_id
    ? db.negocios_locales.find((l) => l.id === reserva.local_id)
    : null;
  const calificacion = db.calificaciones.find((cal) => cal.reserva_id === reserva.id) || null;

  return {
    ...reserva,
    precio_servicio_formateado: formatCOP(reserva.precio_servicio_cop),
    recargo_domicilio_formateado: formatCOP(reserva.recargo_domicilio_cop),
    precio_total_formateado: formatCOP(reserva.precio_total_cop),
    valor_comision_formateado: formatCOP(reserva.valor_comision_cop),
    servicio: servicio
      ? {
          id: servicio.id,
          nombre: servicio.nombre,
          descripcion: servicio.descripcion,
          duracion_minutos: servicio.duracion_minutos,
          imagen_principal_url: servicio.imagen_principal_url,
          precio_cop: servicio.precio_cop,
          precio_formateado: formatCOP(servicio.precio_cop),
        }
      : null,
    cliente: cliente
      ? {
          id: cliente.id,
          usuario_id: cliente.usuario_id,
          nombre_completo: usuarioCliente ? usuarioCliente.nombre_completo : 'Cliente BeautyFlash',
          telefono: usuarioCliente ? usuarioCliente.telefono : '',
          foto_perfil_url: usuarioCliente ? usuarioCliente.foto_perfil_url : null,
        }
      : null,
    profesional: profesional
      ? {
          id: profesional.id,
          usuario_id: profesional.usuario_id,
          codigo_profesional: profesional.codigo_profesional,
          nombre_artistico: profesional.nombre_artistico,
          telefono: usuarioPro ? usuarioPro.telefono : '',
          foto_perfil_url: usuarioPro ? usuarioPro.foto_perfil_url : null,
          calificacion_promedio: profesional.calificacion_promedio,
          latitud_actual: reserva.latitud_profesional ?? profesional.latitud_actual,
          longitud_actual: reserva.longitud_profesional ?? profesional.longitud_actual,
        }
      : null,
    local: local || null,
    calificacion,
  };
}

async function crearSolicitudOReserva(body) {
  const {
    cliente_id,
    servicio_id,
    local_id = null,
    modalidad = SERVICE_MODALITIES.DOMICILIO,
    fecha_programada = new Date().toISOString().slice(0, 10),
    hora_programada = '15:00',
    direccion_servicio = 'Cra. 100 #11-60, Ciudad Jardín, Cali',
    referencia_direccion = 'Portería Principal',
    latitud_servicio = 3.3712,
    longitud_servicio = -76.5320,
    metodo_pago_cliente = 'efectivo',
    notas_cliente = '',
  } = body || {};

  const cliente =
    db.clientes.find((c) => c.id === cliente_id || c.usuario_id === cliente_id) || db.clientes[0];
  const servicio = db.servicios.find((s) => s.id === servicio_id) || db.servicios[0];

  if (! SERVICE_MODALITIES.DOMICILIO && ! SERVICE_MODALITIES.LOCAL) {
    const err = new Error('Modalidad inválida');
    err.statusCode = 400;
    throw err;
  }

  const proDelServicio = db.profesionales.find((p) => p.id === servicio.profesional_id);
  const recargoDomicilioCop =
    modalidad === SERVICE_MODALITIES.DOMICILIO
      ? Number(proDelServicio?.tarifa_domicilio_cop ?? 8000)
      : 0;
  const precioServicioCop = servicio.precio_cop;
  const precioTotalCop = precioServicioCop + recargoDomicilioCop;
  const valorComisionCop = calcularComisionCOP(precioTotalCop);

  const candidatosCercanos = buscarProfesionalesCercanos({
    latitud: Number(latitud_servicio),
    longitud: Number(longitud_servicio),
    radioMaxKm: 20,
    precioEstimadoCop: precioTotalCop,
    modalidad,
  });

  const localSeleccionado =
    modalidad === SERVICE_MODALITIES.LOCAL
      ? db.negocios_locales.find((l) => l.id === (local_id || servicio.local_id)) ||
        db.negocios_locales[0]
      : null;

  const nuevaReserva = {
    id: crypto.randomUUID(),
    codigo_reserva: `BF-${Math.floor(10000 + Math.random() * 90000)}`,
    cliente_id: cliente.id,
    profesional_id: null,
    servicio_id: servicio.id,
    local_id: localSeleccionado ? localSeleccionado.id : null,
    modalidad,
    es_inmediata_flash: modalidad === SERVICE_MODALITIES.DOMICILIO,
    estado: BOOKING_STATES.BUSCANDO_PROFESIONAL,
    fecha_programada,
    hora_programada,
    direccion_servicio:
      modalidad === SERVICE_MODALITIES.LOCAL && localSeleccionado
        ? `${localSeleccionado.nombre_local} — ${localSeleccionado.direccion}`
        : direccion_servicio,
    referencia_direccion,
    ciudad: 'Cali',
    latitud_servicio: Number(latitud_servicio),
    longitud_servicio: Number(longitud_servicio),
    latitud_profesional: null,
    longitud_profesional: null,
    distancia_estimada_km: candidatosCercanos[0] ? candidatosCercanos[0].distancia_km : 1.2,
    tiempo_estimado_minutos: candidatosCercanos[0] ? candidatosCercanos[0].tiempo_estimado_min : 6,
    puntos_ruta: [],
    precio_servicio_cop: precioServicioCop,
    recargo_domicilio_cop: recargoDomicilioCop,
    precio_total_cop: precioTotalCop,
    porcentaje_comision: 10,
    valor_comision_cop: valorComisionCop,
    metodo_pago_cliente,
    notas_cliente,
    profesionales_rechazados: [],
    creado_en: new Date().toISOString(),
    actualizado_en: new Date().toISOString(),
  };

  db.reservas_solicitudes.unshift(nuevaReserva);

  for (const pro of candidatosCercanos.slice(0, 3)) {
    await enviarNotificacion({
      usuarioId: pro.usuario_id,
      reservaId: nuevaReserva.id,
      titulo: `¡Nueva solicitud (${formatCOP(precioTotalCop)} COP)!`,
      mensaje: `${servicio.nombre} a ${pro.distancia_km} km. Comisión 10%: ${formatCOP(valorComisionCop)} COP.`,
      tipo: 'reserva_nueva',
    });
  }

  emitRealtimeEvent('reservas_solicitudes', 'INSERT', nuevaReserva);

  return {
    exito: true,
    mensaje: 'Solicitud creada exitosamente.',
    reserva: enriquecerReserva(nuevaReserva),
  };
}

async function rechazarYReasignarReserva(reservaId, profesionalId, motivo = 'Ocupado') {
  const reserva = db.reservas_solicitudes.find((r) => r.id === reservaId);
  if (!reserva) {
    const err = new Error('Reserva no encontrada.');
    err.statusCode = 404;
    throw err;
  }

  if (!reserva.profesionales_rechazados.includes(profesionalId)) {
    reserva.profesionales_rechazados.push(profesionalId);
  }

  const siguientes = buscarProfesionalesCercanos({
    latitud: reserva.latitud_servicio,
    longitud: reserva.longitud_servicio,
    radioMaxKm: 25,
    precioEstimadoCop: reserva.precio_total_cop,
    modalidad: reserva.modalidad,
    excluidosIds: reserva.profesionales_rechazados,
  });

  if (siguientes.length > 0) {
    const sig = siguientes[0];
    await enviarNotificacion({
      usuarioId: sig.usuario_id,
      reservaId: reserva.id,
      titulo: `Solicitud reasignada (${formatCOP(reserva.precio_total_cop)} COP)`,
      mensaje: `Motivo anterior: ${motivo}. Acepta el servicio ahora.`,
      tipo: 'reserva_nueva',
    });
    return {
      exito: true,
      reasignada: true,
      siguiente_profesional: sig.nombre_artistico,
      reserva: enriquecerReserva(reserva),
    };
  }

  reserva.estado = BOOKING_STATES.SIN_PROFESIONAL;
  return {
    exito: true,
    reasignada: false,
    reserva: enriquecerReserva(reserva),
  };
}

async function cambiarEstadoServicio(reservaId, body) {
  const { nuevo_estado, latitud, longitud, motivo_cancelacion } = body || {};
  const reserva = db.reservas_solicitudes.find((r) => r.id === reservaId);
  if (!reserva) {
    const err = new Error('Reserva no encontrada.');
    err.statusCode = 404;
    throw err;
  }

  const permitidos = VALID_STATE_TRANSITIONS[reserva.estado] || [];
  if (!permitidos.includes(nuevo_estado)) {
    const err = new Error(
      `No se puede pasar de "${reserva.estado}" a "${nuevo_estado}".`
    );
    err.statusCode = 400;
    throw err;
  }

  reserva.estado = nuevo_estado;
  reserva.actualizado_en = new Date().toISOString();

  if (latitud !== undefined && longitud !== undefined) {
    reserva.latitud_profesional = Number(latitud);
    reserva.longitud_profesional = Number(longitud);
  }

  if (nuevo_estado === BOOKING_STATES.EN_CAMINO) {
    reserva.puntos_ruta = generarPuntosRuta(
      reserva.latitud_profesional ?? 3.3768,
      reserva.longitud_profesional ?? -76.5365,
      reserva.latitud_servicio,
      reserva.longitud_servicio
    );
  } else if (nuevo_estado === BOOKING_STATES.LLEGO) {
    reserva.distancia_estimada_km = 0;
    reserva.tiempo_estimado_minutos = 0;
  } else if (nuevo_estado === BOOKING_STATES.CANCELADO) {
    reserva.motivo_cancelacion = motivo_cancelacion || 'Cancelado por el usuario';
  }

  const cliente = db.clientes.find((c) => c.id === reserva.cliente_id);
  const usuCliente = cliente ? db.usuarios.find((u) => u.id === cliente.usuario_id) : null;

  if (cliente) {
    await enviarNotificacion({
      usuarioId: cliente.usuario_id,
      reservaId: reserva.id,
      titulo: `Estado de tu servicio: ${nuevo_estado.toUpperCase()}`,
      mensaje: `Tu pedido ${reserva.codigo_reserva} cambió a estado "${nuevo_estado}".`,
      tipo: nuevo_estado,
    });
    if (usuCliente?.telefono) {
      await enviarAvisoSMS(
        usuCliente.telefono,
        `BeautyFlash: Tu servicio ${reserva.codigo_reserva} ahora está en estado ${nuevo_estado}.`
      );
    }
  }

  emitRealtimeEvent('reservas_solicitudes', 'UPDATE', reserva);
  return {
    exito: true,
    reserva: enriquecerReserva(reserva),
  };
}

function actualizarUbicacionEnVivo(reservaId, body) {
  const { profesional_id, latitud, longitud } = body || {};
  const reserva = db.reservas_solicitudes.find((r) => r.id === reservaId);
  if (!reserva) {
    const err = new Error('Reserva no encontrada.');
    err.statusCode = 404;
    throw err;
  }

  const lat = Number(latitud);
  const lng = Number(longitud);
  const distanciaKm = calcularDistanciaKm(lat, lng, reserva.latitud_servicio, reserva.longitud_servicio);
  const etaMinutos = calcularETAMinutos(distanciaKm);

  reserva.latitud_profesional = lat;
  reserva.longitud_profesional = lng;
  reserva.distancia_estimada_km = distanciaKm;
  reserva.tiempo_estimado_minutos = etaMinutos;
  reserva.puntos_ruta = generarPuntosRuta(lat, lng, reserva.latitud_servicio, reserva.longitud_servicio, 6);

  const puntoTiempoReal = {
    id: crypto.randomUUID(),
    profesional_id: profesional_id || reserva.profesional_id,
    reserva_id: reserva.id,
    latitud: lat,
    longitud: lng,
    distancia_restante_metros: Math.round(distanciaKm * 1000),
    eta_minutos: etaMinutos,
    actualizado_en: new Date().toISOString(),
  };

  db.ubicaciones_tiempo_real.unshift(puntoTiempoReal);
  emitRealtimeEvent('ubicaciones_tiempo_real', 'INSERT', puntoTiempoReal);

  return {
    exito: true,
    ubicacion: puntoTiempoReal,
    distancia_km: distanciaKm,
    eta_minutos: etaMinutos,
    puntos_ruta: reserva.puntos_ruta,
  };
}

async function calificarServicio(reservaId, body) {
  const { puntuacion, comentario = '' } = body || {};
  const reserva = db.reservas_solicitudes.find((r) => r.id === reservaId);
  if (!reserva) {
    const err = new Error('Reserva no encontrada.');
    err.statusCode = 404;
    throw err;
  }

  const estrellas = Math.max(1, Math.min(5, Math.round(Number(puntuacion) || 5)));
  const nuevaCalificacion = {
    id: crypto.randomUUID(),
    reserva_id: reserva.id,
    cliente_id: reserva.cliente_id,
    profesional_id: reserva.profesional_id,
    puntuacion: estrellas,
    comentario: String(comentario).trim(),
    creado_en: new Date().toISOString(),
  };
  db.calificaciones.unshift(nuevaCalificacion);

  return {
    exito: true,
    mensaje: '¡Gracias por tu calificación!',
    calificacion: nuevaCalificacion,
  };
}

module.exports = {
  enriquecerReserva,
  crearSolicitudOReserva,
  aceptarServicioConComisionTransaccional,
  rechazarYReasignarReserva,
  cambiarEstadoServicio,
  actualizarUbicacionEnVivo,
  calificarServicio,
};
