/**
 * Archivo: backend/src/services/smtp.service.js
 * Servicio de Correo Electrónico para Recuperación de Contraseña (Resend SMTP / API + Supabase Custom SMTP):
 * - Utiliza exactamente la plantilla configurada en Supabase ("Código de recuperación de contraseña | BeautyFlash").
 * - Soporta envío directo por Resend SMTP TLS (`smtp.resend.com:465`), API HTTPS de Resend (`api.resend.com`)
 *   y Supabase Auth (`/auth/v1/recover`) sin duplicar correos.
 * - NUNCA expone el código OTP en la respuesta HTTP hacia el frontend.
 */

const tls = require('tls');
const net = require('net');
const { env } = require('../config/env');
const { supabaseAuthRequest } = require('../config/supabaseClient');

function buildRecoveryEmailHtml({ codigoOtp, correoDestino, minutosVigencia = 10 }) {
  return `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; color: #333;">
  <h2 style="color: #16a085;">BeautyFlash</h2>

  <h2>Recupera tu contraseña</h2>

  <p>
    Hemos recibido una solicitud para cambiar
    la contraseña de tu cuenta (${correoDestino}).
  </p>

  <p>Utiliza el siguiente código de verificación (válido por ${minutosVigencia} minutos):</p>

  <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
    ${codigoOtp}
  </div>
</div>`;
}

/**
 * Envío mediante protocolo SMTP sobre TLS directo (Puerto 465 SSL en smtp.resend.com)
 */
function sendRawSmtpTls({
  host,
  port,
  user,
  pass,
  fromEmail,
  senderName = 'BeautyFlash',
  toEmail,
  subject,
  htmlBody,
  textBody,
}) {
  return new Promise((resolve, reject) => {
    const socket =
      Number(port) === 465
        ? tls.connect({ host, port: Number(port), servername: host, rejectUnauthorized: false })
        : net.createConnection({ host, port: Number(port) });

    let step = 0;
    let buffer = '';
    const authUserB64 = Buffer.from(String(user), 'utf8').toString('base64');
    const authPassB64 = Buffer.from(String(pass).replace(/\s+/g, ''), 'utf8').toString('base64');
    const boundary = `bf_mime_${Date.now()}`;

    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('Tiempo de espera agotado al conectar con el servidor SMTP.'));
    }, 6500);

    const writeCmd = (cmd) => {
      socket.write(`${cmd}\r\n`);
    };

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      if (!buffer.endsWith('\r\n')) return;
      const lines = buffer.trim().split('\r\n');
      const lastLine = lines[lines.length - 1] || '';
      if (/^\d{3}-/.test(lastLine)) return;
      buffer = '';

      const code = parseInt(lastLine.slice(0, 3), 10);
      if (code >= 400) {
        clearTimeout(timer);
        socket.end();
        return reject(new Error(`Error SMTP (${code}): ${lastLine}`));
      }

      if (step === 0 && code === 220) {
        step = 1;
        writeCmd('EHLO beautyflash.co');
      } else if (step === 1 && code === 250) {
        step = 2;
        writeCmd('AUTH LOGIN');
      } else if (step === 2 && code === 334) {
        step = 3;
        writeCmd(authUserB64);
      } else if (step === 3 && code === 334) {
        step = 4;
        writeCmd(authPassB64);
      } else if (step === 4 && code === 235) {
        step = 5;
        writeCmd(`MAIL FROM:<${fromEmail}>`);
      } else if (step === 5 && code === 250) {
        step = 6;
        writeCmd(`RCPT TO:<${toEmail}>`);
      } else if (step === 6 && code === 250) {
        step = 7;
        writeCmd('DATA');
      } else if (step === 7 && code === 354) {
        step = 8;
        const mimeMessage = [
          `From: "${senderName}" <${fromEmail}>`,
          `To: <${toEmail}>`,
          `Subject: =?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`,
          'MIME-Version: 1.0',
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          'Content-Type: text/plain; charset="UTF-8"',
          'Content-Transfer-Encoding: 8bit',
          '',
          textBody,
          '',
          `--${boundary}`,
          'Content-Type: text/html; charset="UTF-8"',
          'Content-Transfer-Encoding: 8bit',
          '',
          htmlBody,
          '',
          `--${boundary}--`,
          '.',
        ].join('\r\n');
        writeCmd(mimeMessage);
      } else if (step === 8 && code === 250) {
        step = 9;
        clearTimeout(timer);
        writeCmd('QUIT');
        socket.end();
        resolve({ sent: true, provider: 'RESEND_SMTP_TLS' });
      }
    });

    socket.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Envío por API HTTPS de Resend (`https://api.resend.com/emails`) cuando `SMTP_PASS` es una API key `re_...`
 */
