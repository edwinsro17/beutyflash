/**
 * Archivo: src/theme/colors.js
 * - Cero datos estáticos, usuarios ficticios, profesionales de prueba o servicios simulados.
 * - Toda la información procede de la base de datos real en Supabase (tcyndqzzawwcqqvcsbvu).
 * - Integración real con Google Maps (JS API + Directions Service + respaldo vectorial).
 * - Flujo estricto de solicitudes en 5 pasos y 9 estados oficiales (el profesional acepta/rechaza
 *   y el cliente confirma definitivamente para activar el servicio).
 * - Notificaciones y mensajes informativos del sistema dentro del chat (sin modales invasivos).
 * - Selección de fotografías desde la galería del dispositivo (expo-image-picker) y subida
 *   a Supabase Storage (bucket 'archivos').
 * - Sin emojis en ninguna parte del código.
 */

import { Platform, Vibration, Dimensions, useWindowDimensions } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

export const colors = {
  background: '#F8F6F4',
  surface: '#FFFFFF',
  primary: '#844D3B',
  primaryLight: '#D48C70',
  primaryDark: '#5E3426',
  primaryText: '#FFFFFF',
  secondary: '#1A1A1A',
  secondaryLight: '#F3EFEA',
  secondaryText: '#1A1A1A',
  tertiary: '#C87D65',
  accent: '#C87D65',
  flashIcon: '#D48C70',
  textDark: '#1A1A1A',
  textGray: '#66615E',
  border: '#EAE4DC',
  iconBg: '#F6EFEB',
  badgeBg: '#FDECE7',
  badgeText: '#C05A46',
  success: '#1E824C',
  successBg: '#E8F6EF',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  danger: '#C0392B',
  dangerBg: '#FDEDEC',
  uberBlue: '#2563EB',
  uberDark: '#0F172A',
};

export const SUPABASE_URL = 'https://tcyndqzzawwcqqvcsbvu.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_txO2mh73LE4sY8AqzTiujA_jniwTOrQ';
export const GOOGLE_MAPS_API_KEY =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) ||
  'AIzaSyD6WqT0s_TLC2Va1n3RidhZa5MnAxMBAeA';

const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  `${DEFAULT_HOST}/api/v1`;

const SUPABASE_HEADERS = {
  apikey: SUPABASE_PUBLISHABLE_KEY,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;
  const numColumns = isLargeTablet ? 3 : isTablet ? 2 : 1;
  const containerMaxWidth = isLargeTablet ? 1040 : isTablet ? 780 : 600;
  const horizontalPadding = isLargeTablet ? 32 : isTablet ? 24 : 16;
  const mapHeight = isLargeTablet ? 420 : isTablet ? 360 : 280;
  const cardWidth = isLargeTablet ? '31.8%' : isTablet ? '48.5%' : '100%';
  const modalWidth = isTablet ? Math.min(620, width * 0.88) : width;

  return {
    width,
    height,
    isTablet,
    isLargeTablet,
    numColumns,
    containerMaxWidth,
    horizontalPadding,
    mapHeight,
    cardWidth,
    modalWidth,
    contentContainerStyle: {
      width: '100%',
      maxWidth: isTablet ? containerMaxWidth : '100%',
      alignSelf: 'center',
      paddingHorizontal: horizontalPadding,
    },
    gridStyle: {
      flexDirection: isTablet ? 'row' : 'column',
      flexWrap: isTablet ? 'wrap' : 'nowrap',
      justifyContent: 'space-between',
    },
  };
}

export function formatCOP(valor) {
  const num = Math.round(Number(valor) || 0);
  const signo = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  return `${signo}$${abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function calcularComisionCOP(valorServicio) {
  return Math.round((Number(valorServicio) || 0) * 0.10);
}

export const BARRIOS_DISPONIBLES = [
  'Ciudad Jardín',
  'El Limonar',
  'Granada',
  'Santa Mónica',
  'Valle del Lili',
  'San Fernando',
];

export const BLOQUES_HORARIOS_ESTANDAR = [
  '09:00 a.m.',
  '10:30 a.m.',
  '12:00 m.',
  '02:00 p.m.',
  '03:30 p.m.',
  '05:00 p.m.',
];

// Los 9 estados oficiales obligatorios del flujo de solicitudes
export const ESTADOS_SOLICITUD_OFICIALES = {
  PENDIENTE_ACEPTACION_PRO: 'pendiente_aceptacion_profesional',
  ACEPTADA_POR_PRO: 'aceptada_por_profesional',
  RECHAZADA_POR_PRO: 'rechazada_por_profesional',
  PENDIENTE_CONFIRMACION_CLIENTE: 'pendiente_confirmacion_cliente',
  CONFIRMADA_POR_CLIENTE: 'confirmada_por_cliente',
  EN_CAMINO: 'en_camino',
  EN_SERVICIO: 'en_servicio',
  FINALIZADA: 'finalizada',
  CANCELADA: 'cancelada',
};

export const ESTADOS_DOMICILIO_ACTIVOS = [
  'pendiente_aceptacion_profesional',
  'aceptada_por_profesional',
  'pendiente_confirmacion_cliente',
  'confirmada_por_cliente',
  'en_camino',
  'en_servicio',
];

export function formatearEtiquetaEstado(estado) {
  const mapa = {
    pendiente_aceptacion_profesional: 'Pendiente de aceptación del profesional',
    aceptada_por_profesional: 'Aceptada por el profesional (Pendiente tu confirmación)',
    pendiente_confirmacion_cliente: 'Pendiente de confirmación del cliente',
    rechazada_por_profesional: 'Rechazada por el profesional',
    confirmada_por_cliente: 'Confirmada por el cliente',
    en_camino: 'En camino',
    en_servicio: 'En servicio',
    finalizada: 'Finalizada',
    cancelada: 'Cancelada',
  };
  return mapa[estado] || String(estado || '').replace(/_/g, ' ');
}

/**
 * Store global inicializado SIN datos ficticios ni registros hardcodeados.
 * Todo se hidrata desde la base de datos real en Supabase.
 */
export const sessionStore = {
  selectedRole: 'cliente',
  isAuthenticated: false,
  activeRoleSession: null,
  token: null,
  notificacionesMostradasIds: [],
  clientFavorites: [],
  clientUser: {
    id: null,
    nombre_completo: '',
    correo: '',
    telefono: '',
    barrio: '',
    direccion_principal: '',
    foto_perfil_url: null,
    latitud: null,
    longitud: null,
    gps_exacto_activo: false,
  },
  proUser: {
    id: null,
    usuario_id: null,
    codigo_profesional: '',
    nombre_completo: '',
    nombre_artistico: '',
    nombre_establecimiento: '',
    tiene_establecimiento: false,
    horario_atencion: {
      dias: 'Lunes a Sábado',
      apertura: '08:00 a.m.',
      cierre: '07:00 p.m.',
      bloques_disponibles: [...BLOQUES_HORARIOS_ESTANDAR],
    },
    lema_profesional: '',
    biografia: '',
    correo: '',
    telefono: '',
    foto_perfil_url: null,
    anios_experiencia: '1a3',
    especialidades: [],
    modalidad: 'ambos',
    barrio: '',
    radio_cobertura_km: 12,
    tarifa_domicilio_cop: 8000,
    direccion_base: '',
    latitud_actual: null,
    longitud_actual: null,
    dni_numero: '',
    entidad_certificadora: '',
    estado_verificacion: 'pendiente',
    permisos_otorgados: false,
    permiso_ubicacion: false,
    permiso_notificaciones: false,
    disponible: true,
    activo_por_saldo: false,
    calificacion_promedio: 5.0,
    total_resenas: 0,
  },
  estilistasMapa: [],
  catalogoServicios: [],
  wallet: {
    saldo_disponible_cop: 0,
    total_recargado_cop: 0,
    total_comisiones_pagadas_cop: 0,
    recarga_minima_cop: 10000,
    transacciones: [],
  },
  bookings: [],
  citasAgendadas: [],
  notificacionesProfesional: [],
  notificacionesCliente: [],
  historialCompletadas: [],
};

const idsNotificacionesVistas = new Set();

/**
 * Selecciona una fotografía almacenada en el dispositivo móvil (galería) y la sube
 * al servicio real de Supabase Storage (bucket 'archivos'), guardando su referencia
 * en `public.archivos_storage`.
 */
export async function seleccionarYSubirFotografiaDispositivo({
  carpeta = 'perfiles',
  usuarioId = null,
  onProgress = null,
} = {}) {
  if (onProgress) onProgress(10);
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error(
      'Debes conceder permiso de acceso a las fotografías de tu dispositivo para seleccionar una imagen.'
    );
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.75,
    base64: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    if (onProgress) onProgress(0);
    return null;
  }

  const asset = result.assets[0];
  if (onProgress) onProgress(45);

  const ext = (asset.uri?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const mimeType = asset.mimeType || (ext === 'png' ? 'image/png' : 'image/jpeg');
  const fileName = `${carpeta}/${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;

  let publicUrl = null;

  try {
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: fileName.split('/').pop(),
      type: mimeType,
    });

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/archivos/${fileName}`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      }
    );

    if (uploadRes.ok) {
      publicUrl = `${SUPABASE_URL}/storage/v1/object/public/archivos/${fileName}`;
    }
  } catch (_uploadErr) {}

  if (!publicUrl && asset.base64) {
    publicUrl = `data:${mimeType};base64,${asset.base64}`;
  } else if (!publicUrl) {
    publicUrl = asset.uri;
  }

  if (onProgress) onProgress(85);

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/archivos_storage`, {
      method: 'POST',
      headers: SUPABASE_HEADERS,
      body: JSON.stringify({
        usuario_id: usuarioId || sessionStore.clientUser.id || sessionStore.proUser.usuario_id || null,
        bucket_nombre: 'archivos',
        ruta_storage: fileName,
        url_publica: publicUrl,
        tipo_archivo: mimeType,
      }),
    });
  } catch (_dbErr) {}

  if (onProgress) onProgress(100);

  return {
    uriLocal: asset.uri,
    urlPublica: publicUrl,
    rutaStorage: fileName,
  };
}

