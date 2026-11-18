/**
 * Archivo: backend/src/app.js
 * Enrutador Principal de la API REST y Stream de Tiempo Real (Módulos 1 al 12):
 * - Autenticación Unificada, Cambio de Modalidad (CLIENT <-> PROFESSIONAL) y Alta Profesional
 * - Recuperación Segura de Contraseña en 3 Etapas (OTP 6 dígitos SHA-256)
 * - Sistema Centralizado de Notificaciones y Gestión de Tokens de Dispositivo
 * - Billetera Profesional e Integración con Wompi Sandbox + Webhook Criptográfico Idempotente
 * - Sistema de Comisiones en 2 Etapas (3% Confirmación + 7% Inicio del Servicio = 10% Total)
 * - Seguimiento Geográfico en Tiempo Real y Confirmación de Llegada Validada en Servidor
 */

const url = require('url');
const {
  db,
  realtimeBus,
  buscarProfesionalesCercanos,
} = require('./config/supabaseClient');
const {
  BUSINESS_RULES,
  formatCOP,
  calcularComisionCOP,
} = require('./config/constants');
const { autenticarRequest } = require('./middlewares/auth.middleware');
const {
  armarPerfilUsuario,
  registrarCliente,
  registrarProfesional,
} = require('./controllers/auth.controller');
const {
  gestionarVerificacionProfesional,
  crearServicioProfesional,
  crearProductoProfesional,
  actualizarZonaYDisponibilidad,
} = require('./controllers/professional.controller');
const {
  obtenerDetalleBilletera,
  procesarRecargaBilletera,
  verificarCapacidadServicio,
} = require('./controllers/wallet.controller');
const {
  enriquecerReserva,
  crearSolicitudOReserva,
  aceptarServicioConComisionTransaccional,
  rechazarYReasignarReserva,
  cambiarEstadoServicio,
  actualizarUbicacionEnVivo,
  calificarServicio,
} = require('./controllers/booking.controller');
const { enviarCodigoOTP, verificarCodigoOTP } = require('./services/sms.service');
const { obtenerRutaDirections, buscarLugaresPlaces } = require('./services/maps.service');
const { subirArchivoStorage } = require('./services/storage.service');

// Nuevos Módulos Evolucionados (Módulos 1 al 6)
const {
  unifiedLogin,
  switchUserMode,
  upgradeClientToProfessional,
  assertUserHasRoleAndApproval,
  requestPasswordRecovery,
  verifyPasswordRecoveryCode,
  resetPasswordWithRecoveryToken,
} = require('./modules/auth/unifiedAuth.service');
const {
  registerDeviceToken,
  deactivateDeviceTokenOnLogout,
  dispatchTargetedNotification,
  listNotificationsForUser,
  markNotificationAsRead,
} = require('./modules/notifications/notificationCenter.service');
const {
  calculateTwoStageCommission,
  getProfessionalWalletSummary,
  getWalletTransactionDetail,
  createWompiSandboxTransaction,
  requestAdminWompiRechargeVoid,
  executeWompiSandboxPaymentAndWebhook,
  handleWompiSandboxWebhook,
  chargeBookingCommissionByStage,
  refundStage1CommissionOnCancel,
} = require('./modules/wallet/wompiAndCommission.service');
const {
  updateProfessionalLiveLocation,
  confirmProfessionalArrival,
  getAuthorizedBookingTrackingState,
} = require('./modules/tracking/realtimeTracking.service');

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (_err) {
        reject(new Error('JSON inválido en el cuerpo de la petición.'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-User-Id, Idempotency-Key, X-Event-Checksum',
  });
  res.end(JSON.stringify(payload));
}

