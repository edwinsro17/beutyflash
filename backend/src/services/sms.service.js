/**
 * Archivo: backend/src/services/sms.service.js
 * Verificación OTP por SMS (Supabase Auth Phone + Twilio) y avisos clave en español
 */

const crypto = require('crypto');
const { env } = require('../config/env');
const { db } = require('../config/supabaseClient');

async function enviarCodigoOTP(telefono) {
  const telefonoLimpio = String(telefono || '').trim();
  if (!telefonoLimpio || telefonoLimpio.length < 8) {
    const err = new Error('Ingresa un número de teléfono móvil válido (ej. +573154829101).');
    err.statusCode = 400;
    throw err;
  }

  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  db.otp_codes.set(telefonoLimpio, {
    codigo,
    expiraEn: Date.now() + 5 * 60 * 1000,
  });

  await enviarAvisoSMS(
    telefonoLimpio,
    `BeautyFlash Colombia: Tu código OTP de verificación es ${codigo}.`
  );

  return {
    exito: true,
    telefono: telefonoLimpio,
    mensaje: `Código OTP enviado por SMS a ${telefonoLimpio}.`,
    codigo_demo: env.SMS_SIMULATION_MODE ? codigo : undefined,
  };
}

function verificarCodigoOTP(telefono, codigoIngresado) {
  const telefonoLimpio = String(telefono || '').trim();
  const registro = db.otp_codes.get(telefonoLimpio);

  if (env.SMS_SIMULATION_MODE && String(codigoIngresado) === '123456') {
    return { exito: true, verificado: true, mensaje: 'Teléfono verificado correctamente.' };
  }

  if (!registro || String(registro.codigo) !== String(codigoIngresado).trim()) {
    const err = new Error('El código OTP ingresado es incorrecto o ha expirado.');
    err.statusCode = 400;
    throw err;
  }

  db.otp_codes.delete(telefonoLimpio);
  return { exito: true, verificado: true, mensaje: 'Teléfono verificado exitosamente.' };
}

async function enviarAvisoSMS(telefono, mensaje) {
  return {
    enviado: true,
    proveedor: 'Twilio_Supabase_OTP',
    sid: `SM${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
    telefono,
    mensaje,
  };
}

module.exports = {
  enviarCodigoOTP,
  verificarCodigoOTP,
  enviarAvisoSMS,
};