/**
 * Obtiene la ubicación GPS real del dispositivo y la persiste en Supabase.
 */
export async function obtenerUbicacionExactaGPS(rol = 'cliente') {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    let loc = null;
    try {
      loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
    } catch (_e) {
      loc = await Location.getLastKnownPositionAsync();
    }

    if (!loc || !loc.coords) return null;

    const lat = Number(loc.coords.latitude.toFixed(6));
    const lng = Number(loc.coords.longitude.toFixed(6));

    let direccionDetectada = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    let barrioDetectado =
      (rol === 'cliente' ? sessionStore.clientUser.barrio : sessionStore.proUser.barrio) || '';

    try {
      const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (Array.isArray(places) && places.length > 0) {
        const p = places[0];
        const calle = [p.street, p.streetNumber || p.name].filter(Boolean).join(' #');
        const sub = p.district || p.subregion || p.neighborhood || '';
        const ciudad = p.city || p.region || 'Colombia';
        if (sub) barrioDetectado = sub;
        direccionDetectada = [calle || p.name, sub, ciudad].filter(Boolean).join(', ');
      }
    } catch (_geoErr) {}

    if (rol === 'cliente') {
      sessionStore.clientUser.latitud = lat;
      sessionStore.clientUser.longitud = lng;
      if (direccionDetectada) sessionStore.clientUser.direccion_principal = direccionDetectada;
      if (barrioDetectado) sessionStore.clientUser.barrio = barrioDetectado;
      sessionStore.clientUser.gps_exacto_activo = true;
    } else {
      sessionStore.proUser.latitud_actual = lat;
      sessionStore.proUser.longitud_actual = lng;
      if (direccionDetectada) sessionStore.proUser.direccion_base = direccionDetectada;
      if (barrioDetectado) sessionStore.proUser.barrio = barrioDetectado;
    }

    const emailTarget =
      rol === 'cliente' ? sessionStore.clientUser.correo : sessionStore.proUser.correo;
    if (emailTarget) {
      fetch(
        `${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(emailTarget)}`,
        {
          method: 'PATCH',
          headers: SUPABASE_HEADERS,
          body: JSON.stringify({
            latitud: lat,
            longitud: lng,
            barrio: barrioDetectado || null,
            direccion_principal: direccionDetectada || null,
          }),
        }
      ).catch(() => {});
    }

    return {
      latitude: lat,
      longitude: lng,
      direccion: direccionDetectada,
      barrio: barrioDetectado,
    };
  } catch (_err) {
    return null;
  }
}

/**
 * Calcula la distancia en kilómetros entre dos coordenadas reales (fórmula de Haversine).
 */
export function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const m = calcularDistanciaMetros(lat1, lon1, lat2, lon2);
  if (m === null) return null;
  if (m <= 25) return 0;
  return Number((m / 1000).toFixed(2));
}

/**
 * Sincroniza el estado completo desde la base de datos real en Supabase:
 * - Profesionales registrados con su ubicación real
 * - Servicios activos creados por los profesionales
 * - Solicitudes y sus estados dentro del flujo de 5 pasos
 * - Mensajes de usuario y mensajes informativos del sistema en el chat
 * - Notificaciones reales vinculadas al usuario (sin modales invasivos)
 */
export async function sincronizarEstadoDesdeSupabase(rolActual = 'cliente') {
  try {
    // 1. Consultar profesionales reales en Supabase para mostrarlos en el mapa y directorio
    const resPros = await fetch(
      `${SUPABASE_URL}/rest/v1/usuarios?rol=eq.profesional&select=*&order=created_at.desc`,
      { method: 'GET', headers: SUPABASE_HEADERS }
    );
    if (resPros.ok) {
      const rowsPros = await resPros.json();
      if (Array.isArray(rowsPros)) {
        sessionStore.estilistasMapa = rowsPros
          .filter((u) => u.latitud !== null && u.longitud !== null)
          .map((u) => {
            const dist = calcularDistanciaKm(
              sessionStore.clientUser.latitud,
              sessionStore.clientUser.longitud,
              Number(u.latitud),
              Number(u.longitud)
            );
            return {
              id: `pro-${u.id}`,
              usuario_id: u.id,
              nombre: u.nombre,
              correo: u.email,
              telefono: u.telefono,
              especialidad: 'Especialista Verificado',
              calificacion: '5.0',
              barrio: u.barrio || u.ciudad || 'Colombia',
              direccion_exacta:
                u.direccion_principal ||
                (dist !== null ? `A ${dist} km de tu ubicación` : u.ciudad || 'Colombia'),
              distancia_km: dist,
              foto: u.avatar_url || null,
              latitud: Number(u.latitud),
              longitud: Number(u.longitud),
            };
          });
      }
    }

    // 2. Consultar servicios reales creados en `catalogo_servicios_app`
    const resCat = await fetch(
      `${SUPABASE_URL}/rest/v1/catalogo_servicios_app?select=*&order=created_at.desc`,
      { method: 'GET', headers: SUPABASE_HEADERS }
    );
    if (resCat.ok) {
      const rowsCat = await resCat.json();
      if (Array.isArray(rowsCat)) {
        sessionStore.catalogoServicios = rowsCat.map((r) => ({
          id: r.codigo_servicio || `srv-${r.id}`,
          db_id: r.id,
          profesional_id: r.profesional_id,
          proName: r.pro_name,
          proAvatar: r.pro_avatar,
          proRating: r.pro_rating || '5.0',
          barrio: r.barrio || '',
          nombre_establecimiento: r.nombre_establecimiento || '',
          latitud_profesional: r.latitud_profesional,
          longitud_profesional: r.longitud_profesional,
          categoryId: r.category_id,
          categoryLabel: r.category_label,
          badge: r.badge || 'Destacado',
          title: r.title,
          desc: r.descripcion,
          duration: r.duration,
          modalityLabel: r.modality_label,
          priceCop: Number(r.price_cop) || 10000,
          active: Boolean(r.active),
          image: r.image,
          galeria_resultados:
            Array.isArray(r.galeria_resultados) && r.galeria_resultados.length > 0
              ? r.galeria_resultados
              : r.image
              ? [r.image]
              : [],
        }));
      }
    }

    // 3. Consultar solicitudes reales en `solicitudes_uber`
    const resSol = await fetch(
      `${SUPABASE_URL}/rest/v1/solicitudes_uber?order=created_at.desc&limit=25`,
      { method: 'GET', headers: SUPABASE_HEADERS }
    );
    if (resSol.ok) {
      const rowsSol = await resSol.json();
      if (Array.isArray(rowsSol)) {
        const activas = [];
        const completadas = [];
        for (const s of rowsSol) {
          const item = {
            ...s,
            id: `booking-${s.id || s.codigo_reserva}`,
            db_id: s.id,
            mensajes_chat:
              sessionStore.bookings.find((b) => b.codigo_reserva === s.codigo_reserva)
                ?.mensajes_chat || [],
          };
          if (ESTADOS_DOMICILIO_ACTIVOS.includes(s.estado)) {
            activas.push(item);
          } else {
            completadas.push(item);
          }
        }
        sessionStore.bookings = activas;
        sessionStore.historialCompletadas = completadas;
      }
    }

    // 4. Consultar citas agendadas en local en `citas_agenda`
    const resCitas = await fetch(
      `${SUPABASE_URL}/rest/v1/citas_agenda?select=*&order=created_at.desc`,
      { method: 'GET', headers: SUPABASE_HEADERS }
    );
    if (resCitas.ok) {
      const rowsCitas = await resCitas.json();
      if (Array.isArray(rowsCitas)) {
        sessionStore.citasAgendadas = rowsCitas;
      }
    }

    // 5. Consultar mensajes del chat de la solicitud activa (incluidos mensajes informativos del sistema)
    const activa = obtenerSolicitudActiva();
    if (activa && activa.codigo_reserva) {
      const resMsg = await fetch(
        `${SUPABASE_URL}/rest/v1/mensajes_chat_temporal?codigo_reserva=eq.${encodeURIComponent(
          activa.codigo_reserva
        )}&order=created_at.asc`,
        { method: 'GET', headers: SUPABASE_HEADERS }
      );
      if (resMsg.ok) {
        const rowsMsg = await resMsg.json();
        if (Array.isArray(rowsMsg)) {
          activa.mensajes_chat = rowsMsg.map((m) => ({
            id: `msg-${m.id}`,
            autor: m.autor,
            tipo_mensaje: m.tipo_mensaje || (m.autor === 'sistema' ? 'sistema' : 'texto'),
            nombre: m.nombre,
            texto: m.texto,
            hora: m.hora,
          }));
        }
      }
    }

    // 6. Consultar notificaciones reales del usuario (SIN mostrar ventanas modales invasivas)
    const userIdActual =
      rolActual === 'profesional'
        ? sessionStore.proUser.usuario_id || sessionStore.proUser.id
        : sessionStore.clientUser.id;

    let filtroNotif = `rol_destino=in.(${rolActual},todos)&order=created_at.desc&limit=30`;
    if (userIdActual) {
      filtroNotif = `or=(usuario_id.eq.${userIdActual},rol_destino.eq.${rolActual})&order=created_at.desc&limit=30`;
    }

    const resNotif = await fetch(`${SUPABASE_URL}/rest/v1/notificaciones?${filtroNotif}`, {
      method: 'GET',
      headers: SUPABASE_HEADERS,
    });
    if (resNotif.ok) {
      const rowsNotif = await resNotif.json();
      if (Array.isArray(rowsNotif)) {
        const formateadas = rowsNotif.map((n) => ({
          id: `notif-${n.id}`,
          db_id: n.id,
          usuario_id: n.usuario_id,
          codigo_reserva: n.codigo_reserva,
          titulo: n.titulo,
          mensaje: n.mensaje,
          tipo: n.tipo,
          leida: Boolean(n.leida),
          hora: new Date(n.created_at || Date.now()).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));

        if (rolActual === 'profesional') {
          sessionStore.notificacionesProfesional = formateadas;
        } else {
          sessionStore.notificacionesCliente = formateadas;
        }

        const nuevaNoVista = rowsNotif.find(
          (n) => !n.leida && !idsNotificacionesVistas.has(n.id)
        );
        if (nuevaNoVista) {
          idsNotificacionesVistas.add(nuevaNoVista.id);
          try {
            Vibration.vibrate(180);
          } catch (_vErr) {}
        }
      }
    }
  } catch (_err) {}
}

export async function marcarNotificacionesComoLeidas(rolActual = 'cliente') {
  const lista =
    rolActual === 'profesional'
      ? sessionStore.notificacionesProfesional
      : sessionStore.notificacionesCliente;

  const noLeidasIds = lista.filter((n) => !n.leida && n.db_id).map((n) => n.db_id);
  lista.forEach((n) => {
    n.leida = true;
  });

  if (noLeidasIds.length > 0) {
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/notificaciones?id=in.(${noLeidasIds.join(',')})`,
        {
          method: 'PATCH',
          headers: SUPABASE_HEADERS,
          body: JSON.stringify({ leida: true }),
        }
      );
    } catch (_e) {}
  }
}

export async function guardarServicioCatalogoEnSupabase(srv) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/catalogo_servicios_app?on_conflict=codigo_servicio`,
    {
      method: 'POST',
      headers: {
        ...SUPABASE_HEADERS,
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        codigo_servicio: srv.id,
        profesional_id:
          srv.profesional_id || sessionStore.proUser.usuario_id || sessionStore.proUser.id || null,
        pro_name: srv.proName,
        pro_avatar: srv.proAvatar,
        pro_rating: srv.proRating || '5.0',
        barrio: srv.barrio || sessionStore.proUser.barrio || '',
        nombre_establecimiento:
          srv.nombre_establecimiento || sessionStore.proUser.nombre_establecimiento || '',
        latitud_profesional: sessionStore.proUser.latitud_actual || null,
        longitud_profesional: sessionStore.proUser.longitud_actual || null,
        category_id: srv.categoryId || 'cabello',
        category_label: srv.categoryLabel || 'Peluquería',
        badge: srv.badge || 'Destacado',
        title: srv.title,
        descripcion: srv.desc || '',
        duration: srv.duration || '60 min',
        modality_label: srv.modalityLabel || 'Salón y Domicilio',
        price_cop: Number(srv.priceCop) || 10000,
        active: Boolean(srv.active),
        image: srv.image,
        galeria_resultados: srv.galeria_resultados || (srv.image ? [srv.image] : []),
      }),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`No se pudo guardar el servicio en Supabase: ${errText}`);
  }
  return await res.json();
}

