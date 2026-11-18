import { Platform, Dimensions } from 'react-native';
import { BLOQUES_HORARIOS_ESTANDAR } from '../theme/palette';
import { SupabaseRepository } from '../repositories/SupabaseRepository';
import { sessionStore } from './sessionStore';
import { useAppStore } from '../store/useAppStore';

const STORAGE_KEY_ONBOARDING = 'beautyflash_onboarding_completed_v1';
const STORAGE_KEY_SESSION = 'beautyflash_active_session_v1';

export function obtenerDeviceSignature() {
  const { width, height } = Dimensions.get('screen');
  return `bf-dev-${Platform.OS}-${Platform.Version || '1'}-${Math.round(width)}x${Math.round(height)}`;
}

function leerLocal(key) {
  try {
    return typeof globalThis !== 'undefined' && globalThis.localStorage
      ? globalThis.localStorage.getItem(key)
      : null;
  } catch (_e) {
    return null;
  }
}

function escribirLocal(key, val) {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      if (val === null) globalThis.localStorage.removeItem(key);
      else globalThis.localStorage.setItem(key, val);
    }
  } catch (_e) {}
}

export function limpiarDatosUsuarioEnMemoria() {
  sessionStore.userId = null;
  sessionStore.roles = ['CLIENT'];
  sessionStore.isAuthenticated = false;
  sessionStore.activeRoleSession = null;
  sessionStore.token = null;
  sessionStore.clientFavorites = [];
  sessionStore.clientUser = {
    id: null, nombre_completo: '', correo: '', telefono: '', barrio: '',
    direccion_principal: '', foto_perfil_url: null, latitud: null, longitud: null, gps_exacto_activo: false,
  };
  sessionStore.proUser = {
    id: null, usuario_id: null, codigo_profesional: '', nombre_completo: '', nombre_artistico: '',
    nombre_establecimiento: '', tiene_establecimiento: false,
    horario_atencion: { dias: 'Lunes a Sábado', apertura: '08:00 a.m.', cierre: '07:00 p.m.', bloques_disponibles: [...BLOQUES_HORARIOS_ESTANDAR] },
    correo: '', telefono: '', foto_perfil_url: null, especialidades: [], modalidad: 'ambos',
    barrio: '', direccion_base: '', latitud_actual: null, longitud_actual: null,
    estado_verificacion: 'aprobado', approval_status: 'APPROVED', disponible: true, calificacion_promedio: 5.0,
  };
  sessionStore.wallet = {
    saldo_disponible_cop: 0, total_recargado_cop: 0, total_comisiones_pagadas_cop: 0,
    comisiones_ganadas_plataforma_cop: 0, recarga_minima_cop: 10000, recarga_maxima_cop: 5000000,
    estado_billetera: 'LOW_BALANCE', transacciones: [],
  };
  sessionStore.bookings = [];
  sessionStore.citasAgendadas = [];
  sessionStore.notificacionesProfesional = [];
  sessionStore.notificacionesCliente = [];
  sessionStore.historialCompletadas = [];
  useAppStore.getState().resetSessionData();
}

export async function marcarOnboardingComoVistoPermanentemente() {
  sessionStore.onboardingCompleted = true;
  escribirLocal(STORAGE_KEY_ONBOARDING, 'true');
  useAppStore.getState().setAuthState({ onboardingCompleted: true });
  try {
    await SupabaseRepository.insert(
      'dispositivos_instalacion',
      { device_key: obtenerDeviceSignature(), onboarding_visto: true, updated_at: new Date().toISOString() },
      'device_key'
    );
  } catch (_e) {}
}

export async function guardarSesionPersistente({ usuarioId, token, selectedMode = null }) {
  if (!usuarioId) return;
  const deviceSig = obtenerDeviceSignature();
  const pushToken = sessionStore.deviceToken || `ExponentPushToken[${deviceSig}]`;
  sessionStore.deviceToken = pushToken;

  escribirLocal(
    STORAGE_KEY_SESSION,
    JSON.stringify({
      usuario_id: usuarioId,
      token: token || `sb-sess-${usuarioId}`,
      selected_mode: selectedMode || sessionStore.activeRoleSession || 'cliente',
    })
  );
  try {
    await SupabaseRepository.insert(
      'dispositivos_instalacion',
      {
        device_key: deviceSig,
        onboarding_visto: true,
        usuario_sesion_id: usuarioId,
        token_sesion: token || `sb-sess-${usuarioId}`,
        updated_at: new Date().toISOString(),
      },
      'device_key'
    );
    await SupabaseRepository.insert(
      'device_tokens',
      {
        user_id: Number(usuarioId),
        token: pushToken,
        platform: Platform.OS || 'android',
        device_id: deviceSig,
        is_active: true,
        last_used_at: new Date().toISOString(),
      },
      'user_id,token'
    );
  } catch (_e) {}
}

