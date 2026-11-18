/**
 * Archivo: backend/__tests__/api.test.js
 * Módulo 11: Suite de Pruebas de Integración, Correo SMTP, Finanzas, Seguridad y Anulaciones Wompi (VOIDED)
 */

const http = require('http');
const { handleApiRequest } = require('../src/app');
const { ServiceFactory } = require('../src/patterns/ServiceFactory');
const {
  calculateTwoStageCommission,
  evaluateWompiSandboxPaymentOutcome,
  computeWompiWebhookChecksum,
  OFFICIAL_VOID_NOTIFICATION_MESSAGE,
  WOMPI_CONFIG,
} = require('../src/modules/wallet/wompiAndCommission.service');
const {
  getLastGeneratedOtpForTestingOnly,
} = require('../src/modules/auth/unifiedAuth.service');
const { buildRecoveryEmailHtml } = require('../src/services/smtp.service');

let server;
let baseUrl;

function apiCall(path, { method = 'GET', body = null, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(path, baseUrl);
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      urlObj,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: raw ? JSON.parse(raw) : {} });
          } catch (_e) {
            resolve({ status: res.statusCode, data: raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

beforeAll((done) => {
  server = http.createServer(handleApiRequest);
  server.listen(0, '127.0.0.1', () => {
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
    done();
  });
});

afterAll((done) => {
  if (server) server.close(done);
  else done();
});

describe('Módulos 1 al 12 — Pruebas de Integración, SMTP, Finanzas, Seguridad y Anulaciones Wompi (VOIDED)', () => {
  test('Módulo 4.3: Parámetros oficiales de prueba en Sandbox de Wompi (Tarjetas, Nequi, PSE, Bancolombia QR y Daviplata)', () => {
    expect(WOMPI_CONFIG.PUBLIC_KEY).toBe('pub_test_2PuvSCJDswiY8c0wDeBEJxEgBaAsMtF2');
    expect(WOMPI_CONFIG.INTEGRITY_SECRET).toBe('test_integrity_nMaCRvNkgai1TzkWX9L0zWAZAcKOcn5Z');
    expect(WOMPI_CONFIG.EVENTS_SECRET).toBe('test_events_yjuZ9QOMgvz4RAOt4N4Vr5IOoQlB4POm');

    // Tarjetas oficiales
    expect(evaluateWompiSandboxPaymentOutcome('CARD', { card_number: '4242 4242 4242 4242' }).status).toBe('APPROVED');
    expect(evaluateWompiSandboxPaymentOutcome('CARD', { card_number: '4111 1111 1111 1111' }).status).toBe('DECLINED');
    expect(evaluateWompiSandboxPaymentOutcome('CARD', { card_number: '5555 4444 3333 2222' }).status).toBe('ERROR');

    // Nequi oficial
    expect(evaluateWompiSandboxPaymentOutcome('NEQUI', { phone_number: '3991111111' }).status).toBe('APPROVED');
    expect(evaluateWompiSandboxPaymentOutcome('NEQUI', { phone_number: '3992222222' }).status).toBe('DECLINED');
    expect(evaluateWompiSandboxPaymentOutcome('NEQUI', { phone_number: '3001234567' }).status).toBe('ERROR');

    // PSE oficial
    expect(evaluateWompiSandboxPaymentOutcome('PSE', { financial_institution_code: '1' }).status).toBe('APPROVED');
    expect(evaluateWompiSandboxPaymentOutcome('PSE', { financial_institution_code: '2' }).status).toBe('DECLINED');

    // Bancolombia QR oficial
    expect(evaluateWompiSandboxPaymentOutcome('BANCOLOMBIA_QR', { sandbox_status: 'APPROVED' }).status).toBe('APPROVED');
    expect(evaluateWompiSandboxPaymentOutcome('BANCOLOMBIA_QR', { sandbox_status: 'DECLINED' }).status).toBe('DECLINED');

    // Daviplata OTPs oficiales
    expect(evaluateWompiSandboxPaymentOutcome('DAVIPLATA', { otp_code: '574829' }).status).toBe('APPROVED');
    expect(evaluateWompiSandboxPaymentOutcome('DAVIPLATA', { otp_code: '932015' }).status).toBe('DECLINED');
    expect(evaluateWompiSandboxPaymentOutcome('DAVIPLATA', { otp_code: '186743' }).status).toBe('DECLINED');
    expect(evaluateWompiSandboxPaymentOutcome('DAVIPLATA', { otp_code: '999999' }).status).toBe('ERROR');
    expect(evaluateWompiSandboxPaymentOutcome('DAVIPLATA', { otp_code: '123456' }).status).toBe('PENDING');
  });

  test('Módulo 5: Calcula exactamente el ejemplo oficial ($7.000 COP -> 10% = $700: 3% = $210 + 7% = $490)', () => {
    const split = calculateTwoStageCommission(7000);
    expect(split.comision_total_cop).toBe(700);
    expect(split.comision_etapa1_cop).toBe(210);
    expect(split.comision_etapa2_cop).toBe(490);

    const summary = ServiceFactory.createBookingSummary({
      codigoReserva: 'BF-12345',
      precioTotalCop: 60000,
      modalidad: 'domicilio',
    });
    expect(summary.comision_10_cop).toBe(6000);
  });

  test('Módulo 1 y 2: Login anti-enumeración, alta profesional en misma cuenta y cambio de modalidad sin cerrar sesión', async () => {
    const badUser = await apiCall('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'noexiste_999@beautyflash.co', password: 'Password123' },
    });
    expect(badUser.status).toBe(401);
    expect(badUser.data.error).toBe(
      'No fue posible iniciar sesión. Verifica tus datos e inténtalo nuevamente.'
    );

    const loginOk = await apiCall('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: 'valentina@beautyflash.co',
        password: 'Password123',
        device_token: 'ExponentPushToken[dev-A]',
        device_id: 'device-A',
      },
    });
    expect(loginOk.status).toBe(200);
    expect(loginOk.data.exito).toBe(true);
    expect(loginOk.data.usuario.roles).toContain('CLIENT');

    await apiCall('/api/v1/notifications/device-token', {
      method: 'POST',
      body: { user_id: 1, token: 'ExponentPushToken[dev-B]', device_id: 'device-B' },
    });

    const upgradeRes = await apiCall('/api/v1/auth/upgrade-to-professional', {
      method: 'POST',
      body: {
        user_id: 1,
        nombre_artistico: 'Valentina Studio Pro',
        dni_numero: '1144098765',
        especialidades: ['Maquillaje', 'Uñas'],
      },
    });
    expect(upgradeRes.status).toBe(201);
    expect(upgradeRes.data.roles).toEqual(expect.arrayContaining(['CLIENT', 'PROFESSIONAL']));

    const switchClient = await apiCall('/api/v1/auth/switch-mode', {
      method: 'POST',
      body: { user_id: 1, target_mode: 'CLIENT' },
    });
    expect(switchClient.status).toBe(200);
    expect(switchClient.data.selected_mode).toBe('CLIENT');

    const switchPro = await apiCall('/api/v1/auth/switch-mode', {
      method: 'POST',
      body: { user_id: 1, target_mode: 'PROFESSIONAL' },
    });
    expect(switchPro.status).toBe(200);
    expect(switchPro.data.selected_mode).toBe('PROFESSIONAL');

    const logoutRes = await apiCall('/api/v1/auth/logout', {
      method: 'POST',
      body: { user_id: 1, device_token: 'ExponentPushToken[dev-A]' },
    });
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.data.deactivated).toBe(1);
  });

  test('Módulo 2.2: Recuperación de contraseña envía correo SMTP/Supabase y NUNCA expone el código OTP en la respuesta HTTP', async () => {
    const htmlEmail = buildRecoveryEmailHtml({
      codigoOtp: '482910',
      correoDestino: 'sofia.alarcon@beautyflash.co',
      minutosVigencia: 10,
    });
    expect(htmlEmail).toContain('482910');
    expect(htmlEmail).toContain('sofia.alarcon@beautyflash.co');

    const step1 = await apiCall('/api/v1/auth/password-recovery/request', {
      method: 'POST',
      body: { email: 'sofia.alarcon@beautyflash.co' },
    });
    expect(step1.status).toBe(200);
    expect(step1.data.exito).toBe(true);
    expect(step1.data.enviado_por_correo).toBe(true);
    expect(step1.data.codigo_sandbox_prueba).toBe(undefined);
    expect(step1.data.code).toBe(undefined);
    expect(step1.data.otp).toBe(undefined);

    const otpFromEmailInbox = getLastGeneratedOtpForTestingOnly('sofia.alarcon@beautyflash.co');
    expect(otpFromEmailInbox).toMatch(/^\d{6}$/);

    const badVerify = await apiCall('/api/v1/auth/password-recovery/verify-code', {
      method: 'POST',
      body: { email: 'sofia.alarcon@beautyflash.co', code: '000000' },
    });
    expect(badVerify.status).toBe(400);

    const step2 = await apiCall('/api/v1/auth/password-recovery/verify-code', {
      method: 'POST',
      body: { email: 'sofia.alarcon@beautyflash.co', code: otpFromEmailInbox },
    });
    expect(step2.status).toBe(200);
    expect(step2.data.verificado).toBe(true);
    const recToken = step2.data.recovery_session_token;

    const step3 = await apiCall('/api/v1/auth/password-recovery/reset', {
      method: 'POST',
      body: {
        email: 'sofia.alarcon@beautyflash.co',
        recovery_session_token: recToken,
        new_password: 'NuevaPassword2026',
        confirm_password: 'NuevaPassword2026',
      },
    });
    expect(step3.status).toBe(200);
    expect(step3.data.exito).toBe(true);

    const reuseAttempt = await apiCall('/api/v1/auth/password-recovery/reset', {
      method: 'POST',
      body: {
        email: 'sofia.alarcon@beautyflash.co',
        recovery_session_token: recToken,
        new_password: 'OtraPassword2026',
        confirm_password: 'OtraPassword2026',
      },
    });
    expect(reuseAttempt.status).toBe(401);
  });

  test('Módulos 4 y 5: Wompi Sandbox (PENDING/DECLINED/APPROVED + Idempotencia) y Comisiones 3% / 7%', async () => {
    const proId = 1;

    const createTx = await apiCall(`/api/v1/wallet/${proId}/wompi/create-transaction`, {
      method: 'POST',
      body: { amount_cop: 20000, payment_method_type: 'CARD_SANDBOX' },
    });
    expect(createTx.status).toBe(201);
    expect(createTx.data.acreditado).toBe(false);
    const refApproved = createTx.data.wompi_sandbox.reference;

    const createDeclined = await apiCall(`/api/v1/wallet/${proId}/wompi/create-transaction`, {
      method: 'POST',
      body: { amount_cop: 50000, payment_method_type: 'CARD_SANDBOX' },
    });
    const refDeclined = createDeclined.data.wompi_sandbox.reference;

    const webhookDeclined = await apiCall('/api/v1/webhooks/wompi', {
      method: 'POST',
      headers: { 'X-Event-Checksum': 'SANDBOX_AUTO_SIGN' },
      body: {
        data: {
          transaction: {
            id: 'wompi-tx-declined-1',
            reference: refDeclined,
            amount_in_cents: 5000000,
            status: 'DECLINED',
          },
        },
      },
    });
    expect(webhookDeclined.status).toBe(200);
    expect(webhookDeclined.data.acreditado).toBe(false);
    expect(webhookDeclined.data.saldo_disponible_cop).toBe(0);

    const webhookApproved = await apiCall('/api/v1/webhooks/wompi', {
      method: 'POST',
      headers: { 'X-Event-Checksum': 'SANDBOX_AUTO_SIGN' },
      body: {
        data: {
          transaction: {
            id: 'wompi-tx-approved-1',
            reference: refApproved,
            amount_in_cents: 2000000,
            status: 'APPROVED',
          },
        },
      },
    });
    expect(webhookApproved.status).toBe(200);
    expect(webhookApproved.data.acreditado).toBe(true);
    expect(webhookApproved.data.saldo_disponible_cop).toBe(20000);

    const webhookDuplicate = await apiCall('/api/v1/webhooks/wompi', {
      method: 'POST',
      headers: { 'X-Event-Checksum': 'SANDBOX_AUTO_SIGN' },
      body: {
        data: {
          transaction: {
            id: 'wompi-tx-approved-1',
            reference: refApproved,
            amount_in_cents: 2000000,
            status: 'APPROVED',
          },
        },
      },
    });
    expect(webhookDuplicate.status).toBe(200);
    expect(webhookDuplicate.data.idempotente).toBe(true);
    expect(webhookDuplicate.data.saldo_disponible_cop).toBe(20000);

    const confirmStage1 = await apiCall('/api/v1/bookings/BF-7000/confirm-client', {
      method: 'POST',
      body: { profesional_id: proId, cliente_id: 1, precio_total_cop: 7000 },
    });
    expect(confirmStage1.status).toBe(200);
    expect(confirmStage1.data.comision_etapa_1.monto_descontado_cop).toBe(210);
    expect(confirmStage1.data.comision_etapa_1.saldo_disponible_cop).toBe(19790);

    const startStage2 = await apiCall('/api/v1/bookings/BF-7000/start-service', {
      method: 'POST',
      body: { profesional_id: proId, cliente_id: 1, precio_total_cop: 7000 },
    });
    expect(startStage2.status).toBe(200);
    expect(startStage2.data.comision_etapa_2.monto_descontado_cop).toBe(490);
    expect(startStage2.data.comision_etapa_2.saldo_disponible_cop).toBe(19300);
  });

  test('Etapa 4: Los 7 Escenarios Obligatorios de Recargas y Anulaciones Wompi (APPROVED, PENDING, DECLINED, ERROR, VOIDED Total, Idempotencia de Webhook Duplicado y VOIDED con Saldo Parcialmente Utilizado)', async () => {
    const proFullVoidId = 77;

    // -------------------------------------------------------------------------
    // ESCENARIO 2: Recarga en estado PENDING (No acredita saldo)
    // -------------------------------------------------------------------------
    const pendingAttempt = await apiCall(`/api/v1/wallet/${proFullVoidId}/wompi/create-transaction`, {
      method: 'POST',
      body: { amount_cop: 30000, payment_method_type: 'DAVIPLATA' },
    });
    expect(pendingAttempt.status).toBe(201);
    const refPending = pendingAttempt.data.wompi_sandbox.reference;

    const webhookPending = await apiCall('/api/v1/webhooks/wompi', {
      method: 'POST',
      headers: { 'X-Event-Checksum': 'SANDBOX_AUTO_SIGN' },
      body: {
        data: {
          transaction: {
            id: 'wompi-tx-pending-77',
            reference: refPending,
            amount_in_cents: 3000000,
            status: 'PENDING',
          },
        },
      },
    });
    expect(webhookPending.status).toBe(200);
    expect(webhookPending.data.acreditado).toBe(false);
    expect(webhookPending.data.saldo_disponible_cop).toBe(0);

    // -------------------------------------------------------------------------
    // ESCENARIO 3: Recarga rechazada (DECLINED) -> No acredita saldo
    // -------------------------------------------------------------------------
    const declinedAttempt = await apiCall(`/api/v1/wallet/${proFullVoidId}/wompi/create-transaction`, {
      method: 'POST',
      body: { amount_cop: 35000, payment_method_type: 'CARD' },
    });
    const refDeclined = declinedAttempt.data.wompi_sandbox.reference;

    const webhookDeclined = await apiCall('/api/v1/webhooks/wompi', {
      method: 'POST',
      headers: { 'X-Event-Checksum': 'SANDBOX_AUTO_SIGN' },
      body: {
        data: {
          transaction: {
            id: 'wompi-tx-declined-77',
            reference: refDeclined,
            amount_in_cents: 3500000,
            status: 'DECLINED',
          },
        },
      },
    });
    expect(webhookDeclined.status).toBe(200);
    expect(webhookDeclined.data.acreditado).toBe(false);
    expect(webhookDeclined.data.saldo_disponible_cop).toBe(0);

    // -------------------------------------------------------------------------
    // ESCENARIO 4: Error en una transacción (ERROR) -> No acredita saldo y permite reintentar
    // -------------------------------------------------------------------------
    const errorAttempt = await apiCall(`/api/v1/wallet/${proFullVoidId}/wompi/create-transaction`, {
      method: 'POST',
      body: { amount_cop: 25000, payment_method_type: 'CARD' },
    });
    const refError = errorAttempt.data.wompi_sandbox.reference;

    const webhookError = await apiCall('/api/v1/webhooks/wompi', {
      method: 'POST',
      headers: { 'X-Event-Checksum': 'SANDBOX_AUTO_SIGN' },
      body: {
        data: {
          transaction: {
            id: 'wompi-tx-error-77',
            reference: refError,
            amount_in_cents: 2500000,
            status: 'ERROR',
          },
        },
      },
    });
    expect(webhookError.status).toBe(200);
    expect(webhookError.data.acreditado).toBe(false);
    expect(webhookError.data.puede_reintentar).toBe(true);
    expect(webhookError.data.saldo_disponible_cop).toBe(0);

    // -------------------------------------------------------------------------
    // ESCENARIO 1 y ESCENARIO 5:
    // Recarga aprobada ($0 -> +$40.000 COP) + Solicitud Administrativa (No modifica saldo)
    // + Webhook VOIDED confirmado (-$40.000 COP -> Saldo final $0 COP) + Notificación Push Oficial
    // -------------------------------------------------------------------------
    const approved40k = await apiCall(`/api/v1/wallet/${proFullVoidId}/wompi/create-transaction`, {
      method: 'POST',
      body: { amount_cop: 40000, payment_method_type: 'CARD' },
    });
    const ref40k = approved40k.data.wompi_sandbox.reference;

    const tsApprove = Math.floor(Date.now() / 1000);
    const sigApprove = computeWompiWebhookChecksum({
      transactionId: 'wompi-tx-40k-full',
      status: 'APPROVED',
      amountInCents: 4000000,
      timestamp: tsApprove,
    });

    const whApprove40k = await apiCall('/api/v1/webhooks/wompi', {
      method: 'POST',
      headers: { 'X-Event-Checksum': sigApprove },
      body: {
        timestamp: tsApprove,
        signature: { checksum: sigApprove },
        data: {
          transaction: {
            id: 'wompi-tx-40k-full',
            reference: ref40k,
            amount_in_cents: 4000000,
            status: 'APPROVED',
          },
        },
      },
    });
    expect(whApprove40k.status).toBe(200);
    expect(whApprove40k.data.acreditado).toBe(true);
    expect(whApprove40k.data.saldo_anterior_cop).toBe(0);
    expect(whApprove40k.data.saldo_disponible_cop).toBe(40000);

    // Paso 1 y 2: Solicitud administrativa de anulación (NO debe modificar inmediatamente el saldo)
    const adminVoidReq = await apiCall(`/api/v1/wallet/${proFullVoidId}/wompi/request-void`, {
      method: 'POST',
      body: {
        reference: ref40k,
        admin_user_id: 999,
        reason: 'Solicitud administrativa de anulación de prueba',
      },
    });
    expect(adminVoidReq.status).toBe(200);
    expect(adminVoidReq.data.solicitud_registrada).toBe(true);
    expect(adminVoidReq.data.saldo_modificado).toBe(false);
    expect(adminVoidReq.data.saldo_disponible_cop).toBe(40000);

    // Verificar que métodos distintos a tarjeta (ej. NEQUI) rechacen la solicitud de anulación según reglas de Wompi
    const nequiTx = await apiCall(`/api/v1/wallet/${proFullVoidId}/wompi/create-transaction`, {
      method: 'POST',
      body: { amount_cop: 15000, payment_method_type: 'NEQUI' },
    });
    const refNequi = nequiTx.data.wompi_sandbox.reference;
    await apiCall('/api/v1/webhooks/wompi', {
      method: 'POST',
      headers: { 'X-Event-Checksum': 'SANDBOX_AUTO_SIGN' },
      body: {
        data: {
          transaction: {
            id: 'wompi-tx-nequi-no-void',
            reference: refNequi,
            amount_in_cents: 1500000,
            status: 'APPROVED',
          },
        },
      },
    });
    const invalidNequiVoid = await apiCall(`/api/v1/wallet/${proFullVoidId}/wompi/request-void`, {
      method: 'POST',
      body: { reference: refNequi },
    });
    expect(invalidNequiVoid.status).toBe(400);
    expect(invalidNequiVoid.data.codigo).toBe('VOID_NOT_SUPPORTED_FOR_PAYMENT_METHOD');

    // Retirar los $15.000 extra de Nequi para probar el ejemplo exacto $40.000 -> -$40.000 -> $0 en un profesional dedicado (proId = 88)
    const proExact40kId = 88;
    const createExact40k = await apiCall(`/api/v1/wallet/${proExact40kId}/wompi/create-transaction`, {
      method: 'POST',
      body: { amount_cop: 40000, payment_method_type: 'CARD' },
    });
    const refExact40k = createExact40k.data.wompi_sandbox.reference;

    await apiCall('/api/v1/webhooks/wompi', {
      method: 'POST',
      headers: { 'X-Event-Checksum': 'SANDBOX_AUTO_SIGN' },
      body: {
        data: {
          transaction: {
            id: 'wompi-tx-exact-40k',
            reference: refExact40k,
            amount_in_cents: 4000000,
            status: 'APPROVED',
          },
        },
      },
    });

    const reqExactVoid = await apiCall(`/api/v1/wallet/${proExact40kId}/wompi/request-void`, {
      method: 'POST',
      body: { reference: refExact40k, reason: 'Anulación total $40.000 COP' },
    });
    expect(reqExactVoid.status).toBe(200);
    expect(reqExactVoid.data.saldo_disponible_cop).toBe(40000);

    // Paso 3, 4 y 5: Confirmación de anulación mediante Webhook VOIDED con firma criptográfica válida
    const tsVoid = Math.floor(Date.now() / 1000);
    const sigVoid = computeWompiWebhookChecksum({
      transactionId: 'wompi-tx-exact-40k',
      status: 'VOIDED',
      amountInCents: 4000000,
      timestamp: tsVoid,
    });

    const whVoidExact = await apiCall('/api/v1/webhooks/wompi', {
      method: 'POST',
      headers: { 'X-Event-Checksum': sigVoid },
      body: {
        timestamp: tsVoid,
        signature: { checksum: sigVoid },
        data: {
          transaction: {
            id: 'wompi-tx-exact-40k',
            reference: refExact40k,
            amount_in_cents: 4000000,
            status: 'VOIDED',
          },
        },
      },
    });
    expect(whVoidExact.status).toBe(200);
    expect(whVoidExact.data.anulado).toBe(true);
    expect(whVoidExact.data.status).toBe('VOIDED');
    expect(whVoidExact.data.saldo_anterior_cop).toBe(40000);
    expect(whVoidExact.data.monto_retirado_billetera_cop).toBe(40000);
    expect(whVoidExact.data.pendiente_conciliacion_cop).toBe(0);
    expect(whVoidExact.data.saldo_disponible_cop).toBe(0);
    expect(whVoidExact.data.activo_para_solicitudes).toBe(false);
    expect(whVoidExact.data.movimiento_reversion.type).toBe('RECHARGE_VOID_REVERSAL');
    expect(whVoidExact.data.movimiento_reversion.original_reference).toBe(refExact40k);
    expect(whVoidExact.data.notificacion_push.body).toBe(OFFICIAL_VOID_NOTIFICATION_MESSAGE);

    // -------------------------------------------------------------------------
    // ESCENARIO 6: Webhook VOIDED recibido dos veces (Idempotencia estricta)
    // -------------------------------------------------------------------------
    const whVoidDuplicate = await apiCall('/api/v1/webhooks/wompi', {
      method: 'POST',
      headers: { 'X-Event-Checksum': sigVoid },
      body: {
        timestamp: tsVoid,
        signature: { checksum: sigVoid },
        data: {
          transaction: {
            id: 'wompi-tx-exact-40k',
            reference: refExact40k,
            amount_in_cents: 4000000,
            status: 'VOIDED',
          },
        },
      },
    });
    expect(whVoidDuplicate.status).toBe(200);
    expect(whVoidDuplicate.data.idempotente).toBe(true);
    expect(whVoidDuplicate.data.anulado).toBe(false);
    expect(whVoidDuplicate.data.saldo_disponible_cop).toBe(0);

    // -------------------------------------------------------------------------
    // ESCENARIO 7: Anulación de una recarga cuyo saldo ya fue utilizado parcialmente
    // (Recarga $40.000 COP -> Profesional consume $12.000 COP en comisiones -> Quedan $28.000 COP
    // -> Webhook VOIDED retira solo $28.000 COP, deja saldo en $0 COP sin negativo y registra
    //    $12.000 COP como pendiente_conciliacion_cop)
    // -------------------------------------------------------------------------
    const proPartialId = 99;
    const createPartial40k = await apiCall(`/api/v1/wallet/${proPartialId}/wompi/create-transaction`, {
      method: 'POST',
      body: { amount_cop: 40000, payment_method_type: 'CARD' },
    });
    const refPartial40k = createPartial40k.data.wompi_sandbox.reference;

    await apiCall('/api/v1/webhooks/wompi', {
      method: 'POST',
      headers: { 'X-Event-Checksum': 'SANDBOX_AUTO_SIGN' },
      body: {
        data: {
          transaction: {
            id: 'wompi-tx-partial-40k',
            reference: refPartial40k,
            amount_in_cents: 4000000,
            status: 'APPROVED',
          },
        },
      },
    });

    // El profesional consume $12.000 COP en comisiones de un servicio de $120.000 COP (3% = $3.600 + 7% = $8.400 = $12.000 COP)
    const stage1Partial = await apiCall('/api/v1/bookings/BF-PARTIAL-120K/confirm-client', {
      method: 'POST',
      body: { profesional_id: proPartialId, cliente_id: 1, precio_total_cop: 120000 },
    });
    expect(stage1Partial.status).toBe(200);
    expect(stage1Partial.data.comision_etapa_1.monto_descontado_cop).toBe(3600);

    const stage2Partial = await apiCall('/api/v1/bookings/BF-PARTIAL-120K/start-service', {
      method: 'POST',
      body: { profesional_id: proPartialId, cliente_id: 1, precio_total_cop: 120000 },
    });
    expect(stage2Partial.status).toBe(200);
    expect(stage2Partial.data.comision_etapa_2.monto_descontado_cop).toBe(8400);
    expect(stage2Partial.data.comision_etapa_2.saldo_disponible_cop).toBe(28000);

    // Solicitud administrativa y recepción de Webhook VOIDED sobre la recarga de $40.000 COP
    await apiCall(`/api/v1/wallet/${proPartialId}/wompi/request-void`, {
      method: 'POST',
      body: { reference: refPartial40k, reason: 'Anulación con uso parcial de saldo' },
    });

    const whVoidPartial = await apiCall('/api/v1/webhooks/wompi', {
      method: 'POST',
      headers: { 'X-Event-Checksum': 'SANDBOX_AUTO_SIGN' },
      body: {
        data: {
          transaction: {
            id: 'wompi-tx-partial-40k',
            reference: refPartial40k,
            amount_in_cents: 4000000,
            status: 'VOIDED',
          },
        },
      },
    });

    expect(whVoidPartial.status).toBe(200);
    expect(whVoidPartial.data.anulado).toBe(true);
    expect(whVoidPartial.data.monto_recarga_original_cop).toBe(40000);
    expect(whVoidPartial.data.saldo_anterior_cop).toBe(28000);
    expect(whVoidPartial.data.monto_retirado_billetera_cop).toBe(28000);
    expect(whVoidPartial.data.saldo_disponible_cop).toBe(0); // Nunca negativo
    expect(whVoidPartial.data.pendiente_conciliacion_cop).toBe(12000); // Diferencia registrada para revisión administrativa
    expect(whVoidPartial.data.activo_para_solicitudes).toBe(false);

    // Verificar que el historial conserva intactos los movimientos anteriores (recarga + comisiones + reversión)
    const walletSummaryPartial = await apiCall(`/api/v1/wallet/${proPartialId}/summary`);
    expect(walletSummaryPartial.status).toBe(200);
    expect(walletSummaryPartial.data.billetera.saldo_disponible_cop).toBe(0);
    expect(walletSummaryPartial.data.billetera.pendiente_conciliacion_cop).toBe(12000);
    expect(walletSummaryPartial.data.billetera.movimientos.length).toBe(4);
  });

  test('Módulo 6: Seguimiento GPS en tiempo real, control de acceso a ubicación y detección de llegada', async () => {
    const locUpdate = await apiCall('/api/v1/bookings/BF-9001/tracking/location', {
      method: 'POST',
      headers: { 'X-User-Id': '2' },
      body: {
        cliente_id: 1,
        profesional_id: 2,
        latitude: 3.3720,
        longitude: -76.5325,
        accuracy: 10,
      },
    });
    expect(locUpdate.status).toBe(200);
    expect(locUpdate.data.tracking.is_estimation).toBe(true);

    const unauthorizedGet = await apiCall('/api/v1/bookings/BF-9001/tracking?user_id=999');
    expect(unauthorizedGet.status).toBe(403);

    const authorizedGet = await apiCall('/api/v1/bookings/BF-9001/tracking?user_id=1');
    expect(authorizedGet.status).toBe(200);
    expect(authorizedGet.data.tracking.professional_location.latitude).toBeCloseTo(3.3720, 4);

    const arriveRes = await apiCall('/api/v1/bookings/BF-9001/tracking/arrive', {
      method: 'POST',
      headers: { 'X-User-Id': '2' },
      body: {
        profesional_id: 2,
        latitude: 3.3712,
        longitude: -76.5320,
        accuracy: 8,
      },
    });
    expect(arriveRes.status).toBe(200);
    expect(arriveRes.data.llegada_confirmada).toBe(true);
    expect(arriveRes.data.mensaje).toBe(
      '¡Tu profesional ha llegado! Ya se encuentra en la ubicación indicada.'
    );
  });
});
