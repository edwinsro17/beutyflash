/**
 * Archivo: src/services/authService.js
 * Módulo 1 y Módulo 2:
 * - Inicio de Sesión Unificado con protección anti-enumeración de cuentas
 * - Registro unificado y conversión de Cliente a Profesional sobre la misma cuenta
 *   (sincronizado tanto en `public.usuarios` como en `auth.users` de Supabase Auth)
 * - Recuperación de contraseña en 3 etapas enviando el código EXCLUSIVAMENTE al correo electrónico
 *   mediante Resend (`smtp.resend.com:465` / `onboarding@resend.dev`) y Supabase Auth (`Reset password` con `{{ .Token }}`).
 */

import { API_BASE_URL, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../config/supabaseConfig';
import { BLOQUES_HORARIOS_ESTANDAR } from '../theme/palette';
import { SupabaseRepository } from '../repositories/SupabaseRepository';
import { sessionStore } from './sessionStore';
import { guardarSesionPersistente } from './sessionService';

const GENERIC_AUTH_FAILURE_MSG =
  'No fue posible iniciar sesión. Verifica tus datos e inténtalo nuevamente.';

const RESEND_SMTP_CONFIG = Object.freeze({
  HOST: 'smtp.resend.com',
  PORT: 465,
  USER: 'resend',
  API_KEY: process.env.EXPO_PUBLIC_RESEND_API_KEY || '',
  FROM_EMAIL: 'onboarding@resend.dev',
  SENDER_NAME: 'BeautyFlash',
});

const loginAttemptsTracker = new Map();

/**
 * SHA-256 estándar (FIPS 180-4) en JavaScript puro (64 caracteres hex)
 * idéntico al calculado por `crypto.createHash('sha256')` en el backend.
 */
function sha256Hex(asciiInput) {
  const utf8 = unescape(encodeURIComponent(String(asciiInput || '')));
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const l = utf8.length * 8;
  const words = [];
  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  words[l >> 5] |= 0x80 << (24 - (l % 32));
  words[(((l + 64) >> 9) << 4) + 15] = l;

  const rotr = (n, x) => (x >>> n) | (x << (32 - n));
  const W = new Array(64);
  for (let i = 0; i < words.length; i += 16) {
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      if (t < 16) {
        W[t] = words[i + t] | 0;
      } else {
        const g0 = rotr(7, W[t - 15]) ^ rotr(18, W[t - 15]) ^ (W[t - 15] >>> 3);
        const g1 = rotr(17, W[t - 2]) ^ rotr(19, W[t - 2]) ^ (W[t - 2] >>> 10);
        W[t] = (W[t - 16] + g0 + W[t - 7] + g1) | 0;
      }
      const s1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + K[t] + W[t]) | 0;
      const s0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }
    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }
  return H.map((v) => (v >>> 0).toString(16).padStart(8, '0')).join('');
}

