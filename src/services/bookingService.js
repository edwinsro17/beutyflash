/**
 * Archivo: src/services/bookingService.js
 * Módulo 3, Módulo 5 y Módulo 6:
 * - Gestión de Solicitudes y Contrataciones con cobro de comisión en 2 etapas (3% al confirmar + 7% al iniciar servicio)
 * - Consulta en tiempo real del saldo del profesional en Supabase (`billetera_profesional`) al aceptar y al confirmar
 * - Desactivación automática y ocultamiento de servicios cuando el profesional no tiene saldo disponible
 * - Seguimiento GPS dinámico en tiempo real y detección de llegada validada en servidor
 */

import { Vibration } from 'react-native';
import { BLOQUES_HORARIOS_ESTANDAR } from '../theme/palette';
import { formatCOP, calcularComisionCOP } from '../utils/formatters';
import { calcularDesgloseComisionEtapas } from '../types/domainModels';
import { SupabaseRepository } from '../repositories/SupabaseRepository';
import { sessionStore } from './sessionStore';
import { appEventBus, APP_EVENTS } from '../patterns/ObserverEventBus';
import { NotificationFactory } from '../patterns/NotificationFactory';
import {
  ESTADOS_SOLICITUD_OFICIALES,
  ESTADOS_DOMICILIO_ACTIVOS,
  RequestStateFactory,
  formatearEtiquetaEstado,
} from '../patterns/RequestStateFactory';
import {
  calcularDistanciaMetros,
  calcularDistanciaKm,
  calcularRutaYDistanciaReal,
} from '../patterns/DistanceStrategy';
import { resolverRutaNotificacion } from './notificationRouterService';
import {
  ejecutarCobroComisionEtapa,
  obtenerSaldoRealProfesionalDesdeSupabase,
  desactivarServiciosDeProfesionalSinSaldo,
} from './walletService';
import { callBackendApi } from './authService';

const idsNotificacionesVistas = new Set();
const dedupNotifLocal = new Set();

export function obtenerSolicitudActiva() {
  return sessionStore.bookings.find((b) => ESTADOS_DOMICILIO_ACTIVOS.includes(b.estado)) || null;
}

/**
 * Devuelve el saldo conocido en memoria (hidratado desde `billetera_profesional`) para un profesional dado.
 */
export function obtenerSaldoConocidoProfesional(profesionalId) {
  const map = sessionStore.saldosPorProfesional || {};
  if (profesionalId && map[String(profesionalId)] !== undefined) {
    return Number(map[String(profesionalId)]) || 0;
  }
  if (map['default'] !== undefined) {
    return Number(map['default']) || 0;
  }
  return Number(sessionStore.wallet?.saldo_disponible_cop) || 0;
}

/**
 * Filtra los servicios que pueden mostrarse a los clientes:
 * - Solo muestra servicios que estén activos (`srv.active === true`)
 * - Y cuyo profesional tenga saldo suficiente en su billetera para cubrir la comisión.
 *   Si el profesional no tiene saldo, el servicio queda desactivado y NUNCA se muestra a los clientes.
 */
export function obtenerServiciosActivosParaClientes({ categoria = 'todos', busqueda = '' } = {}) {
  return (sessionStore.catalogoServicios || []).filter((srv) => {
    if (!srv.active || srv.bloqueadoPorSinSaldo) return false;

    const comisionMinima = Math.max(300, Math.round((Number(srv.priceCop) || 10000) * 0.03));
    const saldoPro =
      srv.saldoProfesionalCop !== undefined
        ? Number(srv.saldoProfesionalCop)
        : obtenerSaldoConocidoProfesional(srv.profesional_id);

    if (saldoPro <= 0 || saldoPro < comisionMinima) {
      srv.active = false;
      srv.bloqueadoPorSinSaldo = true;
      return false;
    }

    if (categoria && categoria !== 'todos' && srv.categoryId !== categoria) return false;
    if (busqueda && busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      return (
        (srv.title || '').toLowerCase().includes(q) ||
        (srv.categoryLabel || '').toLowerCase().includes(q) ||
        (srv.desc || '').toLowerCase().includes(q)
      );
    }
    return true;
  });
}

export async function guardarServicioCatalogoEnSupabase(srv) {
  const approvalStatus = sessionStore.proUser?.approval_status || 'APPROVED';
  if (approvalStatus !== 'APPROVED') {
    throw new Error(
      `Tu perfil profesional está en estado ${approvalStatus}. Solo los perfiles APROBADOS pueden publicar servicios.`
    );
  }

  const proId =
    srv.profesional_id ||
    sessionStore.proUser?.usuario_id ||
    sessionStore.proUser?.id ||
    sessionStore.userId ||
    2;

  const { saldoDisponibleCop } = await obtenerSaldoRealProfesionalDesdeSupabase(proId);
  const comisionMinima = Math.max(300, Math.round((Number(srv.priceCop) || 10000) * 0.03));
  const tieneSaldoSuficiente = saldoDisponibleCop > 0 && saldoDisponibleCop >= comisionMinima;

  // Si el profesional no tiene saldo suficiente, el servicio NO puede quedar activo
  const estadoActivoFinal = tieneSaldoSuficiente ? Boolean(srv.active) : false;
  srv.active = estadoActivoFinal;
  srv.bloqueadoPorSinSaldo = !tieneSaldoSuficiente;
  srv.saldoProfesionalCop = saldoDisponibleCop;

  const res = await SupabaseRepository.insert(
    'catalogo_servicios_app',
    {
      codigo_servicio: srv.id,
      profesional_id: proId,
      pro_name: srv.proName,
      pro_avatar: srv.proAvatar,
      pro_rating: srv.proRating || '5.0',
      barrio: srv.barrio || sessionStore.proUser.barrio || '',
      nombre_establecimiento:
        srv.nombre_establecimiento || sessionStore.proUser.nombre_establecimiento || '',
      latitud_profesional: sessionStore.proUser.latitud_actual || null,
      longitud_profesional: sessionStore.proUser.longitud_actual || null,
      category_id: srv.categoryId || 'cabello',
      category_label: srv.categoryLabel || 'Peluquería',
      badge: srv.badge || 'Destacado',
      title: srv.title,
      descripcion: srv.desc || '',
      duration: srv.duration || '60 min',
      modality_label: srv.modalityLabel || 'Salón y Domicilio',
      price_cop: Number(srv.priceCop) || 10000,
      active: estadoActivoFinal,
      image: srv.image,
      galeria_resultados: srv.galeria_resultados || (srv.image ? [srv.image] : []),
    },
    'codigo_servicio'
  );
  appEventBus.notify(APP_EVENTS.CATALOG_UPDATED, srv);
  return res;
}

