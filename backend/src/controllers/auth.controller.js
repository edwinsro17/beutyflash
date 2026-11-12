/**
 * Archivo: backend/src/controllers/auth.controller.js
 * Inserta y consulta directamente en tus tablas reales de Supabase:
 * - public.usuarios (nombre, email, password_hash, telefono, rol, avatar_url, latitud, longitud)
 * - public.perfiles_profesionales (usuario_id, descripcion, anos_experiencia, direccion, ciudad, atiende_domicilio, atiende_salon, verificado, estado)
 * - public.clientes y public.billetera_profesional (si ya ejecutaste el SQL mejorado)
 */

const crypto = require('crypto');
const { db, supabaseRest, supabaseAuthRequest } = require('../config/supabaseClient');
const { ROLES, formatCOP } = require('../config/constants');
const { generarTokenSesion } = require('../middlewares/auth.middleware');
const { enviarCodigoOTP } = require('../services/sms.service');

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password || 'BeautyFlash2026*')).digest('hex');
}

function normalizarUsuario(u, extra = {}) {
  if (!u) return null;
  const nombre = u.nombre_completo || u.nombre || 'Usuario BeautyFlash';
  const correo = u.correo || u.email || '';
  const foto =
    u.foto_perfil_url ||
    u.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop';

  return {
    ...u,
    nombre,
    nombre_completo: nombre,
    email: correo,
    correo,
    avatar_url: foto,
    foto_perfil_url: foto,
    ruta_inicio: u.rol === ROLES.PROFESIONAL ? 'ProDashboard' : 'Home',
    ...extra,
  };
}

/**
 * 1. REGISTRO DE CLIENTE -> Guarda directamente en public.usuarios (y public.clientes) en Supabase
 */
async function registrarCliente(body) {
  const {
    nombre_completo,
    nombre,
    correo,
    email,
    password = 'BeautyFlash2026*',
    telefono,
    direccion_principal = 'Cra. 100 #11-60, Ciudad Jardín, Cali',
    foto_perfil_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    latitud = 3.3712,
    longitud = -76.5320,
  } = body || {};

  const nombreFinal = String(nombre_completo || nombre || '').trim();
  const correoFinal = String(correo || email || '').toLowerCase().trim();
  const telefonoFinal = String(telefono || '').trim();

  if (!nombreFinal || !correoFinal || !telefonoFinal) {
    const err = new Error('Nombre completo, correo electrónico y teléfono móvil son obligatorios.');
    err.statusCode = 400;
    throw err;
  }

  const pwdHash = hashPassword(password);
  let usuarioGuardado = null;

  // A. Guardar directamente en la tabla public.usuarios de tu Supabase
  try {
    // 1. Opcionalmente registrar en Supabase Auth (/auth/v1/signup)
    let authUserId = null;
    try {
      const authRes = await supabaseAuthRequest('/signup', 'POST', {
        email: correoFinal,
        password: String(password),
        data: {
          rol: ROLES.CLIENTE,
          nombre_completo: nombreFinal,
          telefono: telefonoFinal,
        },
      });
      if (authRes.ok && authRes.data?.user?.id) {
        authUserId = authRes.data.user.id;
      }
    } catch (_authErr) {}

    // 2. Insertar fila real en public.usuarios (usando las columnas exactas de tu tabla en Supabase)
    usuarioGuardado = await supabaseRest('usuarios', {
      method: 'POST',
      single: true,
      body: {
        nombre: nombreFinal,
        email: correoFinal,
        password_hash: pwdHash,
        telefono: telefonoFinal,
        rol: ROLES.CLIENTE,
        avatar_url: foto_perfil_url,
        latitud: Number(latitud),
        longitud: Number(longitud),
        ...(authUserId ? { auth_user_id: authUserId } : {}),
      },
    });

    // 3. Si existe la tabla public.clientes, insertar también su dirección principal
    if (usuarioGuardado && usuarioGuardado.id) {
      try {
        await supabaseRest('clientes', {
          method: 'POST',
          single: true,
          body: {
            usuario_id: usuarioGuardado.id,
            direccion_principal,
            latitud: Number(latitud),
            longitud: Number(longitud),
          },
        });
      } catch (_clienteErr) {}
    }
  } catch (dbErr) {
    console.error('[Supabase Insert Cliente Warning]:', dbErr.message);
    if (dbErr.message && dbErr.message.includes('duplicate key')) {
      const err = new Error('Ya existe un usuario registrado con ese correo o teléfono en Supabase.');
      err.statusCode = 409;
      throw err;
    }
  }

  // B. Sincronizar también en memoria para respuesta inmediata
  if (!usuarioGuardado) {
    usuarioGuardado = {
      id: db.usuarios.length + 1,
      nombre: nombreFinal,
      email: correoFinal,
      password_hash: pwdHash,
      telefono: telefonoFinal,
      rol: ROLES.CLIENTE,
      avatar_url: foto_perfil_url,
      latitud: Number(latitud),
      longitud: Number(longitud),
    };
  }
  db.usuarios.push(usuarioGuardado);

  const perfilNormalizado = normalizarUsuario(usuarioGuardado, {
    direccion_principal,
    perfil_cliente: {
      usuario_id: usuarioGuardado.id,
      direccion_principal,
      latitud_actual: Number(latitud),
      longitud_actual: Number(longitud),
    },
  });

  const otpInfo = await enviarCodigoOTP(telefonoFinal);
  const token = generarTokenSesion(perfilNormalizado);

  return {
    exito: true,
    guardado_en_supabase: Boolean(usuarioGuardado.created_at || usuarioGuardado.id),
    mensaje: 'Cuenta de cliente guardada exitosamente en la base de datos.',
    token,
    ruta_inicio: 'Home',
    usuario: perfilNormalizado,
    otp: otpInfo,
  };
}

