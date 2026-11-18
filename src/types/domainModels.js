/**
 * Archivo: src/types/domainModels.js
 * Modelos de Dominio y Contratos de Datos (Módulos 1 al 12):
 * - Autenticación Unificada y Roles (CLIENT, PROFESSIONAL, ADMIN)
 * - Estados de Aprobación Profesional (INCOMPLETE, PENDING, APPROVED, REJECTED, SUSPENDED)
 * - Tipos de Movimiento de Billetera y Comisiones por Etapa (3% Confirmación + 7% Inicio)
 * - Tipos de Notificación y Mapa de Resolución de Rutas
 */

export const USER_ROLES = Object.freeze({
  CLIENT: 'CLIENT',
  PROFESSIONAL: 'PROFESSIONAL',
  ADMIN: 'ADMIN',
});

export const APP_MODES = Object.freeze({
  CLIENT: 'cliente',
  PROFESSIONAL: 'profesional',
});

export const PROFESSIONAL_APPROVAL_STATUS = Object.freeze({
  INCOMPLETE: 'INCOMPLETE',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
});

export const WALLET_TRANSACTION_TYPES = Object.freeze({
  RECHARGE: 'RECHARGE',
  COMMISSION_STAGE_1_3PCT: 'COMMISSION_STAGE_1_3PCT',
  COMMISSION_STAGE_2_7PCT: 'COMMISSION_STAGE_2_7PCT',
  COMMISSION_REFUND: 'COMMISSION_REFUND',
  ADMIN_ADJUSTMENT: 'ADMIN_ADJUSTMENT',
});

export const WOMPI_PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  VOIDED: 'VOIDED',
  ERROR: 'ERROR',
});

export const COMMISSION_RATES = Object.freeze({
  TOTAL_PCT: 0.10, // 10% total
  STAGE_1_CONFIRM_PCT: 0.03, // 3% al confirmar contratación
  STAGE_2_START_PCT: 0.07, // 7% al iniciar el servicio
});

/**
 * Calcula el desglose exacto de comisión en pesos colombianos (COP enteros):
 * Ejemplo: $7.000 COP -> Total 10% ($700) = Etapa 1: 3% ($210) + Etapa 2: 7% ($490)
 */
export function calcularDesgloseComisionEtapas(precioTotalCop) {
  const base = Math.max(0, Math.round(Number(precioTotalCop) || 0));
  const total10 = Math.round(base * COMMISSION_RATES.TOTAL_PCT);
  const etapa1_3pct = Math.round(base * COMMISSION_RATES.STAGE_1_CONFIRM_PCT);
  const etapa2_7pct = Math.max(0, total10 - etapa1_3pct);
  return {
    precio_total_cop: base,
    comision_total_cop: total10,
    comision_etapa1_cop: etapa1_3pct,
    comision_etapa2_cop: etapa2_7pct,
    porcentaje_total: 10,
    porcentaje_etapa1: 3,
    porcentaje_etapa2: 7,
  };
}

export const NOTIFICATION_TYPES = Object.freeze({
  // Clientes
  CLIENT_REQUEST_SENT: 'CLIENT_REQUEST_SENT',
  CLIENT_PRO_ACCEPTED: 'CLIENT_PRO_ACCEPTED',
  CLIENT_PRO_REJECTED: 'CLIENT_PRO_REJECTED',
  CLIENT_BOOKING_CONFIRMED: 'CLIENT_BOOKING_CONFIRMED',
  CLIENT_PRO_EN_ROUTE: 'CLIENT_PRO_EN_ROUTE',
  CLIENT_PRO_ARRIVING_SOON: 'CLIENT_PRO_ARRIVING_SOON',
  CLIENT_PRO_ARRIVED: 'CLIENT_PRO_ARRIVED',
  CLIENT_SERVICE_STARTED: 'CLIENT_SERVICE_STARTED',
  CLIENT_SERVICE_COMPLETED: 'CLIENT_SERVICE_COMPLETED',
  CLIENT_BOOKING_CANCELLED: 'CLIENT_BOOKING_CANCELLED',
  CLIENT_NEW_MESSAGE: 'CLIENT_NEW_MESSAGE',
  CLIENT_REMINDER: 'CLIENT_REMINDER',
  // Profesionales
  PRO_NEW_REQUEST: 'PRO_NEW_REQUEST',
  PRO_CLIENT_CONFIRMED: 'PRO_CLIENT_CONFIRMED',
  PRO_BOOKING_CANCELLED: 'PRO_BOOKING_CANCELLED',
  PRO_APPOINTMENT_REMINDER: 'PRO_APPOINTMENT_REMINDER',
  PRO_CLIENT_STARTED_SERVICE: 'PRO_CLIENT_STARTED_SERVICE',
  PRO_NEW_RATING: 'PRO_NEW_RATING',
  PRO_RECHARGE_APPROVED: 'PRO_RECHARGE_APPROVED',
  PRO_RECHARGE_REJECTED: 'PRO_RECHARGE_REJECTED',
  PRO_COMMISSION_DEDUCTED: 'PRO_COMMISSION_DEDUCTED',
  PRO_INSUFFICIENT_BALANCE: 'PRO_INSUFFICIENT_BALANCE',
});