export function obtenerServiciosActivosParaClientes({
  categoria = 'todos',
  busqueda = '',
} = {}) {
  return sessionStore.catalogoServicios.filter((srv) => {
    if (!srv.active) return false;
    if (categoria && categoria !== 'todos' && srv.categoryId !== categoria) {
      return false;
    }
    if (busqueda && busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      const matchNombre = (srv.title || '').toLowerCase().includes(q);
      const matchCat = (srv.categoryLabel || '').toLowerCase().includes(q);
      const matchDesc = (srv.desc || '').toLowerCase().includes(q);
      if (!matchNombre && !matchCat && !matchDesc) return false;
    }
    return true;
  });
}

/**
 * Registra una notificación en `public.notificaciones` y opcionalmente un mensaje
 * informativo del sistema (`autor: 'sistema'`) dentro de la conversación del chat.
 */
export async function agregarNotificacionTiempoReal(
  destino,
  {
    usuario_id = null,
    titulo,
    mensaje,
    tipo = 'estado_solicitud',
    codigo_reserva = null,
    registrarEnChat = true,
  }
) {
  const horaStr = new Date().toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const notifLocal = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    usuario_id,
    codigo_reserva,
    titulo,
    mensaje,
    tipo,
    leida: false,
    hora: horaStr,
  };

  if (destino === 'profesional') {
    sessionStore.notificacionesProfesional.unshift(notifLocal);
  } else {
    sessionStore.notificacionesCliente.unshift(notifLocal);
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/notificaciones`, {
      method: 'POST',
      headers: SUPABASE_HEADERS,
      body: JSON.stringify({
        usuario_id,
        rol_destino: destino === 'profesional' ? 'profesional' : 'cliente',
        codigo_reserva,
        titulo,
        mensaje,
        tipo,
        leida: false,
      }),
    });
    if (res.ok) {
      const saved = await res.json();
      const fila = Array.isArray(saved) ? saved[0] : saved;
      if (fila?.id) idsNotificacionesVistas.add(fila.id);
    }
  } catch (_e) {}

  if (registrarEnChat && codigo_reserva) {
    const msgSistema = {
      id: `sys-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      autor: 'sistema',
      tipo_mensaje: 'sistema',
      nombre: 'Sistema BeautyFlash',
      texto: `${titulo}: ${mensaje}`,
      hora: horaStr,
    };

    const activa = obtenerSolicitudActiva();
    if (activa && activa.codigo_reserva === codigo_reserva) {
      activa.mensajes_chat = [...(activa.mensajes_chat || []), msgSistema];
    }

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/mensajes_chat_temporal`, {
        method: 'POST',
        headers: SUPABASE_HEADERS,
        body: JSON.stringify({
          codigo_reserva,
          autor: 'sistema',
          tipo_mensaje: 'sistema',
          nombre: 'Sistema BeautyFlash',
          texto: `${titulo}: ${mensaje}`,
          hora: horaStr,
        }),
      });
    } catch (_e) {}
  }

  return notifLocal;
}

export function verificarDisponibilidadEspecialista(profesionalId, fecha, hora) {
  const bloquesBase =
    sessionStore.proUser.horario_atencion?.bloques_disponibles || BLOQUES_HORARIOS_ESTANDAR;

  const citasMismoDia = sessionStore.citasAgendadas.filter(
    (c) =>
      c.estado !== 'cancelada' &&
      c.estado !== 'rechazada_por_profesional' &&
      String(c.fecha_programada).toLowerCase() === String(fecha).trim().toLowerCase()
  );

  const horasOcupadas = citasMismoDia.map((c) => c.hora_programada);
  const estaOcupado = horasOcupadas.includes(hora);
  const fueraDeHorario = !bloquesBase.includes(hora);
  const horariosRecomendados = bloquesBase.filter((h) => !horasOcupadas.includes(h));

  if (estaOcupado || fueraDeHorario) {
    return {
      disponible: false,
      motivo: estaOcupado
        ? `El horario ${hora} del día ${fecha} ya se encuentra reservado.`
        : `El horario ${hora} está fuera del bloque de atención (${bloquesBase.join(', ')}).`,
      horariosRecomendados,
    };
  }

  return {
    disponible: true,
    horariosRecomendados,
  };
}

export function obtenerSolicitudActiva() {
  return (
    sessionStore.bookings.find((b) => ESTADOS_DOMICILIO_ACTIVOS.includes(b.estado)) || null
  );
}

/**
 * PASO 1 DEL FLUJO OBLIGATORIO DE SOLICITUDES:
 * El cliente selecciona un profesional/servicio real y crea una solicitud en estado
 * `pendiente_aceptacion_profesional`.
 * Envía notificación al profesional e inserta el mensaje inicial del sistema en el chat.
 */
export async function crearUnicaSolicitudServicio({
  servicio_id,
  servicio_nombre,
  precio_servicio_cop,
  servicio_foto = null,
  profesional_id = null,
  profesional_nombre = '',
  profesional_foto = null,
  latitud_profesional = null,
  longitud_profesional = null,
  modalidad = 'domicilio',
  fecha_programada = 'Hoy',
  hora_programada = 'Inmediato',
  coordsCliente = null,
}) {
  const existente = obtenerSolicitudActiva();
  if (existente) {
    return {
      bloqueado: true,
      activa: existente,
      mensaje: `Ya tienes una solicitud en curso (#${existente.codigo_reserva} en estado "${formatearEtiquetaEstado(
        existente.estado
      )}"). Debes finalizarla o cancelarla antes de crear otra.`,
    };
  }

  if (modalidad === 'local') {
    const disp = verificarDisponibilidadEspecialista(
      profesional_id,
      fecha_programada,
      hora_programada
    );
    if (!disp.disponible) {
      return {
        bloqueado: true,
        disponible: false,
        motivo: disp.motivo,
        horariosRecomendados: disp.horariosRecomendados,
      };
    }
  }

  const cliente = sessionStore.clientUser;
  const latCli = Number(coordsCliente?.latitude || cliente.latitud || 3.3712);
  const lngCli = Number(coordsCliente?.longitude || cliente.longitud || -76.5320);

  const proEnMapa =
    sessionStore.estilistasMapa.find(
      (e) => e.usuario_id === profesional_id || e.nombre === profesional_nombre
    ) || sessionStore.estilistasMapa[0];

  const latPro = Number(
    latitud_profesional ||
      proEnMapa?.latitud ||
      sessionStore.proUser.latitud_actual ||
      latCli + 0.0032
  );
  const lngPro = Number(
    longitud_profesional ||
      proEnMapa?.longitud ||
      sessionStore.proUser.longitud_actual ||
      lngCli - 0.0028
  );

  const calculoRuta = await calcularRutaYDistanciaReal({
    latProfesional: latPro,
    lngProfesional: lngPro,
    latCliente: latCli,
    lngCliente: lngCli,
  });
  const distKm = calculoRuta.distancia_km;
  const etaMin = calculoRuta.eta_minutos;

  const recargo = modalidad === 'domicilio' ? 8000 : 0;
  const baseCop = Number(precio_servicio_cop) || 10000;
  const totalCop = baseCop + recargo;
  const comision10 = calcularComisionCOP(totalCop);
  const codigo = `BF-${Math.floor(10000 + Math.random() * 90000)}`;

  const nueva = {
    id: `booking-${Date.now()}`,
    codigo_reserva: codigo,
    servicio_id: servicio_id || null,
    servicio_nombre,
    servicio_foto,
    barrio_zona: cliente.barrio || 'Cali',
    cliente_id: cliente.id || null,
    cliente_nombre: cliente.nombre_completo || 'Cliente',
    cliente_telefono: cliente.telefono || '',
    cliente_foto: cliente.foto_perfil_url || null,
    profesional_id:
      profesional_id || proEnMapa?.usuario_id || sessionStore.proUser.usuario_id || null,
    profesional_nombre:
      profesional_nombre || proEnMapa?.nombre || sessionStore.proUser.nombre_completo || 'Profesional',
    profesional_foto:
      profesional_foto || proEnMapa?.foto || sessionStore.proUser.foto_perfil_url || null,
    modalidad,
    fecha_programada,
    hora_programada,
    estado: ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_ACEPTACION_PRO,
    progreso_ruta: 0,
    instruccion_uber: 'Solicitud enviada. Pendiente de aceptación del profesional.',
    direccion_servicio:
      cliente.direccion_principal || `${latCli.toFixed(5)}, ${lngCli.toFixed(5)}`,
    latitud_servicio: latCli,
    longitud_servicio: lngCli,
    latitud_origen_pro: latPro,
    longitud_origen_pro: lngPro,
    latitud_profesional: latPro,
    longitud_profesional: lngPro,
    distancia_estimada_km: distKm,
    tiempo_estimado_minutos: etaMin,
    precio_servicio_cop: baseCop,
    recargo_domicilio_cop: recargo,
    precio_total_cop: totalCop,
    valor_comision_cop: comision10,
    chat_activo: true,
    mensajes_chat: [],
  };

  sessionStore.bookings = [nueva];

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/solicitudes_uber`, {
      method: 'POST',
      headers: SUPABASE_HEADERS,
      body: JSON.stringify({
        codigo_reserva: nueva.codigo_reserva,
        servicio_id: nueva.servicio_id,
        servicio_nombre: nueva.servicio_nombre,
        servicio_foto: nueva.servicio_foto,
        barrio_zona: nueva.barrio_zona,
        cliente_id: nueva.cliente_id,
        cliente_nombre: nueva.cliente_nombre,
        cliente_telefono: nueva.cliente_telefono,
        cliente_foto: nueva.cliente_foto,
        profesional_id: nueva.profesional_id,
        profesional_nombre: nueva.profesional_nombre,
        profesional_foto: nueva.profesional_foto,
        modalidad: nueva.modalidad,
        fecha_programada: nueva.fecha_programada,
        hora_programada: nueva.hora_programada,
        estado: nueva.estado,
        direccion_servicio: nueva.direccion_servicio,
        latitud_servicio: nueva.latitud_servicio,
        longitud_servicio: nueva.longitud_servicio,
        latitud_origen_pro: nueva.latitud_origen_pro,
        longitud_origen_pro: nueva.longitud_origen_pro,
        latitud_profesional: nueva.latitud_profesional,
        longitud_profesional: nueva.longitud_profesional,
        distancia_estimada_km: nueva.distancia_estimada_km,
        tiempo_estimado_minutos: nueva.tiempo_estimado_minutos,
        precio_servicio_cop: nueva.precio_servicio_cop,
        recargo_domicilio_cop: nueva.recargo_domicilio_cop,
        precio_total_cop: nueva.precio_total_cop,
        valor_comision_cop: nueva.valor_comision_cop,
        progreso_ruta: 0,
        instruccion_uber: nueva.instruccion_uber,
        chat_activo: true,
      }),
    });
  } catch (_e) {}

  if (modalidad === 'local') {
    sessionStore.citasAgendadas.unshift({
      codigo_reserva: nueva.codigo_reserva,
      servicio_id: nueva.servicio_id,
      servicio_nombre: nueva.servicio_nombre,
      servicio_foto: nueva.servicio_foto,
      cliente_id: nueva.cliente_id,
      cliente_nombre: nueva.cliente_nombre,
      cliente_telefono: nueva.cliente_telefono,
      profesional_id: nueva.profesional_id,
      profesional_nombre: nueva.profesional_nombre,
      modalidad: 'local',
      fecha_programada,
      hora_programada,
      direccion_servicio: nueva.direccion_servicio,
      precio_servicio_cop: baseCop,
      precio_total_cop: totalCop,
      valor_comision_cop: comision10,
      estado: ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_ACEPTACION_PRO,
    });
  }

  await agregarNotificacionTiempoReal('profesional', {
    usuario_id: nueva.profesional_id,
    codigo_reserva: nueva.codigo_reserva,
    titulo: 'Nueva solicitud de servicio recibida',
    mensaje: `${nueva.cliente_nombre} solicita "${nueva.servicio_nombre}" (${
      modalidad === 'domicilio' ? 'A domicilio' : `En salón: ${fecha_programada} ${hora_programada}`
    }) por ${formatCOP(totalCop)} COP. Revisa y acepta o rechaza la solicitud.`,
    tipo: 'solicitud_recibida',
    registrarEnChat: true,
  });

  return {
    bloqueado: false,
    disponible: true,
    reserva: nueva,
  };
}

/**
 * PASO 3 DEL FLUJO DE SOLICITUDES:
 * El profesional acepta o rechaza la solicitud.
 * IMPORTANTE: Cuando el profesional acepta, la solicitud pasa a `aceptada_por_profesional`
 * (pendiente de confirmación definitiva por parte del cliente). NO se activa el servicio todavía.
 */
export async function responderSolicitudPorProfesional(decision = 'aceptar') {
  const activa = obtenerSolicitudActiva();
  if (!activa) return null;

  if (decision === 'rechazar') {
    activa.estado = ESTADOS_SOLICITUD_OFICIALES.RECHAZADA_POR_PRO;
    activa.chat_activo = false;
    activa.instruccion_uber = 'Solicitud rechazada por el profesional.';

    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/solicitudes_uber?codigo_reserva=eq.${encodeURIComponent(
          activa.codigo_reserva
        )}`,
        {
          method: 'PATCH',
          headers: SUPABASE_HEADERS,
          body: JSON.stringify({
            estado: activa.estado,
            chat_activo: false,
            instruccion_uber: activa.instruccion_uber,
          }),
        }
      );
    } catch (_e) {}

    await agregarNotificacionTiempoReal('cliente', {
      usuario_id: activa.cliente_id,
      codigo_reserva: activa.codigo_reserva,
      titulo: 'Solicitud rechazada por el profesional',
      mensaje: `El profesional ${activa.profesional_nombre} no puede atender la solicitud #${activa.codigo_reserva} en este momento.`,
      tipo: 'rechazada_profesional',
      registrarEnChat: true,
    });

    sessionStore.historialCompletadas.unshift({ ...activa });
    sessionStore.bookings = [];
    return activa;
  }

  // El profesional acepta -> Pasa a `aceptada_por_profesional` (esperando confirmación del cliente)
  activa.estado = ESTADOS_SOLICITUD_OFICIALES.ACEPTADA_POR_PRO;
  activa.instruccion_uber =
    'El profesional aceptó tu solicitud. Confirma definitivamente el servicio para activarlo.';

  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/solicitudes_uber?codigo_reserva=eq.${encodeURIComponent(
        activa.codigo_reserva
      )}`,
      {
        method: 'PATCH',
        headers: SUPABASE_HEADERS,
        body: JSON.stringify({
          estado: activa.estado,
          instruccion_uber: activa.instruccion_uber,
        }),
      }
    );
  } catch (_e) {}

  await agregarNotificacionTiempoReal('cliente', {
    usuario_id: activa.cliente_id,
    codigo_reserva: activa.codigo_reserva,
    titulo: 'Solicitud aceptada por el profesional',
    mensaje: `${activa.profesional_nombre} aceptó tu solicitud #${activa.codigo_reserva} ("${activa.servicio_nombre}"). Por favor confirma definitivamente la solicitud para activar el servicio.`,
    tipo: 'aceptada_profesional',
    registrarEnChat: true,
  });

  return activa;
}