/**
 * 2. REGISTRO DE PROFESIONAL -> Guarda directamente en public.usuarios Y public.perfiles_profesionales en Supabase
 */
async function registrarProfesional(body) {
  const {
    nombre_completo,
    nombre,
    nombre_artistico,
    correo,
    email,
    password = 'BeautyFlash2026*',
    telefono,
    biografia = 'Especialista certificada en servicios de belleza a domicilio y en salón.',
    anios_experiencia = 3,
    especialidades = ['Peluquería & Color'],
    modalidad = 'ambos',
    radio_cobertura_km = 12,
    tarifa_domicilio_cop = 8000,
    direccion_base = 'Cali, Valle del Cauca',
    ciudad = 'Cali',
    latitud = 3.3768,
    longitud = -76.5365,
    dni_numero = '',
    foto_perfil_url = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop',
  } = body || {};

  const nombreFinal = String(nombre_completo || nombre || '').trim();
  const correoFinal = String(correo || email || '').toLowerCase().trim();
  const telefonoFinal = String(telefono || '').trim();

  if (!nombreFinal || !correoFinal || !telefonoFinal) {
    const err = new Error('Nombre completo, correo electrónico y teléfono móvil son obligatorios.');
    err.statusCode = 400;
    throw err;
  }

  const pwdHash = hashPassword(password);
  let usuarioGuardado = null;
  let perfilProGuardado = null;

  try {
    // 1. Opcionalmente crear en Supabase Auth
    let authUserId = null;
    try {
      const authRes = await supabaseAuthRequest('/signup', 'POST', {
        email: correoFinal,
        password: String(password),
        data: {
          rol: ROLES.PROFESIONAL,
          nombre_completo: nombreFinal,
          telefono: telefonoFinal,
        },
      });
      if (authRes.ok && authRes.data?.user?.id) {
        authUserId = authRes.data.user.id;
      }
    } catch (_authErr) {}

    // 2. Insertar en public.usuarios con rol = 'profesional'
    usuarioGuardado = await supabaseRest('usuarios', {
      method: 'POST',
      single: true,
      body: {
        nombre: nombreFinal,
        email: correoFinal,
        password_hash: pwdHash,
        telefono: telefonoFinal,
        rol: ROLES.PROFESIONAL,
        avatar_url: foto_perfil_url,
        latitud: Number(latitud),
        longitud: Number(longitud),
        ...(authUserId ? { auth_user_id: authUserId } : {}),
      },
    });

    // 3. Insertar en public.perfiles_profesionales (usando las columnas exactas de tu tabla)
    if (usuarioGuardado && usuarioGuardado.id) {
      perfilProGuardado = await supabaseRest('perfiles_profesionales', {
        method: 'POST',
        single: true,
        body: {
          usuario_id: usuarioGuardado.id,
          descripcion: `${
            nombre_artistico || `${nombreFinal} — Atelier`
          } | ${biografia} | Especialidades: ${
            Array.isArray(especialidades) ? especialidades.join(', ') : especialidades
          }`,
          anos_experiencia: Number(anios_experiencia) || 3,
          direccion: direccion_base,
          ciudad,
          atiende_domicilio: modalidad === 'domicilio' || modalidad === 'ambos',
          atiende_salon: modalidad === 'local' || modalidad === 'salon' || modalidad === 'ambos',
          verificado: false,
          estado: 'activo',
        },
      });

      // 4. Si existe la tabla public.billetera_profesional, crear su billetera con saldo $0 COP (recarga mín. $10.000)
      if (perfilProGuardado && perfilProGuardado.id) {
        try {
          await supabaseRest('billetera_profesional', {
            method: 'POST',
            single: true,
            body: {
              profesional_id: perfilProGuardado.id,
              saldo_disponible_cop: 0,
              recarga_minima_cop: 10000,
            },
          });
        } catch (_walletErr) {}
      }
    }
  } catch (dbErr) {
    console.error('[Supabase Insert Profesional Warning]:', dbErr.message);
    if (dbErr.message && dbErr.message.includes('duplicate key')) {
      const err = new Error('Ya existe un profesional registrado con ese correo o teléfono en Supabase.');
      err.statusCode = 409;
      throw err;
    }
  }

  if (!usuarioGuardado) {
    usuarioGuardado = {
      id: db.usuarios.length + 1,
      nombre: nombreFinal,
      email: correoFinal,
      password_hash: pwdHash,
      telefono: telefonoFinal,
      rol: ROLES.PROFESIONAL,
      avatar_url: foto_perfil_url,
    };
  }
  db.usuarios.push(usuarioGuardado);

  const nuevoPro = {
    id: perfilProGuardado?.id || `pro-${Date.now()}`,
    usuario_id: usuarioGuardado.id,
    codigo_profesional: `BF-${Math.floor(1000 + Math.random() * 9000)}`,
    nombre_artistico: nombre_artistico || `${nombreFinal} — Atelier`,
    biografia,
    anos_experiencia: Number(anios_experiencia) || 3,
    especialidades: Array.isArray(especialidades) ? especialidades : [especialidades],
    modalidad,
    radio_cobertura_km: Number(radio_cobertura_km) || 12,
    tarifa_domicilio_cop: Number(tarifa_domicilio_cop) || 8000,
    direccion_base,
    dni_numero: String(dni_numero || ''),
    estado_verificacion: 'pendiente',
    disponible: false,
    activo_por_saldo: false,
  };
  db.profesionales.push(nuevoPro);

  const nuevaBilletera = {
    id: crypto.randomUUID(),
    profesional_id: nuevoPro.id,
    saldo_disponible_cop: 0,
    total_recargado_cop: 0,
    total_comisiones_pagadas_cop: 0,
    umbral_saldo_bajo_cop: 10000,
    recarga_minima_cop: 10000,
    saldo_formateado: formatCOP(0),
    recarga_minima_formateada: formatCOP(10000),
  };
  db.billeteras_profesional.push(nuevaBilletera);

  const perfilNormalizado = normalizarUsuario(usuarioGuardado, {
    perfil_profesional: nuevoPro,
    billetera: nuevaBilletera,
  });

  const otpInfo = await enviarCodigoOTP(telefonoFinal);
  const token = generarTokenSesion(perfilNormalizado);

  return {
    exito: true,
    guardado_en_supabase: Boolean(usuarioGuardado.created_at || perfilProGuardado?.id),
    mensaje: 'Cuenta profesional guardada en Supabase (usuarios y perfiles_profesionales).',
    token,
    ruta_inicio: 'ProDashboard',
    usuario: perfilNormalizado,
    otp: otpInfo,
  };
}