/**
 * Módulo 3: Emitir notificación direccionada exclusivamente al usuario destinatario (`recipient_user_id`)
 */
export async function agregarNotificacionTiempoReal(
  destino,
  {
    usuario_id = null,
    actor_user_id = null,
    titulo,
    mensaje,
    tipo = 'estado_solicitud',
    codigo_reserva = null,
    entity_type = 'BOOKING',
    entity_id = null,
    registrarEnChat = true,
  }
) {
  const recipientId =
    usuario_id ||
    (destino === 'profesional'
      ? sessionStore.proUser.usuario_id || sessionStore.proUser.id
      : sessionStore.clientUser.id || sessionStore.userId);

  const dedupKey = `${recipientId || destino}:${tipo}:${codigo_reserva || entity_id || ''}:${titulo}`;
  if (dedupNotifLocal.has(dedupKey)) {
    return null;
  }
  dedupNotifLocal.add(dedupKey);
  setTimeout(() => dedupNotifLocal.delete(dedupKey), 3500);

  const horaStr = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const routeInfo = resolverRutaNotificacion({
    type: tipo,
    rol_destino: destino === 'profesional' ? 'profesional' : 'cliente',
    codigo_reserva,
    entity_id: entity_id || codigo_reserva,
  });

  const notif = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    usuario_id: recipientId,
    recipient_user_id: recipientId,
    actor_user_id,
    codigo_reserva,
    entity_type,
    entity_id: entity_id || codigo_reserva,
    target_screen: routeInfo.screen || 'SearchResults',
    titulo,
    title: titulo,
    mensaje,
    body: mensaje,
    tipo,
    type: tipo,
    leida: false,
    is_read: false,
    hora: horaStr,
  };

  if (destino === 'profesional') sessionStore.notificacionesProfesional.unshift(notif);
  else sessionStore.notificacionesCliente.unshift(notif);

  try {
    const saved = await SupabaseRepository.insert('notificaciones', {
      usuario_id: recipientId,
      actor_user_id,
      rol_destino: destino === 'profesional' ? 'profesional' : 'cliente',
      codigo_reserva,
      entity_type,
      entity_id: String(entity_id || codigo_reserva || ''),
      target_screen: notif.target_screen,
      titulo,
      mensaje,
      tipo,
      leida: false,
    });
    const fila = Array.isArray(saved) ? saved[0] : saved;
    if (fila?.id) idsNotificacionesVistas.add(fila.id);
  } catch (_e) {}

  if (registrarEnChat && codigo_reserva) {
    const msgSistema = NotificationFactory.createSystemChatMessage({
      titulo,
      mensaje,
      codigoReserva: codigo_reserva,
    });
    const activa = obtenerSolicitudActiva();
    if (activa && activa.codigo_reserva === codigo_reserva) {
      activa.mensajes_chat = [...(activa.mensajes_chat || []), msgSistema];
    }
    try {
      await SupabaseRepository.insert('mensajes_chat_temporal', {
        codigo_reserva,
        autor: 'sistema',
        tipo_mensaje: 'sistema',
        nombre: 'Sistema BeautyFlash',
        texto: `${titulo}: ${mensaje}`,
        hora: horaStr,
      });
    } catch (_e) {}
  }
  appEventBus.notify(APP_EVENTS.NEW_NOTIFICATION, notif);
  return notif;
}

export async function marcarNotificacionesComoLeidas(rolActual = 'cliente') {
  const lista =
    rolActual === 'profesional'
      ? sessionStore.notificacionesProfesional
      : sessionStore.notificacionesCliente;
  const ids = lista.filter((n) => !n.leida && n.db_id).map((n) => n.db_id);
  lista.forEach((n) => {
    n.leida = true;
    n.is_read = true;
  });
  if (ids.length > 0) {
    await SupabaseRepository.patch('notificaciones', `id=in.(${ids.join(',')})`, {
      leida: true,
    }).catch(() => {});
  }
}

export function verificarDisponibilidadEspecialista(profesionalId, fecha, hora) {
  const bloquesBase =
    sessionStore.proUser.horario_atencion?.bloques_disponibles || BLOQUES_HORARIOS_ESTANDAR;
  const citasDia = sessionStore.citasAgendadas.filter(
    (c) =>
      c.estado !== 'cancelada' &&
      c.estado !== 'rechazada_por_profesional' &&
      String(c.fecha_programada).toLowerCase() === String(fecha).trim().toLowerCase()
  );
  const ocupadas = citasDia.map((c) => c.hora_programada);
  const estaOcupado = ocupadas.includes(hora);
  const fueraDeHorario = !bloquesBase.includes(hora);
  const horariosRecomendados = bloquesBase.filter((h) => !ocupadas.includes(h));
  if (estaOcupado || fueraDeHorario) {
    return {
      disponible: false,
      motivo: estaOcupado
        ? `El horario ${hora} del día ${fecha} ya está reservado.`
        : `El horario ${hora} está fuera del bloque de atención.`,
      horariosRecomendados,
    };
  }
  return { disponible: true, horariosRecomendados };
}

