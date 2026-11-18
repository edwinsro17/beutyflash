/**
 * Archivo: backend/src/config/constants.js
 * Reglas de negocio, estados del servicio y utilidades de moneda COP ($10.000) y geolocalización PostGIS
 */

const BUSINESS_RULES = {
  CURRENCY: 'COP',
  COUNTRY_CODE: '+57',
  COMMISSION_RATE: 0.10, // 10% del valor de cada servicio
  COMMISSION_PERCENT: 10,
  MIN_RECHARGE_COP: 10000, // Recarga mínima obligatoria: $10.000 COP
  LOW_BALANCE_THRESHOLD_COP: 10000, // Alerta de saldo bajo: $10.000 COP
  SEARCH_TIMEOUT_SECONDS: 90,
  DEFAULT_COVERAGE_RADIUS_KM: 12,
};

const ROLES = {
  CLIENTE: 'cliente',
  PROFESIONAL: 'profesional',
  ADMIN: 'admin',
};

const VERIFICATION_STATES = {
  PENDIENTE: 'pendiente',
  EN_REVISION: 'en_revision',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
};

const SERVICE_MODALITIES = {
  DOMICILIO: 'domicilio',
  LOCAL: 'local',
  AMBOS: 'ambos',
};

const BOOKING_STATES = {
  BUSCANDO_PROFESIONAL: 'buscando_profesional',
  PENDIENTE_CONFIRMACION: 'pendiente_confirmacion',
  ACEPTADO: 'aceptado',
  EN_CAMINO: 'en_camino',
  LLEGO: 'llego',
  EN_SERVICIO: 'en_servicio',
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado',
  SIN_PROFESIONAL: 'sin_profesional',
};

const VALID_STATE_TRANSITIONS = {
  [BOOKING_STATES.BUSCANDO_PROFESIONAL]: [
    BOOKING_STATES.ACEPTADO,
    BOOKING_STATES.CANCELADO,
    BOOKING_STATES.SIN_PROFESIONAL,
  ],
  [BOOKING_STATES.PENDIENTE_CONFIRMACION]: [
    BOOKING_STATES.ACEPTADO,
    BOOKING_STATES.CANCELADO,
  ],
  [BOOKING_STATES.ACEPTADO]: [
    BOOKING_STATES.EN_CAMINO,
    BOOKING_STATES.LLEGO,
    BOOKING_STATES.CANCELADO,
  ],
  [BOOKING_STATES.EN_CAMINO]: [
    BOOKING_STATES.LLEGO,
    BOOKING_STATES.CANCELADO,
  ],
  [BOOKING_STATES.LLEGO]: [
    BOOKING_STATES.EN_SERVICIO,
    BOOKING_STATES.CANCELADO,
  ],
  [BOOKING_STATES.EN_SERVICIO]: [
    BOOKING_STATES.FINALIZADO,
  ],
  [BOOKING_STATES.FINALIZADO]: [],
  [BOOKING_STATES.CANCELADO]: [],
  [BOOKING_STATES.SIN_PROFESIONAL]: [
    BOOKING_STATES.BUSCANDO_PROFESIONAL,
    BOOKING_STATES.CANCELADO,
  ],
};

/**
 * Formatea un número entero a Peso Colombiano: $10.000
 */
function formatCOP(monto) {
  const numero = Math.round(Number(monto) || 0);
  const signo = numero < 0 ? '-' : '';
  const absoluto = Math.abs(numero);
  const conPuntos = absoluto.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${signo}$${conPuntos}`;
}

/**
 * Calcula la comisión del 10% sobre el valor del servicio en COP
 */
function calcularComisionCOP(valorServicioCOP) {
  const base = Math.round(Number(valorServicioCOP) || 0);
  if (base <= 0) return 0;
  return Math.round(base * BUSINESS_RULES.COMMISSION_RATE);
}

/**
 * Valida que la recarga sea de mínimo $10.000 COP
 */
function validarRecargaMinima(montoCOP) {
  const monto = Math.round(Number(montoCOP) || 0);
  if (monto < BUSINESS_RULES.MIN_RECHARGE_COP) {
    return {
      valido: false,
      mensaje: `El monto mínimo de recarga es de ${formatCOP(BUSINESS_RULES.MIN_RECHARGE_COP)} COP. Intentaste recargar ${formatCOP(monto)} COP.`,
    };
  }
  return { valido: true };
}

/**
 * Verifica si el saldo del profesional cubre el 10% de comisión
 */
function verificarCoberturaComision(saldoDisponibleCOP, valorServicioCOP) {
  const saldo = Math.round(Number(saldoDisponibleCOP) || 0);
  const comision = calcularComisionCOP(valorServicioCOP);
  const cubre = saldo >= comision;
  return {
    cubre,
    comisionRequeridaCOP: comision,
    comisionFormateada: formatCOP(comision),
    saldoActualCOP: saldo,
    saldoFormateado: formatCOP(saldo),
    saldoRestanteCOP: cubre ? saldo - comision : saldo,
    faltanteCOP: cubre ? 0 : comision - saldo,
  };
}

/**
 * Funciones geoespaciales compatibles con PostGIS (SRID 4326) y Google Maps
 */
function gradosARadianes(grados) {
  return (grados * Math.PI) / 180;
}

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371;
  const dLat = gradosARadianes(lat2 - lat1);
  const dLon = gradosARadianes(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(gradosARadianes(lat1)) *
      Math.cos(gradosARadianes(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

function calcularETAMinutos(distanciaKm) {
  const dist = Number(distanciaKm) || 0;
  if (dist <= 0.15) return 1;
  return Math.max(3, Math.round((dist / 22) * 60 + 2));
}

function generarPuntosRuta(origenLat, origenLng, destinoLat, destinoLng, pasos = 8) {
  const puntos = [];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    const offsetCalle = Math.sin(t * Math.PI) * 0.0006;
    puntos.push({
      latitude: Number((origenLat + (destinoLat - origenLat) * t + offsetCalle).toFixed(6)),
      longitude: Number((origenLng + (destinoLng - origenLng) * t - offsetCalle).toFixed(6)),
    });
  }
  return puntos;
}

function aPostGISPoint(latitud, longitud) {
  return `SRID=4326;POINT(${Number(longitud)} ${Number(latitud)})`;
}

module.exports = {
  BUSINESS_RULES,
  ROLES,
  VERIFICATION_STATES,
  SERVICE_MODALITIES,
  BOOKING_STATES,
  VALID_STATE_TRANSITIONS,
  formatCOP,
  calcularComisionCOP,
  validarRecargaMinima,
  verificarCoberturaComision,
  calcularDistanciaKm,
  calcularETAMinutos,
  generarPuntosRuta,
  aPostGISPoint,
};
