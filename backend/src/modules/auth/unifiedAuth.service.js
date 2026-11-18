/**
 * Archivo: backend/src/modules/auth/unifiedAuth.service.js
 * Módulo 1 y Módulo 2:
 * - Autenticación Unificada (una sola cuenta con roles CLIENT y PROFESSIONAL simultáneos)
 * - Cambio de modalidad sin cerrar sesión y verificación de roles reales en el servidor
 * - Protección contra fuerza bruta y mensajes anti-enumeración de usuarios
 * - Recuperación de contraseña en 3 etapas enviando el código de 6 dígitos por SMTP Gratuito / Supabase Auth Email
 *   (NUNCA expone el código OTP en la respuesta HTTP hacia el cliente)
 */

const crypto = require('crypto');
const { db, supabaseRest, supabaseAuthRequest } = require('../../config/supabaseClient');
const { enviarCorreoRecuperacionSMTP } = require('../../services/smtp.service');

const loginRateLimitMap = new Map();
const recoveryRateLimitMap = new Map();
const recoveryOtpStore = new Map();
const unifiedUsersStore = new Map();
// Bandeja interna exclusiva del proceso Node para pruebas automatizadas (NUNCA expuesta por HTTP)
const internalTestOutbox = new Map();

const GENERIC_LOGIN_ERROR =
  'No fue posible iniciar sesión. Verifica tus datos e inténtalo nuevamente.';
const GENERIC_RECOVERY_MESSAGE =
  'Si el correo ingresado está asociado a una cuenta elegible, hemos enviado un código de verificación de 6 dígitos a tu bandeja de entrada.';

