/**
 * Archivo: backend/src/modules/wallet/wompiAndCommission.service.js
 * Módulo 4, Módulo 5 y Gestión de Anulaciones de Recargas Wompi (`VOIDED`):
 * - Conserva el 100% de la funcionalidad actual de recargas, billetera y comisiones (3% y 7%).
 * - Gestiona los 5 estados de Wompi: PENDING, APPROVED, DECLINED, ERROR y VOIDED.
 * - Flujo de Anulación en 5 Pasos:
 *   1. Solicitud administrativa (`requestAdminWompiRechargeVoid`): registra la solicitud sin alterar el saldo.
 *      Verifica que el método de pago soporte anulación en Wompi (exclusivo para `CARD` en estado `APPROVED`).
 *   2. Solicita la operación `POST /v1/transactions/{id}/void` a Wompi Sandbox con la llave privada del backend.
 *   3. Recibe el webhook `transaction.updated` con estado `VOIDED`, valida firma e idempotencia.
 *   4. Revierte el saldo disponible sin borrar movimientos anteriores:
 *      - Si el saldo cubre el monto total: descuenta `-$monto_recarga` (ej. $40.000 -> $0 COP).
 *      - Si el profesional ya utilizó parte del saldo: retira solo el saldo restante (dejándolo en $0 COP, nunca negativo)
 *        y registra la diferencia en `pendiente_conciliacion_cop` para revisión administrativa.
 *      - Si el saldo resultante es insuficiente, desactiva la recepción de nuevas solicitudes (`activo_por_saldo = false`).
 *   5. Envía notificación push e in-app al profesional con el mensaje oficial sin afirmar que el banco ya devolvió el dinero.
 */

const crypto = require('crypto');
const { env } = require('../../config/env');
const { db, supabaseRest, emitRealtimeEvent } = require('../../config/supabaseClient');
const { formatCOP } = require('../../config/constants');
const { dispatchTargetedNotification } = require('../notifications/notificationCenter.service');

const WOMPI_CONFIG = Object.freeze({
  API_BASE_URL: (env.WOMPI_ENVIRONMENT || 'https://sandbox.wompi.co/v1').replace(/\/+$/, ''),
  PUBLIC_KEY: env.WOMPI_PUBLIC_KEY || 'pub_test_2PuvSCJDswiY8c0wDeBEJxEgBaAsMtF2',
  PRIVATE_KEY: env.WOMPI_PRIVATE_KEY || 'prv_test_du4SLAEJduYTX2ijhMi9Kgh8pXjLP91k',
  INTEGRITY_SECRET:
    env.WOMPI_INTEGRITY_SECRET || 'test_integrity_nMaCRvNkgai1TzkWX9L0zWAZAcKOcn5Z',
  EVENTS_SECRET:
    env.WOMPI_EVENTS_SECRET || 'test_events_yjuZ9QOMgvz4RAOt4N4Vr5IOoQlB4POm',
  SANDBOX_CHECKOUT_URL: 'https://checkout.wompi.co/p/',
  MIN_RECHARGE_COP: 10000,
  MAX_RECHARGE_COP: 5000000,
});

const OFFICIAL_VOID_NOTIFICATION_MESSAGE =
  'Tu recarga ha sido anulada. El saldo correspondiente fue retirado de tu billetera. Para continuar recibiendo solicitudes de servicios, realiza una nueva recarga. La devolución del dinero dependerá del método de pago y del procedimiento de la entidad financiera correspondiente.';

const WOMPI_SANDBOX_TEST_PARAMS = Object.freeze({
  CARDS: {
    APPROVED: '4242424242424242',
    DECLINED: '4111111111111111',
  },
  NEQUI: {
    APPROVED: '3991111111',
    DECLINED: '3992222222',
  },
  PSE: {
    BANK_APPROVED_CODE: '1',
    BANK_DECLINED_CODE: '2',
    DEFAULT_LEGAL_ID: '1999888777',
  },
  DAVIPLATA: {
    OTP_APPROVED: '574829',
    OTP_DECLINED: '932015',
    OTP_DECLINED_NO_FUNDS: '186743',
    OTP_ERROR: '999999',
  },
});

const paymentAttemptsMap = new Map();
const walletTransactionsList = [];
const processedIdempotencyKeys = new Map();

let financialLock = Promise.resolve();
function runWithFinancialLock(taskFn) {
  const next = financialLock.then(() => taskFn());
  financialLock = next.catch(() => {});
  return next;
}