export async function crearUnicaSolicitudServicio({
  servicio_id,
  servicio_nombre,
  precio_servicio_cop,
  servicio_foto = null,
  profesional_id = null,
  profesional_nombre = '',
  profesional_foto = null,
  latitud_profesional = null,
  longitud_profesional = null,
  modalidad = 'domicilio',
  fecha_programada = 'Hoy',
  hora_programada = 'Inmediato',
  coordsCliente = null,
}) {
  const existente = obtenerSolicitudActiva();
  if (existente) {
    return {
      bloqueado: true,
      activa: existente,
      mensaje: `Ya tienes una solicitud activa (#${existente.codigo_reserva}: ${formatearEtiquetaEstado(
        existente.estado
      )}).`,
    };
  }
  if (modalidad === 'local') {
    const disp = verificarDisponibilidadEspecialista(
      profesional_id,
      fecha_programada,
      hora_programada
    );
    if (!disp.disponible) return { bloqueado: true, disponible: false, ...disp };
  }

  const proEnMapa =
    sessionStore.estilistasMapa.find(
      (e) => e.usuario_id === profesional_id || e.nombre === profesional_nombre
    ) || sessionStore.estilistasMapa[0];

  const resolvedProId =
    profesional_id ||
    proEnMapa?.usuario_id ||
    sessionStore.proUser.usuario_id ||
    sessionStore.proUser.id ||
    2;

  const recargo = modalidad === 'domicilio' ? 8000 : 0;
  const baseCop = Number(precio_servicio_cop) || 10000;
  const totalCop = baseCop + recargo;
  const desgloseComision = calcularDesgloseComisionEtapas(totalCop);

  // Verificar en Supabase que el profesional tenga saldo suficiente antes de crear la solicitud
  const { saldoDisponibleCop } = await obtenerSaldoRealProfesionalDesdeSupabase(resolvedProId);
  if (saldoDisponibleCop < desgloseComision.comision_etapa1_cop) {
    await desactivarServiciosDeProfesionalSinSaldo(resolvedProId, saldoDisponibleCop);
    return {
      bloqueado: true,
      disponible: false,
      motivo:
        'Este servicio fue desactivado porque el profesional no cuenta con saldo disponible en su billetera en este momento.',
    };
  }

  const cliente = sessionStore.clientUser;
  const latCli = Number(coordsCliente?.latitude || cliente.latitud || 3.3712);
  const lngCli = Number(coordsCliente?.longitude || cliente.longitud || -76.5320);
  const latPro = Number(
    latitud_profesional || proEnMapa?.latitud || sessionStore.proUser.latitud_actual || latCli
  );
  const lngPro = Number(
    longitud_profesional || proEnMapa?.longitud || sessionStore.proUser.longitud_actual || lngCli
  );

  const ruta = await calcularRutaYDistanciaReal({
    latProfesional: latPro,
    lngProfesional: lngPro,
    latCliente: latCli,
    lngCliente: lngCli,
  });
  const comision10 = calcularComisionCOP(totalCop);
  const codigo = `BF-${Math.floor(10000 + Math.random() * 90000)}`;

  const nueva = {
    id: `booking-${Date.now()}`,
    codigo_reserva: codigo,
    servicio_id: servicio_id || null,
    servicio_nombre,
    servicio_foto,
    barrio_zona: cliente.barrio || 'Cali',
    cliente_id: cliente.id || sessionStore.userId || null,
    cliente_nombre: cliente.nombre_completo || 'Cliente',
    cliente_telefono: cliente.telefono || '',
    cliente_foto: cliente.foto_perfil_url || null,
    profesional_id: resolvedProId,
    profesional_nombre:
      profesional_nombre ||
      proEnMapa?.nombre ||
      sessionStore.proUser.nombre_completo ||
      'Profesional',
    profesional_foto:
      profesional_foto || proEnMapa?.foto || sessionStore.proUser.foto_perfil_url || null,
    modalidad,
    fecha_programada,
    hora_programada,
    estado: ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_ACEPTACION_PRO,
    progreso_ruta: 0,
    instruccion_uber: 'Solicitud enviada. Pendiente de aceptación del profesional.',
    direccion_servicio:
      cliente.direccion_principal || `${latCli.toFixed(5)}, ${lngCli.toFixed(5)}`,
    latitud_servicio: latCli,
    longitud_servicio: lngCli,
    latitud_origen_pro: latPro,
    longitud_origen_pro: lngPro,
    latitud_profesional: latPro,
    longitud_profesional: lngPro,
    distancia_estimada_km: ruta.distancia_km,
    tiempo_estimado_minutos: ruta.eta_minutos,
    precio_servicio_cop: baseCop,
    recargo_domicilio_cop: recargo,
    precio_total_cop: totalCop,
    valor_comision_cop: comision10,
    comision_etapa1_cop: desgloseComision.comision_etapa1_cop,
    comision_etapa2_cop: desgloseComision.comision_etapa2_cop,
    etapa1_cobrada: false,
    etapa2_cobrada: false,
    llegada_confirmada: false,
    arrived_at: null,
    chat_activo: true,
    mensajes_chat: [],
  };

  sessionStore.bookings = [nueva];
  await SupabaseRepository.insert('solicitudes_uber', {
    codigo_reserva: nueva.codigo_reserva,
    servicio_id: nueva.servicio_id,
    servicio_nombre: nueva.servicio_nombre,
    servicio_foto: nueva.servicio_foto,
    barrio_zona: nueva.barrio_zona,
    cliente_id: nueva.cliente_id,
    cliente_nombre: nueva.cliente_nombre,
    cliente_telefono: nueva.cliente_telefono,
    cliente_foto: nueva.cliente_foto,
    profesional_id: nueva.profesional_id,
    profesional_nombre: nueva.profesional_nombre,
    profesional_foto: nueva.profesional_foto,
    modalidad: nueva.modalidad,
    fecha_programada: nueva.fecha_programada,
    hora_programada: nueva.hora_programada,
    estado: nueva.estado,
    direccion_servicio: nueva.direccion_servicio,
    latitud_servicio: nueva.latitud_servicio,
    longitud_servicio: nueva.longitud_servicio,
    latitud_origen_pro: nueva.latitud_origen_pro,
    longitud_origen_pro: nueva.longitud_origen_pro,
    latitud_profesional: nueva.latitud_profesional,
    longitud_profesional: nueva.longitud_profesional,
    distancia_estimada_km: nueva.distancia_estimada_km,
    tiempo_estimado_minutos: nueva.tiempo_estimado_minutos,
    precio_servicio_cop: nueva.precio_servicio_cop,
    recargo_domicilio_cop: nueva.recargo_domicilio_cop,
    precio_total_cop: nueva.precio_total_cop,
    valor_comision_cop: nueva.valor_comision_cop,
    comision_etapa1_cop: nueva.comision_etapa1_cop,
    comision_etapa2_cop: nueva.comision_etapa2_cop,
    etapa1_cobrada: false,
    etapa2_cobrada: false,
    progreso_ruta: 0,
    instruccion_uber: nueva.instruccion_uber,
    chat_activo: true,
  }).catch(() => {});

  const notif = NotificationFactory.create('solicitud_recibida', {
    codigoReserva: nueva.codigo_reserva,
    clienteNombre: nueva.cliente_nombre,
    servicioNombre: nueva.servicio_nombre,
    extra:
      modalidad === 'domicilio'
        ? 'A domicilio'
        : `En salón: ${fecha_programada} ${hora_programada}`,
  });
  await agregarNotificacionTiempoReal('profesional', {
    usuario_id: nueva.profesional_id,
    actor_user_id: nueva.cliente_id,
    codigo_reserva: nueva.codigo_reserva,
    titulo: notif.titulo,
    mensaje: notif.mensaje,
    tipo: 'PRO_NEW_REQUEST',
    registrarEnChat: true,
  });

  appEventBus.notify(APP_EVENTS.REQUEST_STATUS_CHANGED, nueva);
  return { bloqueado: false, disponible: true, reserva: nueva };
}

