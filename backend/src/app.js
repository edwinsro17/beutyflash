/**
 * Archivo: backend/src/app.js
 * Enrutador HTTP Principal de la API REST y Stream de Tiempo Real
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
  iniciarSesion,
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, Idempotency-Key',
  });
  res.end(JSON.stringify(payload));
}

async function handleApiRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, Idempotency-Key',
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
        servicio: 'BeautyFlash Colombia API',
        moneda: BUSINESS_RULES.CURRENCY,
        comision_plataforma_porcentaje: BUSINESS_RULES.COMMISSION_PERCENT,
        recarga_minima_cop: BUSINESS_RULES.MIN_RECHARGE_COP,
        recarga_minima_formateada: formatCOP(BUSINESS_RULES.MIN_RECHARGE_COP),
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

    // AUTENTICACIÓN Y REGISTRO POR ROL (CLIENTE Y PROFESIONAL)
    if (method === 'POST' && pathname === '/api/v1/auth/register/client') {
      sendJson(res, 201, await registrarCliente(await parseBody(req)));
      return;
    }
    if (method === 'POST' && pathname === '/api/v1/auth/register/professional') {
      sendJson(res, 201, await registrarProfesional(await parseBody(req)));
      return;
    }
    if (method === 'POST' && pathname === '/api/v1/auth/login') {
      sendJson(res, 200, await iniciarSesion(await parseBody(req)));
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
      sendJson(res, 201, crearServicioProfesional(matchProServices[1], await parseBody(req)));
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

    // BILLETERA DEL PROFESIONAL ($10.000 COP MÍNIMO Y 10% COMISIÓN)
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
      sendJson(res, 200, verificarCapacidadServicio(matchWalletCheck[1], Number(query.valor_servicio_cop || 50000)));
      return;
    }

    // RESERVAS Y SOLICITUDES DE SERVICIO
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
    });
  }
}

module.exports = { handleApiRequest };