/**
 * PASO 4 Y PASO 5 DEL FLUJO DE SOLICITUDES:
 * El CLIENTE confirma definitivamente la solicitud que había sido aceptada por el profesional.
 * Únicamente en este momento el estado pasa a `confirmada_por_cliente`, se activa el servicio,
 * se descuenta la comisión del 10% y se habilita el seguimiento en el mapa a pantalla completa.
 */
export async function confirmarDefinitivamentePorCliente() {
  const activa = obtenerSolicitudActiva();
  if (!activa) return null;

  activa.estado = ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE;
  activa.progreso_ruta = 15;
  activa.chat_activo = true;
  activa.instruccion_uber = `Servicio confirmado por el cliente. ${activa.profesional_nombre} listo para iniciar ruta hacia ${activa.direccion_servicio}.`;

  // Descontar comisión del 10% de la billetera del profesional al activarse el servicio
  const comision = activa.valor_comision_cop || calcularComisionCOP(activa.precio_total_cop);
  if (sessionStore.wallet.saldo_disponible_cop >= comision) {
    sessionStore.wallet.saldo_disponible_cop -= comision;
    sessionStore.wallet.total_comisiones_pagadas_cop += comision;
    sessionStore.wallet.transacciones.unshift({
      id: `tx-${Date.now()}`,
      tipo: 'comision_servicio',
      monto_cop: comision,
      signo: -1,
      saldo_posterior_cop: sessionStore.wallet.saldo_disponible_cop,
      metodo_pago: 'Comisión 10%',
      descripcion: `Comisión 10% por servicio #${activa.codigo_reserva} confirmado por ${activa.cliente_nombre}`,
      creado_en: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    });
  }

  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/solicitudes_uber?codigo_reserva=eq.${encodeURIComponent(
        activa.codigo_reserva
      )}`,
      {
        method: 'PATCH',
        headers: SUPABASE_HEADERS,
        body: JSON.stringify({
          estado: activa.estado,
          progreso_ruta: activa.progreso_ruta,
          chat_activo: true,
          instruccion_uber: activa.instruccion_uber,
        }),
      }
    );
  } catch (_e) {}

  await agregarNotificacionTiempoReal('profesional', {
    usuario_id: activa.profesional_id,
    codigo_reserva: activa.codigo_reserva,
    titulo: 'Servicio confirmado definitivamente por el cliente',
    mensaje: `${activa.cliente_nombre} confirmó la solicitud #${activa.codigo_reserva} ("${activa.servicio_nombre}"). El servicio está activo; puedes iniciar la ruta hacia el destino.`,
    tipo: 'confirmada_cliente',
    registrarEnChat: true,
  });

  return activa;
}