export async function responderSolicitudPorProfesional(decision = 'aceptar') {
  const activa = obtenerSolicitudActiva();
  if (!activa) return null;

  // Antes de aceptar, verificar en Supabase que el profesional tenga saldo suficiente para la comisión
  if (decision !== 'rechazar') {
    const desglose = calcularDesgloseComisionEtapas(activa.precio_total_cop);
    const proId =
      activa.profesional_id ||
      sessionStore.proUser?.usuario_id ||
      sessionStore.proUser?.id ||
      2;
    const { saldoDisponibleCop: saldoActual } =
      await obtenerSaldoRealProfesionalDesdeSupabase(proId);

    sessionStore.wallet.saldo_disponible_cop = saldoActual;

    if (saldoActual < desglose.comision_etapa1_cop) {
      await desactivarServiciosDeProfesionalSinSaldo(proId, saldoActual);
      return {
        ...activa,
        bloqueadoPorSaldo: true,
        saldo_disponible_cop: saldoActual,
        monto_requerido_cop: desglose.comision_etapa1_cop,
        faltante_cop: desglose.comision_etapa1_cop - saldoActual,
        mensaje: `No tienes saldo suficiente en tu billetera profesional (${formatCOP(
          saldoActual
        )} COP). Necesitas al menos ${formatCOP(
          desglose.comision_etapa1_cop
        )} COP para cubrir la primera etapa de comisión (3%). Tus servicios han sido desactivados hasta que recargues.`,
      };
    }
  }

  const nextState =
    decision === 'rechazar'
      ? ESTADOS_SOLICITUD_OFICIALES.RECHAZADA_POR_PRO
      : ESTADOS_SOLICITUD_OFICIALES.ACEPTADA_POR_PRO;
  if (!RequestStateFactory.canTransition(activa.estado, nextState)) return activa;

  activa.estado = nextState;
  if (decision === 'rechazar') {
    activa.chat_activo = false;
    activa.instruccion_uber = 'Solicitud rechazada por el profesional.';
    await SupabaseRepository.patch(
      'solicitudes_uber',
      `codigo_reserva=eq.${encodeURIComponent(activa.codigo_reserva)}`,
      {
        estado: activa.estado,
        chat_activo: false,
        instruccion_uber: activa.instruccion_uber,
      }
    ).catch(() => {});
    const n = NotificationFactory.create('rechazada_profesional', {
      codigoReserva: activa.codigo_reserva,
      profesionalNombre: activa.profesional_nombre,
    });
    await agregarNotificacionTiempoReal('cliente', {
      usuario_id: activa.cliente_id,
      actor_user_id: activa.profesional_id,
      ...n,
      tipo: 'CLIENT_PRO_REJECTED',
      registrarEnChat: true,
    });
    sessionStore.historialCompletadas.unshift({ ...activa });
    sessionStore.bookings = [];
  } else {
    activa.instruccion_uber =
      'Aceptada por el profesional. Pendiente confirmación definitiva del cliente.';
    await SupabaseRepository.patch(
      'solicitudes_uber',
      `codigo_reserva=eq.${encodeURIComponent(activa.codigo_reserva)}`,
      {
        estado: activa.estado,
        instruccion_uber: activa.instruccion_uber,
      }
    ).catch(() => {});
    const n = NotificationFactory.create('aceptada_profesional', {
      codigoReserva: activa.codigo_reserva,
      profesionalNombre: activa.profesional_nombre,
    });
    await agregarNotificacionTiempoReal('cliente', {
      usuario_id: activa.cliente_id,
      actor_user_id: activa.profesional_id,
      ...n,
      tipo: 'CLIENT_PRO_ACCEPTED',
      registrarEnChat: true,
    });
  }
  appEventBus.notify(APP_EVENTS.REQUEST_STATUS_CHANGED, activa);
  return activa;
}