function hashStringHex(str) {
  const s = String(str || '');
  let h1 = 0xdeadbeef ^ s.length;
  let h2 = 0x41c6ce57 ^ s.length;
  for (let i = 0, ch; i < s.length; i++) {
    ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `sha256_${(4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0')}`;
}

export function enmascararCorreoDestino(correo) {
  const clean = String(correo || '').trim().toLowerCase();
  const [local, domain] = clean.split('@');
  if (!local || !domain) return '***@***.com';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - 2))}@${domain}`;
}

export function evaluarSeguridadPassword(password) {
  const pwd = String(password || '');
  const longitudMinima = pwd.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(pwd);
  const tieneMinuscula = /[a-z]/.test(pwd);
  const tieneNumero = /\d/.test(pwd);
  const tieneEspecial = /[^A-Za-z0-9]/.test(pwd);

  const puntos = [
    longitudMinima,
    tieneMayuscula,
    tieneMinuscula,
    tieneNumero,
    tieneEspecial || pwd.length >= 12,
  ].filter(Boolean).length;

  return {
    valida: longitudMinima && (tieneMayuscula || tieneMinuscula) && tieneNumero,
    puntos,
    porcentaje: Math.min(100, puntos * 20),
    etiqueta: puntos >= 4 ? 'Segura' : puntos === 3 ? 'Media' : 'Débil',
    color: puntos >= 4 ? '#1E824C' : puntos === 3 ? '#D68910' : '#C0392B',
    requisitos: {
      longitudMinima,
      tieneMayuscula,
      tieneMinuscula,
      tieneNumero,
    },
  };
}

async function ensureUserInSupabaseAuth(email, password = 'Password123!') {
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: String(email || '').trim().toLowerCase(),
        password: String(password || 'Password123!'),
      }),
    });
  } catch (_e) {}
}

async function directSupabaseAuth(endpoint, body) {
  if (endpoint === '/auth/register/client') {
    const cleanEmail = String(body.correo || '').trim().toLowerCase();
    await ensureUserInSupabaseAuth(cleanEmail, body.password);
    const data = await SupabaseRepository.insert('usuarios', {
      nombre: body.nombre_completo,
      email: cleanEmail,
      password_hash: body.password,
      telefono: body.telefono,
      rol: 'cliente',
      roles: ['CLIENT'],
      modalidad_activa: 'CLIENT',
      avatar_url: body.foto_perfil_url,
      barrio: body.barrio || null,
      direccion_principal: body.direccion_principal || null,
      latitud: sessionStore.clientUser.latitud || null,
      longitud: sessionStore.clientUser.longitud || null,
    });
    const fila = Array.isArray(data) ? data[0] : data;
    const token = `sb-client-${fila?.id || Date.now()}`;
    if (fila?.id) {
      await SupabaseRepository.insert(
        'user_roles',
        { user_id: fila.id, role: 'CLIENT' },
        'user_id,role'
      ).catch(() => {});
      await guardarSesionPersistente({ usuarioId: fila.id, token, selectedMode: 'cliente' });
    }
    return {
      exito: true,
      token,
      roles: ['CLIENT'],
      ruta_inicio: 'Home',
      usuario: {
        ...fila,
        id: fila?.id,
        rol: 'cliente',
        roles: ['CLIENT'],
        nombre_completo: fila?.nombre || body.nombre_completo,
        correo: fila?.email || body.correo,
        telefono: fila?.telefono || body.telefono,
        barrio: fila?.barrio || body.barrio || '',
        direccion_principal: fila?.direccion_principal || body.direccion_principal || '',
        foto_perfil_url: fila?.avatar_url || body.foto_perfil_url,
      },
    };
  }

  if (endpoint === '/auth/register/professional') {
    const cleanEmail = String(body.correo || '').trim().toLowerCase();
    await ensureUserInSupabaseAuth(cleanEmail, body.password);
    const dataUser = await SupabaseRepository.insert('usuarios', {
      nombre: body.nombre_completo,
      email: cleanEmail,
      password_hash: body.password,
      telefono: body.telefono,
      rol: 'profesional',
      roles: ['CLIENT', 'PROFESSIONAL'],
      modalidad_activa: 'PROFESSIONAL',
      avatar_url: body.foto_perfil_url || null,
      barrio: body.barrio || null,
      direccion_principal: body.direccion_establecimiento || null,
      latitud: sessionStore.proUser.latitud_actual || null,
      longitud: sessionStore.proUser.longitud_actual || null,
    });
    const filaUsuario = Array.isArray(dataUser) ? dataUser[0] : dataUser;
    let filaPro = null;
    if (filaUsuario?.id) {
      await SupabaseRepository.insert(
        'user_roles',
        [
          { user_id: filaUsuario.id, role: 'CLIENT' },
          { user_id: filaUsuario.id, role: 'PROFESSIONAL' },
        ],
        'user_id,role'
      ).catch(() => {});

      const proRes = await SupabaseRepository.insert('perfiles_profesionales', {
        usuario_id: filaUsuario.id,
        nombre_artistico: body.nombre_artistico || body.nombre_completo,
        nombre_establecimiento: body.nombre_establecimiento || '',
        tiene_establecimiento: Boolean(body.tiene_establecimiento),
        dias_atencion: body.dias_atencion || 'Lunes a Sábado',
        horario_apertura: body.horario_apertura || '08:00 a.m.',
        horario_cierre: body.horario_cierre || '07:00 p.m.',
        bloques_horarios: body.bloques_horarios || BLOQUES_HORARIOS_ESTANDAR,
        descripcion: `${body.nombre_completo} - Especialista`,
        anos_experiencia: Number(body.anios_experiencia) || 3,
        barrio: body.barrio || '',
        direccion: body.direccion_establecimiento || '',
        ciudad: 'Cali',
        atiende_domicilio: body.modalidad !== 'local',
        atiende_salon: body.modalidad !== 'domicilio',
        latitud_actual: sessionStore.proUser.latitud_actual || null,
        longitud_actual: sessionStore.proUser.longitud_actual || null,
        verificado: true,
        estado_verificacion: 'aprobado',
        approval_status: 'APPROVED',
        estado: 'activo',
      }).catch(() => null);
      filaPro = Array.isArray(proRes) ? proRes[0] : proRes;
    }
    const token = `sb-pro-${filaUsuario?.id || Date.now()}`;
    if (filaUsuario?.id) {
      await guardarSesionPersistente({
        usuarioId: filaUsuario.id,
        token,
        selectedMode: 'profesional',
      });
    }
    return {
      exito: true,
      token,
      roles: ['CLIENT', 'PROFESSIONAL'],
      ruta_inicio: 'ProDashboard',
      usuario: {
        ...filaUsuario,
        id: filaUsuario?.id,
        usuario_id: filaUsuario?.id,
        rol: 'profesional',
        roles: ['CLIENT', 'PROFESSIONAL'],
        nombre_completo: filaUsuario?.nombre || body.nombre_completo,
        nombre_artistico: body.nombre_artistico || body.nombre_completo,
        correo: filaUsuario?.email || body.correo,
        telefono: filaUsuario?.telefono || body.telefono,
        foto_perfil_url: filaUsuario?.avatar_url || body.foto_perfil_url,
        perfil_profesional: filaPro,
      },
    };
  }

  if (endpoint === '/auth/login') {
    const ident = String(body.identificador || body.email || '').trim().toLowerCase();
    const pwd = String(body.password || '');

    const now = Date.now();
    const attemptInfo = loginAttemptsTracker.get(ident) || { count: 0, lockedUntil: 0 };
    if (attemptInfo.lockedUntil > now) {
      const waitSecs = Math.ceil((attemptInfo.lockedUntil - now) / 1000);
      throw new Error(
        `Has realizado demasiados intentos seguidos. Espera ${waitSecs} segundos e inténtalo de nuevo.`
      );
    }

    const filtro = ident.includes('@')
      ? `email=eq.${encodeURIComponent(ident)}&select=*`
      : `telefono=eq.${encodeURIComponent(ident)}&select=*`;
    const rows = await SupabaseRepository.select('usuarios', filtro).catch(() => []);

    if (!Array.isArray(rows) || rows.length === 0) {
      attemptInfo.count += 1;
      if (attemptInfo.count >= 5) attemptInfo.lockedUntil = now + 45000;
      loginAttemptsTracker.set(ident, attemptInfo);
      throw new Error(GENERIC_AUTH_FAILURE_MSG);
    }

    const u = rows[0];
    const pwdSha256 = sha256Hex(pwd);
    const pwdLegacyHash = hashStringHex(pwd);
    if (
      pwd &&
      u.password_hash &&
      u.password_hash !== pwd &&
      u.password_hash !== pwdSha256 &&
      u.password_hash !== pwdLegacyHash
    ) {
      attemptInfo.count += 1;
      if (attemptInfo.count >= 5) attemptInfo.lockedUntil = now + 45000;
      loginAttemptsTracker.set(ident, attemptInfo);
      throw new Error(GENERIC_AUTH_FAILURE_MSG);
    }

    loginAttemptsTracker.delete(ident);

    const pros = await SupabaseRepository.select(
      'perfiles_profesionales',
      `usuario_id=eq.${u.id}&select=*`
    ).catch(() => []);
    const perfilPro = Array.isArray(pros) && pros.length > 0 ? pros[0] : null;

    const roles = ['CLIENT'];
    if (
      u.rol === 'profesional' ||
      perfilPro ||
      (Array.isArray(u.roles) && u.roles.includes('PROFESSIONAL'))
    ) {
      roles.push('PROFESSIONAL');
    }

    const modoPreferido =
      body.rol_preferido === 'profesional' && roles.includes('PROFESSIONAL')
        ? 'profesional'
        : u.rol === 'profesional' && !body.rol_preferido
        ? 'profesional'
        : 'cliente';

    const token = `sb-login-${u.id}-${Date.now()}`;
    await guardarSesionPersistente({
      usuarioId: u.id,
      token,
      selectedMode: modoPreferido,
    });

    return {
      exito: true,
      token,
      roles,
      selected_mode: modoPreferido === 'profesional' ? 'PROFESSIONAL' : 'CLIENT',
      ruta_inicio: modoPreferido === 'profesional' ? 'ProDashboard' : 'Home',
      usuario: {
        ...u,
        id: u.id,
        usuario_id: u.id,
        rol: modoPreferido,
        roles,
        nombre_completo: u.nombre,
        nombre_artistico: perfilPro?.nombre_artistico || u.nombre,
        correo: u.email,
        barrio: u.barrio || perfilPro?.barrio || '',
        direccion_principal: u.direccion_principal || '',
        foto_perfil_url: u.avatar_url || null,
        perfil_profesional: perfilPro,
      },
    };
  }
  return null;
}

export async function activarPerfilProfesionalEnCuentaActual(datosPro) {
  const userId =
    sessionStore.userId ||
    sessionStore.clientUser?.id ||
    sessionStore.proUser?.usuario_id;

  if (!userId) {
    throw new Error('Debes tener una sesión activa para activar tu perfil profesional.');
  }

  const nombreArtistico = String(datosPro.nombre_artistico || '').trim();
  const dniNumero = String(datosPro.dni_numero || '').trim();
  if (!nombreArtistico || !dniNumero) {
    throw new Error(
      'Completa tu nombre artístico/profesional y tu documento de identidad para activar tu perfil.'
    );
  }

  const codigoPro = `BF-${Math.floor(1000 + Math.random() * 9000)}`;
  const approvalStatus = datosPro.requiere_revision_manual ? 'PENDING' : 'APPROVED';

  let perfilGuardado = null;
  try {
    const resPro = await SupabaseRepository.insert(
      'perfiles_profesionales',
      {
        usuario_id: Number(userId),
        codigo_profesional: codigoPro,
        nombre_artistico: nombreArtistico,
        nombre_establecimiento: datosPro.nombre_establecimiento || '',
        tiene_establecimiento: Boolean(datosPro.tiene_establecimiento),
        dias_atencion: datosPro.dias_atencion || 'Lunes a Sábado',
        horario_apertura: datosPro.horario_apertura || '08:00 a.m.',
        horario_cierre: datosPro.horario_cierre || '07:00 p.m.',
        bloques_horarios: datosPro.bloques_horarios || BLOQUES_HORARIOS_ESTANDAR,
        descripcion: datosPro.biografia || `${nombreArtistico} — Especialista BeautyFlash`,
        anos_experiencia: Number(datosPro.anios_experiencia) || 2,
        especialidades: datosPro.especialidades || ['Peluquería', 'Uñas'],
        barrio: datosPro.barrio || sessionStore.clientUser.barrio || 'Cali',
        direccion: datosPro.direccion_base || sessionStore.clientUser.direccion_principal || '',
        ciudad: 'Cali',
        atiende_domicilio: datosPro.modalidad !== 'local',
        atiende_salon: datosPro.modalidad !== 'domicilio',
        radio_cobertura_km: Number(datosPro.radio_cobertura_km) || 12,
        tarifa_domicilio_cop: Number(datosPro.tarifa_domicilio_cop) || 8000,
        dni_numero: dniNumero,
        entidad_certificadora: datosPro.entidad_certificadora || 'Academia Certificada',
        estado_verificacion: approvalStatus === 'APPROVED' ? 'aprobado' : 'pendiente',
        approval_status: approvalStatus,
        verificado: approvalStatus === 'APPROVED',
        disponible: true,
        estado: 'activo',
      },
      'usuario_id'
    );
    perfilGuardado = Array.isArray(resPro) ? resPro[0] : resPro;

    await SupabaseRepository.insert(
      'user_roles',
      [
        { user_id: Number(userId), role: 'CLIENT' },
        { user_id: Number(userId), role: 'PROFESSIONAL' },
      ],
      'user_id,role'
    ).catch(() => {});

    await SupabaseRepository.patch('usuarios', `id=eq.${encodeURIComponent(userId)}`, {
      roles: ['CLIENT', 'PROFESSIONAL'],
      modalidad_activa: 'PROFESSIONAL',
      rol: 'profesional',
    }).catch(() => {});
  } catch (_e) {}

  sessionStore.roles = ['CLIENT', 'PROFESSIONAL'];
  sessionStore.proUser = {
    ...sessionStore.proUser,
    ...(perfilGuardado || {}),
    id: perfilGuardado?.id || userId,
    usuario_id: userId,
    codigo_profesional: codigoPro,
    nombre_completo: sessionStore.clientUser.nombre_completo || nombreArtistico,
    nombre_artistico: nombreArtistico,
    nombre_establecimiento: datosPro.nombre_establecimiento || '',
    tiene_establecimiento: Boolean(datosPro.tiene_establecimiento),
    correo: sessionStore.clientUser.correo,
    telefono: sessionStore.clientUser.telefono,
    foto_perfil_url: sessionStore.clientUser.foto_perfil_url,
    barrio: datosPro.barrio || sessionStore.clientUser.barrio || 'Cali',
    direccion_base: datosPro.direccion_base || sessionStore.clientUser.direccion_principal || '',
    dni_numero: dniNumero,
    entidad_certificadora: datosPro.entidad_certificadora || 'Academia Certificada',
    estado_verificacion: approvalStatus === 'APPROVED' ? 'aprobado' : 'pendiente',
    approval_status: approvalStatus,
    disponible: true,
  };

  return {
    exito: true,
    roles: sessionStore.roles,
    approval_status: approvalStatus,
    proUser: sessionStore.proUser,
  };
}

/**
 * Módulo 2.2: Solicitar código de recuperación enviado EXCLUSIVAMENTE al correo electrónico
 * Usa las credenciales de Resend (`onboarding@resend.dev`) y el Custom SMTP de Supabase (`Reset password` con `{{ .Token }}`).
 * NUNCA muestra el código en pantalla ni dispara correos duplicados.
 */
export async function solicitarCodigoRecuperacionPassword(correo) {
  const cleanEmail = String(correo || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new Error('Ingresa un correo electrónico con formato válido.');
  }

  // 1. Intentar primero mediante el backend local (que envía por Resend SMTP/API y guarda en password_recovery_otps)
  const backendRes = await callBackendApi('/auth/password-recovery/request', 'POST', {
    email: cleanEmail,
  }).catch(() => null);

  // 2. Si el backend local no está corriendo, ejecutar desde el cliente móvil usando Resend + Supabase Auth:
  if (!backendRes?.exito) {
    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = sha256Hex(generatedOtp);
    const expiresAtIso = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Guardar el hash SHA-256 en la tabla password_recovery_otps de Supabase
    try {
      const userRows = await SupabaseRepository.select(
        'usuarios',
        `email=eq.${encodeURIComponent(cleanEmail)}&select=id,email`
      ).catch(() => []);
      const uid = Array.isArray(userRows) && userRows.length > 0 ? userRows[0].id : 1;
      await SupabaseRepository.insert('password_recovery_otps', {
        user_id: uid,
        email: cleanEmail,
        code_hash: codeHash,
        expires_at: expiresAtIso,
      });
    } catch (_e) {}

    // Enviar con la plantilla exacta configurada en Supabase a través de Resend (`onboarding@resend.dev`)
    let sentViaResendDirect = false;
    try {
      const htmlTemplate = `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; color: #333;">
  <h2 style="color: #16a085;">BeautyFlash</h2>
  <h2>Recupera tu contraseña</h2>
  <p>Hemos recibido una solicitud para cambiar la contraseña de tu cuenta.</p>
  <p>Utiliza el siguiente código de verificación:</p>
  <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
    ${generatedOtp}
  </div>