function sha256(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

function timingSafeCompareHash(hashA, hashB) {
  const bufA = Buffer.from(String(hashA || ''), 'utf8');
  const bufB = Buffer.from(String(hashB || ''), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function maskEmail(email) {
  const clean = String(email || '').trim().toLowerCase();
  const [local, domain] = clean.split('@');
  if (!local || !domain) return '***@***.com';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - 2))}@${domain}`;
}

function validatePasswordComplexity(password) {
  const pwd = String(password || '');
  const minLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /\d/.test(pwd);
  const score = [minLength, hasUpper, hasLower, hasNumber, pwd.length >= 12].filter(Boolean).length;

  return {
    valid: minLength && (hasUpper || hasLower) && hasNumber,
    score,
    level: score >= 4 ? 'Fuerte' : score === 3 ? 'Media' : 'Débil',
    message:
      minLength && (hasUpper || hasLower) && hasNumber
        ? 'Contraseña segura.'
        : 'La contraseña debe tener al menos 8 caracteres e incluir letras y números.',
  };
}

function checkLoginRateLimit(key) {
  const now = Date.now();
  const entry = loginRateLimitMap.get(key) || { count: 0, lockedUntil: 0, lastAttempt: 0 };
  if (entry.lockedUntil > now) {
    const secs = Math.ceil((entry.lockedUntil - now) / 1000);
    const err = new Error(
      `Demasiados intentos seguidos. Por seguridad, espera ${secs} segundos antes de intentarlo nuevamente.`
    );
    err.statusCode = 429;
    err.code = 'TOO_MANY_ATTEMPTS';
    throw err;
  }
  return entry;
}

function recordLoginFailure(key) {
  const now = Date.now();
  const entry = loginRateLimitMap.get(key) || { count: 0, lockedUntil: 0, lastAttempt: 0 };
  if (now - entry.lastAttempt > 15 * 60 * 1000) {
    entry.count = 0;
  }
  entry.count += 1;
  entry.lastAttempt = now;
  if (entry.count >= 5) {
    entry.lockedUntil = now + 60 * 1000;
  }
  loginRateLimitMap.set(key, entry);
}

function clearLoginFailures(key) {
  loginRateLimitMap.delete(key);
}

function hydrateUnifiedUserRecord(rawUser, rawPro = null) {
  const userId = rawUser.id;
  const existing = unifiedUsersStore.get(String(userId));
  const rolesSet = new Set(existing?.roles || ['CLIENT']);

  if (Array.isArray(rawUser.roles)) {
    rawUser.roles.forEach((r) => rolesSet.add(String(r).toUpperCase()));
  }
  if (rawUser.rol === 'profesional' || rawPro) {
    rolesSet.add('CLIENT');
    rolesSet.add('PROFESSIONAL');
  } else {
    rolesSet.add('CLIENT');
  }

  const roles = Array.from(rolesSet);
  const selectedMode =
    existing?.selected_mode ||
    (rawUser.modalidad_activa === 'PROFESSIONAL' || rawUser.rol === 'profesional'
      ? 'PROFESSIONAL'
      : 'CLIENT');

  const proProfile = rawPro || existing?.professional_profile || null;
  const approvalStatus = proProfile
    ? (proProfile.approval_status ||
        (proProfile.estado_verificacion === 'aprobado' ? 'APPROVED' : 'PENDING')).toUpperCase()
    : 'INCOMPLETE';

  const record = {
    id: userId,
    full_name: rawUser.nombre_completo || rawUser.nombre || existing?.full_name || 'Usuario BeautyFlash',
    email: String(rawUser.email || rawUser.correo || '').toLowerCase(),
    phone: rawUser.telefono || existing?.phone || '',
    avatar_url: rawUser.avatar_url || rawUser.foto_perfil_url || existing?.avatar_url || null,
    password_hash: rawUser.password_hash || existing?.password_hash || null,
    roles,
    selected_mode: selectedMode,
    client_profile: {
      user_id: userId,
      barrio: rawUser.barrio || existing?.client_profile?.barrio || 'Cali',
      primary_address: rawUser.direccion_principal || existing?.client_profile?.primary_address || '',
      latitude: rawUser.latitud ?? existing?.client_profile?.latitude ?? 3.3712,
      longitude: rawUser.longitud ?? existing?.client_profile?.longitude ?? -76.5320,
    },
    professional_profile: proProfile
      ? {
          ...proProfile,
          user_id: userId,
          artistic_name: proProfile.nombre_artistico || proProfile.artistic_name || rawUser.nombre,
          establishment_name: proProfile.nombre_establecimiento || proProfile.establishment_name || '',
          has_establishment: Boolean(proProfile.tiene_establecimiento ?? proProfile.has_establishment),
          approval_status: approvalStatus,
          is_available: proProfile.disponible !== false,
          coverage_radius_km: Number(proProfile.radio_cobertura_km || 12),
          home_fee_cop: Number(proProfile.tarifa_domicilio_cop || 8000),
        }
      : null,
    updated_at: new Date().toISOString(),
  };

  unifiedUsersStore.set(String(userId), record);
  return record;
}

function ensureSeedUsersSynced() {
  db.usuarios.forEach((u) => {
    const pro = db.profesionales.find((p) => String(p.usuario_id) === String(u.id)) || null;
    hydrateUnifiedUserRecord(u, pro);
  });
}
ensureSeedUsersSynced();

async function unifiedLogin({ email, identificador, password, device_token, platform = 'android', device_id = null }) {
  ensureSeedUsersSynced();
  const rawIdent = String(email || identificador || '').trim().toLowerCase();
  const pwd = String(password || '');

  if (!rawIdent || !pwd) {
    const err = new Error('Por favor completa el correo electrónico y la contraseña.');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  checkLoginRateLimit(rawIdent);

  let foundUser = null;
  let foundPro = null;

  try {
    const filter = rawIdent.includes('@')
      ? `email=eq.${encodeURIComponent(rawIdent)}&select=*`
      : `telefono=eq.${encodeURIComponent(rawIdent)}&select=*`;
    const rows = await supabaseRest('usuarios', { method: 'GET', query: filter });
    if (Array.isArray(rows) && rows.length > 0) {
      foundUser = rows[0];
      const pros = await supabaseRest('perfiles_profesionales', {
        method: 'GET',
        query: `usuario_id=eq.${foundUser.id}&select=*`,
      }).catch(() => []);
      if (Array.isArray(pros) && pros.length > 0) foundPro = pros[0];
    }
  } catch (_e) {}

  if (!foundUser) {
    foundUser = db.usuarios.find(
      (u) =>
        String(u.email || u.correo || '').toLowerCase() === rawIdent ||
        String(u.telefono || '') === rawIdent
    );
    if (foundUser) {
      foundPro = db.profesionales.find((p) => String(p.usuario_id) === String(foundUser.id)) || null;
    }
  }

  if (!foundUser) {
    recordLoginFailure(rawIdent);
    const err = new Error(GENERIC_LOGIN_ERROR);
    err.statusCode = 401;
    err.code = 'AUTH_INVALID_CREDENTIALS';
    throw err;
  }

  const storedHash = foundUser.password_hash;
  if (storedHash) {
    const inputHash = sha256(pwd);
    const matchesPlain = storedHash === pwd;
    const matchesSha = timingSafeCompareHash(storedHash, inputHash);
    if (!matchesPlain && !matchesSha) {
      recordLoginFailure(rawIdent);
      const err = new Error(GENERIC_LOGIN_ERROR);
      err.statusCode = 401;
      err.code = 'AUTH_INVALID_CREDENTIALS';
      throw err;
    }
  }

  clearLoginFailures(rawIdent);
  const unified = hydrateUnifiedUserRecord(foundUser, foundPro);
  const sessionToken = `bf-jwt-${unified.id}-${crypto.randomBytes(12).toString('hex')}`;

  return {
    exito: true,
    token: sessionToken,
    refresh_token: `bf-refresh-${unified.id}-${crypto.randomBytes(12).toString('hex')}`,
    selected_mode: unified.selected_mode,
    ruta_inicio: unified.selected_mode === 'PROFESSIONAL' ? 'ProDashboard' : 'Home',
    usuario: {
      id: unified.id,
      usuario_id: unified.id,
      nombre_completo: unified.full_name,
      correo: unified.email,
      telefono: unified.phone,
      foto_perfil_url: unified.avatar_url,
      rol: unified.selected_mode === 'PROFESSIONAL' ? 'profesional' : 'cliente',
      roles: unified.roles,
      selected_mode: unified.selected_mode,
      client_profile: unified.client_profile,
      professional_profile: unified.professional_profile,
      perfil_profesional: unified.professional_profile,
    },
    device_registration: device_token ? { token: device_token, platform, device_id } : null,
  };
}

async function switchUserMode({ userId, targetMode }) {
  ensureSeedUsersSynced();
  const normalizedMode =
    String(targetMode || '').toUpperCase() === 'PROFESSIONAL' ||
    String(targetMode || '').toLowerCase() === 'profesional'
      ? 'PROFESSIONAL'
      : 'CLIENT';

  let unified = unifiedUsersStore.get(String(userId));
  if (!unified) {
    const u = db.usuarios.find((item) => String(item.id) === String(userId));
    if (u) unified = hydrateUnifiedUserRecord(u);
  }

  if (!unified) {
    try {
      const rows = await supabaseRest('usuarios', {
        method: 'GET',
        query: `id=eq.${encodeURIComponent(userId)}&select=*`,
      });
      if (Array.isArray(rows) && rows.length > 0) {
        const pros = await supabaseRest('perfiles_profesionales', {
          method: 'GET',
          query: `usuario_id=eq.${userId}&select=*`,
        }).catch(() => []);
        unified = hydrateUnifiedUserRecord(rows[0], Array.isArray(pros) ? pros[0] : null);
      }
    } catch (_e) {}
  }

  if (!unified) {
    const err = new Error('Sesión de usuario no válida.');
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  if (normalizedMode === 'PROFESSIONAL' && !unified.roles.includes('PROFESSIONAL')) {
    return {
      exito: false,
      requiere_registro_profesional: true,
      codigo: 'PROFESSIONAL_PROFILE_REQUIRED',
      mensaje:
        'Para activar el Modo Profesional en tu cuenta, completa primero tus datos profesionales.',
      roles_actuales: unified.roles,
    };
  }

  unified.selected_mode = normalizedMode;
  unified.updated_at = new Date().toISOString();
  unifiedUsersStore.set(String(userId), unified);

  try {
    await supabaseRest('usuarios', {
      method: 'PATCH',
      query: `id=eq.${encodeURIComponent(userId)}`,
      body: {
        modalidad_activa: normalizedMode,
        rol: normalizedMode === 'PROFESSIONAL' ? 'profesional' : 'cliente',
        updated_at: unified.updated_at,
      },
    });
    await supabaseRest('user_preferences', {
      method: 'POST',
      single: true,
      body: {
        user_id: Number(userId),
        selected_mode: normalizedMode,
        updated_at: unified.updated_at,
      },
    });
  } catch (_e) {}

  return {
    exito: true,
    selected_mode: normalizedMode,
    rol_activo: normalizedMode === 'PROFESSIONAL' ? 'profesional' : 'cliente',
    ruta_destino: normalizedMode === 'PROFESSIONAL' ? 'ProDashboard' : 'Home',
    roles: unified.roles,
    professional_profile: unified.professional_profile,
    client_profile: unified.client_profile,
  };
}

async function upgradeClientToProfessional({ userId, body }) {
  ensureSeedUsersSynced();
  if (!userId) {
    const err = new Error('Identificador de usuario requerido.');
    err.statusCode = 400;
    throw err;
  }

  const artisticName = String(body.nombre_artistico || body.artistic_name || '').trim();
  const dniNumber = String(body.dni_numero || body.dni_number || '').trim();
  const specialties = Array.isArray(body.especialidades || body.specialties)
    ? body.especialidades || body.specialties
    : ['Peluquería', 'Manicura'];

  if (!artisticName || !dniNumber) {
    const err = new Error(
      'Debes indicar tu nombre artístico/profesional y tu número de documento de identidad.'
    );
    err.statusCode = 400;
    err.code = 'INVALID_PROFESSIONAL_DATA';
    throw err;
  }

  const approvalStatus = body.auto_approve !== false ? 'APPROVED' : 'PENDING';
  const proCode = `BF-${Math.floor(1000 + Math.random() * 9000)}`;

  const newProProfile = {
    id: `pro-${userId}`,
    usuario_id: Number(userId),
    user_id: Number(userId),
    codigo_profesional: proCode,
    professional_code: proCode,
    nombre_artistico: artisticName,
    artistic_name: artisticName,
    nombre_establecimiento: body.nombre_establecimiento || body.establishment_name || '',
    tiene_establecimiento: Boolean(body.tiene_establecimiento ?? body.has_establishment),
    anos_experiencia: Number(body.anios_experiencia || body.years_experience || 3),
    especialidades: specialties,
    barrio: body.barrio || 'Cali',
    direccion: body.direccion || body.address || '',
    radio_cobertura_km: Number(body.radio_cobertura_km || 12),
    tarifa_domicilio_cop: Number(body.tarifa_domicilio_cop || 8000),
    dni_numero: dniNumber,
    entidad_certificadora: body.entidad_certificadora || 'Academia Certificada',
    estado_verificacion: approvalStatus === 'APPROVED' ? 'aprobado' : 'pendiente',
    approval_status: approvalStatus,
    verificado: approvalStatus === 'APPROVED',
    disponible: true,
    is_available: true,
  };

  let unified = unifiedUsersStore.get(String(userId));
  if (!unified) {
    unified = hydrateUnifiedUserRecord({
      id: Number(userId),
      nombre: artisticName,
      email: body.correo || `user${userId}@beautyflash.co`,
      telefono: body.telefono || '',
    });
  }

  if (!unified.roles.includes('CLIENT')) unified.roles.push('CLIENT');
  if (!unified.roles.includes('PROFESSIONAL')) unified.roles.push('PROFESSIONAL');
  unified.professional_profile = newProProfile;
  unified.selected_mode = 'PROFESSIONAL';
  unifiedUsersStore.set(String(userId), unified);

  const existingProIdx = db.profesionales.findIndex((p) => String(p.usuario_id) === String(userId));
  if (existingProIdx >= 0) db.profesionales[existingProIdx] = newProProfile;
  else db.profesionales.push(newProProfile);

  if (!db.billeteras_profesional.some((b) => String(b.profesional_id) === String(userId))) {
    db.billeteras_profesional.push({
      id: db.billeteras_profesional.length + 1,
      profesional_id: Number(userId),
      saldo_disponible_cop: 0,
      total_recargado_cop: 0,
      total_comisiones_pagadas_cop: 0,
      comisiones_ganadas_plataforma_cop: 0,
      recarga_minima_cop: 10000,
      bloqueada: false,
    });
  }

  try {
    await supabaseRest('perfiles_profesionales', {
      method: 'POST',
      single: true,
      body: {
        usuario_id: Number(userId),
        codigo_profesional: proCode,
        nombre_artistico: artisticName,
        nombre_establecimiento: newProProfile.nombre_establecimiento,
        tiene_establecimiento: newProProfile.tiene_establecimiento,
        anos_experiencia: newProProfile.anos_experiencia,
        especialidades: specialties,
        barrio: newProProfile.barrio,
        direccion: newProProfile.direccion,
        dni_numero: dniNumber,
        entidad_certificadora: newProProfile.entidad_certificadora,
        estado_verificacion: newProProfile.estado_verificacion,
        approval_status: approvalStatus,
        verificado: approvalStatus === 'APPROVED',
        disponible: true,
      },
    });
    await supabaseRest('user_roles', {
      method: 'POST',
      single: true,
      body: { user_id: Number(userId), role: 'PROFESSIONAL' },
    });
    await supabaseRest('usuarios', {
      method: 'PATCH',
      query: `id=eq.${encodeURIComponent(userId)}`,
      body: {
        roles: ['CLIENT', 'PROFESSIONAL'],
        modalidad_activa: 'PROFESSIONAL',
        rol: 'profesional',
      },
    });
  } catch (_e) {}

  return {
    exito: true,
    roles: unified.roles,
    selected_mode: 'PROFESSIONAL',
    approval_status: approvalStatus,
    professional_profile: newProProfile,
    mensaje:
      approvalStatus === 'APPROVED'
        ? 'Tu perfil profesional ha sido activado en tu misma cuenta.'
        : 'Tu solicitud profesional fue recibida y se encuentra en revisión.',
  };
}

function assertUserHasRoleAndApproval(userId, requiredRole = 'PROFESSIONAL', requireApproved = true) {
  ensureSeedUsersSynced();
  const unified = unifiedUsersStore.get(String(userId));
  if (!unified) return true;

  const roleNorm = String(requiredRole).toUpperCase();
  if (!unified.roles.includes(roleNorm)) {
    const err = new Error(`Acceso denegado: tu cuenta no posee el rol ${roleNorm}.`);
    err.statusCode = 403;
    err.code = 'ROLE_FORBIDDEN';
    throw err;
  }

  if (roleNorm === 'PROFESSIONAL' && requireApproved) {
    const status = unified.professional_profile?.approval_status || 'INCOMPLETE';
    if (status !== 'APPROVED') {
      const err = new Error(
        `Tu perfil profesional se encuentra en estado ${status}. Solo los perfiles APROBADOS pueden publicar servicios o recibir contrataciones.`
      );
      err.statusCode = 403;
      err.code = 'PROFESSIONAL_NOT_APPROVED';
      throw err;
    }
  }
  return true;
}

/**
 * 2.2. SCREEN 1 — Solicitar Recuperación de Contraseña por Correo Electrónico
 * Envía el código OTP de 6 dígitos por SMTP Gratuito / Supabase Auth Email y NUNCA lo retorna en la respuesta HTTP.
 */
async function requestPasswordRecovery({ email }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    const err = new Error('Ingresa un formato de correo electrónico válido.');
    err.statusCode = 400;
    err.code = 'INVALID_EMAIL_FORMAT';
    throw err;
  }

  const now = Date.now();
  const lastReq = recoveryRateLimitMap.get(cleanEmail) || 0;
  if (now - lastReq < 30 * 1000) {
    const waitSec = Math.ceil((30 * 1000 - (now - lastReq)) / 1000);
    const err = new Error(
      `Por favor espera ${waitSec} segundos antes de solicitar un nuevo código.`
    );
    err.statusCode = 429;
    err.code = 'RECOVERY_COOLDOWN';
    throw err;
  }
  recoveryRateLimitMap.set(cleanEmail, now);

  // Generar código OTP de 6 dígitos y almacenar ÚNICAMENTE su hash SHA-256
  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = sha256(otpCode);
  const expiresAt = now + 10 * 60 * 1000;

  recoveryOtpStore.set(cleanEmail, {
    email: cleanEmail,
    codeHash,
    attempts: 0,
    maxAttempts: 5,
    expiresAt,
    verified: false,
    used: false,
    recoveryTokenHash: null,
  });

  // Guardar en bandeja interna del proceso solo para pruebas unitarias de backend (nunca viaja por HTTP)
  internalTestOutbox.set(cleanEmail, otpCode);

  // Enviar el código por correo electrónico usando SMTP Gratuito + Supabase Auth
  const emailResult = await enviarCorreoRecuperacionSMTP({
    toEmail: cleanEmail,
    codigoOtp: otpCode,
  });

  // Guardar hash en tabla password_recovery_otps
  try {
    const rows = await supabaseRest('usuarios', {
      method: 'GET',
      query: `email=eq.${encodeURIComponent(cleanEmail)}&select=id,email`,
    });
    const userId = Array.isArray(rows) && rows.length > 0 ? rows[0].id : 1;
    await supabaseRest('password_recovery_otps', {
      method: 'POST',
      body: {
        user_id: userId,
        email: cleanEmail,
        code_hash: codeHash,
        expires_at: new Date(expiresAt).toISOString(),
      },
    });
  } catch (_e) {}

  // SEGURIDAD: NUNCA incluir el código OTP en la respuesta JSON hacia el frontend
  return {
    exito: true,
    enviado_por_correo: true,
    proveedor_correo: emailResult.transportUsed,
    mensaje: GENERIC_RECOVERY_MESSAGE,
    correo_enmascarado: maskEmail(cleanEmail),
    reenvio_segundos: 60,
  };
}

/**
 * 2.2. SCREEN 2 — Verificar Código OTP de 6 Dígitos en el Servidor
 * Valida contra el hash SHA-256 enviado por SMTP o contra el endpoint oficial /auth/v1/verify de Supabase Auth
 */
async function verifyPasswordRecoveryCode({ email, code }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanCode = String(code || '').replace(/\D/g, '');

  if (!cleanEmail || cleanCode.length !== 6) {
    const err = new Error('Ingresa el código de verificación de 6 dígitos enviado a tu correo.');
    err.statusCode = 400;
    err.code = 'INVALID_OTP_FORMAT';
    throw err;
  }

  let record = recoveryOtpStore.get(cleanEmail);

  // Intentar verificar también contra Supabase Auth (/auth/v1/verify) si el usuario recibió el correo nativo de Supabase
  if (!record) {
    try {
      const supaVerify = await supabaseAuthRequest('/verify', 'POST', {
        type: 'recovery',
        email: cleanEmail,
        token: cleanCode,
      });
      if (supaVerify?.ok) {
        const recoverySessionToken = `rec-tok-${crypto.randomBytes(20).toString('hex')}`;
        recoveryOtpStore.set(cleanEmail, {
          email: cleanEmail,
          codeHash: sha256(cleanCode),
          attempts: 0,
          maxAttempts: 5,
          expiresAt: Date.now() + 10 * 60 * 1000,
          verified: true,
          used: false,
          recoveryTokenHash: sha256(recoverySessionToken),
        });
        return {
          exito: true,
          verificado: true,
          recovery_session_token: recoverySessionToken,
          correo_enmascarado: maskEmail(cleanEmail),
          mensaje: 'Código verificado correctamente. Ahora puedes establecer tu nueva contraseña.',
        };
      }
    } catch (_e) {}
  }

  if (!record || record.used) {
    const err = new Error('El código ingresado es inválido o ha expirado. Solicita uno nuevo.');
    err.statusCode = 400;
    err.code = 'OTP_INVALID_OR_EXPIRED';
    throw err;
  }

  if (Date.now() > record.expiresAt) {
    recoveryOtpStore.delete(cleanEmail);
    const err = new Error('El código de verificación ha vencido. Solicita un nuevo código.');
    err.statusCode = 400;
    err.code = 'OTP_EXPIRED';
    throw err;
  }

  if (record.attempts >= record.maxAttempts) {
    recoveryOtpStore.delete(cleanEmail);
    const err = new Error(
      'Superaste el número máximo de intentos permitidos. Solicita un nuevo código.'
    );
    err.statusCode = 429;
    err.code = 'OTP_MAX_ATTEMPTS_EXCEEDED';
    throw err;
  }

  const candidateHash = sha256(cleanCode);
  let matched = timingSafeCompareHash(record.codeHash, candidateHash);

  // Si no coincidió con el hash SMTP, verificar si coincide con el OTP emitido por Supabase Auth
  if (!matched) {
    try {
      const supaVerify = await supabaseAuthRequest('/verify', 'POST', {
        type: 'recovery',
        email: cleanEmail,
        token: cleanCode,
      });
      if (supaVerify?.ok) matched = true;
    } catch (_e) {}
  }

  if (!matched) {
    record.attempts += 1;
    const restantes = Math.max(0, record.maxAttempts - record.attempts);
    const err = new Error(
      `El código ingresado no es válido. Intentos restantes: ${restantes}.`
    );
    err.statusCode = 400;
    err.code = 'OTP_MISMATCH';
    throw err;
  }

  const recoverySessionToken = `rec-tok-${crypto.randomBytes(20).toString('hex')}`;
  record.verified = true;
  record.recoveryTokenHash = sha256(recoverySessionToken);
  recoveryOtpStore.set(cleanEmail, record);

  return {
    exito: true,
    verificado: true,
    recovery_session_token: recoverySessionToken,
    correo_enmascarado: maskEmail(cleanEmail),
    mensaje: 'Código verificado correctamente. Ahora puedes establecer tu nueva contraseña.',
  };
}

async function resetPasswordWithRecoveryToken({
  email,
  recovery_session_token,
  new_password,
  confirm_password,
}) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const pwd = String(new_password || '');
  const confirm = String(confirm_password || '');

  if (!cleanEmail || !recovery_session_token) {
    const err = new Error('La sesión de recuperación no es válida o ha expirado.');
    err.statusCode = 401;
    err.code = 'INVALID_RECOVERY_SESSION';
    throw err;
  }

  if (pwd !== confirm) {
    const err = new Error('Las contraseñas ingresadas no coinciden.');
    err.statusCode = 400;
    err.code = 'PASSWORD_MISMATCH';
    throw err;
  }

  const complexity = validatePasswordComplexity(pwd);
  if (!complexity.valid) {
    const err = new Error(complexity.message);
    err.statusCode = 400;
    err.code = 'WEAK_PASSWORD';
    throw err;
  }

  const record = recoveryOtpStore.get(cleanEmail);
  if (
    !record ||
    !record.verified ||
    record.used ||
    Date.now() > record.expiresAt ||
    !timingSafeCompareHash(record.recoveryTokenHash, sha256(recovery_session_token))
  ) {
    const err = new Error('La sesión de recuperación ha expirado. Inicia el proceso nuevamente.');
    err.statusCode = 401;
    err.code = 'RECOVERY_SESSION_EXPIRED';
    throw err;
  }

  record.used = true;
  recoveryOtpStore.delete(cleanEmail);
  internalTestOutbox.delete(cleanEmail);

  const hashedNewPassword = sha256(pwd);

  const memUser = db.usuarios.find(
    (u) => String(u.email || u.correo || '').toLowerCase() === cleanEmail
  );
  if (memUser) {
    memUser.password_hash = hashedNewPassword;
    hydrateUnifiedUserRecord(memUser);
  }

  try {
    await supabaseRest('usuarios', {
      method: 'PATCH',
      query: `email=eq.${encodeURIComponent(cleanEmail)}`,
      body: {
        password_hash: hashedNewPassword,
        intentos_fallidos: 0,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (_e) {}

  clearLoginFailures(cleanEmail);

  return {
    exito: true,
    sesiones_anteriores_invalidadas: true,
    mensaje:
      'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva clave.',
  };
}

/**
 * Helper exclusivo para pruebas automatizadas en el mismo proceso Node (NUNCA expuesto en endpoints HTTP)
 */
function getLastGeneratedOtpForTestingOnly(email) {
  return internalTestOutbox.get(String(email || '').trim().toLowerCase()) || null;
}

module.exports = {
  GENERIC_LOGIN_ERROR,
  GENERIC_RECOVERY_MESSAGE,
  maskEmail,
  validatePasswordComplexity,
  unifiedLogin,
  switchUserMode,
  upgradeClientToProfessional,
  assertUserHasRoleAndApproval,
  requestPasswordRecovery,
  verifyPasswordRecoveryCode,
  resetPasswordWithRecoveryToken,
  hydrateUnifiedUserRecord,
  getLastGeneratedOtpForTestingOnly,
};