/**
 * Módulo 5.1: Primera etapa de comisión (3% cuando el cliente confirma la contratación).
 * Consulta el saldo real del profesional directamente en Supabase (`billetera_profesional`)
 * para que la confirmación funcione tanto en HomeScreen como en Solicitudes/Reservas.
 */
export async function confirmarDefinitivamentePorCliente() {
  let activa = obtenerSolicitudActiva();
  if (!activa) {
    await sincronizarEstadoDesdeSupabase('cliente');
    activa = obtenerSolicitudActiva();
  }
  if (!activa) return null;

  if (
    !RequestStateFactory.canTransition(
      activa.estado,
      ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE
    )
  ) {
    return activa;
  }

  // Ejecutar cobro de la primera etapa de comisión (3%) sobre el saldo prepago del profesional en Supabase
  const resultadoComision1 = await ejecutarCobroComisionEtapa({
    codigoReserva: activa.codigo_reserva,
    profesionalId: activa.profesional_id || 2,
    etapa: 1,
    precioTotalCop: activa.precio_total_cop,
  });

  if (resultadoComision1.bloqueadoPorSaldo) {
    return {
      ...activa,
      bloqueadoPorSaldo: true,
      detallesSaldo: resultadoComision1,
    };
  }

  activa.estado = ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE;
  activa.etapa1_cobrada = true;
  activa.comision_etapa1_cop = resultadoComision1.monto_descontado_cop;
  activa.progreso_ruta = 15;
  activa.chat_activo = true;
  activa.instruccion_uber =
    'Contratación confirmada (Comisión 3% aplicada). Activo para seguimiento en tiempo real.';

  await SupabaseRepository.patch(
    'solicitudes_uber',
    `codigo_reserva=eq.${encodeURIComponent(activa.codigo_reserva)}`,
    {
      estado: activa.estado,
      etapa1_cobrada: true,
      comision_etapa1_cop: activa.comision_etapa1_cop,
      progreso_ruta: 15,
      chat_activo: true,
      instruccion_uber: activa.instruccion_uber,
    }
  ).catch(() => {});

  const n = NotificationFactory.create('confirmada_cliente', {
    codigoReserva: activa.codigo_reserva,
    clienteNombre: activa.cliente_nombre,
    servicioNombre: activa.servicio_nombre,
  });
  await agregarNotificacionTiempoReal('profesional', {
    usuario_id: activa.profesional_id,
    actor_user_id: activa.cliente_id,
    ...n,
    tipo: 'PRO_CLIENT_CONFIRMED',
    registrarEnChat: true,
  });
  appEventBus.notify(APP_EVENTS.REQUEST_STATUS_CHANGED, activa);
  return activa;
}

/**
 * Módulo 6.5: Confirmación y Detección de Llegada del Profesional al Destino
 */
export async function confirmarLlegadaProfesionalAlDestino({
  confirmacionAdicional = true,
} = {}) {
  const activa = obtenerSolicitudActiva();
  if (!activa) return null;

  const latD = Number(activa.latitud_servicio);
  const lngD = Number(activa.longitud_servicio);
  activa.latitud_profesional = latD;
  activa.longitud_profesional = lngD;
  activa.progreso_ruta = 100;
  activa.distancia_estimada_km = 0;
  activa.tiempo_estimado_minutos = 0;
  activa.llegada_confirmada = true;
  activa.arrived_at = new Date().toISOString();
  activa.instruccion_uber =
    '¡Tu profesional ha llegado! Ya se encuentra en la ubicación indicada.';

  await callBackendApi(`/bookings/${activa.codigo_reserva}/tracking/arrive`, 'POST', {
    profesional_id: activa.profesional_id,
    latitude: latD,
    longitude: lngD,
    accuracy: 10,
    confirmacion_adicional: confirmacionAdicional,
  }).catch(() => {});

  await SupabaseRepository.patch(
    'solicitudes_uber',
    `codigo_reserva=eq.${encodeURIComponent(activa.codigo_reserva)}`,
    {
      latitud_profesional: latD,
      longitud_profesional: lngD,
      progreso_ruta: 100,
      distancia_estimada_km: 0,
      tiempo_estimado_minutos: 0,
      llegada_confirmada: true,
      arrived_at: activa.arrived_at,
      instruccion_uber: activa.instruccion_uber,
    }
  ).catch(() => {});

  await agregarNotificacionTiempoReal('cliente', {
    usuario_id: activa.cliente_id,
    actor_user_id: activa.profesional_id,
    codigo_reserva: activa.codigo_reserva,
    titulo: '¡Tu profesional ha llegado!',
    mensaje: '¡Tu profesional ha llegado! Ya se encuentra en la ubicación indicada.',
    tipo: 'CLIENT_PRO_ARRIVED',
    registrarEnChat: true,
  });

  appEventBus.notify(APP_EVENTS.REQUEST_STATUS_CHANGED, activa);
  return activa;
}

/**
 * Módulo 5.2 y 6: Actualizar estado (incluyendo el cobro de la Etapa 2 del 7% al iniciar el servicio)
 */