/**
 * Módulo 1.3: Cambiar entre Modo Cliente y Modo Profesional SIN cerrar la sesión
 */
export async function cambiarModalidadSinCerrarSesion(nuevoModo = 'cliente', navigation = null) {
  const modoNorm =
    String(nuevoModo).toLowerCase() === 'profesional' ||
    String(nuevoModo).toUpperCase() === 'PROFESSIONAL'
      ? 'profesional'
      : 'cliente';

  const tieneRolPro =
    (sessionStore.roles || []).includes('PROFESSIONAL') ||
    Boolean(sessionStore.proUser?.id || sessionStore.proUser?.usuario_id);

  if (modoNorm === 'profesional' && !tieneRolPro) {
    return {
      exito: false,
      requiere_registro_profesional: true,
      mensaje: 'Completa tus datos profesionales para activar el Modo Profesional en tu cuenta.',
    };
  }

  sessionStore.selectedRole = modoNorm;
  sessionStore.activeRoleSession = modoNorm;
  useAppStore.getState().setAuthState({
    selectedRole: modoNorm,
    activeRoleSession: modoNorm,
  });

  const userId =
    sessionStore.userId ||
    sessionStore.clientUser?.id ||
    sessionStore.proUser?.usuario_id ||
    sessionStore.proUser?.id;

  if (userId) {
    await guardarSesionPersistente({
      usuarioId: userId,
      token: sessionStore.token,
      selectedMode: modoNorm,
    });
    try {
      await SupabaseRepository.insert(
        'user_preferences',
        {
          user_id: Number(userId),
          selected_mode: modoNorm === 'profesional' ? 'PROFESSIONAL' : 'CLIENT',
          updated_at: new Date().toISOString(),
        },
        'user_id'
      );
      await SupabaseRepository.patch('usuarios', `id=eq.${encodeURIComponent(userId)}`, {
        modalidad_activa: modoNorm === 'profesional' ? 'PROFESSIONAL' : 'CLIENT',
      });
    } catch (_e) {}
  }

  const rutaDestino = modoNorm === 'profesional' ? 'ProDashboard' : 'Home';
  if (navigation?.reset) {
    navigation.reset({ index: 0, routes: [{ name: rutaDestino }] });
  } else if (navigation?.navigate) {
    navigation.navigate(rutaDestino);
  }

  return {
    exito: true,
    modoActivo: modoNorm,
    rutaDestino,
  };
}

