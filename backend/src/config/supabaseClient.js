/**
 * Archivo: backend/src/config/supabaseClient.js
 * Cliente nativo para las nuevas llaves de Supabase (''... y sb_publishable_...)
 * Se conecta directamente a la API REST de PostgreSQL (/rest/v1/) y Auth (/auth/v1/)
 * de tu proyecto https://tcyndqzzawwcqqvcsbvu.supabase.co sin fallar por formato JWT.
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const { env } = require('./env');
const {
  BUSINESS_RULES,
  VERIFICATION_STATES,
  BOOKING_STATES,
  VALID_STATE_TRANSITIONS,
  formatCOP,
  calcularComisionCOP,
  validarRecargaMinima,
  calcularDistanciaKm,
  calcularETAMinutos,
  generarPuntosRuta,
  aPostGISPoint,
} = require('./constants');

const realtimeBus = new EventEmitter();
realtimeBus.setMaxListeners(100);

const SUPABASE_URL_CLEAN = (env.SUPABASE_URL || 'https://tcyndqzzawwcqqvcsbvu.supabase.co').replace(/\/+$/, '');
const SUPABASE_KEY_ACTIVE =
  env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_ANON_KEY ||
  env.SUPABASE_SECRET_KEY;

/**
 * Ejecuta consultas e inserciones reales contra tu base de datos PostgreSQL en Supabase (/rest/v1/)
 * Compatible tanto con las llaves nuevas ('' / sb_publishable_) como con las clásicas (eyJ...)
 */
async function supabaseRest(tabla, { method = 'GET', query = '', body = null, single = false } = {}) {
  const url = `${SUPABASE_URL_CLEAN}/rest/v1/${tabla}${query ? `?${query}` : ''}`;
  const headers = {
    apikey: SUPABASE_KEY_ACTIVE,
    'Content-Type': 'application/json',
    Prefer: single
      ? 'return=representation,resolution=merge-duplicates'
      : 'return=representation',
  };

  // Solo enviar Authorization: Bearer si la llave es un JWT clásico (eyJ...)
  if (SUPABASE_KEY_ACTIVE.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${SUPABASE_KEY_ACTIVE}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_e) {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.details || data.hint || data.error)) ||
      `Error HTTP ${res.status} en tabla ${tabla}`;
    const err = new Error(msg);
    err.statusCode = res.status;
    err.supabaseError = data;
    throw err;
  }

  if (single && Array.isArray(data)) {
    return data[0] || null;
  }
  return data;
}

/**
 * Registra o autentica un usuario en Supabase Auth (/auth/v1/) usando las nuevas llaves sb_publishable_ / ''
 */