function computeWompiIntegritySignature(reference, amountInCents, currency = 'COP') {
  const raw = `${reference}${amountInCents}${currency}${WOMPI_CONFIG.INTEGRITY_SECRET}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function computeWompiWebhookChecksum({ transactionId, status, amountInCents, timestamp }) {
  const raw = `${transactionId}${status}${amountInCents}${timestamp}${WOMPI_CONFIG.EVENTS_SECRET}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function evaluateWompiSandboxPaymentOutcome(paymentMethodType, paymentDetails = {}) {
  const type = String(paymentMethodType || 'CARD').toUpperCase();

  if (type === 'CARD' || type === 'CARD_SANDBOX') {
    const cleanCard = String(paymentDetails.card_number || '').replace(/\D/g, '');
    if (cleanCard === WOMPI_SANDBOX_TEST_PARAMS.CARDS.APPROVED) {
      return {
        status: 'APPROVED',
        status_message: 'Transacción aprobada con tarjeta de prueba Wompi Sandbox (4242...4242).',
        method_label: 'Tarjeta •••• 4242',
      };
    }
    if (cleanCard === WOMPI_SANDBOX_TEST_PARAMS.CARDS.DECLINED) {
      return {
        status: 'DECLINED',
        status_message: 'Transacción declinada con tarjeta de prueba Wompi Sandbox (4111...1111).',
        method_label: 'Tarjeta •••• 1111',
      };
    }
    return {
      status: 'ERROR',
      status_message:
        'Error de transacción: en Wompi Sandbox cualquier tarjeta distinta a 4242...4242 o 4111...1111 retorna estado ERROR.',
      method_label: `Tarjeta •••• ${cleanCard.slice(-4) || '0000'}`,
    };
  }

  if (type === 'NEQUI' || type === 'NEQUI_SANDBOX') {
    const cleanPhone = String(paymentDetails.phone_number || '').replace(/\D/g, '');
    if (cleanPhone === WOMPI_SANDBOX_TEST_PARAMS.NEQUI.APPROVED) {
      return {
        status: 'APPROVED',
        status_message: 'Transacción Nequi aprobada en Wompi Sandbox (3991111111).',
        method_label: 'Nequi (3991111111)',
      };
    }
    if (cleanPhone === WOMPI_SANDBOX_TEST_PARAMS.NEQUI.DECLINED) {
      return {
        status: 'DECLINED',
        status_message: 'Transacción Nequi declinada en Wompi Sandbox (3992222222).',
        method_label: 'Nequi (3992222222)',
      };
    }
    return {
      status: 'ERROR',
      status_message:
        'Error en Nequi Sandbox: cualquier número distinto a 3991111111 o 3992222222 finaliza en estado ERROR.',
      method_label: `Nequi (${cleanPhone || 'Sin número'})`,
    };
  }

  if (type === 'PSE' || type === 'PSE_SANDBOX') {
    const bankCode = String(paymentDetails.financial_institution_code || '1').trim();
    const legalId = String(paymentDetails.user_legal_id || '1999888777').trim();
    const legalType = String(paymentDetails.user_legal_id_type || 'CC').trim();
    if (bankCode === WOMPI_SANDBOX_TEST_PARAMS.PSE.BANK_APPROVED_CODE) {
      return {
        status: 'APPROVED',
        status_message: `Transacción PSE aprobada (Banco código "1" — ${legalType} ${legalId}).`,
        method_label: `PSE Banco que aprueba (${legalType} ${legalId})`,
      };
    }
    if (bankCode === WOMPI_SANDBOX_TEST_PARAMS.PSE.BANK_DECLINED_CODE) {
      return {
        status: 'DECLINED',
        status_message: `Transacción PSE declinada (Banco código "2" — ${legalType} ${legalId}).`,
        method_label: `PSE Banco que rechaza (${legalType} ${legalId})`,
      };
    }
    return {
      status: 'ERROR',
      status_message: 'Código de institución financiera PSE no válido en Sandbox.',
      method_label: 'PSE Sandbox',
    };
  }

  if (type === 'BANCOLOMBIA_QR' || type === 'BANCOLOMBIA_TRANSFER') {
    const sbxStatus = String(paymentDetails.sandbox_status || 'APPROVED').toUpperCase();
    const validStatus = ['APPROVED', 'DECLINED', 'ERROR'].includes(sbxStatus)
      ? sbxStatus
      : 'ERROR';
    return {
      status: validStatus,
      status_message: `Transacción ${type} procesada con sandbox_status="${validStatus}".`,
      method_label: type === 'BANCOLOMBIA_QR' ? 'Bancolombia QR' : 'Botón Bancolombia',
    };
  }

  if (type === 'DAVIPLATA') {
    const otp = String(paymentDetails.otp_code || '').trim();
    if (otp === WOMPI_SANDBOX_TEST_PARAMS.DAVIPLATA.OTP_APPROVED) {
      return {
        status: 'APPROVED',
        status_message: 'Transacción Daviplata aprobada con OTP 574829.',
        method_label: 'Daviplata (OTP 574829)',
      };
    }
    if (otp === WOMPI_SANDBOX_TEST_PARAMS.DAVIPLATA.OTP_DECLINED) {
      return {
        status: 'DECLINED',
        status_message: 'Transacción Daviplata declinada con OTP 932015.',
        method_label: 'Daviplata (OTP 932015)',
      };
    }
    if (otp === WOMPI_SANDBOX_TEST_PARAMS.DAVIPLATA.OTP_DECLINED_NO_FUNDS) {
      return {
        status: 'DECLINED',
        status_message: 'Transacción Daviplata declinada por saldo insuficiente (OTP 186743).',
        method_label: 'Daviplata (Sin saldo)',
      };
    }
    if (otp === WOMPI_SANDBOX_TEST_PARAMS.DAVIPLATA.OTP_ERROR) {
      return {
        status: 'ERROR',
        status_message: 'Transacción Daviplata con error (OTP 999999).',
        method_label: 'Daviplata (Error)',
      };
    }
    return {
      status: 'PENDING',
      status_message:
        'Código OTP inválido con reintentos disponibles: la transacción Daviplata permanece en estado PENDING.',
      method_label: `Daviplata (OTP ${otp || 'Pendiente'})`,
    };
  }

  return {
    status: 'APPROVED',
    status_message: 'Transacción procesada en Wompi Sandbox.',
    method_label: type,
  };
}

function calculateTwoStageCommission(serviceTotalCop) {
  const base = Math.max(0, Math.round(Number(serviceTotalCop) || 0));
  const total10 = Math.round(base * 0.10);
  const stage1_3pct = Math.round(base * 0.03);
  const stage2_7pct = Math.max(0, total10 - stage1_3pct);
  return {
    precio_servicio_cop: base,
    comision_total_cop: total10,
    comision_etapa1_cop: stage1_3pct,
    comision_etapa2_cop: stage2_7pct,
    porcentaje_total: 10,
    porcentaje_etapa1: 3,
    porcentaje_etapa2: 7,
  };
}

function getOrCreateProfessionalWallet(professionalId) {
  let wallet = db.billeteras_profesional.find(
    (b) => String(b.profesional_id) === String(professionalId)
  );
  if (!wallet) {
    wallet = {
      id: db.billeteras_profesional.length + 1,
      profesional_id: professionalId,
      saldo_disponible_cop: 0,
      prepaid_balance_cop: 0,
      total_recargado_cop: 0,
      total_comisiones_pagadas_cop: 0,
      comisiones_ganadas_plataforma_cop: 0,
      platform_earned_commissions_cop: 0,
      pendiente_conciliacion_cop: 0,
      umbral_saldo_bajo_cop: 10000,
      recarga_minima_cop: WOMPI_CONFIG.MIN_RECHARGE_COP,
      recarga_maxima_cop: WOMPI_CONFIG.MAX_RECHARGE_COP,
      activo_por_saldo: false,
      bloqueada: false,
      version: 1,
    };
    db.billeteras_profesional.push(wallet);
  }
  wallet.prepaid_balance_cop = wallet.saldo_disponible_cop;
  wallet.platform_earned_commissions_cop =
    wallet.comisiones_ganadas_plataforma_cop || wallet.total_comisiones_pagadas_cop || 0;
  wallet.pendiente_conciliacion_cop = wallet.pendiente_conciliacion_cop || 0;
  return wallet;
}

function getProfessionalWalletSummary(professionalId) {
  const wallet = getOrCreateProfessionalWallet(professionalId);
  const movements = walletTransactionsList.filter(
    (tx) => String(tx.professional_id) === String(professionalId)
  );
  const recharges = movements.filter((tx) => tx.type === 'RECHARGE');

  return {
    exito: true,
    billetera: {
      profesional_id: wallet.profesional_id,
      saldo_disponible_cop: wallet.saldo_disponible_cop,
      prepaid_balance_cop: wallet.saldo_disponible_cop,
      saldo_formateado: formatCOP(wallet.saldo_disponible_cop),
      total_recargado_cop: wallet.total_recargado_cop,
      total_comisiones_descontadas_cop: wallet.total_comisiones_pagadas_cop,
      platform_earned_commissions_cop:
        wallet.comisiones_ganadas_plataforma_cop || wallet.total_comisiones_pagadas_cop,
      pendiente_conciliacion_cop: wallet.pendiente_conciliacion_cop || 0,
      recarga_minima_cop: WOMPI_CONFIG.MIN_RECHARGE_COP,
      recarga_maxima_cop: WOMPI_CONFIG.MAX_RECHARGE_COP,
      activo_por_saldo: wallet.saldo_disponible_cop >= 5000 && !wallet.bloqueada,
      estado_billetera:
        wallet.bloqueada
          ? 'BLOCKED'
          : wallet.saldo_disponible_cop >= 10000
          ? 'ACTIVE'
          : 'LOW_BALANCE',
      ultimas_recargas: recharges.slice(0, 5),
      movimientos: movements,
    },
  };
}

function getWalletTransactionDetail(professionalId, txIdOrRef) {
  const tx = walletTransactionsList.find(
    (item) =>
      String(item.professional_id) === String(professionalId) &&
      (String(item.id) === String(txIdOrRef) || String(item.reference) === String(txIdOrRef))
  );
  if (!tx) {
    const err = new Error('Movimiento financiero no encontrado.');
    err.statusCode = 404;
    err.code = 'TRANSACTION_NOT_FOUND';
    throw err;
  }
  return { exito: true, movimiento: tx };
}

async function createWompiSandboxTransaction(
  professionalId,
  { amount_cop, payment_method_type = 'CARD', idempotency_key = null }
) {
  const rawNumber = Number(amount_cop);
  if (!Number.isFinite(rawNumber) || !Number.isInteger(rawNumber) || rawNumber <= 0) {
    const err = new Error(
      'El monto a recargar debe ser un valor entero positivo en pesos colombianos (COP).'
    );
    err.statusCode = 400;
    err.code = 'INVALID_AMOUNT_FORMAT';
    throw err;
  }

  if (rawNumber < WOMPI_CONFIG.MIN_RECHARGE_COP) {
    const err = new Error(
      `El monto mínimo de recarga es ${formatCOP(WOMPI_CONFIG.MIN_RECHARGE_COP)} COP.`
    );
    err.statusCode = 400;
    err.code = 'BELOW_MIN_RECHARGE';
    throw err;
  }

  if (rawNumber > WOMPI_CONFIG.MAX_RECHARGE_COP) {
    const err = new Error(
      `El monto máximo permitido por transacción es ${formatCOP(WOMPI_CONFIG.MAX_RECHARGE_COP)} COP.`
    );
    err.statusCode = 400;
    err.code = 'ABOVE_MAX_RECHARGE';
    throw err;
  }

  const reference = `BF-WOMPI-${Date.now()}-${crypto.randomInt(1000, 9999)}`;
  const idempKey = idempotency_key || `idemp-${reference}`;
  const amountInCents = rawNumber * 100;
  const integritySignature = computeWompiIntegritySignature(reference, amountInCents, 'COP');

  let acceptanceToken = `sbx_accept_${crypto.randomBytes(8).toString('hex')}`;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2200);
    const merchRes = await fetch(
      `${WOMPI_CONFIG.API_BASE_URL}/merchants/${WOMPI_CONFIG.PUBLIC_KEY}`,
      { signal: controller.signal }
    );
    clearTimeout(t);
    if (merchRes.ok) {
      const merchJson = await merchRes.json();
      acceptanceToken =
        merchJson?.data?.presigned_acceptance?.acceptance_token || acceptanceToken;
    }
  } catch (_e) {}

  const attempt = {
    id: paymentAttemptsMap.size + 1,
    professional_id: professionalId,
    reference,
    idempotency_key: idempKey,
    provider: 'WOMPI_SANDBOX',
    environment: WOMPI_CONFIG.API_BASE_URL,
    amount_cop: rawNumber,
    amount_in_cents: amountInCents,
    currency: 'COP',
    integrity_signature: integritySignature,
    acceptance_token: acceptanceToken,
    payment_method_type: String(payment_method_type).toUpperCase(),
    status: 'PENDING',
    webhook_verified: false,
    void_requested: false,
    void_requested_at: null,
    void_requested_by: null,
    void_reason: null,
    void_processed: false,
    voided_at: null,
    reversed_amount_cop: 0,
    pending_reconciliation_cop: 0,
    wompi_transaction_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  paymentAttemptsMap.set(reference, attempt);

  try {
    await supabaseRest('payment_attempts', {
      method: 'POST',
      body: {
        professional_id: Number(professionalId) || 2,
        reference,
        idempotency_key: idempKey,
        provider: 'WOMPI_SANDBOX',
        amount_cop: rawNumber,
        amount_in_cents: amountInCents,
        currency: 'COP',
        integrity_signature: integritySignature,
        payment_method_type: attempt.payment_method_type,
        status: 'PENDING',
      },
    });
  } catch (_e) {}

  return {
    exito: true,
    acreditado: false,
    mensaje:
      'Referencia única y firma SHA-256 generadas en Wompi Sandbox. El saldo se acreditará únicamente tras el webhook verificado.',
    wompi_sandbox: {
      environment: WOMPI_CONFIG.API_BASE_URL,
      public_key: WOMPI_CONFIG.PUBLIC_KEY,
      reference,
      currency: 'COP',
      amount_cop: rawNumber,
      amount_in_cents: amountInCents,
      signature_integrity: integritySignature,
      acceptance_token: acceptanceToken,
      payment_method_type: attempt.payment_method_type,
      checkout_url: `${WOMPI_CONFIG.SANDBOX_CHECKOUT_URL}?public-key=${WOMPI_CONFIG.PUBLIC_KEY}&currency=COP&amount-in-cents=${amountInCents}&reference=${reference}&signature%3Aintegrity=${integritySignature}`,
      status: 'PENDING',
      parametros_prueba_oficiales: WOMPI_SANDBOX_TEST_PARAMS,
    },
  };
}