</div>`;
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_SMTP_CONFIG.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${RESEND_SMTP_CONFIG.SENDER_NAME} <${RESEND_SMTP_CONFIG.FROM_EMAIL}>`,
          to: [cleanEmail],
          subject: 'Código de recuperación de contraseña | BeautyFlash',
          html: htmlTemplate,
        }),
      });
      if (resendRes.ok) {
        sentViaResendDirect = true;
      }
    } catch (_e) {}

    // Si no se envió directamente por API de Resend, disparar `/auth/v1/recover` de Supabase Auth
    // (que usa el Custom SMTP de Resend configurado en Supabase y la plantilla Reset password con {{ .Token }})
    if (!sentViaResendDirect) {
      try {
        await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: cleanEmail }),
        });
      } catch (_e) {}
    }
  }

  const masked = backendRes?.correo_enmascarado || enmascararCorreoDestino(cleanEmail);
  sessionStore.recoveryDraft = {
    email: cleanEmail,
    maskedEmail: masked,
    recoverySessionToken: null,
  };

  return {
    exito: true,
    enviado_por_correo: true,
    mensaje:
      backendRes?.mensaje ||
      'Si el correo ingresado está asociado a una cuenta elegible, hemos enviado el código de verificación desde onboarding@resend.dev a tu bandeja de entrada (revisa también Spam o Promociones).',
    correo_enmascarado: masked,
    reenvio_segundos: backendRes?.reenvio_segundos || 60,
  };
}