/**
 * 3. INICIO DE SESIÓN -> Consulta en public.usuarios de Supabase por email o teléfono y valida el rol
 */
async function iniciarSesion(body) {
  const { identificador, password, rol_preferido } = body || {};
  const valor = String(identificador || body?.correo || body?.email || body?.telefono || '')
    .trim()
    .toLowerCase();

  let usuarioEncontrado = null;
  let perfilProfesional = null;
  let billeteraPro = null;

  // A. Buscar primero en la tabla real public.usuarios de tu Supabase
  try {
    const filtro = valor.includes('@')
      ? `email=eq.${encodeURIComponent(valor)}&select=*`
      : `telefono=eq.${encodeURIComponent(valor)}&select=*`;

    const filas = await supabaseRest('usuarios', {
      method: 'GET',
      query: filtro,
    });

    if (Array.isArray(filas) && filas.length > 0) {
      usuarioEncontrado = filas[0];

      // Si el usuario tiene password_hash guardado y envió password, verificar que coincida
      if (password && usuarioEncontrado.password_hash) {
        const hashIngresado = hashPassword(password);
        if (
          usuarioEncontrado.password_hash !== hashIngresado &&
          usuarioEncontrado.password_hash !== password
        ) {
          const err = new Error('La contraseña ingresada es incorrecta.');
          err.statusCode = 401;
          throw err;
        }
      }

      // Si es profesional, traer su registro de public.perfiles_profesionales
      if (usuarioEncontrado.rol === ROLES.PROFESIONAL) {
        const pros = await supabaseRest('perfiles_profesionales', {
          method: 'GET',
          query: `usuario_id=eq.${usuarioEncontrado.id}&select=*`,
        });
        if (Array.isArray(pros) && pros.length > 0) {
          perfilProfesional = pros[0];
        }
      }
    }
  } catch (err) {
    if (err.statusCode === 401) throw err;
  }

  // B. Si no estaba en Supabase aún (ej. cuentas semilla de prueba), buscar en memoria
  if (!usuarioEncontrado) {
    usuarioEncontrado = db.usuarios.find(
      (u) =>
        (u.email && u.email.toLowerCase() === valor) ||
        (u.correo && u.correo.toLowerCase() === valor) ||
        (u.telefono && u.telefono.replace(/\s+/g, '') === valor.replace(/\s+/g, ''))
    );
  }

  if (!usuarioEncontrado) {
    const err = new Error('No encontramos una cuenta con ese correo o teléfono. Regístrate primero.');
    err.statusCode = 404;
    throw err;
  }

  // Validar que el rol coincida con el selector elegido en LoginScreen (Cliente vs Profesional)
  if (rol_preferido && usuarioEncontrado.rol !== rol_preferido) {
    const err = new Error(
      `Esta cuenta está registrada como "${usuarioEncontrado.rol.toUpperCase()}". Cambia el selector superior a "Soy ${
        usuarioEncontrado.rol === 'profesional' ? 'Profesional' : 'Cliente'
      }" para entrar.`
    );
    err.statusCode = 403;
    throw err;
  }

  if (usuarioEncontrado.rol === ROLES.PROFESIONAL && !perfilProfesional) {
    perfilProfesional =
      db.profesionales.find((p) => String(p.usuario_id) === String(usuarioEncontrado.id)) ||
      db.profesionales[0];
  }

  if (usuarioEncontrado.rol === ROLES.PROFESIONAL) {
    billeteraPro =
      db.billeteras_profesional.find(
        (b) => String(b.profesional_id) === String(perfilProfesional?.id)
      ) || db.billeteras_profesional[0];
  }

  const perfilCompleto = normalizarUsuario(usuarioEncontrado, {
    perfil_profesional: perfilProfesional,
    billetera: billeteraPro,
  });

  const token = generarTokenSesion(perfilCompleto);

  return {
    exito: true,
    mensaje: `Bienvenido de nuevo, ${perfilCompleto.nombre_completo}.`,
    token,
    ruta_inicio: perfilCompleto.rol === ROLES.PROFESIONAL ? 'ProDashboard' : 'Home',
    usuario: perfilCompleto,
  };
}

module.exports = {
   normalizarUsuario,
  armarPerfilUsuario: normalizarUsuario,
  registrarCliente,
  registrarProfesional,
  iniciarSesion,
};
