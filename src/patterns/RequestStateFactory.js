/**
 * PATRÓN DE DISEÑO: FACTORY METHOD + STATE MACHINE
 * Centraliza los 9 estados oficiales y valida estrictamente las transiciones permitidas
 * (impidiendo que el profesional confirme unilateralmente sin aprobación del cliente).
 */
export const ESTADOS_SOLICITUD_OFICIALES = {
  PENDIENTE_ACEPTACION_PRO: 'pendiente_aceptacion_profesional',
  ACEPTADA_POR_PRO: 'aceptada_por_profesional',
  RECHAZADA_POR_PRO: 'rechazada_por_profesional',
  PENDIENTE_CONFIRMACION_CLIENTE: 'pendiente_confirmacion_cliente',
  CONFIRMADA_POR_CLIENTE: 'confirmada_por_cliente',
  EN_CAMINO: 'en_camino',
  EN_SERVICIO: 'en_servicio',
  FINALIZADA: 'finalizada',
  CANCELADA: 'cancelada',
};

export const ESTADOS_DOMICILIO_ACTIVOS = [
  ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_ACEPTACION_PRO,
  ESTADOS_SOLICITUD_OFICIALES.ACEPTADA_POR_PRO,
  ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_CONFIRMACION_CLIENTE,
  ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE,
  ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO,
  ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO,
];

const TRANSICIONES_VALIDAS = {
  [ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_ACEPTACION_PRO]: [
    ESTADOS_SOLICITUD_OFICIALES.ACEPTADA_POR_PRO,
    ESTADOS_SOLICITUD_OFICIALES.RECHAZADA_POR_PRO,
    ESTADOS_SOLICITUD_OFICIALES.CANCELADA,
  ],
  [ESTADOS_SOLICITUD_OFICIALES.ACEPTADA_POR_PRO]: [
    ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE,
    ESTADOS_SOLICITUD_OFICIALES.CANCELADA,
  ],
  [ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_CONFIRMACION_CLIENTE]: [
    ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE,
    ESTADOS_SOLICITUD_OFICIALES.CANCELADA,
  ],
  [ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE]: [
    ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO,
    ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO,
    ESTADOS_SOLICITUD_OFICIALES.CANCELADA,
  ],
  [ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO]: [
    ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO,
    ESTADOS_SOLICITUD_OFICIALES.CANCELADA,
  ],
  [ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO]: [
    ESTADOS_SOLICITUD_OFICIALES.FINALIZADA,
  ],
};

export function formatearEtiquetaEstado(estado) {
  const mapa = {
    pendiente_aceptacion_profesional: 'Pendiente de aceptación del profesional',
    aceptada_por_profesional: 'Aceptada por el profesional (Pendiente confirmación)',
    pendiente_confirmacion_cliente: 'Pendiente de confirmación del cliente',
    rechazada_por_profesional: 'Rechazada por el profesional',
    confirmada_por_cliente: 'Confirmada por el cliente',
    en_camino: 'En camino',
    en_servicio: 'En servicio',
    finalizada: 'Finalizada',
    cancelada: 'Cancelada',
  };
  return mapa[estado] || String(estado || '').replace(/_/g, ' ');
}

export class RequestStateFactory {
  static canTransition(currentState, nextState) {
    const allowed = TRANSICIONES_VALIDAS[currentState] || [];
    return allowed.includes(nextState);
  }
}