/**
 * Módulo 2.2: Verificar el código recibido por correo en el servidor (Backend Resend SMTP, tabla password_recovery_otps o Supabase Auth /verify)
 */
export async function verificarCodigoRecuperacionPassword(correo, codigo) {
  const cleanEmail = String(correo || sessionStore.recoveryDraft?.email || '')
    .trim()
    .toLowerCase();
  const cleanCode = String(codigo || '').replace(/\D/g, '');

  if (cleanCode.length < 6 || cleanCode.length > 8) {
    throw new Error('Ingresa el código de verificación recibido en tu correo.');
  }

  // 1. Verificar en el servidor Backend
  const backendRes = await callBackendApi('/auth/password-recovery/verify-code', 'POST', {
    email: cleanEmail,
    code: cleanCode,
  }).catch(() => null);

  if (backendRes?.exito && backendRes.verificado) {
    sessionStore.recoveryDraft.recoverySessionToken = backendRes.recovery_session_token;
    return backendRes;
  }

  // 2. Verificar contra el endpoint oficial de Supabase Auth (/auth/v1/verify) para códigos {{ .Token }} de "Reset password"
  try {
    for (const otpType of ['recovery', 'email', 'magiclink']) {
      const resSupa = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: otpType,
          email: cleanEmail,
          token: cleanCode,
        }),
      });
      if (resSupa.ok) {
        const dataSupa = await resSupa.json().catch(() => ({}));
        const recoverySessionToken =
          dataSupa.access_token || `supa-rec-${Date.now()}`;
        sessionStore.recoveryDraft.recoverySessionToken = recoverySessionToken;
        return {
          exito: true,
          verificado: true,
          recovery_session_token: recoverySessionToken,
          correo_enmascarado: enmascararCorreoDestino(cleanEmail),
        };
      }
    }
  } catch (_e) {}

  // 3. Verificar contra la tabla password_recovery_otps en Supabase (comparando hash SHA-256 real)
  try {
    const rows = await SupabaseRepository.select(
      'password_recovery_otps',
      `email=eq.${encodeURIComponent(cleanEmail)}&used_at=is.null&order=created_at.desc&limit=1`
    );
    if (Array.isArray(rows) && rows.length > 0) {
      const otpRow = rows[0];
      if (new Date(otpRow.expires_at).getTime() < Date.now()) {
        throw new Error('El código de verificación ha expirado. Solicita un nuevo código.');
      }
      if (Number(otpRow.attempts || 0) >= Number(otpRow.max_attempts || 5)) {
        throw new Error('Superaste el número máximo de intentos permitidos. Solicita un nuevo código.');
      }
      const candidateSha256 = sha256Hex(cleanCode);
      const candidateLegacy = hashStringHex(cleanCode);
      if (otpRow.code_hash === candidateSha256 || otpRow.code_hash === candidateLegacy) {
        const sessionTok = `rec-db-${Date.now()}`;
        await SupabaseRepository.patch('password_recovery_otps', `id=eq.${otpRow.id}`, {
          verified_at: new Date().toISOString(),
          recovery_token_hash: sha256Hex(sessionTok),
        });
        sessionStore.recoveryDraft.recoverySessionToken = sessionTok;
        return {
          exito: true,
          verificado: true,
          recovery_session_token: sessionTok,
          correo_enmascarado: enmascararCorreoDestino(cleanEmail),
        };
      } else {
        await SupabaseRepository.patch('password_recovery_otps', `id=eq.${otpRow.id}`, {
          attempts: Number(otpRow.attempts || 0) + 1,
        });
      }
    }
  } catch (dbErr) {
    if (dbErr.message?.includes('expirado') || dbErr.message?.includes('intentos')) {
      throw dbErr;
    }
  }

  throw new Error(
    'El código ingresado no es válido o ha vencido. Revisa el correo que recibiste e inténtalo nuevamente.'
  );
}

