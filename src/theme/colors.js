/**
 * Fachada modular de compatibilidad.
 */
export { colors, BARRIOS_DISPONIBLES, BLOQUES_HORARIOS_ESTANDAR } from './palette';
export { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, GOOGLE_MAPS_API_KEY, API_BASE_URL } from '../config/supabaseConfig';
export { useResponsiveLayout } from '../hooks/useResponsiveLayout';
export { formatCOP, calcularComisionCOP } from '../utils/formatters';
export {
  USER_ROLES,
  APP_MODES,
  PROFESSIONAL_APPROVAL_STATUS,
  WALLET_TRANSACTION_TYPES,
  WOMPI_PAYMENT_STATUS,
  COMMISSION_RATES,
  calcularDesgloseComisionEtapas,
  NOTIFICATION_TYPES,
} from '../types/domainModels';
export {
  ESTADOS_SOLICITUD_OFICIALES,
  ESTADOS_DOMICILIO_ACTIVOS,
  formatearEtiquetaEstado,
  RequestStateFactory,
} from '../patterns/RequestStateFactory';
export {
  normalizarYValidarCoordenadas,
  calcularDistanciaMetros,
  calcularDistanciaKm,
  calcularRutaYDistanciaReal,
} from '../patterns/DistanceStrategy';
export { sessionStore } from '../services/sessionStore';
export { seleccionarYSubirFotografiaDispositivo } from '../services/storageService';
export { obtenerUbicacionExactaGPS } from '../services/locationService';
export {
  obtenerDeviceSignature,
  limpiarDatosUsuarioEnMemoria,
  marcarOnboardingComoVistoPermanentemente,
  guardarSesionPersistente,
  cambiarModalidadSinCerrarSesion,
  verificarEstadoInicialYSesion,
  cerrarSesionActiva,
} from '../services/sessionService';
export {
  enmascararCorreoDestino,
  evaluarSeguridadPassword,
  activarPerfilProfesionalEnCuentaActual,
  solicitarCodigoRecuperacionPassword,
  verificarCodigoRecuperacionPassword,
  establecerNuevaPasswordRecuperada,
  callBackendApi,
} from '../services/authService';
export {
  WOMPI_PUBLIC_SANDBOX_KEY,
  MENSAJE_OFICIAL_NOTIFICACION_ANULACION,
  WOMPI_OFFICIAL_SANDBOX_DATA,
  evaluarParametrosWompiSandbox,
  obtenerSaldoRealProfesionalDesdeSupabase,
  desactivarServiciosDeProfesionalSinSaldo,
  sincronizarBilleteraDesdeSupabase,
  iniciarTransaccionWompiSandbox,
  procesarConfirmacionWebhookWompiSandbox,
  ejecutarPagoConDatosPruebaWompiSandbox,
  solicitarAnulacionAdministrativaRecargaWompi,
  confirmarWebhookAnulacionVoidedWompi,
  ejecutarCobroComisionEtapa,
} from '../services/walletService';
export {
  resolverRutaNotificacion,
  navegarDesdeNotificacion,
} from '../services/notificationRouterService';
export {
  obtenerSolicitudActiva,
  obtenerSaldoConocidoProfesional,
  obtenerServiciosActivosParaClientes,
  guardarServicioCatalogoEnSupabase,
  agregarNotificacionTiempoReal,
  marcarNotificacionesComoLeidas,
  verificarDisponibilidadEspecialista,
  crearUnicaSolicitudServicio,
  responderSolicitudPorProfesional,
  confirmarDefinitivamentePorCliente,
  confirmarLlegadaProfesionalAlDestino,
  actualizarEstadoSolicitudActiva,
  enviarMensajeChatServicio,
  sincronizarEstadoDesdeSupabase,
} from '../services/bookingService';