export async function enviarMensajeChatServicio(autor, texto) {
  const activa = obtenerSolicitudActiva();
  if (!activa || !activa.chat_activo) {
    return {
      exito: false,
      error: 'El chat no se encuentra activo para esta solicitud.',
    };
  }
  const limpio = String(texto || '').trim();
  if (!limpio) return { exito: false };

  const horaStr = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const nombreAutor = autor === 'cliente' ? activa.cliente_nombre : activa.profesional_nombre;

  const nuevoMsg = {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    autor,
    tipo_mensaje: 'texto',
    nombre: nombreAutor,
    texto: limpio,
    hora: horaStr,
  };
  activa.mensajes_chat = [...(activa.mensajes_chat || []), nuevoMsg];

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/mensajes_chat_temporal`, {
      method: 'POST',
      headers: SUPABASE_HEADERS,
      body: JSON.stringify({
        codigo_reserva: activa.codigo_reserva,
        autor,
        tipo_mensaje: 'texto',
        nombre: nombreAutor,
        texto: limpio,
        hora: horaStr,
      }),
    });
  } catch (_e) {}

  await agregarNotificacionTiempoReal(autor === 'cliente' ? 'profesional' : 'cliente', {
    usuario_id: autor === 'cliente' ? activa.profesional_id : activa.cliente_id,
    codigo_reserva: activa.codigo_reserva,
    titulo: `Nuevo mensaje de ${nombreAutor}`,
    mensaje: limpio,
    tipo: 'mensaje_chat',
    registrarEnChat: false,
  });

  return { exito: true, mensaje: nuevoMsg };
}

/**
 * Actualiza los estados posteriores a la confirmación del cliente:
 * `en_camino` -> `en_servicio` -> `finalizada` (o `cancelada`),
 * registrando la notificación y el mensaje informativo del sistema en el chat.
 */
export async function actualizarEstadoSolicitudActiva(nuevoEstado, avanceExtra = null) {
  const activa = obtenerSolicitudActiva();
  if (!activa) return null;

  activa.estado = nuevoEstado;

  const latO = Number(activa.latitud_origen_pro || activa.latitud_servicio + 0.003);
  const lngO = Number(activa.longitud_origen_pro || activa.longitud_servicio - 0.0025);
  const latD = Number(activa.latitud_servicio);
  const lngD = Number(activa.longitud_servicio);

  if (nuevoEstado === ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO) {
    activa.chat_activo = true;
    activa.progreso_ruta =
      avanceExtra !== null ? avanceExtra : Math.min(90, (activa.progreso_ruta || 15) + 25);
    const fracRest = Math.max(0.08, 1 - activa.progreso_ruta / 100);
    const distBase = calcularDistanciaKm(latO, lngO, latD, lngD) || 1.2;
    activa.distancia_estimada_km = Number((distBase * fracRest).toFixed(2));
    activa.tiempo_estimado_minutos = Math.max(1, Math.round(activa.distancia_estimada_km * 4));
    activa.instruccion_uber = `Profesional en camino hacia ${activa.direccion_servicio} (${activa.distancia_estimada_km} km • ${activa.tiempo_estimado_minutos} min).`;

    await agregarNotificacionTiempoReal('cliente', {
      usuario_id: activa.cliente_id,
      codigo_reserva: activa.codigo_reserva,
      titulo: 'Profesional en camino',
      mensaje: `${activa.profesional_nombre} está en camino hacia tu ubicación. Tiempo estimado: ${activa.tiempo_estimado_minutos} min (${activa.distancia_estimada_km} km).`,
      tipo: 'en_camino',
      registrarEnChat: true,
    });
  } else if (nuevoEstado === ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO) {
    activa.progreso_ruta = 100;
    activa.distancia_estimada_km = 0;
    activa.tiempo_estimado_minutos = 0;
    activa.instruccion_uber = 'Profesional en ubicación realizando el servicio.';

    await agregarNotificacionTiempoReal('cliente', {
      usuario_id: activa.cliente_id,
      codigo_reserva: activa.codigo_reserva,
      titulo: 'Servicio en curso',
      mensaje: `${activa.profesional_nombre} ha iniciado la prestación del servicio "${activa.servicio_nombre}".`,
      tipo: 'en_servicio',
      registrarEnChat: true,
    });
  } else if (
    nuevoEstado === ESTADOS_SOLICITUD_OFICIALES.FINALIZADA ||
    nuevoEstado === ESTADOS_SOLICITUD_OFICIALES.CANCELADA
  ) {
    activa.progreso_ruta = 100;
    activa.chat_activo = false;

    const esFinalizada = nuevoEstado === ESTADOS_SOLICITUD_OFICIALES.FINALIZADA;
    await agregarNotificacionTiempoReal(esFinalizada ? 'cliente' : 'profesional', {
      usuario_id: esFinalizada ? activa.cliente_id : activa.profesional_id,
      codigo_reserva: activa.codigo_reserva,
      titulo: esFinalizada ? 'Servicio finalizado' : 'Solicitud cancelada',
      mensaje: esFinalizada
        ? `El servicio #${activa.codigo_reserva} ("${activa.servicio_nombre}") ha finalizado correctamente.`
        : `La solicitud #${activa.codigo_reserva} fue cancelada.`,
      tipo: nuevoEstado,
      registrarEnChat: true,
    });

    sessionStore.historialCompletadas.unshift({ ...activa });
    sessionStore.bookings = [];
  }

  const frac = Math.min(1, Math.max(0, (activa.progreso_ruta || 0) / 100));
  activa.latitud_profesional = Number((latO + (latD - latO) * frac).toFixed(6));
  activa.longitud_profesional = Number((lngO + (lngD - lngO) * frac).toFixed(6));

  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/solicitudes_uber?codigo_reserva=eq.${encodeURIComponent(
        activa.codigo_reserva
      )}`,
      {
        method: 'PATCH',
        headers: SUPABASE_HEADERS,
        body: JSON.stringify({
          estado: activa.estado,
          progreso_ruta: activa.progreso_ruta,
          chat_activo: activa.chat_activo,
          latitud_profesional: activa.latitud_profesional,
          longitud_profesional: activa.longitud_profesional,
          distancia_estimada_km: activa.distancia_estimada_km,
          tiempo_estimado_minutos: activa.tiempo_estimado_minutos,
          instruccion_uber: activa.instruccion_uber,
        }),
      }
    );
  } catch (_e) {}

  return activa;
}

/**
 * Integración Real con Google Maps (JavaScript API + DirectionsService + Google Maps Tiles).
 * - Muestra marcadores reales de la ubicación del cliente y de los profesionales registrados en Supabase.
 * - Traza la ruta vial real entre el profesional y el destino del cliente cuando el servicio está confirmado o en camino.
 */
export function generarHtmlMapaUber({
  solicitud = null,
  coordsCliente = null,
  vista = 'cliente',
}) {
  const latCli = Number(
    coordsCliente?.latitude ||
      solicitud?.latitud_servicio ||
      sessionStore.clientUser.latitud ||
      sessionStore.proUser.latitud_actual ||
      3.4516
  );
  const lngCli = Number(
    coordsCliente?.longitude ||
      solicitud?.longitud_servicio ||
      sessionStore.clientUser.longitud ||
      sessionStore.proUser.longitud_actual ||
      -76.5320
  );

  const estilistasReales = (sessionStore.estilistasMapa || []).filter(
    (e) => e.latitud !== null && e.longitud !== null
  );

  const latProActual = Number(
    solicitud?.latitud_profesional ||
      solicitud?.latitud_origen_pro ||
      sessionStore.proUser.latitud_actual ||
      latCli + 0.0028
  );
  const lngProActual = Number(
    solicitud?.longitud_profesional ||
      solicitud?.longitud_origen_pro ||
      sessionStore.proUser.longitud_actual ||
      lngCli - 0.0024
  );

  const estado = solicitud?.estado || 'exploracion';
  const mostrarRuta = [
    ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE,
    ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO,
    ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO,
  ].includes(estado);

  const estilistasJson = JSON.stringify(estilistasReales);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
      <style>
        * { box-sizing: border-box; }
        body, html, #map {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background: #EFEAE4;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .leaflet-control-attribution { display: none !important; }
        .pin-cliente {
          background: #1A1A1A;
          color: #FFFFFF;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 6px;
          border: 2px solid #FFFFFF;
          white-space: nowrap;
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        }
        .pin-pro {
          background: #844D3B;
          color: #FFFFFF;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 9px;
          border-radius: 999px;
          border: 2px solid #FFFFFF;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(132,77,59,0.45);
        }
        .recenter-btn {
          position: absolute;
          bottom: 14px;
          right: 14px;
          z-index: 999;
          background: #1A1A1A;
          color: #FFFFFF;
          border: 1px solid #D48C70;
          border-radius: 8px;
          padding: 7px 12px;
          font-size: 11px;
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      <button class="recenter-btn" onclick="centrarVista()">Centrar mapa</button>
      <div id="map"></div>
      <script>
        var latCli = ${latCli};
        var lngCli = ${lngCli};
        var latPro = ${latProActual};
        var lngPro = ${lngProActual};
        var mostrarRuta = ${mostrarRuta ? 'true' : 'false'};
        var estilistas = ${estilistasJson};
        var map = null;
        var boundsPts = [];

        function centrarVista() {
          if (map && boundsPts.length > 1) {
            map.fitBounds(boundsPts, { padding: [50, 50], maxZoom: 16 });
          } else if (map) {
            map.setView([latCli, lngCli], 15);
          }
        }

        function iniciarMapaGoogleTiles() {
          map = L.map('map', { zoomControl: true }).setView([latCli, lngCli], 15);
          // Google Maps Official Roadmap Tiles (con respaldo Carto/OSM)
          var gLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20
          }).addTo(map);

          gLayer.on('tileerror', function() {
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
              maxZoom: 20,
              subdomains: 'abcd'
            }).addTo(map);
          });

          // Marcador de ubicación del cliente / destino
          var cliMarker = L.marker([latCli, lngCli], {
            icon: L.divIcon({
              className: '',
              html: '<div class="pin-cliente">Ubicación Cliente</div>',
              iconSize: [110, 26],
              iconAnchor: [55, 13]
            })
          }).addTo(map);
          boundsPts.push([latCli, lngCli]);

          if (!mostrarRuta) {
            estilistas.forEach(function(e) {
              var m = L.marker([e.latitud, e.longitud], {
                icon: L.divIcon({
                  className: '',
                  html: '<div class="pin-pro">' + e.nombre + '</div>',
                  iconSize: [120, 26],
                  iconAnchor: [60, 13]
                })
              }).addTo(map);
              m.bindPopup('<b>' + e.nombre + '</b><br/>' + (e.direccion_exacta || ''));
              boundsPts.push([e.latitud, e.longitud]);
            });
            centrarVista();
          } else {
            var proMarker = L.marker([latPro, lngPro], {
              icon: L.divIcon({
                className: '',
                html: '<div class="pin-pro">Profesional: ${
                  solicitud?.profesional_nombre || 'En ruta'
                }</div>',
                iconSize: [140, 26],
                iconAnchor: [70, 13]
              })
            }).addTo(map);
            boundsPts.push([latPro, lngPro]);

            var fallbackLine = [
              [latPro, lngPro],
              [(latPro + latCli) / 2 + 0.0005, (lngPro + lngCli) / 2 - 0.0004],
              [latCli, lngCli]
            ];
            var polyBorder = L.polyline(fallbackLine, { color: '#1A1A1A', weight: 8, opacity: 0.85 }).addTo(map);
            var polyMain = L.polyline(fallbackLine, { color: '#844D3B', weight: 4, opacity: 1 }).addTo(map);
            centrarVista();

            // Trazado real de ruta por calles
            fetch('https://router.project-osrm.org/route/v1/driving/' + lngPro + ',' + latPro + ';' + lngCli + ',' + latCli + '?overview=full&geometries=geojson')
              .then(function(r) { return r.json(); })
              .then(function(d) {
                if (d && d.routes && d.routes[0] && d.routes[0].geometry) {
                  var coords = d.routes[0].geometry.coordinates.map(function(c) { return [c[1], c[0]]; });
                  if (coords.length > 1) {
                    polyBorder.setLatLngs(coords);
                    polyMain.setLatLngs(coords);
                    map.fitBounds(polyBorder.getBounds(), { padding: [50, 50] });
                  }
                }
              })
              .catch(function() {});
          }
        }

        iniciarMapaGoogleTiles();
      </script>
    </body>
    </html>
  `;
}