export async function actualizarEstadoSolicitudActiva(nuevoEstado, avanceExtra = null) {
  const activa = obtenerSolicitudActiva();
  if (!activa) return null;
  if (!RequestStateFactory.canTransition(activa.estado, nuevoEstado)) return activa;

  // Si pasa a EN_SERVICIO, descontar la Segunda Etapa de Comisión (7%)
  if (nuevoEstado === ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO) {
    const resultadoComision2 = await ejecutarCobroComisionEtapa({
      codigoReserva: activa.codigo_reserva,
      profesionalId: activa.profesional_id || 2,
      etapa: 2,
      precioTotalCop: activa.precio_total_cop,
    });

    if (resultadoComision2.bloqueadoPorSaldo) {
      return {
        ...activa,
        bloqueadoPorSaldo: true,
        detallesSaldo: resultadoComision2,
      };
    }

    activa.etapa2_cobrada = true;
    activa.comision_etapa2_cop = resultadoComision2.monto_descontado_cop;
    activa.started_at = new Date().toISOString();
  }

  activa.estado = nuevoEstado;
  const latO = Number(activa.latitud_origen_pro || activa.latitud_servicio);
  const lngO = Number(activa.longitud_origen_pro || activa.longitud_servicio);
  const latD = Number(activa.latitud_servicio);
  const lngD = Number(activa.longitud_servicio);

  if (nuevoEstado === ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO) {
    activa.progreso_ruta =
      avanceExtra !== null ? avanceExtra : Math.min(92, (activa.progreso_ruta || 15) + 25);
    const frac = Math.min(1, Math.max(0, activa.progreso_ruta / 100));
    activa.latitud_profesional = Number((latO + (latD - latO) * frac).toFixed(6));
    activa.longitud_profesional = Number((lngO + (lngD - lngO) * frac).toFixed(6));
    const ruta = await calcularRutaYDistanciaReal({
      latProfesional: activa.latitud_profesional,
      lngProfesional: activa.longitud_profesional,
      latCliente: latD,
      lngCliente: lngD,
    });
    activa.distancia_estimada_km = ruta.distancia_km;
    activa.tiempo_estimado_minutos = ruta.eta_minutos;

    await callBackendApi(`/bookings/${activa.codigo_reserva}/tracking/location`, 'POST', {
      profesional_id: activa.profesional_id,
      latitude: activa.latitud_profesional,
      longitude: activa.longitud_profesional,
      accuracy: 12,
    }).catch(() => {});

    await SupabaseRepository.insert('booking_locations', {
      booking_code: activa.codigo_reserva,
      professional_id: Number(activa.profesional_id || 2),
      latitude: activa.latitud_profesional,
      longitude: activa.longitud_profesional,
      accuracy: 12,
      is_current: true,
    }).catch(() => {});

    const distMetros = calcularDistanciaMetros(
      activa.latitud_profesional,
      activa.longitud_profesional,
      latD,
      lngD
    );

    if (distMetros <= 80 && !activa.llegada_confirmada) {
      await confirmarLlegadaProfesionalAlDestino({ confirmacionAdicional: true });
    } else {
      const n = NotificationFactory.create('en_camino', {
        codigoReserva: activa.codigo_reserva,
        profesionalNombre: activa.profesional_nombre,
        extra: `${ruta.distancia_texto} • ${ruta.tiempo_texto} (estimado)`,
      });
      await agregarNotificacionTiempoReal('cliente', {
        usuario_id: activa.cliente_id,
        actor_user_id: activa.profesional_id,
        ...n,
        tipo: 'CLIENT_PRO_EN_ROUTE',
        registrarEnChat: true,
      });
    }
  } else if (nuevoEstado === ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO) {
    activa.progreso_ruta = 100;
    activa.distancia_estimada_km = 0;
    activa.tiempo_estimado_minutos = 0;
    activa.llegada_confirmada = true;
    activa.instruccion_uber =
      'Servicio iniciado (Comisión restante del 7% descontada). En atención.';
    const n = NotificationFactory.create('en_servicio', {
      codigoReserva: activa.codigo_reserva,
      profesionalNombre: activa.profesional_nombre,
      servicioNombre: activa.servicio_nombre,
    });
    await agregarNotificacionTiempoReal('cliente', {
      usuario_id: activa.cliente_id,
      actor_user_id: activa.profesional_id,
      ...n,
      tipo: 'CLIENT_SERVICE_STARTED',
      registrarEnChat: true,
    });
  } else if (
    nuevoEstado === ESTADOS_SOLICITUD_OFICIALES.FINALIZADA ||
    nuevoEstado === ESTADOS_SOLICITUD_OFICIALES.CANCELADA
  ) {
    activa.progreso_ruta = 100;
    activa.chat_activo = false;
    activa.completed_at = new Date().toISOString();
    const n = NotificationFactory.create(nuevoEstado, {
      codigoReserva: activa.codigo_reserva,
      servicioNombre: activa.servicio_nombre,
    });
    await agregarNotificacionTiempoReal('cliente', {
      usuario_id: activa.cliente_id,
      actor_user_id: activa.profesional_id,
      ...n,
      tipo:
        nuevoEstado === ESTADOS_SOLICITUD_OFICIALES.FINALIZADA
          ? 'CLIENT_SERVICE_COMPLETED'
          : 'CLIENT_BOOKING_CANCELLED',
      registrarEnChat: true,
    });
    sessionStore.historialCompletadas.unshift({ ...activa });
    sessionStore.bookings = [];
  }

  await SupabaseRepository.patch(
    'solicitudes_uber',
    `codigo_reserva=eq.${encodeURIComponent(activa.codigo_reserva)}`,
    {
      estado: activa.estado,
      progreso_ruta: activa.progreso_ruta,
      chat_activo: activa.chat_activo,
      latitud_profesional: activa.latitud_profesional,
      longitud_profesional: activa.longitud_profesional,
      distancia_estimada_km: activa.distancia_estimada_km,
      tiempo_estimado_minutos: activa.tiempo_estimado_minutos,
      etapa1_cobrada: activa.etapa1_cobrada,
      etapa2_cobrada: activa.etapa2_cobrada,
      llegada_confirmada: activa.llegada_confirmada,
    }
  ).catch(() => {});

  appEventBus.notify(APP_EVENTS.REQUEST_STATUS_CHANGED, activa);
  return activa;
}