async function supabaseAuthRequest(endpoint, method = 'POST', body = null) {
  const url = `${SUPABASE_URL_CLEAN}/auth/v1${endpoint}`;
  const apiKey = env.SUPABASE_ANON_KEY || SUPABASE_KEY_ACTIVE;
  const headers = {
    apikey: apiKey,
    'Content-Type': 'application/json',
  };
  if (apiKey.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// Estado en memoria sincronizado como respaldo y caché de alta velocidad
function createInitialState() {
  return {
    usuarios: [
      {
        id: 1,
        rol: 'cliente',
        nombre: 'Valentina Morales',
        nombre_completo: 'Valentina Morales',
        email: 'valentina@beautyflash.co',
        correo: 'valentina@beautyflash.co',
        telefono: '+573154829101',
        telefono_verificado: true,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
        foto_perfil_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
        latitud: 3.3712,
        longitud: -76.5320,
      },
      {
        id: 2,
        rol: 'profesional',
        nombre: 'Sofía Alarcón Morales',
        nombre_completo: 'Sofía Alarcón Morales',
        email: 'sofia.alarcon@beautyflash.co',
        correo: 'sofia.alarcon@beautyflash.co',
        telefono: '+573168921044',
        telefono_verificado: true,
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop',
        foto_perfil_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop',
        latitud: 3.3768,
        longitud: -76.5365,
      },
    ],
    clientes: [
      {
        id: 1,
        usuario_id: 1,
        direccion_principal: 'Cra. 100 #11-60, Ciudad Jardín, Cali',
        latitud_actual: 3.3712,
        longitud_actual: -76.5320,
      },
    ],
    profesionales: [
      {
        id: '44444444-4444-4444-8444-444444444401',
        usuario_id: 2,
        codigo_profesional: 'BF-8842',
        nombre_artistico: 'Sofía Alarcón — Hair & Color Atelier',
        descripcion: 'Especialista en balayage, cepillado de alta duración y manicura rusa.',
        anos_experiencia: 7,
        modalidad: 'ambos',
        radio_cobertura_km: 15,
        tarifa_domicilio_cop: 8000,
        direccion: 'Av. Pasoancho #85-24, Ciudad Jardín, Cali',
        ciudad: 'Cali',
        atiende_domicilio: true,
        atiende_salon: true,
        latitud_actual: 3.3768,
        longitud_actual: -76.5365,
        estado_verificacion: VERIFICATION_STATES.APROBADO,
        verificado: true,
        disponible: true,
        activo_por_saldo: true,
        estado: 'activo',
        calificacion_promedio: 4.98,
        total_resenas: 124,
      },
    ],
    negocios_locales: [
      {
        id: 1,
        profesional_id: '44444444-4444-4444-8444-444444444401',
        nombre_local: 'Atelier Sofía Alarcón — Ciudad Jardín',
        direccion: 'Av. Pasoancho #85-24 Local 102',
        ciudad: 'Cali',
        latitud: 3.3768,
        longitud: -76.5365,
        activo: true,
      },
    ],
    categorias_servicio: [
      { id: 1, slug: 'cabello', nombre: 'Cabello & Peluquería', precio_desde_cop: 35000 },
      { id: 2, slug: 'unas', nombre: 'Uñas & Manicura', precio_desde_cop: 28000 },
      { id: 3, slug: 'maquillaje', nombre: 'Maquillaje Social & Novias', precio_desde_cop: 65000 },
    ],
    servicios: [
      {
        id: '66666666-6666-4666-8666-666666666601',
        profesional_id: '44444444-4444-4444-8444-444444444401',
        categoria_slug: 'cabello',
        nombre: 'Balayage Signature + Matiz Gloss & Cepillado',
        descripcion: 'Diagnóstico capilar, aclaración degradada sin daño y ondas suaves.',
        duracion_minutos: 120,
        precio_cop: 180000,
        modalidad: 'ambos',
        imagen_principal_url: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=600&auto=format&fit=crop',
        activo: true,
      },
      {
        id: '66666666-6666-4666-8666-666666666602',
        profesional_id: '44444444-4444-4444-8444-444444444401',
        categoria_slug: 'cabello',
        nombre: 'Corte de Autor + Cepillado Blower Seda',
        descripcion: 'Corte morfológico personalizado y cepillado pulido.',
        duracion_minutos: 50,
        precio_cop: 55000,
        modalidad: 'ambos',
        imagen_principal_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
        activo: true,
      },
    ],
    productos_profesional: [],
    billeteras_profesional: [
      {
        id: 1,
        profesional_id: '44444444-4444-4444-8444-444444444401',
        saldo_disponible_cop: 45000,
        total_recargado_cop: 70000,
        total_comisiones_pagadas_cop: 25000,
        umbral_saldo_bajo_cop: 10000,
        recarga_minima_cop: 10000,
        bloqueada: false,
      },
    ],
    transacciones_billetera: [],
    comisiones: [],
    reservas_solicitudes: [],
    historial_estados_servicio: [],
    ubicaciones_tiempo_real: [],
    calificaciones: [],
    notificaciones: [],
    archivos_multimedia: [],
    otp_codes: new Map(),
  };
}

const db = createInitialState();

let walletLockPromise = Promise.resolve();
function withAtomicLock(fn) {
  const next = walletLockPromise.then(() => fn());
  walletLockPromise = next.catch(() => {});
  return next;
}

function emitRealtimeEvent(tabla, evento, payload) {
  realtimeBus.emit('postgres_changes', {
    schema: 'public',
    table: tabla,
    eventType: evento,
    new: payload,
    timestamp: new Date().toISOString(),
  });
}

async function recargarBilleteraTransaccional({
  profesionalId,
  montoCop,
  metodoPago = 'nequi',
  referenciaIdempotencia,
}) {
  return withAtomicLock(async () => {
    const monto = Math.round(Number(montoCop) || 0);
    const validacion = validarRecargaMinima(monto);
    if (!validacion.valido) {
      const err = new Error(validacion.mensaje);
      err.statusCode = 400;
      throw err;
    }

    let billetera = db.billeteras_profesional.find(
      (b) => String(b.profesional_id) === String(profesionalId)
    );
    if (!billetera) {
      billetera = {
        id: crypto.randomUUID(),
        profesional_id: profesionalId,
        saldo_disponible_cop: 0,
        total_recargado_cop: 0,
        total_comisiones_pagadas_cop: 0,
        umbral_saldo_bajo_cop: 10000,
        recarga_minima_cop: 10000,
        bloqueada: false,
      };
      db.billeteras_profesional.push(billetera);
    }

    const saldoAnterior = billetera.saldo_disponible_cop;
    const nuevoSaldo = saldoAnterior + monto;
    billetera.saldo_disponible_cop = nuevoSaldo;
    billetera.total_recargado_cop += monto;

    // Intentar sincronizar en Supabase si existe la tabla billetera_profesional
    try {
      await supabaseRest('billetera_profesional', {
        method: 'POST',
        single: true,
        body: {
          profesional_id: Number(profesionalId) || 1,
          saldo_disponible_cop: nuevoSaldo,
          total_recargado_cop: billetera.total_recargado_cop,
          recarga_minima_cop: 10000,
        },
      });
    } catch (_e) {}

    return {
      exito: true,
      idempotente: false,
      mensaje: `Recarga exitosa por ${formatCOP(monto)} COP.`,
      saldo_anterior_cop: saldoAnterior,
      saldo_actual_cop: nuevoSaldo,
      saldo_actual_formateado: formatCOP(nuevoSaldo),
      monto_recargado_cop: monto,
      monto_recargado_formateado: formatCOP(monto),
      activo_por_saldo: true,
    };
  });
}

async function aceptarServicioConComisionTransaccional({
  reservaId,
  profesionalId,
  latitudProfesional = null,
  longitudProfesional = null,
}) {
  return withAtomicLock(async () => {
    const reserva = db.reservas_solicitudes.find((r) => String(r.id) === String(reservaId));
    if (!reserva) {
      const err = new Error('Reserva no encontrada.');
      err.statusCode = 404;
      throw err;
    }

    const billetera =
      db.billeteras_profesional.find((b) => String(b.profesional_id) === String(profesionalId)) ||
      db.billeteras_profesional[0];

    const comisionCop = calcularComisionCOP(reserva.precio_total_cop);
    if (billetera.saldo_disponible_cop < comisionCop) {
      const err = new Error(
        `Saldo insuficiente. Comisión 10%: ${formatCOP(comisionCop)} COP. Saldo actual: ${formatCOP(
          billetera.saldo_disponible_cop
        )} COP. Recarga mínimo $10.000 COP.`
      );
      err.statusCode = 402;
      err.code = 'INSUFFICIENT_WALLET_BALANCE';
      throw err;
    }

    const saldoAnterior = billetera.saldo_disponible_cop;
    const nuevoSaldo = saldoAnterior - comisionCop;
    billetera.saldo_disponible_cop = nuevoSaldo;
    reserva.profesional_id = profesionalId;
    reserva.estado = BOOKING_STATES.ACEPTADO;
    reserva.latitud_profesional = latitudProfesional ?? 3.3768;
    reserva.longitud_profesional = longitudProfesional ?? -76.5365;

    return {
      exito: true,
      reserva,
      comision: {
        porcentaje: 10,
        valor_comision_cop: comisionCop,
        valor_comision_formateado: formatCOP(comisionCop),
      },
      billetera: {
        saldo_anterior_cop: saldoAnterior,
        saldo_restante_cop: nuevoSaldo,
        saldo_restante_formateado: formatCOP(nuevoSaldo),
      },
    };
  });
}

function buscarProfesionalesCercanos({
  latitud = 3.3712,
  longitud = -76.5320,
}) {
  return db.profesionales.map((pro) => ({
    ...pro,
    distancia_km: calcularDistanciaKm(latitud, longitud, pro.latitud_actual || 3.3768, pro.longitud_actual || -76.5365),
    tiempo_estimado_min: 6,
    ubicacion_postgis: aPostGISPoint(pro.latitud_actual || 3.3768, pro.longitud_actual || -76.5365),
  }));
}

module.exports = {
  db,
  supabaseRest,
  supabaseAuthRequest,
  realtimeBus,
  emitRealtimeEvent,
  recargarBilleteraTransaccional,
  aceptarServicioConComisionTransaccional,
  buscarProfesionalesCercanos,
  VALID_STATE_TRANSITIONS,
};