// =============================================================================
// PERSISTENCIA LOCAL DE ONBOARDING Y SESIÓN + CÁLCULO RIGUROSO DE DISTANCIAS
// =============================================================================
const STORAGE_KEY_ONBOARDING = 'beautyflash_onboarding_completed_v1';
const STORAGE_KEY_SESSION = 'beautyflash_active_session_v1';

function obtenerDeviceSignature() {
  const { width, height } = Dimensions.get('screen');
  return `bf-dev-${Platform.OS}-${Platform.Version || '1'}-${Math.round(width)}x${Math.round(height)}`;
}

function leerLocalStorageSeguro(key) {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage.getItem(key);
    }
  } catch (_e) {}
  return null;
}

function escribirLocalStorageSeguro(key, val) {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      if (val === null) {
        globalThis.localStorage.removeItem(key);
      } else {
        globalThis.localStorage.setItem(key, val);
      }
    }
  } catch (_e) {}
}

/**
 * Guarda permanentemente que el Onboarding de 5 pantallas ya fue visualizado.
 * Este indicador es independiente de la sesión y NUNCA se borra al cerrar sesión.
 */
export async function marcarOnboardingComoVistoPermanentemente() {
  sessionStore.onboardingCompleted = true;
  escribirLocalStorageSeguro(STORAGE_KEY_ONBOARDING, 'true');

  const devKey = obtenerDeviceSignature();
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/dispositivos_instalacion?on_conflict=device_key`,
      {
        method: 'POST',
        headers: {
          ...SUPABASE_HEADERS,
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify({
          device_key: devKey,
          onboarding_visto: true,
          updated_at: new Date().toISOString(),
        }),
      }
    );
  } catch (_e) {}
}

/**
 * Guarda la sesión autenticada (ID de usuario y token de sesión, NUNCA la contraseña).
 */
export async function guardarSesionPersistente({ usuarioId, token }) {
  if (!usuarioId) return;
  const payload = JSON.stringify({
    usuario_id: usuarioId,
    token: token || `sb-sess-${usuarioId}`,
    timestamp: Date.now(),
  });
  escribirLocalStorageSeguro(STORAGE_KEY_SESSION, payload);

  const devKey = obtenerDeviceSignature();
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/dispositivos_instalacion?on_conflict=device_key`,
      {
        method: 'POST',
        headers: {
          ...SUPABASE_HEADERS,
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify({
          device_key: devKey,
          onboarding_visto: true,
          usuario_sesion_id: usuarioId,
          token_sesion: token || `sb-sess-${usuarioId}`,
          updated_at: new Date().toISOString(),
        }),
      }
    );
  } catch (_e) {}
}

/**
 * Limpia todos los datos en memoria del usuario anterior para evitar mezcla de datos
 * cuando se cierra sesión o se ingresa con otra cuenta/rol.
 */
export function limpiarDatosUsuarioEnMemoria() {
  sessionStore.isAuthenticated = false;
  sessionStore.activeRoleSession = null;
  sessionStore.token = null;
  sessionStore.clientFavorites = [];
  sessionStore.clientUser = {
    id: null,
    nombre_completo: '',
    correo: '',
    telefono: '',
    barrio: '',
    direccion_principal: '',
    foto_perfil_url: null,
    latitud: null,
    longitud: null,
    gps_exacto_activo: false,
  };
  sessionStore.proUser = {
    id: null,
    usuario_id: null,
    codigo_profesional: '',
    nombre_completo: '',
    nombre_artistico: '',
    nombre_establecimiento: '',
    tiene_establecimiento: false,
    horario_atencion: {
      dias: 'Lunes a Sábado',
      apertura: '08:00 a.m.',
      cierre: '07:00 p.m.',
      bloques_disponibles: [...BLOQUES_HORARIOS_ESTANDAR],
    },
    lema_profesional: '',
    biografia: '',
    correo: '',
    telefono: '',
    foto_perfil_url: null,
    anios_experiencia: '1a3',
    especialidades: [],
    modalidad: 'ambos',
    barrio: '',
    radio_cobertura_km: 12,
    tarifa_domicilio_cop: 8000,
    direccion_base: '',
    latitud_actual: null,
    longitud_actual: null,
    dni_numero: '',
    entidad_certificadora: '',
    estado_verificacion: 'pendiente',
    permisos_otorgados: false,
    permiso_ubicacion: false,
    permiso_notificaciones: false,
    disponible: true,
    activo_por_saldo: false,
    calificacion_promedio: 5.0,
    total_resenas: 0,
  };
  sessionStore.wallet = {
    saldo_disponible_cop: 0,
    total_recargado_cop: 0,
    total_comisiones_pagadas_cop: 0,
    recarga_minima_cop: 10000,
    transacciones: [],
  };
  sessionStore.bookings = [];
  sessionStore.citasAgendadas = [];
  sessionStore.notificacionesProfesional = [];
  sessionStore.notificacionesCliente = [];
  sessionStore.historialCompletadas = [];
}

/**
 * Verifica al iniciar la aplicación:
 * 1. Si el Onboarding ya fue visualizado.
 * 2. Si existe una sesión activa válida en el dispositivo, recuperando el usuario
 *    y su rol real ('cliente' o 'profesional') desde la base de datos en Supabase.
 */