async function sendViaResendHttpApi({ apiKey, fromEmail, senderName = 'BeautyFlash', toEmail, subject, htmlBody, textBody }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${senderName} <${fromEmail}>`,
        to: [toEmail],
        subject,
        html: htmlBody,
        text: textBody,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Resend HTTP ${res.status}: ${errBody}`);
    }
    return { sent: true, provider: 'RESEND_HTTP_API' };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Envía el código de recuperación de 6 dígitos por correo electrónico:
 * 1. Usa Resend (`smtp.resend.com:465` o API HTTPS de Resend con ``)
 *    para entregar el código exacto almacenado en `password_recovery_otps` con la plantilla de BeautyFlash.
 * 2. Si el envío directo no está disponible, delega en `/auth/v1/recover` de Supabase Auth (que usa el mismo
 *    Custom SMTP de Resend configurado en el panel de Supabase) sin disparar llamadas duplicadas.
 */
async function enviarCorreoRecuperacionSMTP({ toEmail, codigoOtp }) {
  const cleanTo = String(toEmail || '').trim().toLowerCase();
  const smtpHost = process.env.SMTP_HOST || env.SMTP_HOST || 'smtp.resend.com';
  const smtpPort = Number(process.env.SMTP_PORT || env.SMTP_PORT || 465);
  const smtpUser = process.env.SMTP_USER || env.SMTP_USER || 'resend';
  const smtpPass =
    process.env.SMTP_PASS || env.SMTP_PASS || '';
  const smtpFrom = process.env.SMTP_FROM || env.SMTP_FROM || 'onboarding@resend.dev';
  const senderName = process.env.SMTP_SENDER_NAME || env.SMTP_SENDER_NAME || 'BeautyFlash';

  const subject = 'Código de recuperación de contraseña | BeautyFlash';
  const textBody = `BeautyFlash - Recupera tu contraseña. Utiliza el siguiente código de verificación: ${codigoOtp}`;
  const htmlBody = buildRecoveryEmailHtml({
    codigoOtp,
    correoDestino: cleanTo,
    minutosVigencia: 10,
  });

  let smtpSent = false;
  let supabaseSent = false;
  let transportUsed = 'SUPABASE_CUSTOM_SMTP_RESEND';

  // 1. Intentar por API HTTPS de Resend si la contraseña es una API Key de Resend (`re_...`)
  if (smtpPass && smtpPass.startsWith('re_')) {
    try {
      await sendViaResendHttpApi({
        apiKey: smtpPass,
        fromEmail: smtpFrom,
        senderName,
        toEmail: cleanTo,
        subject,
        htmlBody,
        textBody,
      });
      smtpSent = true;
      transportUsed = `RESEND_API (${smtpFrom})`;
    } catch (_apiErr) {
      smtpSent = false;
    }
  }

  // 2. Si no salió por API HTTPS, intentar por protocolo SMTPS en puerto 465 (`smtp.resend.com:465`)
  if (!smtpSent && smtpUser && smtpPass && !smtpPass.includes('TU_CONTRASENA')) {
    try {
      await sendRawSmtpTls({
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        pass: smtpPass,
        fromEmail: smtpFrom,
        senderName,
        toEmail: cleanTo,
        subject,
        htmlBody,
        textBody,
      });
      smtpSent = true;
      transportUsed = `SMTP (${smtpHost}:${smtpPort})`;
    } catch (_smtpErr) {
      smtpSent = false;
    }
  }

  // 3. Si el envío directo por Resend no se ejecutó, usar `/auth/v1/recover` de Supabase Auth
  //    (que usa la plantilla "Reset password" con {{ .Token }} y el Custom SMTP de Resend en Supabase)
  if (!smtpSent) {
    try {
      const recoverRes = await supabaseAuthRequest('/recover', 'POST', {
        email: cleanTo,
      });
      if (recoverRes?.ok) {
        supabaseSent = true;
        transportUsed = 'SUPABASE_AUTH_RECOVER_RESEND';
      }
    } catch (_supaErr) {}
  }

  return {
    exito: true,
    smtpSent,
    supabaseSent,
    transportUsed,
  };
}

module.exports = {
  buildRecoveryEmailHtml,
  enviarCorreoRecuperacionSMTP,
};