export async function enviarMensajeChatServicio(autor, texto) {
  const activa = obtenerSolicitudActiva();
  if (!activa || !activa.chat_activo) return { exito: false, error: 'El chat no está activo.' };
  const limpio = String(texto || '').trim();
  if (!limpio) return { exito: false };

  const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const nombre = autor === 'cliente' ? activa.cliente_nombre : activa.profesional_nombre;
  const nuevoMsg = {
    id: `msg-${Date.now()}`,
    autor,
    tipo_mensaje: 'texto',
    nombre,
    texto: limpio,
    hora,
  };
  activa.mensajes_chat = [...(activa.mensajes_chat || []), nuevoMsg];

  await SupabaseRepository.insert('mensajes_chat_temporal', {
    codigo_reserva: activa.codigo_reserva,
    autor,
    tipo_mensaje: 'texto',
    nombre,
    texto: limpio,
    hora,
  }).catch(() => {});

  await agregarNotificacionTiempoReal(autor === 'cliente' ? 'profesional' : 'cliente', {
    usuario_id: autor === 'cliente' ? activa.profesional_id : activa.cliente_id,
    actor_user_id: autor === 'cliente' ? activa.cliente_id : activa.profesional_id,
    codigo_reserva: activa.codigo_reserva,
    titulo: `Nuevo mensaje de ${nombre}`,
    mensaje: limpio,
    tipo: 'CLIENT_NEW_MESSAGE',
    registrarEnChat: false,
  });
  appEventBus.notify(APP_EVENTS.CHAT_MESSAGE_RECEIVED, nuevoMsg);
  return { exito: true, mensaje: nuevoMsg };
}