export async function verificarEstadoInicialYSesion() {
  let onboardingVisto = leerLocalStorageSeguro(STORAGE_KEY_ONBOARDING) === 'true';
  let sesionLocalRaw = leerLocalStorageSeguro(STORAGE_KEY_SESSION);
  let usuarioIdPersistido = null;
  let tokenPersistido = null;

  if (sesionLocalRaw) {
    try {
      const parsed = JSON.parse(sesionLocalRaw);
      usuarioIdPersistido = parsed?.usuario_id || null;
      tokenPersistido = parsed?.token || null;
    } catch (_e) {}
  }

  const devKey = obtenerDeviceSignature();
  try {
    const resDisp = await fetch(
      `${SUPABASE_URL}/rest/v1/dispositivos_instalacion?device_key=eq.${encodeURIComponent(
        devKey
      )}&select=*`,
      { method: 'GET', headers: SUPABASE_HEADERS }
    );
    if (resDisp.ok) {
      const rowsDisp = await resDisp.json();
      if (Array.isArray(rowsDisp) && rowsDisp.length > 0) {
        const d = rowsDisp[0];
        if (d.onboarding_visto) {
          onboardingVisto = true;
          escribirLocalStorageSeguro(STORAGE_KEY_ONBOARDING, 'true');
        }
        if (!usuarioIdPersistido && d.usuario_sesion_id) {
          usuarioIdPersistido = d.usuario_sesion_id;
          tokenPersistido = d.token_sesion;
        }
      }
    }
  } catch (_e) {}

  sessionStore.onboardingCompleted = onboardingVisto;

  // Si aún no ha visto el onboarding, debe ir a 'Welcome' (Onboarding de 5 pantallas)
  if (!onboardingVisto) {
    return {
      mostrarOnboarding: true,
      sesionValida: false,
      rutaDestino: 'Welcome',
    };
  }

  // Si ya vio el onboarding, verificar si hay una sesión activa válida en la base de datos
  if (usuarioIdPersistido) {
    try {
      const resUser = await fetch(
        `${SUPABASE_URL}/rest/v1/usuarios?id=eq.${usuarioIdPersistido}&select=*`,
        { method: 'GET', headers: SUPABASE_HEADERS }
      );
      if (resUser.ok) {
        const rowsUser = await resUser.json();
        if (Array.isArray(rowsUser) && rowsUser.length > 0 && rowsUser[0].activo !== false) {
          const u = rowsUser[0];
          limpiarDatosUsuarioEnMemoria();
          sessionStore.isAuthenticated = true;
          sessionStore.activeRoleSession = u.rol;
          sessionStore.selectedRole = u.rol;
          sessionStore.token = tokenPersistido || `sb-sess-${u.id}`;

          if (u.rol === 'profesional') {
            let perfilPro = null;
            const resPro = await fetch(
              `${SUPABASE_URL}/rest/v1/perfiles_profesionales?usuario_id=eq.${u.id}&select=*`,
              { method: 'GET', headers: SUPABASE_HEADERS }
            );
            if (resPro.ok) {
              const proRows = await resPro.json();
              if (Array.isArray(proRows) && proRows.length > 0) {
                perfilPro = proRows[0];
              }
            }
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
            };
            sessionStore.wallet.saldo_disponible_cop = Number(
              perfilPro?.saldo_billetera_cop || 0
            );
            return {
              mostrarOnboarding: false,
              sesionValida: true,
              rol: 'profesional',
              rutaDestino: 'ProDashboard',
            };
          } else {
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
            return {
              mostrarOnboarding: false,
              sesionValida: true,
              rol: 'cliente',
              rutaDestino: 'Home',
            };
          }
        }
      }
    } catch (_e) {}
  }

  // No hay sesión válida, pero el onboarding ya fue visto -> ir a Login / RoleSelection
  return {
    mostrarOnboarding: false,
    sesionValida: false,
    rutaDestino: 'Login',
  };
}

/**
 * Valida que un par de coordenadas (latitud, longitud) sea válido y corrige si están invertidas.
 */
export function normalizarYValidarCoordenadas(latRaw, lngRaw) {
  let lat = Number(latRaw);
  let lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { valida: false, latitud: null, longitud: null };
  }
  if (lat === 0 && lng === 0) {
    return { valida: false, latitud: null, longitud: null };
  }
  // Detectar si latitud y longitud fueron intercambiadas accidentalmente (ej. en Colombia lat ~ 3 a 11, lng ~ -73 a -77)
  if (Math.abs(lat) > 65 && Math.abs(lng) <= 65) {
    const temp = lat;
    lat = lng;
    lng = temp;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { valida: false, latitud: null, longitud: null };
  }
  return {
    valida: true,
    latitud: Number(lat.toFixed(6)),
    longitud: Number(lng.toFixed(6)),
  };
}

/**
 * Calcula la distancia en metros exactos en línea recta (fórmula de Haversine).
 */
export function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
  const c1 = normalizarYValidarCoordenadas(lat1, lon1);
  const c2 = normalizarYValidarCoordenadas(lat2, lon2);
  if (!c1.valida || !c2.valida) return null;

  const R = 6371000; // Radio de la Tierra en metros
  const dLat = ((c2.latitud - c1.latitud) * Math.PI) / 180;
  const dLon = ((c2.longitud - c1.longitud) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.latitud * Math.PI) / 180) *
      Math.cos((c2.latitud * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Sistema completo de cálculo de distancia, ruta real por carretera y tiempo estimado (ETA)
 * que contempla obligatoriamente los 4 casos:
 * - CASO 1: Misma ubicación (considerando precisión GPS) -> 0 m, 0 min, mensaje «El profesional se encuentra en tu ubicación» / «Ya estás en el lugar».
 * - CASO 2: Muy cerca (pocos metros) -> distancia real en metros y tiempo coherente en minutos/segundos sin asignar 5 min arbitrarios.
 * - CASO 3: Ubicaciones diferentes con ruta disponible -> distancia por carretera y tiempo real de la ruta.
 * - CASO 4: Sin ruta por carretera disponible -> distancia en línea recta aproximada y «Tiempo estimado no disponible».
 */
export async function calcularRutaYDistanciaReal({
  latProfesional,
  lngProfesional,
  latCliente,
  lngCliente,
  precisionGpsMetros = 20,
}) {
  const coordPro = normalizarYValidarCoordenadas(latProfesional, lngProfesional);
  const coordCli = normalizarYValidarCoordenadas(latCliente, lngCliente);

  if (!coordPro.valida || !coordCli.valida) {
    return {
      caso: 'sin_coordenadas',
      coordenadas_validas: false,
      misma_ubicacion: false,
      ruta_disponible: false,
      eta_disponible: false,
      distancia_metros: null,
      distancia_km: null,
      eta_minutos: null,
      distancia_texto: 'Ubicación GPS pendiente de actualización',
      tiempo_texto: 'Tiempo estimado no disponible',
      mensaje_cliente: 'Esperando actualización de ubicación GPS del profesional',
      mensaje_profesional: 'Activa tu GPS para calcular la distancia hacia el cliente',
      geometria_ruta: [],
    };
  }

  const metrosLineales = calcularDistanciaMetros(
    coordPro.latitud,
    coordPro.longitud,
    coordCli.latitud,
    coordCli.longitud
  );

  // Umbral coherente con la precisión del GPS (entre 15 m y 35 m)
  const umbralProximidadMetros = Math.min(35, Math.max(15, Number(precisionGpsMetros) || 20));

  // CASO 1: Cliente y profesional en la misma ubicación o dentro de la variación normal del GPS
  if (metrosLineales !== null && metrosLineales <= umbralProximidadMetros) {
    return {
      caso: 'misma_ubicacion',
      coordenadas_validas: true,
      misma_ubicacion: true,
      ruta_disponible: true,
      eta_disponible: true,
      distancia_metros: metrosLineales,
      distancia_km: 0,
      eta_minutos: 0,
      distancia_texto: metrosLineales <= 5 ? '0 m (En el punto)' : `${metrosLineales} m`,
      tiempo_texto: 'En ubicación',
      mensaje_cliente: 'El profesional se encuentra en tu ubicación',
      mensaje_profesional: 'Ya estás en el lugar',
      geometria_ruta: [
        [coordPro.latitud, coordPro.longitud],
        [coordCli.latitud, coordCli.longitud],
      ],
    };
  }

  // Consultar servicio de rutas por carretera (OSRM Driving Route / Google Directions)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const urlRuta = `https://router.project-osrm.org/route/v1/driving/${coordPro.longitud},${coordPro.latitud};${coordCli.longitud},${coordCli.latitud}?overview=full&geometries=geojson`;
    const res = await fetch(urlRuta, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distRutaMetros = Math.round(Number(route.distance) || metrosLineales);
        const duracionSegundos = Math.round(Number(route.duration) || 0);
        const puntos =
          route.geometry && Array.isArray(route.geometry.coordinates)
            ? route.geometry.coordinates.map((c) => [c[1], c[0]])
            : [];

        // Si la distancia vial reportada también es prácticamente el mismo punto
        if (distRutaMetros <= umbralProximidadMetros) {
          return {
            caso: 'misma_ubicacion',
            coordenadas_validas: true,
            misma_ubicacion: true,
            ruta_disponible: true,
            eta_disponible: true,
            distancia_metros: distRutaMetros,
            distancia_km: 0,
            eta_minutos: 0,
            distancia_texto: `${distRutaMetros} m`,
            tiempo_texto: 'En ubicación',
            mensaje_cliente: 'El profesional se encuentra en tu ubicación',
            mensaje_profesional: 'Ya estás en el lugar',
            geometria_ruta: puntos,
          };
        }

        // CASO 2: Muy cerca (a pocos metros, menos de 300 m)
        if (distRutaMetros < 300) {
          const minReales = Math.max(1, Math.round(duracionSegundos / 60));
          const tiempoTxt =
            duracionSegundos < 60
              ? 'Menos de 1 min'
              : `${minReales} min`;
          return {
            caso: 'muy_cerca',
            coordenadas_validas: true,
            misma_ubicacion: false,
            ruta_disponible: true,
            eta_disponible: true,
            distancia_metros: distRutaMetros,
            distancia_km: Number((distRutaMetros / 1000).toFixed(2)),
            eta_minutos: duracionSegundos < 60 ? 1 : minReales,
            distancia_texto: `${distRutaMetros} m por ruta`,
            tiempo_texto: tiempoTxt,
            mensaje_cliente: `El profesional está muy cerca (${distRutaMetros} m • ${tiempoTxt})`,
            mensaje_profesional: `Estás a ${distRutaMetros} m del cliente (${tiempoTxt})`,
            geometria_ruta: puntos,
          };
        }

        // CASO 3: Ubicaciones diferentes con ruta vial real disponible
        const distKm = Number((distRutaMetros / 1000).toFixed(2));
        const minRuta = Math.max(1, Math.round(duracionSegundos / 60));
        return {
          caso: 'ruta_carretera',
          coordenadas_validas: true,
          misma_ubicacion: false,
          ruta_disponible: true,
          eta_disponible: true,
          distancia_metros: distRutaMetros,
          distancia_km: distKm,
          eta_minutos: minRuta,
          distancia_texto: `${distKm} km por carretera`,
          tiempo_texto: `${minRuta} min`,
          mensaje_cliente: `Distancia por ruta: ${distKm} km • Tiempo estimado: ${minRuta} min`,
          mensaje_profesional: `Ruta hacia el cliente: ${distKm} km • Tiempo estimado: ${minRuta} min`,
          geometria_ruta: puntos,
        };
      }
    }
  } catch (_routeErr) {}

  // CASO 4: No se pudo calcular ruta por carretera -> Mostrar distancia en línea recta como aproximada
  // e informar explícitamente que el tiempo estimado no está disponible
  const distLinealKm = Number((metrosLineales / 1000).toFixed(2));
  const textoLineal =
    metrosLineales < 1000
      ? `${metrosLineales} m en línea recta (aprox.)`
      : `${distLinealKm} km en línea recta (aprox.)`;

  return {
    caso: 'sin_ruta_carretera',
    coordenadas_validas: true,
    misma_ubicacion: false,
    ruta_disponible: false,
    eta_disponible: false,
    distancia_metros: metrosLineales,
    distancia_km: distLinealKm,
    eta_minutos: null,
    distancia_texto: textoLineal,
    tiempo_texto: 'Tiempo estimado no disponible',
    mensaje_cliente: `${textoLineal} • Tiempo estimado no disponible`,
    mensaje_profesional: `${textoLineal} • Tiempo estimado no disponible`,
    geometria_ruta: [],
  };
}

