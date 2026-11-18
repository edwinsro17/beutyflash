/**
 * Especificación OpenAPI 3.0 (Swagger) para la API REST de BeautyFlash Colombia.
 */
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'BeautyFlash Colombia API',
    version: '2.0.0',
    description: 'API REST modular para servicios de belleza a domicilio y en salón (COP, 10% comisión, Google Maps, Supabase).',
  },
  servers: [{ url: 'http://localhost:4000/api/v1' }],
  paths: {
    '/auth/login': {
      post: { summary: 'Iniciar sesión (Cliente o Profesional)', responses: { 200: { description: 'Sesión autenticada' } } },
    },
    '/auth/register/client': {
      post: { summary: 'Registrar nuevo cliente', responses: { 201: { description: 'Cliente creado' } } },
    },
    '/bookings': {
      post: { summary: 'Crear solicitud única de servicio', responses: { 201: { description: 'Solicitud creada' } } },
    },
    '/wallet/{id}/recharge': {
      post: { summary: 'Recargar billetera profesional (Mínimo $10.000 COP)', responses: { 200: { description: 'Saldo acreditado' } } },
    },
  },
};

module.exports = { openApiSpec };