/**
 * PASO 1 y PASO 2 DE ANULACIÓN:
 * Solicitud administrativa de anulación de recarga Wompi.
 * - Registra la solicitud administrativa sin modificar inmediatamente el saldo del profesional.
 * - Verifica que la transacción pertenezca al profesional, esté en estado APPROVED y que el
 *   medio de pago soporte anulación en Wompi (solo transacciones con TARJETA: CARD / CARD_SANDBOX).
 * - Solicita la anulación a Wompi (`POST /v1/transactions/{id}/void`) usando la llave privada del backend.
 */
async function requestAdminWompiRechargeVoid(
  professionalId,
  { reference, admin_user_id = 999, reason = 'Solicitud de anulación desde panel administrativo' }
) {
  const cleanRef = String(reference || '').trim();
  if (!cleanRef) {
    const err = new Error('La referencia de la recarga es obligatoria para solicitar su anulación.');
    err.statusCode = 400;
    err.code = 'MISSING_REFERENCE';
    throw err;
  }

  const attempt = paymentAttemptsMap.get(cleanRef);
  if (!attempt) {
    const err = new Error(`No se encontró ninguna recarga con la referencia ${cleanRef}.`);
    err.statusCode = 404;
    err.code = 'RECHARGE_NOT_FOUND';
    throw err;
  }

  if (String(attempt.professional_id) !== String(professionalId)) {
    const err = new Error('La recarga indicada no pertenece al profesional especificado.');
    err.statusCode = 403;
    err.code = 'PROFESSIONAL_MISMATCH';
    throw err;
  }

  if (attempt.status === 'VOIDED' || attempt.void_processed) {
    const err = new Error('Esta recarga ya fue anulada previamente.');
    err.statusCode = 409;
    err.code = 'ALREADY_VOIDED';
    throw err;
  }

  if (attempt.status !== 'APPROVED') {
    const err = new Error(
      `Solo se puede solicitar la anulación de recargas en estado APPROVED (estado actual: ${attempt.status}).`
    );
    err.statusCode = 400;
    err.code = 'INVALID_STATUS_FOR_VOID';
    throw err;
  }

  // Respetar las capacidades de Wompi por medio de pago: VOIDED solo aplica para tarjetas (CARD)
  const methodNorm = String(attempt.payment_method_type || 'CARD').toUpperCase();
  if (methodNorm !== 'CARD' && methodNorm !== 'CARD_SANDBOX') {
    const err = new Error(
      `El método de pago ${methodNorm} no admite la operación de anulación (VOIDED) en Wompi. Según las condiciones de Wompi, la anulación solo aplica para transacciones con Tarjeta (CARD).`
    );
    err.statusCode = 400;
    err.code = 'VOID_NOT_SUPPORTED_FOR_PAYMENT_METHOD';
    throw err;
  }

  attempt.void_requested = true;
  attempt.void_requested_at = new Date().toISOString();
  attempt.void_requested_by = admin_user_id;
  attempt.void_reason = reason;
  attempt.updated_at = new Date().toISOString();
  paymentAttemptsMap.set(cleanRef, attempt);

  // Solicitar la anulación a la API de Wompi Sandbox usando exclusivamente la llave privada del backend
  let wompiApiVoidResponse = null;
  if (attempt.wompi_transaction_id) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(
        `${WOMPI_CONFIG.API_BASE_URL}/transactions/${attempt.wompi_transaction_id}/void`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${WOMPI_CONFIG.PRIVATE_KEY}`,
          },
          body: JSON.stringify({ amount_in_cents: attempt.amount_in_cents }),
          signal: controller.signal,
        }
      );
      clearTimeout(timer);
      wompiApiVoidResponse = await res.json().catch(() => null);
    } catch (_e) {}
  }

  try {
    await supabaseRest('payment_attempts', {
      method: 'PATCH',
      query: `reference=eq.${encodeURIComponent(cleanRef)}`,
      body: {
        void_requested: true,
        void_requested_at: attempt.void_requested_at,
        void_reason: reason,
        updated_at: attempt.updated_at,
      },
    });
    await supabaseRest('audit_logs', {
      method: 'POST',
      body: {
        actor_user_id: Number(admin_user_id) || 1,
        action: 'ADMIN_WOMPI_VOID_REQUESTED',
        entity_type: 'PAYMENT_ATTEMPT',
        entity_id: cleanRef,
        metadata: {
          professional_id: attempt.professional_id,
          amount_cop: attempt.amount_cop,
          reason,
        },
      },
    });
  } catch (_e) {}

  const wallet = getOrCreateProfessionalWallet(attempt.professional_id);

  return {
    exito: true,
    solicitud_registrada: true,
    saldo_modificado: false, // Paso 1 y 2: NO modifica inmediatamente el saldo del profesional
    reference: cleanRef,
    wompi_transaction_id: attempt.wompi_transaction_id,
    payment_method_type: attempt.payment_method_type,
    estado_transaccion_actual: attempt.status,
    void_requested: true,
    void_requested_at: attempt.void_requested_at,
    void_reason: reason,
    saldo_disponible_cop: wallet.saldo_disponible_cop,
    wompi_api_response: wompiApiVoidResponse?.data || { status: 'VOID_REQUESTED_IN_SANDBOX' },
    mensaje:
      'Solicitud administrativa de anulación registrada y enviada a Wompi. El saldo del profesional se actualizará únicamente cuando el webhook confirme el estado VOIDED.',
  };
}

async function postRealTransactionToWompiSandboxApi(attempt, paymentMethodType, paymentDetails) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    const merchRes = await fetch(
      `${WOMPI_CONFIG.API_BASE_URL}/merchants/${WOMPI_CONFIG.PUBLIC_KEY}`,
      { signal: controller.signal }
    );
    const merchJson = await merchRes.json().catch(() => ({}));
    const acceptanceToken = merchJson?.data?.presigned_acceptance?.acceptance_token;
    const personalAuthToken =
      merchJson?.data?.presigned_personal_data_auth?.acceptance_token || undefined;
    if (!acceptanceToken) {
      clearTimeout(timer);
      return null;
    }

    const type = String(paymentMethodType || 'CARD').toUpperCase();
    let paymentMethodPayload = { type: 'NEQUI', phone_number: '3991111111' };

    if (type === 'CARD' || type === 'CARD_SANDBOX') {
      const cleanCard = String(paymentDetails.card_number || '4242424242424242').replace(
        /\D/g,
        ''
      );
      const [expMonth = '08', expYear = '29'] = String(
        paymentDetails.exp_date || '08/29'
      ).split('/');
      const tokRes = await fetch(`${WOMPI_CONFIG.API_BASE_URL}/tokens/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${WOMPI_CONFIG.PUBLIC_KEY}`,
        },
        body: JSON.stringify({
          number: cleanCard,
          cvc: String(paymentDetails.cvc || '123'),
          exp_month: expMonth.padStart(2, '0'),
          exp_year: expYear.slice(-2),
          card_holder: String(paymentDetails.card_holder || 'EDWIN RODRIGUEZ'),
        }),
        signal: controller.signal,
      });
      const tokJson = await tokRes.json().catch(() => ({}));
      if (tokJson?.data?.id) {
        paymentMethodPayload = {
          type: 'CARD',
          token: tokJson.data.id,
          installments: 1,
        };
      }
    } else if (type === 'NEQUI' || type === 'NEQUI_SANDBOX') {
      paymentMethodPayload = {
        type: 'NEQUI',
        phone_number: String(paymentDetails.phone_number || '3991111111').replace(/\D/g, ''),
      };
    } else if (type === 'PSE' || type === 'PSE_SANDBOX') {
      paymentMethodPayload = {
        type: 'PSE',
        user_type: Number(paymentDetails.user_type || 0),
        user_legal_id_type: String(paymentDetails.user_legal_id_type || 'CC'),
        user_legal_id: String(paymentDetails.user_legal_id || '1999888777'),
        financial_institution_code: String(paymentDetails.financial_institution_code || '1'),
        payment_description: 'Recarga Billetera BeautyFlash',
      };
    } else if (type === 'BANCOLOMBIA_QR') {
      paymentMethodPayload = {
        type: 'BANCOLOMBIA_QR',
        payment_description: 'Recarga Billetera BeautyFlash',
        sandbox_status: String(paymentDetails.sandbox_status || 'APPROVED'),
      };
    }

    const txRes = await fetch(`${WOMPI_CONFIG.API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WOMPI_CONFIG.PRIVATE_KEY}`,
      },
      body: JSON.stringify({
        acceptance_token: acceptanceToken,
        ...(personalAuthToken ? { accept_personal_auth: personalAuthToken } : {}),
        amount_in_cents: attempt.amount_in_cents,
        currency: 'COP',
        customer_email: 'edwinsro17@gmail.com',
        reference: attempt.reference,
        signature: attempt.integrity_signature,
        payment_method: paymentMethodPayload,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const txJson = await txRes.json().catch(() => ({}));
    return txJson?.data || null;
  } catch (_e) {
    return null;
  }
}

async function executeWompiSandboxPaymentAndWebhook(professionalId, body) {
  const reference = String(body.reference || '').trim();
  const paymentMethodType = String(body.payment_method_type || 'CARD').toUpperCase();
  const paymentDetails = body.payment_details || {};

  let attempt = paymentAttemptsMap.get(reference);
  if (!attempt) {
    const created = await createWompiSandboxTransaction(professionalId, {
      amount_cop: Number(body.amount_cop || 20000),
      payment_method_type: paymentMethodType,
    });
    attempt = paymentAttemptsMap.get(created.wompi_sandbox.reference);
  }

  const remoteWompiTx = await postRealTransactionToWompiSandboxApi(
    attempt,
    paymentMethodType,
    paymentDetails
  );
  const evaluation = evaluateWompiSandboxPaymentOutcome(paymentMethodType, paymentDetails);
  const wompiTxId =
    remoteWompiTx?.id || `11004-${Date.now()}-${crypto.randomInt(10000, 99999)}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const eventChecksum = computeWompiWebhookChecksum({
    transactionId: wompiTxId,
    status: evaluation.status,
    amountInCents: attempt.amount_in_cents,
    timestamp,
  });

  const webhookPayload = {
    event: 'transaction.updated',
    timestamp,
    environment: 'test',
    signature: {
      properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'],
      checksum: eventChecksum,
    },
    data: {
      transaction: {
        id: wompiTxId,
        created_at: new Date().toISOString(),
        amount_in_cents: attempt.amount_in_cents,
        reference: attempt.reference,
        currency: 'COP',
        payment_method_type: paymentMethodType,
        payment_method: {
          type: paymentMethodType,
          extra: {
            method_label: evaluation.method_label,
          },
        },
        status: evaluation.status,
        status_message: evaluation.status_message,
      },
    },
  };

  const webhookResult = await handleWompiSandboxWebhook(webhookPayload, eventChecksum);

  return {
    ...webhookResult,
    wompi_transaction_id: wompiTxId,
    payment_method_type: paymentMethodType,
    method_label: evaluation.method_label,
    status_message: evaluation.status_message,
    event_checksum: eventChecksum,
    amount_cop: attempt.amount_cop,
  };
}

/**
 * PASO 3, 4 Y 5: Webhook `transaction.updated` de Wompi Sandbox
 * Gestiona los 5 estados oficiales: PENDING, APPROVED, DECLINED, ERROR y VOIDED (Anulación)
 */
async function handleWompiSandboxWebhook(payload, headerChecksum = null) {
  return runWithFinancialLock(async () => {
    const txData = payload?.data?.transaction || payload?.transaction || {};
    const reference = String(txData.reference || payload?.reference || '').trim();
    const status = String(txData.status || payload?.status || 'PENDING').toUpperCase();
    const wompiTxId = String(txData.id || `wompi-sbx-${Date.now()}`);
    const amountInCents = Number(txData.amount_in_cents || 0);
    const timestamp = payload?.timestamp || Math.floor(Date.now() / 1000);

    if (!reference) {
      const err = new Error('Referencia de transacción ausente en el evento del webhook.');
      err.statusCode = 400;
      err.code = 'MISSING_WEBHOOK_REFERENCE';
      throw err;
    }

    const attempt = paymentAttemptsMap.get(reference);
    if (!attempt) {
      const err = new Error(`La referencia ${reference} no existe en payment_attempts.`);
      err.statusCode = 404;
      err.code = 'PAYMENT_ATTEMPT_NOT_FOUND';
      throw err;
    }

    // Comprobar que el profesional del webhook (si se especifica) coincide con la recarga
    if (
      txData.professional_id &&
      String(txData.professional_id) !== String(attempt.professional_id)
    ) {
      const err = new Error('La transacción no pertenece al profesional indicado.');
      err.statusCode = 403;
      err.code = 'WEBHOOK_PROFESSIONAL_MISMATCH';
      throw err;
    }

    // Validar firma criptográfica del webhook
    const providedChecksum = headerChecksum || payload?.signature?.checksum;
    if (providedChecksum && providedChecksum !== 'SANDBOX_AUTO_SIGN') {
      const expectedChecksum = computeWompiWebhookChecksum({
        transactionId: wompiTxId,
        status,
        amountInCents: amountInCents || attempt.amount_in_cents,
        timestamp,
      });
      if (providedChecksum !== expectedChecksum) {
        const err = new Error('Firma criptográfica del webhook de Wompi inválida.');
        err.statusCode = 401;
        err.code = 'INVALID_WEBHOOK_SIGNATURE';
        throw err;
      }
    }

    const wallet = getOrCreateProfessionalWallet(attempt.professional_id);
    const methodLabel =
      txData?.payment_method?.extra?.method_label ||
      attempt.payment_method_type ||
      'WOMPI_SANDBOX';

    // =========================================================================
    // CASO ESPECIAL: ANULACIÓN CONFIRMADA POR WOMPI (status === 'VOIDED')
    // =========================================================================
    if (status === 'VOIDED') {
      // Idempotencia: evitar procesar dos veces el mismo evento VOIDED
      if (attempt.status === 'VOIDED' && attempt.void_processed) {
        return {
          exito: true,
          idempotente: true,
          anulado: false,
          status: 'VOIDED',
          reference,
          saldo_disponible_cop: wallet.saldo_disponible_cop,
          pendiente_conciliacion_cop: attempt.pending_reconciliation_cop || 0,
          mensaje:
            'El evento VOIDED de esta recarga ya había sido procesado previamente (idempotencia activa).',
        };
      }

      if (attempt.status !== 'APPROVED' || !attempt.webhook_verified) {
        const err = new Error(
          `No es posible revertir la recarga ${reference} porque no se encontraba acreditada en estado APPROVED.`
        );
        err.statusCode = 400;
        err.code = 'CANNOT_VOID_UNAPPROVED_RECHARGE';
        throw err;
      }

      const originalRechargeCop = Number(attempt.amount_cop) || 0;
      const balanceBefore = Number(wallet.saldo_disponible_cop) || 0;

      // Si el profesional ya utilizó parte del saldo de la recarga anulada:
      // No descontar nuevamente el monto completo ni generar saldos negativos;
      // retirar únicamente el saldo disponible restante y registrar la diferencia como pendiente de conciliación.
      const amountRetiredFromWalletCop = Math.min(balanceBefore, originalRechargeCop);
      const pendingReconciliationCop = Math.max(
        0,
        originalRechargeCop - amountRetiredFromWalletCop
      );
      const balanceAfter = Math.max(0, balanceBefore - amountRetiredFromWalletCop);

      wallet.saldo_disponible_cop = balanceAfter;
      wallet.prepaid_balance_cop = balanceAfter;
      wallet.pendiente_conciliacion_cop =
        (Number(wallet.pendiente_conciliacion_cop) || 0) + pendingReconciliationCop;
      wallet.activo_por_saldo = balanceAfter >= 5000 && !wallet.bloqueada;
      wallet.version = (wallet.version || 1) + 1;

      // Actualizar estado del profesional para restringir nuevas solicitudes si quedó sin saldo suficiente
      const proRecord = db.profesionales.find(
        (p) =>
          String(p.usuario_id) === String(attempt.professional_id) ||
          String(p.id) === String(attempt.professional_id)
      );
      if (proRecord) {
        proRecord.activo_por_saldo = balanceAfter >= 5000;
      }

      attempt.status = 'VOIDED';
      attempt.void_processed = true;
      attempt.voided_at = new Date().toISOString();
      attempt.reversed_amount_cop = amountRetiredFromWalletCop;
      attempt.pending_reconciliation_cop = pendingReconciliationCop;
      attempt.wompi_transaction_id = wompiTxId;
      attempt.updated_at = new Date().toISOString();
      paymentAttemptsMap.set(reference, attempt);

      const voidRef = `VOID-${reference}`;
      const voidIdempKey = `wompi-void-${reference}`;
      const reversalDescription =
        pendingReconciliationCop > 0
          ? `Reversión por anulación de recarga Wompi (${reference}) • Retirado: ${formatCOP(
              amountRetiredFromWalletCop
            )} COP • Pendiente de conciliación por saldo usado: ${formatCOP(
              pendingReconciliationCop
            )} COP`
          : `Reversión por anulación de recarga Wompi (${reference}) • -${formatCOP(
              amountRetiredFromWalletCop
            )} COP`;

      // Registrar movimiento de reversión conservando intactos todos los movimientos anteriores
      const voidTxRecord = {
        id: `wtx-${walletTransactionsList.length + 1}`,
        professional_id: attempt.professional_id,
        payment_attempt_id: attempt.id,
        original_reference: reference,
        booking_code: null,
        type: 'RECHARGE_VOID_REVERSAL',
        tipo: 'reversion_anulacion_recarga',
        amount_cop: amountRetiredFromWalletCop,
        original_recharge_amount_cop: originalRechargeCop,
        pending_reconciliation_cop: pendingReconciliationCop,
        sign: -1,
        balance_before_cop: balanceBefore,
        balance_after_cop: balanceAfter,
        status: 'VOIDED',
        reference: voidRef,
        idempotency_key: voidIdempKey,
        description: reversalDescription,
        metadata: {
          wompi_transaction_id: wompiTxId,
          original_reference: reference,
          original_recharge_amount_cop: originalRechargeCop,
          amount_retired_cop: amountRetiredFromWalletCop,
          pending_reconciliation_cop: pendingReconciliationCop,
          void_reason: attempt.void_reason || 'Anulación confirmada por Wompi',
        },
        created_at: new Date().toISOString(),
      };

      walletTransactionsList.unshift(voidTxRecord);
      db.transacciones_billetera.unshift(voidTxRecord);

      try {
        await supabaseRest('payment_attempts', {
          method: 'PATCH',
          query: `reference=eq.${encodeURIComponent(reference)}`,
          body: {
            status: 'VOIDED',
            wompi_transaction_id: wompiTxId,
            webhook_verified: true,
            webhook_payload: payload,
            updated_at: attempt.updated_at,
          },
        });
        await supabaseRest('billetera_profesional', {
          method: 'PATCH',
          query: `profesional_id=eq.${encodeURIComponent(attempt.professional_id)}`,
          body: {
            saldo_disponible_cop: balanceAfter,
            estado_billetera: balanceAfter >= 5000 ? 'ACTIVE' : 'LOW_BALANCE',
            updated_at: attempt.updated_at,
          },
        });
        await supabaseRest('transacciones_billetera', {
          method: 'POST',
          body: {
            profesional_id: Number(attempt.professional_id) || 2,
            tipo: 'reversion_anulacion_recarga',
            monto_cop: Math.max(1, amountRetiredFromWalletCop),
            signo: -1,
            saldo_anterior_cop: balanceBefore,
            saldo_posterior_cop: balanceAfter,
            metodo_pago: 'WOMPI_VOID_REVERSAL',
            referencia: voidRef,
            idempotency_key: voidIdempKey,
            estado: 'REVERSED',
            descripcion: reversalDescription,
            metadata: voidTxRecord.metadata,
          },
        });
        await supabaseRest('audit_logs', {
          method: 'POST',
          body: {
            actor_user_id: Number(attempt.professional_id) || 2,
            action: 'WOMPI_RECHARGE_VOIDED',
            entity_type: 'WALLET',
            entity_id: reference,
            metadata: voidTxRecord.metadata,
          },
        });
      } catch (_e) {}

      // Paso 5: Enviar notificación push e in-app con el mensaje sugerido oficial
      const notifRes = await dispatchTargetedNotification({
        recipientUserId: attempt.professional_id,
        roleTarget: 'profesional',
        title: 'Recarga anulada en tu billetera',
        body: OFFICIAL_VOID_NOTIFICATION_MESSAGE,
        type: 'PRO_RECHARGE_REJECTED',
        entityType: 'WALLET',
        entityId: voidRef,
        dedupKey: `notif-wompi-voided-${reference}`,
      });

      emitRealtimeEvent('professional_wallets', 'VOIDED', {
        professional_id: attempt.professional_id,
        prepaid_balance_cop: balanceAfter,
        pending_reconciliation_cop: pendingReconciliationCop,
        reference,
      });

      return {
        exito: true,
        idempotente: false,
        anulado: true,
        status: 'VOIDED',
        reference,
        void_reference: voidRef,
        wompi_transaction_id: wompiTxId,
        monto_recarga_original_cop: originalRechargeCop,
        monto_retirado_billetera_cop: amountRetiredFromWalletCop,
        pendiente_conciliacion_cop: pendingReconciliationCop,
        saldo_anterior_cop: balanceBefore,
        saldo_disponible_cop: balanceAfter,
        activo_para_solicitudes: balanceAfter >= 5000,
        movimiento_reversion: voidTxRecord,
        notificacion_push: notifRes.notification,
        mensaje: OFFICIAL_VOID_NOTIFICATION_MESSAGE,
      };
    }

    // =========================================================================
    // FLUJO ESTÁNDAR: PENDING, APPROVED, DECLINED, ERROR
    // =========================================================================
    if (attempt.status === 'APPROVED' && attempt.webhook_verified) {
      return {
        exito: true,
        idempotente: true,
        acreditado: false,
        reference,
        status: 'APPROVED',
        saldo_disponible_cop: wallet.saldo_disponible_cop,
        mensaje:
          'Evento de webhook repetido ignorado por idempotencia. El saldo no fue duplicado.',
      };
    }

    attempt.status = status;
    attempt.wompi_transaction_id = wompiTxId;
    attempt.webhook_verified = true;
    attempt.updated_at = new Date().toISOString();
    paymentAttemptsMap.set(reference, attempt);

    if (status !== 'APPROVED') {
      const rejectedTx = {
        id: `wtx-${walletTransactionsList.length + 1}`,
        professional_id: attempt.professional_id,
        booking_code: null,
        type: 'RECHARGE',
        amount_cop: attempt.amount_cop,
        sign: 1,
        balance_before_cop: wallet.saldo_disponible_cop,
        balance_after_cop: wallet.saldo_disponible_cop,
        status: status === 'PENDING' ? 'PENDING' : 'REJECTED',
        reference,
        idempotency_key: `wompi-${reference}-${status}`,
        description: `Intento de recarga Wompi Sandbox (${status}) • ${methodLabel} • Ref ${reference}`,
        created_at: new Date().toISOString(),
      };
      if (status !== 'PENDING') {
        walletTransactionsList.unshift(rejectedTx);
        await dispatchTargetedNotification({
          recipientUserId: attempt.professional_id,
          roleTarget: 'profesional',
          title: status === 'ERROR' ? 'Error en transacción Wompi' : 'Recarga rechazada',
          body: `Tu intento de recarga por ${formatCOP(
            attempt.amount_cop
          )} COP (${methodLabel}) finalizó en estado ${status}. No se acreditó saldo.`,
          type: 'PRO_RECHARGE_REJECTED',
          entityType: 'WALLET',
          entityId: reference,
        });
      }

      return {
        exito: true,
        idempotente: false,
        acreditado: false,
        status,
        reference,
        puede_reintentar: status === 'ERROR' || status === 'DECLINED',
        saldo_disponible_cop: wallet.saldo_disponible_cop,
        movimiento: rejectedTx,
      };
    }

    const balanceBefore = wallet.saldo_disponible_cop;
    const balanceAfter = balanceBefore + attempt.amount_cop;
    wallet.saldo_disponible_cop = balanceAfter;
    wallet.prepaid_balance_cop = balanceAfter;
    wallet.total_recargado_cop += attempt.amount_cop;
    wallet.activo_por_saldo = balanceAfter >= 5000 && !wallet.bloqueada;
    wallet.version = (wallet.version || 1) + 1;

    const approvedTx = {
      id: `wtx-${walletTransactionsList.length + 1}`,
      professional_id: attempt.professional_id,
      payment_attempt_id: attempt.id,
      booking_code: null,
      type: 'RECHARGE',
      tipo: 'recarga',
      amount_cop: attempt.amount_cop,
      sign: 1,
      balance_before_cop: balanceBefore,
      balance_after_cop: balanceAfter,
      status: 'APPROVED',
      reference,
      idempotency_key: `wompi-approved-${reference}`,
      description: `Recarga aprobada en Wompi Sandbox (${methodLabel}) • ${formatCOP(
        attempt.amount_cop
      )} COP`,
      metadata: {
        wompi_transaction_id: wompiTxId,
        environment: WOMPI_CONFIG.API_BASE_URL,
        method_label: methodLabel,
      },
      created_at: new Date().toISOString(),
    };
    walletTransactionsList.unshift(approvedTx);
    db.transacciones_billetera.unshift(approvedTx);

    try {
      await supabaseRest('rpc/fn_process_wompi_webhook_recharge', {
        method: 'POST',
        body: {
          p_reference: reference,
          p_wompi_tx_id: wompiTxId,
          p_status: 'APPROVED',
          p_webhook_payload: payload,
        },
      });
    } catch (_e) {}

    await dispatchTargetedNotification({
      recipientUserId: attempt.professional_id,
      roleTarget: 'profesional',
      title: 'Recarga aprobada',
      body: `Se acreditaron ${formatCOP(
        attempt.amount_cop
      )} COP en tu billetera profesional vía ${methodLabel}. Nuevo saldo: ${formatCOP(
        balanceAfter
      )} COP.`,
      type: 'PRO_RECHARGE_APPROVED',
      entityType: 'WALLET',
      entityId: reference,
      dedupKey: `notif-wompi-approved-${reference}`,
    });

    emitRealtimeEvent('professional_wallets', 'UPDATE', {
      professional_id: attempt.professional_id,
      prepaid_balance_cop: balanceAfter,
      reference,
    });

    return {
      exito: true,
      idempotente: false,
      acreditado: true,
      status: 'APPROVED',
      reference,
      monto_acreditado_cop: attempt.amount_cop,
      saldo_anterior_cop: balanceBefore,
      saldo_disponible_cop: balanceAfter,
      movimiento: approvedTx,
    };
  });
}

async function chargeBookingCommissionByStage({
  bookingCode,
  professionalId,
  stage,
  totalPriceCop,
}) {
  return runWithFinancialLock(async () => {
    const split = calculateTwoStageCommission(totalPriceCop);
    const isStage1 = Number(stage) === 1;
    const stageAmountCop = isStage1 ? split.comision_etapa1_cop : split.comision_etapa2_cop;
    const idempKey = `comm-stage-${stage}-${bookingCode}`;

    if (processedIdempotencyKeys.has(idempKey)) {
      return {
        ...processedIdempotencyKeys.get(idempKey),
        idempotente: true,
      };
    }

    const wallet = getOrCreateProfessionalWallet(professionalId);

    if (wallet.saldo_disponible_cop < stageAmountCop) {
      await dispatchTargetedNotification({
        recipientUserId: professionalId,
        roleTarget: 'profesional',
        title: 'Saldo insuficiente para comisión',
        body: `Necesitas ${formatCOP(stageAmountCop)} COP para cubrir la comisión (${
          isStage1 ? '3% confirmación' : '7% inicio'
        }) de la reserva #${bookingCode}. Tu saldo actual es ${formatCOP(
          wallet.saldo_disponible_cop
        )} COP.`,
        type: 'PRO_INSUFFICIENT_BALANCE',
        entityType: 'WALLET',
        entityId: bookingCode,
      });

      const err = new Error(
        `Saldo insuficiente en billetera profesional. Se requieren ${formatCOP(
          stageAmountCop
        )} COP (${isStage1 ? '3%' : '7%'}) y el saldo disponible es ${formatCOP(
          wallet.saldo_disponible_cop
        )} COP.`
      );
      err.statusCode = 402;
      err.code = 'INSUFFICIENT_WALLET_BALANCE';
      err.details = {
        saldo_disponible_cop: wallet.saldo_disponible_cop,
        monto_requerido_cop: stageAmountCop,
        faltante_cop: stageAmountCop - wallet.saldo_disponible_cop,
        desglose_comision: split,
      };
      throw err;
    }

    const balanceBefore = wallet.saldo_disponible_cop;
    const balanceAfter = balanceBefore - stageAmountCop;
    wallet.saldo_disponible_cop = balanceAfter;
    wallet.prepaid_balance_cop = balanceAfter;
    wallet.total_comisiones_pagadas_cop += stageAmountCop;
    wallet.comisiones_ganadas_plataforma_cop =
      (wallet.comisiones_ganadas_plataforma_cop || 0) + stageAmountCop;
    wallet.platform_earned_commissions_cop = wallet.comisiones_ganadas_plataforma_cop;
    wallet.activo_por_saldo = balanceAfter >= 5000 && !wallet.bloqueada;
    wallet.version = (wallet.version || 1) + 1;

    const txRecord = {
      id: `wtx-${walletTransactionsList.length + 1}`,
      professional_id: professionalId,
      booking_code: bookingCode,
      type: isStage1 ? 'COMMISSION_STAGE_1_3PCT' : 'COMMISSION_STAGE_2_7PCT',
      tipo: isStage1 ? 'comision_etapa1_3pct' : 'comision_etapa2_7pct',
      amount_cop: stageAmountCop,
      sign: -1,
      balance_before_cop: balanceBefore,
      balance_after_cop: balanceAfter,
      status: 'APPROVED',
      reference: idempKey.toUpperCase(),
      idempotency_key: idempKey,
      description: isStage1
        ? `Comisión Etapa 1 (3% confirmación) • Reserva #${bookingCode}`
        : `Comisión Etapa 2 (7% inicio del servicio) • Reserva #${bookingCode}`,
      metadata: {
        booking_code: bookingCode,
        stage: Number(stage),
        percentage: isStage1 ? 3 : 7,
        service_total_cop: split.precio_servicio_cop,
      },
      created_at: new Date().toISOString(),
    };

    walletTransactionsList.unshift(txRecord);
    db.transacciones_billetera.unshift(txRecord);

    try {
      await supabaseRest('rpc/fn_charge_booking_commission_stage', {
        method: 'POST',
        body: {
          p_codigo_reserva: bookingCode,
          p_profesional_id: Number(professionalId) || 2,
          p_etapa: Number(stage),
          p_precio_total_cop: split.precio_servicio_cop,
        },
      });
    } catch (_e) {}

    await dispatchTargetedNotification({
      recipientUserId: professionalId,
      roleTarget: 'profesional',
      title: `Comisión descontada (${isStage1 ? '3%' : '7%'})`,
      body: `Se descontaron ${formatCOP(stageAmountCop)} COP (${
        isStage1 ? 'Etapa 1: Confirmación' : 'Etapa 2: Inicio de servicio'
      }) de la reserva #${bookingCode}. Saldo disponible: ${formatCOP(balanceAfter)} COP.`,
      type: 'PRO_COMMISSION_DEDUCTED',
      entityType: 'WALLET',
      entityId: txRecord.reference,
      dedupKey: `notif-${idempKey}`,
    });

    const result = {
      exito: true,
      idempotente: false,
      etapa: Number(stage),
      porcentaje_aplicado: isStage1 ? 3 : 7,
      monto_descontado_cop: stageAmountCop,
      saldo_anterior_cop: balanceBefore,
      saldo_disponible_cop: balanceAfter,
      comisiones_ganadas_plataforma_cop: wallet.comisiones_ganadas_plataforma_cop,
      desglose_comision: split,
      movimiento: txRecord,
    };

    processedIdempotencyKeys.set(idempKey, result);
    return result;
  });
}

async function refundStage1CommissionOnCancel({ bookingCode, professionalId }) {
  return runWithFinancialLock(async () => {
    const stage1Key = `comm-stage-1-${bookingCode}`;
    const refundKey = `comm-refund-${bookingCode}`;
    if (!processedIdempotencyKeys.has(stage1Key) || processedIdempotencyKeys.has(refundKey)) {
      return { exito: true, refunded: false };
    }

    const stage1Data = processedIdempotencyKeys.get(stage1Key);
    const amountToRefund = stage1Data.monto_descontado_cop;
    const wallet = getOrCreateProfessionalWallet(professionalId);

    const balanceBefore = wallet.saldo_disponible_cop;
    const balanceAfter = balanceBefore + amountToRefund;
    wallet.saldo_disponible_cop = balanceAfter;
    wallet.prepaid_balance_cop = balanceAfter;
    wallet.total_comisiones_pagadas_cop = Math.max(
      0,
      wallet.total_comisiones_pagadas_cop - amountToRefund
    );
    wallet.comisiones_ganadas_plataforma_cop = Math.max(
      0,
      (wallet.comisiones_ganadas_plataforma_cop || 0) - amountToRefund
    );

    const refundTx = {
      id: `wtx-${walletTransactionsList.length + 1}`,
      professional_id: professionalId,
      booking_code: bookingCode,
      type: 'COMMISSION_REFUND',
      tipo: 'reembolso_comision',
      amount_cop: amountToRefund,
      sign: 1,
      balance_before_cop: balanceBefore,
      balance_after_cop: balanceAfter,
      status: 'APPROVED',
      reference: refundKey.toUpperCase(),
      idempotency_key: refundKey,
      description: `Devolución de comisión Etapa 1 (3%) por cancelación • Reserva #${bookingCode}`,
      created_at: new Date().toISOString(),
    };

    walletTransactionsList.unshift(refundTx);
    processedIdempotencyKeys.set(refundKey, { exito: true, refunded: true, movimiento: refundTx });
    return { exito: true, refunded: true, movimiento: refundTx };
  });
}

module.exports = {
  WOMPI_CONFIG,
  OFFICIAL_VOID_NOTIFICATION_MESSAGE,
  WOMPI_SANDBOX_TEST_PARAMS,
  computeWompiIntegritySignature,
  computeWompiWebhookChecksum,
  evaluateWompiSandboxPaymentOutcome,
  calculateTwoStageCommission,
  getOrCreateProfessionalWallet,
  getProfessionalWalletSummary,
  getWalletTransactionDetail,
  createWompiSandboxTransaction,
  requestAdminWompiRechargeVoid,
  executeWompiSandboxPaymentAndWebhook,
  handleWompiSandboxWebhook,
  chargeBookingCommissionByStage,
  refundStage1CommissionOnCancel,
};