export async function sincronizarEstadoDesdeSupabase(rolActual = 'cliente') {
  try {
    // 1. Consultar billeteras profesionales y perfiles profesionales para conocer el saldo real de cada especialista
    const [rowsWallets, rowsPerfilesPro, rowsPros, rowsCat] = await Promise.all([
      SupabaseRepository.select(
        'billetera_profesional',
        'select=*&order=saldo_disponible_cop.desc,updated_at.desc'
      ).catch(() => null),
      SupabaseRepository.select(
        'perfiles_profesionales',
        'select=id,usuario_id,saldo_billetera_cop'
      ).catch(() => null),
      SupabaseRepository.select(
        'usuarios',
        'rol=eq.profesional&select=*&order=created_at.desc'
      ).catch(() => null),
      SupabaseRepository.select(
        'catalogo_servicios_app',
        'select=*&order=created_at.desc'
      ).catch(() => null),
    ]);

    const saldosMap = {};
    if (Array.isArray(rowsWallets) && rowsWallets.length > 0) {
      rowsWallets.forEach((w) => {
        const s = Number(w.saldo_disponible_cop) || 0;
        const pid = String(w.profesional_id);
        if (saldosMap[pid] === undefined || s > saldosMap[pid]) {
          saldosMap[pid] = s;
        }
      });
      // Guardar también el saldo por defecto (ej. profesional_id = 2 o la billetera principal)
      const defaultWallet =
        rowsWallets.find((w) => Number(w.profesional_id) === 2) || rowsWallets[0];
      if (defaultWallet) {
        saldosMap['default'] = Number(defaultWallet.saldo_disponible_cop) || 0;
      }
    }

    if (Array.isArray(rowsPerfilesPro)) {
      rowsPerfilesPro.forEach((p) => {
        const sUser = saldosMap[String(p.usuario_id)];
        const sPerfil = saldosMap[String(p.id)];
        const resolved =
          sUser !== undefined
            ? sUser
            : sPerfil !== undefined
            ? sPerfil
            : saldosMap['default'] ?? 0;
        if (p.usuario_id) saldosMap[String(p.usuario_id)] = resolved;
        if (p.id) saldosMap[String(p.id)] = resolved;
      });
    }

    sessionStore.saldosPorProfesional = saldosMap;

    // Si estamos en sesión profesional, sincronizar también el saldo en sessionStore.wallet
    const currentProId =
      sessionStore.proUser?.usuario_id ||
      sessionStore.proUser?.id ||
      (rolActual === 'profesional' ? sessionStore.userId : null);
    if (currentProId && saldosMap[String(currentProId)] !== undefined) {
      sessionStore.wallet.saldo_disponible_cop = saldosMap[String(currentProId)];
    } else if (saldosMap['default'] !== undefined && Array.isArray(rowsWallets)) {
      sessionStore.wallet.saldo_disponible_cop = saldosMap['default'];
    }

    if (Array.isArray(rowsPros)) {
      sessionStore.estilistasMapa = rowsPros
        .filter((u) => {
          if (u.latitud === null || u.longitud === null) return false;
          const saldoEstilista =
            saldosMap[String(u.id)] !== undefined
              ? saldosMap[String(u.id)]
              : saldosMap['default'] ?? 0;
          return saldoEstilista > 0;
        })
        .map((u) => ({
          id: `pro-${u.id}`,
          usuario_id: u.id,
          nombre: u.nombre,
          correo: u.email,
          telefono: u.telefono,
          especialidad: 'Especialista Verificado',
          calificacion: '5.0',
          barrio: u.barrio || u.ciudad || 'Colombia',
          direccion_exacta: u.direccion_principal || u.ciudad || 'Colombia',
          distancia_km: calcularDistanciaKm(
            sessionStore.clientUser.latitud,
            sessionStore.clientUser.longitud,
            Number(u.latitud),
            Number(u.longitud)
          ),
          foto: u.avatar_url || null,
          latitud: Number(u.latitud),
          longitud: Number(u.longitud),
        }));
    }

    if (Array.isArray(rowsCat)) {
      sessionStore.catalogoServicios = rowsCat.map((r) => {
        const precioCop = Number(r.price_cop) || 10000;
        const comisionMinima = Math.max(300, Math.round(precioCop * 0.03));
        const pidKey = r.profesional_id ? String(r.profesional_id) : 'default';
        const saldoPro =
          saldosMap[pidKey] !== undefined
            ? saldosMap[pidKey]
            : saldosMap['default'] !== undefined
            ? saldosMap['default']
            : Number(sessionStore.wallet?.saldo_disponible_cop) || 0;

        const sinSaldo = saldoPro <= 0 || saldoPro < comisionMinima;

        // Si el profesional no tiene saldo y el servicio seguía activo en BD, desactivarlo automáticamente en Supabase
        if (sinSaldo && r.active) {
          SupabaseRepository.patch(
            'catalogo_servicios_app',
            `id=eq.${encodeURIComponent(r.id)}`,
            { active: false, updated_at: new Date().toISOString() }
          ).catch(() => {});
        }

        return {
          id: r.codigo_servicio || `srv-${r.id}`,
          db_id: r.id,
          profesional_id: r.profesional_id,
          proName: r.pro_name,
          proAvatar: r.pro_avatar,
          proRating: r.pro_rating || '5.0',
          barrio: r.barrio || '',
          nombre_establecimiento: r.nombre_establecimiento || '',
          latitud_profesional: r.latitud_profesional,
          longitud_profesional: r.longitud_profesional,
          categoryId: r.category_id,
          categoryLabel: r.category_label,
          badge: r.badge || 'Destacado',
          title: r.title,
          desc: r.descripcion,
          duration: r.duration,
          modalityLabel: r.modality_label,
          priceCop: precioCop,
          active: sinSaldo ? false : Boolean(r.active),
          bloqueadoPorSinSaldo: sinSaldo,
          saldoProfesionalCop: saldoPro,
          image: r.image,
          galeria_resultados:
            Array.isArray(r.galeria_resultados) && r.galeria_resultados.length > 0
              ? r.galeria_resultados
              : r.image
              ? [r.image]
              : [],
        };
      });
    }

    const rowsSol = await SupabaseRepository.select(
      'solicitudes_uber',
      'order=created_at.desc&limit=25'
    ).catch(() => null);
    if (Array.isArray(rowsSol)) {
      const activas = [];
      const completadas = [];
      rowsSol.forEach((s) => {
        const item = {
          ...s,
          id: `booking-${s.id || s.codigo_reserva}`,
          db_id: s.id,
          mensajes_chat:
            sessionStore.bookings.find((b) => b.codigo_reserva === s.codigo_reserva)
              ?.mensajes_chat || [],
        };
        if (ESTADOS_DOMICILIO_ACTIVOS.includes(s.estado)) activas.push(item);
        else completadas.push(item);
      });
      sessionStore.bookings = activas;
      sessionStore.historialCompletadas = completadas;
    }

    const activa = obtenerSolicitudActiva();
    if (activa?.codigo_reserva) {
      const rowsMsg = await SupabaseRepository.select(
        'mensajes_chat_temporal',
        `codigo_reserva=eq.${encodeURIComponent(activa.codigo_reserva)}&order=created_at.asc`
      ).catch(() => null);
      if (Array.isArray(rowsMsg)) {
        activa.mensajes_chat = rowsMsg.map((m) => ({
          id: `msg-${m.id}`,
          autor: m.autor,
          tipo_mensaje: m.tipo_mensaje || (m.autor === 'sistema' ? 'sistema' : 'texto'),
          nombre: m.nombre,
          texto: m.texto,
          hora: m.hora,
        }));
      }
    }

    const currentUserId =
      sessionStore.userId ||
      (rolActual === 'profesional'
        ? sessionStore.proUser.usuario_id || sessionStore.proUser.id
        : sessionStore.clientUser.id);

    const notifQuery = currentUserId
      ? `or=(usuario_id.eq.${currentUserId},usuario_id.is.null)&rol_destino=in.(${rolActual},todos)&order=created_at.desc&limit=30`
      : `rol_destino=in.(${rolActual},todos)&order=created_at.desc&limit=30`;

    const rowsNotif = await SupabaseRepository.select('notificaciones', notifQuery).catch(
      () => null
    );
    if (Array.isArray(rowsNotif)) {
      const fmt = rowsNotif.map((n) => ({
        id: `notif-${n.id}`,
        db_id: n.id,
        usuario_id: n.usuario_id,
        recipient_user_id: n.usuario_id,
        codigo_reserva: n.codigo_reserva,
        entity_type: n.entity_type || 'BOOKING',
        entity_id: n.entity_id || n.codigo_reserva,
        target_screen: n.target_screen || 'SearchResults',
        titulo: n.titulo,
        title: n.titulo,
        mensaje: n.mensaje,
        body: n.mensaje,
        tipo: n.tipo,
        type: n.tipo,
        leida: Boolean(n.leida),
        is_read: Boolean(n.leida),
        hora: new Date(n.created_at || Date.now()).toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));
      if (rolActual === 'profesional') sessionStore.notificacionesProfesional = fmt;
      else sessionStore.notificacionesCliente = fmt;

      const nueva = rowsNotif.find((n) => !n.leida && !idsNotificacionesVistas.has(n.id));
      if (nueva) {
        idsNotificacionesVistas.add(nueva.id);
        try {
          Vibration.vibrate(180);
        } catch (_v) {}
      }
    }
  } catch (_err) {}
}