export async function verificarEstadoInicialYSesion() {
  let onboardingVisto = leerLocal(STORAGE_KEY_ONBOARDING) === 'true';
  let usuarioId = null;
  let token = null;
  let savedMode = null;

  const rawSess = leerLocal(STORAGE_KEY_SESSION);
  if (rawSess) {
    try {
      const p = JSON.parse(rawSess);
      usuarioId = p?.usuario_id || null;
      token = p?.token || null;
      savedMode = p?.selected_mode || null;
    } catch (_e) {}
  }

  try {
    const rows = await SupabaseRepository.select(
      'dispositivos_instalacion',
      `device_key=eq.${encodeURIComponent(obtenerDeviceSignature())}&select=*`
    );
    if (Array.isArray(rows) && rows.length > 0) {
      if (rows[0].onboarding_visto) {
        onboardingVisto = true;
        escribirLocal(STORAGE_KEY_ONBOARDING, 'true');
      }
      if (!usuarioId && rows[0].usuario_sesion_id) {
        usuarioId = rows[0].usuario_sesion_id;
        token = rows[0].token_sesion;
      }
    }
  } catch (_e) {}

  sessionStore.onboardingCompleted = onboardingVisto;
  if (!onboardingVisto) return { mostrarOnboarding: true, sesionValida: false, rutaDestino: 'Welcome' };

  if (usuarioId) {
    try {
      const users = await SupabaseRepository.select('usuarios', `id=eq.${usuarioId}&select=*`);
      if (Array.isArray(users) && users.length > 0 && users[0].activo !== false) {
        const u = users[0];
        limpiarDatosUsuarioEnMemoria();
        sessionStore.userId = u.id;
        sessionStore.isAuthenticated = true;
        sessionStore.token = token || `sb-sess-${u.id}`;

        const pros = await SupabaseRepository.select(
          'perfiles_profesionales',
          `usuario_id=eq.${u.id}&select=*`
        ).catch(() => []);
        const perfilPro = Array.isArray(pros) && pros.length > 0 ? pros[0] : null;

        const roles = ['CLIENT'];
        if (u.rol === 'profesional' || perfilPro || (Array.isArray(u.roles) && u.roles.includes('PROFESSIONAL'))) {
          roles.push('PROFESSIONAL');
        }
        sessionStore.roles = roles;

        // Hidratar ambos perfiles para que el usuario pueda alternar sin cerrar sesión
        sessionStore.clientUser = {
          ...sessionStore.clientUser,
          id: u.id,
          nombre_completo: u.nombre,
          correo: u.email,
          telefono: u.telefono || '',
          barrio: u.barrio || '',
          direccion_principal: u.direccion_principal || '',
          foto_perfil_url: u.avatar_url || null,
          latitud: u.latitud,
          longitud: u.longitud,
        };

        if (roles.includes('PROFESSIONAL')) {
          sessionStore.proUser = {
            ...sessionStore.proUser,
            ...(perfilPro || {}),
            id: perfilPro?.id || u.id,
            usuario_id: u.id,
            nombre_completo: u.nombre,
            nombre_artistico: perfilPro?.nombre_artistico || u.nombre,
            correo: u.email,
            telefono: u.telefono || '',
            barrio: u.barrio || perfilPro?.barrio || '',
            direccion_base: u.direccion_principal || perfilPro?.direccion || '',
            foto_perfil_url: u.avatar_url || null,
            latitud_actual: u.latitud,
            longitud_actual: u.longitud,
            approval_status:
              perfilPro?.approval_status ||
              (perfilPro?.estado_verificacion === 'aprobado' ? 'APPROVED' : 'APPROVED'),
          };
        }

        const modoInicial =
          savedMode === 'profesional' && roles.includes('PROFESSIONAL')
            ? 'profesional'
            : u.modalidad_activa === 'PROFESSIONAL' && roles.includes('PROFESSIONAL')
            ? 'profesional'
            : u.rol === 'profesional' && !savedMode
            ? 'profesional'
            : 'cliente';

        sessionStore.activeRoleSession = modoInicial;
        sessionStore.selectedRole = modoInicial;

        return {
          mostrarOnboarding: false,
          sesionValida: true,
          rol: modoInicial,
          rutaDestino: modoInicial === 'profesional' ? 'ProDashboard' : 'Home',
        };
      }
    } catch (_e) {}
  }
  return { mostrarOnboarding: false, sesionValida: false, rutaDestino: 'Login' };
}

/**
 * Módulo 3.2: Al cerrar sesión, desactivar exclusivamente el token del dispositivo actual
 */
export async function cerrarSesionActiva(navigation) {
  const userId =
    sessionStore.userId ||
    sessionStore.clientUser?.id ||
    sessionStore.proUser?.usuario_id ||
    sessionStore.proUser?.id;
  const deviceSig = obtenerDeviceSignature();

  limpiarDatosUsuarioEnMemoria();
  escribirLocal(STORAGE_KEY_SESSION, null);
  escribirLocal(STORAGE_KEY_ONBOARDING, 'true');

  try {
    await SupabaseRepository.patch(
      'dispositivos_instalacion',
      `device_key=eq.${encodeURIComponent(deviceSig)}`,
      {
        onboarding_visto: true,
        usuario_sesion_id: null,
        token_sesion: null,
        updated_at: new Date().toISOString(),
      }
    );
    if (userId) {
      await SupabaseRepository.patch(
        'device_tokens',
        `user_id=eq.${encodeURIComponent(userId)}&device_id=eq.${encodeURIComponent(deviceSig)}`,
        {
          is_active: false,
          last_used_at: new Date().toISOString(),
        }
      );
    }
  } catch (_e) {}

  if (navigation?.reset) navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  else if (navigation?.replace) navigation.replace('Login');
}