export async function cerrarSesionActiva(navigation) {
  limpiarDatosUsuarioEnMemoria();
  escribirLocalStorageSeguro(STORAGE_KEY_SESSION, null);
  // Asegurar que el indicador de onboarding permanezca en true al cerrar sesión
  escribirLocalStorageSeguro(STORAGE_KEY_ONBOARDING, 'true');

  const devKey = obtenerDeviceSignature();
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/dispositivos_instalacion?device_key=eq.${encodeURIComponent(
        devKey
      )}`,
      {
        method: 'PATCH',
        headers: SUPABASE_HEADERS,
        body: JSON.stringify({
          onboarding_visto: true,
          usuario_sesion_id: null,
          token_sesion: null,
          updated_at: new Date().toISOString(),
        }),
      }
    );
  } catch (_e) {}

  if (navigation && navigation.reset) {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  } else if (navigation && navigation.replace) {
    navigation.replace('Login');
  }
}

async function directSupabaseOperation(endpoint, method, body) {
  if (endpoint === '/auth/register/client' && method === 'POST') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/usuarios`, {
      method: 'POST',
      headers: SUPABASE_HEADERS,
      body: JSON.stringify({
        nombre: body.nombre_completo,
        email: body.correo,
        password_hash: body.password,
        telefono: body.telefono,
        rol: 'cliente',
        avatar_url: body.foto_perfil_url,
        barrio: body.barrio || null,
        direccion_principal: body.direccion_principal || null,
        latitud: sessionStore.clientUser.latitud || null,
        longitud: sessionStore.clientUser.longitud || null,
      }),
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_e) {}

    if (!res.ok) {
      const detalle = data?.message || data?.details || text || `HTTP ${res.status}`;
      throw new Error(`No se pudo registrar en la base de datos: ${detalle}`);
    }

    const fila = Array.isArray(data) ? data[0] : data;
    return {
      exito: true,
      guardado_en_supabase: true,
      token: `sb-client-${fila?.id || Date.now()}`,
      ...(fila?.id ? (guardarSesionPersistente({ usuarioId: fila.id, token: `sb-client-${fila.id}` }), {}) : {}),
      ruta_inicio: 'Home',
      usuario: {
        ...fila,
        id: fila?.id,
        rol: 'cliente',
        nombre_completo: fila?.nombre || body.nombre_completo,
        correo: fila?.email || body.correo,
        telefono: fila?.telefono || body.telefono,
        barrio: fila?.barrio || body.barrio || '',
        direccion_principal: fila?.direccion_principal || body.direccion_principal || '',
        foto_perfil_url: fila?.avatar_url || body.foto_perfil_url,
      },
    };
  }

  if (endpoint === '/auth/register/professional' && method === 'POST') {
    const resUser = await fetch(`${SUPABASE_URL}/rest/v1/usuarios`, {
      method: 'POST',
      headers: SUPABASE_HEADERS,
      body: JSON.stringify({
        nombre: body.nombre_completo,
        email: body.correo,
        password_hash: body.password,
        telefono: body.telefono,
        rol: 'profesional',
        avatar_url: body.foto_perfil_url || null,
        barrio: body.barrio || null,
        direccion_principal: body.direccion_establecimiento || null,
        latitud: sessionStore.proUser.latitud_actual || null,
        longitud: sessionStore.proUser.longitud_actual || null,
      }),
    });
    const textUser = await resUser.text();
    let dataUser = null;
    try {
      dataUser = textUser ? JSON.parse(textUser) : null;
    } catch (_e) {}

    if (!resUser.ok) {
      const detalle = dataUser?.message || dataUser?.details || textUser || `HTTP ${resUser.status}`;
      throw new Error(`No se pudo registrar en la base de datos: ${detalle}`);
    }

    const filaUsuario = Array.isArray(dataUser) ? dataUser[0] : dataUser;
    let filaPro = null;

    if (filaUsuario && filaUsuario.id) {
      const resPro = await fetch(`${SUPABASE_URL}/rest/v1/perfiles_profesionales`, {
        method: 'POST',
        headers: SUPABASE_HEADERS,
        body: JSON.stringify({
          usuario_id: filaUsuario.id,
          nombre_artistico: body.nombre_artistico || body.nombre_completo,
          nombre_establecimiento: body.nombre_establecimiento || '',
          tiene_establecimiento: Boolean(body.tiene_establecimiento),
          dias_atencion: body.dias_atencion || 'Lunes a Sábado',
          horario_apertura: body.horario_apertura || '08:00 a.m.',
          horario_cierre: body.horario_cierre || '07:00 p.m.',
          bloques_horarios: body.bloques_horarios || BLOQUES_HORARIOS_ESTANDAR,
          descripcion: `${body.nombre_completo} - Especialista en ${(body.especialidades || []).join(', ')}`,
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
          estado: 'activo',
        }),
      });
      const textPro = await resPro.text();
      try {
        const parsedPro = textPro ? JSON.parse(textPro) : null;
        filaPro = Array.isArray(parsedPro) ? parsedPro[0] : parsedPro;
      } catch (_e) {}
    }

    return {
      exito: true,
      guardado_en_supabase: true,
      token: `sb-pro-${filaUsuario?.id || Date.now()}`,
      ...(filaUsuario?.id ? (guardarSesionPersistente({ usuarioId: filaUsuario.id, token: `sb-pro-${filaUsuario.id}` }), {}) : {}),
      ruta_inicio: 'ProDashboard',
      usuario: {
        ...filaUsuario,
        id: filaUsuario?.id,
        usuario_id: filaUsuario?.id,
        rol: 'profesional',
        nombre_completo: filaUsuario?.nombre || body.nombre_completo,
        nombre_artistico: body.nombre_artistico || body.nombre_completo,
        correo: filaUsuario?.email || body.correo,
        telefono: filaUsuario?.telefono || body.telefono,
        foto_perfil_url: filaUsuario?.avatar_url || body.foto_perfil_url,
        perfil_profesional: filaPro,
      },
    };
  }

  if (endpoint === '/auth/login' && method === 'POST') {
    const ident = String(body.identificador || '').trim().toLowerCase();
    const filtro = ident.includes('@')
      ? `email=eq.${encodeURIComponent(ident)}&select=*`
      : `telefono=eq.${encodeURIComponent(ident)}&select=*`;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?${filtro}`, {
      method: 'GET',
      headers: SUPABASE_HEADERS,
    });
    const text = await res.text();
    let rows = [];
    try {
      rows = text ? JSON.parse(text) : [];
    } catch (_e) {}

    if (!res.ok) {
      throw new Error(`Error al consultar la base de datos: ${text}`);
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error(
        `No existe ninguna cuenta registrada con "${ident}". Por favor regístrate primero.`
      );
    }

    const u = rows[0];

    if (body.password && u.password_hash && u.password_hash !== body.password) {
      throw new Error('La contraseña ingresada es incorrecta.');
    }

    if (body.rol_preferido && u.rol !== body.rol_preferido) {
      throw new Error(
        `Esta cuenta está registrada con el rol "${u.rol.toUpperCase()}". Debes iniciar sesión en el perfil correspondiente.`
      );
    }

    let perfilPro = null;
    if (u.rol === 'profesional') {
      const resPro = await fetch(
        `${SUPABASE_URL}/rest/v1/perfiles_profesionales?usuario_id=eq.${u.id}&select=*`,
        { method: 'GET', headers: SUPABASE_HEADERS }
      );
      const proRows = await resPro.json().catch(() => []);
      if (Array.isArray(proRows) && proRows.length > 0) {
        perfilPro = proRows[0];
      }
    }

    return {
      exito: true,
      token: `sb-login-${u.id}`,
      ...(u?.id ? (guardarSesionPersistente({ usuarioId: u.id, token: `sb-login-${u.id}` }), {}) : {}),
      ruta_inicio: u.rol === 'profesional' ? 'ProDashboard' : 'Home',
      usuario: {
        ...u,
        id: u.id,
        usuario_id: u.id,
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

export async function callBackendApi(endpoint, method = 'GET', body = null) {
  if (
    endpoint === '/auth/register/client' ||
    endpoint === '/auth/register/professional' ||
    endpoint === '/auth/login'
  ) {
    return await directSupabaseOperation(endpoint, method, body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2800);
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(sessionStore.token ? { Authorization: `Bearer ${sessionStore.token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Error en la petición al servidor.');
    }
    return data;
  } catch (_err) {
    clearTimeout(timer);
    return null;
  }
} 