async function handleApiRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-User-Id, Idempotency-Key, X-Event-Checksum',
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';
  const query = parsedUrl.query || {};
  const method = req.method.toUpperCase();

  try {
    if (method === 'GET' && (pathname === '/api/v1/health' || pathname === '/health')) {
      sendJson(res, 200, {
        exito: true,
        servicio: 'BeautyFlash Colombia API — Arquitectura Evolucionada',
        moneda: BUSINESS_RULES.CURRENCY,
        comision_plataforma_porcentaje: BUSINESS_RULES.COMMISSION_PERCENT,
        comision_etapa1_confirmacion_porcentaje: 3,
        comision_etapa2_inicio_servicio_porcentaje: 7,
        recarga_minima_cop: BUSINESS_RULES.MIN_RECHARGE_COP,
        recarga_minima_formateada: formatCOP(BUSINESS_RULES.MIN_RECHARGE_COP),
        pasarela_pagos: 'Wompi Sandbox',
        firebase_usado: false,
      });
      return;
    }

    if (method === 'GET' && pathname === '/api/v1/realtime/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      const listener = (ev) => res.write(`data: ${JSON.stringify(ev)}\n\n`);
      realtimeBus.on('postgres_changes', listener);
      req.on('close', () => realtimeBus.off('postgres_changes', listener));
      return;
    }

    // =========================================================================
    // MÓDULO 1 & 2: AUTENTICACIÓN UNIFICADA, ROLES, MODALIDAD Y RECUPERACIÓN OTP
    // =========================================================================
    if (method === 'POST' && pathname === '/api/v1/auth/login') {
      const body = await parseBody(req);
      const loginResult = await unifiedLogin(body);
      if (body.device_token && loginResult.usuario?.id) {
        await registerDeviceToken({
          userId: loginResult.usuario.id,
          token: body.device_token,
          platform: body.platform || 'android',
          deviceId: body.device_id || null,
        });
      }
      sendJson(res, 200, loginResult);
      return;
    }

    if (method === 'POST' && pathname === '/api/v1/auth/switch-mode') {
      const body = await parseBody(req);
      const userId = body.user_id || req.headers['x-user-id'] || 1;
      sendJson(res, 200, await switchUserMode({ userId, targetMode: body.target_mode }));
      return;
    }

    if (method === 'POST' && pathname === '/api/v1/auth/upgrade-to-professional') {
      const body = await parseBody(req);
      const userId = body.user_id || req.headers['x-user-id'] || 1;
      sendJson(res, 201, await upgradeClientToProfessional({ userId, body }));
      return;
    }

    if (method === 'POST' && pathname === '/api/v1/auth/logout') {
      const body = await parseBody(req);
      const userId = body.user_id || req.headers['x-user-id'];
      const logoutRes = await deactivateDeviceTokenOnLogout({
        userId,
        token: body.device_token,
        deviceId: body.device_id,
      });
      sendJson(res, 200, logoutRes);
      return;
    }

    if (method === 'POST' && pathname === '/api/v1/auth/password-recovery/request') {
      sendJson(res, 200, await requestPasswordRecovery(await parseBody(req)));
      return;
    }

    if (method === 'POST' && pathname === '/api/v1/auth/password-recovery/verify-code') {
      sendJson(res, 200, await verifyPasswordRecoveryCode(await parseBody(req)));
      return;
    }

    if (method === 'POST' && pathname === '/api/v1/auth/password-recovery/reset') {
      sendJson(res, 200, await resetPasswordWithRecoveryToken(await parseBody(req)));
      return;
    }

    if (method === 'POST' && pathname === '/api/v1/auth/register/client') {
      sendJson(res, 201, await registrarCliente(await parseBody(req)));
      return;
    }
    if (method === 'POST' && pathname === '/api/v1/auth/register/professional') {
      sendJson(res, 201, await registrarProfesional(await parseBody(req)));
      return;
    }
    if (method === 'POST' && pathname === '/api/v1/auth/otp/send') {
      const body = await parseBody(req);
      sendJson(res, 200, await enviarCodigoOTP(body.telefono));
      return;
    }
    if (method === 'POST' && pathname === '/api/v1/auth/otp/verify') {
      const body = await parseBody(req);
      sendJson(res, 200, verificarCodigoOTP(body.telefono, body.codigo));
      return;
    }
    if (method === 'GET' && pathname === '/api/v1/auth/me') {
      const usuario = (await autenticarRequest(req)) || db.usuarios[0];
      sendJson(res, 200, { exito: true, usuario: armarPerfilUsuario(usuario) });
      return;
    }

    // =========================================================================
    // MÓDULO 3: SISTEMA UNIFICADO DE NOTIFICACIONES Y TOKENS DE DISPOSITIVO
    // =========================================================================
    if (method === 'POST' && pathname === '/api/v1/notifications/device-token') {
      const body = await parseBody(req);
      sendJson(
        res,
        201,
        await registerDeviceToken({
          userId: body.user_id || req.headers['x-user-id'],
          token: body.token,
          platform: body.platform,
          deviceId: body.device_id,
        })
      );
      return;
    }

    if (method === 'DELETE' && pathname === '/api/v1/notifications/device-token') {
      const body = await parseBody(req);
      sendJson(
        res,
        200,
        await deactivateDeviceTokenOnLogout({
          userId: body.user_id || req.headers['x-user-id'],
          token: body.token,
          deviceId: body.device_id,
        })
      );
      return;
    }

    if (method === 'GET' && pathname === '/api/v1/notifications') {
      const userId = query.user_id || req.headers['x-user-id'];
      sendJson(
        res,
        200,
        await listNotificationsForUser({
          userId,
          unreadOnly: query.unread_only === 'true',
        })
      );
      return;
    }

    if (method === 'POST' && pathname === '/api/v1/notifications/dispatch') {
      const body = await parseBody(req);
      sendJson(
        res,
        201,
        await dispatchTargetedNotification({
          recipientUserId: body.recipient_user_id,
          actorUserId: body.actor_user_id,
          roleTarget: body.role_target,
          title: body.title,
          body: body.body,
          type: body.type,
          entityType: body.entity_type,
          entityId: body.entity_id,
          targetScreen: body.target_screen,
          data: body.data,
          dedupKey: body.dedup_key,
        })
      );
      return;
    }

    if (method === 'POST' && pathname === '/api/v1/notifications/read-all') {
      const body = await parseBody(req);
      sendJson(
        res,
        200,
        await markNotificationAsRead({
          userId: body.user_id || req.headers['x-user-id'],
          markAll: true,
        })
      );
      return;
    }

    const matchNotifRead = pathname.match(/^\/api\/v1\/notifications\/([^/]+)\/read$/);
    if (matchNotifRead && (method === 'PATCH' || method === 'POST')) {
      const body = await parseBody(req);
      sendJson(
        res,
        200,
        await markNotificationAsRead({
          userId: body.user_id || req.headers['x-user-id'],
          notificationId: matchNotifRead[1],
        })
      );
      return;
    }

    // =========================================================================
    // MÓDULO 4 & 5: BILLETERA PROFESIONAL, WOMPI SANDBOX Y COMISIONES 3% / 7%
    // =========================================================================
    const matchWompiVoidReq = pathname.match(
      /^\/api\/v1\/wallet\/([^/]+)\/wompi\/request-void$/
    );
    if (matchWompiVoidReq && method === 'POST') {
      const body = await parseBody(req);
      sendJson(res, 200, await requestAdminWompiRechargeVoid(matchWompiVoidReq[1], body));
      return;
    }

    if (method === 'POST' && pathname === '/api/v1/webhooks/wompi') {
      const body = await parseBody(req);
      const headerChecksum = req.headers['x-event-checksum'] || null;
      sendJson(res, 200, await handleWompiSandboxWebhook(body, headerChecksum));
      return;
    }

    const matchWompiProcess = pathname.match(
      /^\/api\/v1\/wallet\/([^/]+)\/wompi\/process-sandbox-payment$/
    );
    if (matchWompiProcess && method === 'POST') {
      const body = await parseBody(req);
      sendJson(res, 200, await executeWompiSandboxPaymentAndWebhook(matchWompiProcess[1], body));
      return;
    }

    const matchWompiCreate = pathname.match(
      /^\/api\/v1\/wallet\/([^/]+)\/wompi\/create-transaction$/
    );
    if (matchWompiCreate && method === 'POST') {
      const body = await parseBody(req);
      if (req.headers['idempotency-key'] && !body.idempotency_key) {
        body.idempotency_key = req.headers['idempotency-key'];
      }
      sendJson(res, 201, await createWompiSandboxTransaction(matchWompiCreate[1], body));
      return;
    }

    const matchWalletSummary = pathname.match(/^\/api\/v1\/wallet\/([^/]+)\/summary$/);
    if (matchWalletSummary && method === 'GET') {
      sendJson(res, 200, getProfessionalWalletSummary(matchWalletSummary[1]));
      return;
    }

    const matchWalletTxDetail = pathname.match(
      /^\/api\/v1\/wallet\/([^/]+)\/transactions\/([^/]+)$/
    );
    if (matchWalletTxDetail && method === 'GET') {
      sendJson(res, 200, getWalletTransactionDetail(matchWalletTxDetail[1], matchWalletTxDetail[2]));
      return;
    }

    const matchWalletGet = pathname.match(/^\/api\/v1\/wallet\/([^/]+)$/);
    if (matchWalletGet && method === 'GET') {
      sendJson(res, 200, obtenerDetalleBilletera(matchWalletGet[1]));
      return;
    }

    const matchWalletRecharge = pathname.match(/^\/api\/v1\/wallet\/([^/]+)\/recharge$/);
    if (matchWalletRecharge && method === 'POST') {
      const body = await parseBody(req);
      if (req.headers['idempotency-key'] && !body.referencia_idempotencia) {
        body.referencia_idempotencia = req.headers['idempotency-key'];
      }
      sendJson(res, 200, await procesarRecargaBilletera(matchWalletRecharge[1], body));
      return;
    }

    const matchWalletCheck = pathname.match(/^\/api\/v1\/wallet\/([^/]+)\/check-commission$/);
    if (matchWalletCheck && method === 'GET') {
      const valorCop = Number(query.valor_servicio_cop || 50000);
      const baseRes = verificarCapacidadServicio(matchWalletCheck[1], valorCop);
      baseRes.desglose_etapas = calculateTwoStageCommission(valorCop);
      sendJson(res, 200, baseRes);
      return;
    }

    // =========================================================================
    // MÓDULO 5 & 6: CONTRATACIONES, COMISIONES (3% + 7%) Y TRACKING GPS
    // =========================================================================
    const matchConfirmClient = pathname.match(/^\/api\/v1\/bookings\/([^/]+)\/confirm-client$/);
    if (matchConfirmClient && method === 'POST') {
      const body = await parseBody(req);
      const bookingCode = matchConfirmClient[1];
      const proId = body.profesional_id || body.professional_id || 2;
      const totalCop = Number(body.precio_total_cop || body.total_price_cop || 50000);

      // Etapa 1: descontar 3% de comisión al confirmar la contratación
      const commStage1 = await chargeBookingCommissionByStage({
        bookingCode,
        professionalId: proId,
        stage: 1,
        totalPriceCop: totalCop,
      });

      await dispatchTargetedNotification({
        recipientUserId: proId,
        actorUserId: body.cliente_id || 1,
        roleTarget: 'profesional',
        title: 'Cliente confirmó la contratación',
        body: `La reserva #${bookingCode} fue confirmada definitivamente. Se descontó el 3% inicial (${formatCOP(commStage1.monto_descontado_cop)} COP).`,
        type: 'PRO_CLIENT_CONFIRMED',
        entityType: 'BOOKING',
        entityId: bookingCode,
      });

      sendJson(res, 200, {
        exito: true,
        codigo_reserva: bookingCode,
        estado: 'confirmada_por_cliente',
        comision_etapa_1: commStage1,
      });
      return;
    }

    const matchStartService = pathname.match(/^\/api\/v1\/bookings\/([^/]+)\/start-service$/);
    if (matchStartService && method === 'POST') {
      const body = await parseBody(req);
      const bookingCode = matchStartService[1];
      const proId = body.profesional_id || body.professional_id || 2;
      const clientId = body.cliente_id || body.client_id || 1;
      const totalCop = Number(body.precio_total_cop || body.total_price_cop || 50000);

      // Etapa 2: descontar 7% restante al comenzar el servicio
      const commStage2 = await chargeBookingCommissionByStage({
        bookingCode,
        professionalId: proId,
        stage: 2,
        totalPriceCop: totalCop,
      });

      await dispatchTargetedNotification({
        recipientUserId: clientId,
        actorUserId: proId,
        roleTarget: 'cliente',
        title: 'Servicio iniciado',
        body: `El servicio de la contratación #${bookingCode} ha comenzado oficialmente.`,
        type: 'CLIENT_SERVICE_STARTED',
        entityType: 'BOOKING',
        entityId: bookingCode,
      });

      sendJson(res, 200, {
        exito: true,
        codigo_reserva: bookingCode,
        estado: 'en_servicio',
        comision_etapa_2: commStage2,
      });
      return;
    }

    const matchCancelBooking = pathname.match(/^\/api\/v1\/bookings\/([^/]+)\/cancel-refund$/);
    if (matchCancelBooking && method === 'POST') {
      const body = await parseBody(req);
      const bookingCode = matchCancelBooking[1];
      const proId = body.profesional_id || body.professional_id || 2;
      const refundRes = await refundStage1CommissionOnCancel({
        bookingCode,
        professionalId: proId,
      });
      sendJson(res, 200, {
        exito: true,
        codigo_reserva: bookingCode,
        estado: 'cancelada',
        reembolso: refundRes,
      });
      return;
    }

    // Endpoints de Seguimiento GPS en Tiempo Real (Módulo 6)
    const matchTrackingLocation = pathname.match(
      /^\/api\/v1\/bookings\/([^/]+)\/tracking\/location$/
    );
    if (matchTrackingLocation && (method === 'POST' || method === 'PATCH')) {
      const body = await parseBody(req);
      const reqUserId = req.headers['x-user-id'] || body.user_id || null;
      sendJson(
        res,
        200,
        await updateProfessionalLiveLocation(matchTrackingLocation[1], body, reqUserId)
      );
      return;
    }

    const matchTrackingArrive = pathname.match(/^\/api\/v1\/bookings\/([^/]+)\/tracking\/arrive$/);
    if (matchTrackingArrive && method === 'POST') {
      const body = await parseBody(req);
      const reqUserId = req.headers['x-user-id'] || body.user_id || null;
      sendJson(
        res,
        200,
        await confirmProfessionalArrival(matchTrackingArrive[1], body, reqUserId)
      );
      return;
    }

    const matchTrackingGet = pathname.match(/^\/api\/v1\/bookings\/([^/]+)\/tracking$/);
    if (matchTrackingGet && method === 'GET') {
      const reqUserId = req.headers['x-user-id'] || query.user_id || null;
      sendJson(res, 200, getAuthorizedBookingTrackingState(matchTrackingGet[1], reqUserId));
      return;
    }

    // CATÁLOGO Y PROFESIONALES CERCANOS (POSTGIS)
    if (method === 'GET' && pathname === '/api/v1/categories') {
      sendJson(res, 200, { exito: true, categorias: db.categorias_servicio });
      return;
    }
    if (method === 'GET' && pathname === '/api/v1/services') {
      const servicios = db.servicios.map((s) => ({
        ...s,
        precio_formateado: formatCOP(s.precio_cop),
        comision_cop: calcularComisionCOP(s.precio_cop),
        desglose_comision: calculateTwoStageCommission(s.precio_cop),
      }));
      sendJson(res, 200, { exito: true, servicios });
      return;
    }
    if (method === 'GET' && pathname === '/api/v1/professionals/nearby') {
      const cercanos = buscarProfesionalesCercanos({
        latitud: Number(query.latitud || 3.3712),
        longitud: Number(query.longitud || -76.5320),
        radioMaxKm: Number(query.radio_km || 15),
        precioEstimadoCop: Number(query.precio_cop || 45000),
        modalidad: query.modalidad || 'domicilio',
      });
      sendJson(res, 200, { exito: true, profesionales: cercanos });
      return;
    }

    // PROFESIONALES: VERIFICACIÓN DNI/CERTIFICADO, SERVICIOS Y PRODUCTOS
    const matchProVerify = pathname.match(/^\/api\/v1\/professionals\/([^/]+)\/verification$/);
    if (matchProVerify && (method === 'POST' || method === 'PATCH')) {
      sendJson(res, 200, await gestionarVerificacionProfesional(matchProVerify[1], await parseBody(req)));
      return;
    }
    const matchProServices = pathname.match(/^\/api\/v1\/professionals\/([^/]+)\/services$/);
    if (matchProServices && method === 'POST') {
      const body = await parseBody(req);
      if (body.require_approval_guard) {
        assertUserHasRoleAndApproval(matchProServices[1], 'PROFESSIONAL', true);
      }
      sendJson(res, 201, crearServicioProfesional(matchProServices[1], body));
      return;
    }
    const matchProProducts = pathname.match(/^\/api\/v1\/professionals\/([^/]+)\/products$/);
    if (matchProProducts && method === 'POST') {
      sendJson(res, 201, crearProductoProfesional(matchProProducts[1], await parseBody(req)));
      return;
    }
    const matchProZone = pathname.match(/^\/api\/v1\/professionals\/([^/]+)\/availability$/);
    if (matchProZone && (method === 'PATCH' || method === 'POST')) {
      sendJson(res, 200, actualizarZonaYDisponibilidad(matchProZone[1], await parseBody(req)));
      return;
    }

    // RESERVAS Y SOLICITUDES DE SERVICIO COMPATIBLES
    if (method === 'POST' && pathname === '/api/v1/bookings') {
      sendJson(res, 201, await crearSolicitudOReserva(await parseBody(req)));
      return;
    }
    if (method === 'GET' && pathname === '/api/v1/bookings') {
      sendJson(res, 200, { exito: true, reservas: db.reservas_solicitudes.map(enriquecerReserva) });
      return;
    }
    const matchBookingAccept = pathname.match(/^\/api\/v1\/bookings\/([^/]+)\/accept$/);
    if (matchBookingAccept && method === 'POST') {
      const body = await parseBody(req);
      const result = await aceptarServicioConComisionTransaccional({
        reservaId: matchBookingAccept[1],
        profesionalId: body.profesional_id,
        latitudProfesional: body.latitud_profesional,
        longitudProfesional: body.longitud_profesional,
      });
      result.reserva = enriquecerReserva(result.reserva);
      sendJson(res, 200, result);
      return;
    }
    const matchBookingReject = pathname.match(/^\/api\/v1\/bookings\/([^/]+)\/reject$/);
    if (matchBookingReject && method === 'POST') {
      const body = await parseBody(req);
      sendJson(res, 200, await rechazarYReasignarReserva(matchBookingReject[1], body.profesional_id, body.motivo));
      return;
    }
    const matchBookingStatus = pathname.match(/^\/api\/v1\/bookings\/([^/]+)\/status$/);
    if (matchBookingStatus && (method === 'PATCH' || method === 'POST')) {
      sendJson(res, 200, await cambiarEstadoServicio(matchBookingStatus[1], await parseBody(req)));
      return;
    }
    const matchBookingLocation = pathname.match(/^\/api\/v1\/bookings\/([^/]+)\/location$/);
    if (matchBookingLocation && (method === 'POST' || method === 'PATCH')) {
      sendJson(res, 200, actualizarUbicacionEnVivo(matchBookingLocation[1], await parseBody(req)));
      return;
    }
    const matchBookingReview = pathname.match(/^\/api\/v1\/bookings\/([^/]+)\/review$/);
    if (matchBookingReview && method === 'POST') {
      sendJson(res, 201, await calificarServicio(matchBookingReview[1], await parseBody(req)));
      return;
    }

    // MAPAS Y STORAGE
    if (method === 'GET' && pathname === '/api/v1/maps/directions') {
      sendJson(res, 200, {
        exito: true,
        ruta: await obtenerRutaDirections({
          origenLat: Number(query.origen_lat || 3.3768),
          origenLng: Number(query.origen_lng || -76.5365),
          destinoLat: Number(query.destino_lat || 3.3712),
          destinoLng: Number(query.destino_lng || -76.5320),
        }),
      });
      return;
    }
    if (method === 'GET' && pathname === '/api/v1/maps/places') {
      sendJson(res, 200, { exito: true, lugares: await buscarLugaresPlaces(query.q || '') });
      return;
    }
    if (method === 'POST' && pathname === '/api/v1/storage/upload') {
      const body = await parseBody(req);
      sendJson(res, 201, {
        exito: true,
        archivo: await subirArchivoStorage({
          usuarioId: body.usuario_id || db.usuarios[0].id,
          profesionalId: body.profesional_id || null,
          tipoArchivo: body.tipo_archivo || 'foto_perfil',
          nombreArchivo: body.nombre_archivo || 'foto.jpg',
        }),
      });
      return;
    }

    sendJson(res, 404, { exito: false, error: `Ruta no encontrada: ${method} ${pathname}` });
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      exito: false,
      codigo: error.code || 'ERROR_NEGOCIO',
      error: error.message,
      ...(error.details ? { detalles: error.details } : {}),
    });
  }
}

module.exports = { handleApiRequest };