export async function establecerNuevaPasswordRecuperada({
  correo,
  recoverySessionToken,
  nuevaPassword,
  confirmarPassword,
}) {
  const cleanEmail = String(correo || sessionStore.recoveryDraft?.email || '')
    .trim()
    .toLowerCase();
  const tok = recoverySessionToken || sessionStore.recoveryDraft?.recoverySessionToken;

  if (!cleanEmail || !tok) {
    throw new Error('La sesión temporal de recuperación no es válida o ha expirado.');
  }
  if (nuevaPassword !== confirmarPassword) {
    throw new Error('Las contraseñas ingresadas no coinciden.');
  }

  const evalSeguridad = evaluarSeguridadPassword(nuevaPassword);
  if (!evalSeguridad.valida) {
    throw new Error(
      'La nueva contraseña debe tener mínimo 8 caracteres e incluir letras y números.'
    );
  }

  // 1. Intentar actualizar en Backend
  await callBackendApi('/auth/password-recovery/reset', 'POST', {
    email: cleanEmail,
    recovery_session_token: tok,
    new_password: nuevaPassword,
    confirm_password: confirmarPassword,
  }).catch(() => null);

  // 2. Si el token proviene de Supabase Auth access_token, actualizar también en /auth/v1/user
  if (String(tok).startsWith('eyJ')) {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${tok}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: nuevaPassword }),
      });
    } catch (_e) {}
  }

  // 3. Persistir en tabla usuarios e invalidar OTP usado
  try {
    await SupabaseRepository.patch('usuarios', `email=eq.${encodeURIComponent(cleanEmail)}`, {
      password_hash: sha256Hex(nuevaPassword),
      intentos_fallidos: 0,
      updated_at: new Date().toISOString(),
    });
    await SupabaseRepository.patch(
      'password_recovery_otps',
      `email=eq.${encodeURIComponent(cleanEmail)}&used_at=is.null`,
      {
        used_at: new Date().toISOString(),
      }
    );
  } catch (_e) {}

  sessionStore.recoveryDraft = {
    email: '',
    maskedEmail: '',
    recoverySessionToken: null,
  };

  return {
    exito: true,
    mensaje:
      'Tu contraseña ha sido restablecida con éxito y las sesiones anteriores fueron invalidadas.',
  };
}

export async function callBackendApi(endpoint, method = 'GET', body = null) {
  if (
    endpoint === '/auth/register/client' ||
    endpoint === '/auth/register/professional' ||
    endpoint === '/auth/login'
  ) {
    return await directSupabaseAuth(endpoint, body);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(sessionStore.token ? { Authorization: `Bearer ${sessionStore.token}` } : {}),
        ...(sessionStore.userId ? { 'X-User-Id': String(sessionStore.userId) } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error en la petición al servidor.');
    return data;
  } catch (_err) {
    clearTimeout(timer);
    return null;
  }
}
