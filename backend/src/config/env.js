/**
 * Archivo: backend/src/config/env.js
 * Configuración de Variables de Entorno del Backend (Supabase, Google Maps, Resend SMTP y Wompi Sandbox Oficial)
 */

const rawIntegrity =
  process.env.WOMPI_INTEGRITY_SECRET || 'test_integrity_nMaCRvNkgai1TzkWX9L0zWAZAcKOcn5Z';
const rawEvents =
  process.env.WOMPI_EVENTS_SECRET || 'test_events_yjuZ9QOMgvz4RAOt4N4Vr5IOoQlB4POm';

// Auto-detección inteligente por prefijo oficial de Wompi por si en el .env se invirtieron ambos secretos:
// - El secreto de integridad de Wompi siempre lleva el prefijo `test_integrity_`
// - El secreto de eventos (webhook) de Wompi siempre lleva el prefijo `test_events_`
const resolvedIntegritySecret = rawIntegrity.startsWith('test_integrity_')
  ? rawIntegrity
  : rawEvents.startsWith('test_integrity_')
  ? rawEvents
  : rawIntegrity;

const resolvedEventsSecret = rawEvents.startsWith('test_events_')
  ? rawEvents
  : rawIntegrity.startsWith('test_events_')
  ? rawIntegrity
  : rawEvents;

const env = {
  PORT: Number(process.env.PORT || 4000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://tcyndqzzawwcqqvcsbvu.supabase.co',
  SUPABASE_ANON_KEY:
    process.env.SUPABASE_ANON_KEY || 'sb_publishable_txO2mh73LE4sY8AqzTiujA_jniwTOrQ',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',

  // Configuración Oficial SMTP con Resend (Configurada también en Supabase Custom SMTP)
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.resend.com',
  SMTP_PORT: Number(process.env.SMTP_PORT || 465),
  SMTP_USER: process.env.SMTP_USER || 'resend',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'onboarding@resend.dev',
  SMTP_SENDER_NAME: process.env.SMTP_SENDER_NAME || 'BeautyFlash',

  // Credenciales Oficiales de Wompi Sandbox (Exclusivamente en el Backend)
  WOMPI_ENVIRONMENT: process.env.WOMPI_ENVIRONMENT || 'https://sandbox.wompi.co/v1',
  WOMPI_PUBLIC_KEY:
    process.env.WOMPI_PUBLIC_KEY || 'pub_test_2PuvSCJDswiY8c0wDeBEJxEgBaAsMtF2',
  WOMPI_PRIVATE_KEY:
    process.env.WOMPI_PRIVATE_KEY || 'prv_test_du4SLAEJduYTX2ijhMi9Kgh8pXjLP91k',
  WOMPI_INTEGRITY_SECRET: resolvedIntegritySecret,
  WOMPI_EVENTS_SECRET: resolvedEventsSecret,
};

module.exports = { env };
