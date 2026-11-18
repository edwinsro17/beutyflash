import * as Location from 'expo-location';
import { SupabaseRepository } from '../repositories/SupabaseRepository';
import { sessionStore } from './sessionStore';
import { appEventBus, APP_EVENTS } from '../patterns/ObserverEventBus';
import { ESTADOS_DOMICILIO_ACTIVOS } from '../patterns/RequestStateFactory';

export async function obtenerUbicacionExactaGPS(rol = 'cliente') {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    let loc = null;
    try {
      loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
    } catch (_e) {
      loc = await Location.getLastKnownPositionAsync();
    }
    if (!loc?.coords) return null;

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
      sessionStore.clientUser.direccion_principal = direccionDetectada;
      if (barrioDetectado) sessionStore.clientUser.barrio = barrioDetectado;
      sessionStore.clientUser.gps_exacto_activo = true;
    } else {
      sessionStore.proUser.latitud_actual = lat;
      sessionStore.proUser.longitud_actual = lng;
      sessionStore.proUser.direccion_base = direccionDetectada;
      if (barrioDetectado) sessionStore.proUser.barrio = barrioDetectado;
    }

    const emailTarget = rol === 'cliente' ? sessionStore.clientUser.correo : sessionStore.proUser.correo;
    if (emailTarget) {
      SupabaseRepository.patch('usuarios', `email=eq.${encodeURIComponent(emailTarget)}`, {
        latitud: lat,
        longitud: lng,
        barrio: barrioDetectado || null,
        direccion_principal: direccionDetectada || null,
      }).catch(() => {});
    }

    const activa = sessionStore.bookings.find((b) => ESTADOS_DOMICILIO_ACTIVOS.includes(b.estado));
    if (activa && rol === 'cliente') {
      activa.latitud_servicio = lat;
      activa.longitud_servicio = lng;
    }

    appEventBus.notify(APP_EVENTS.LOCATION_UPDATED, { rol, lat, lng, direccionDetectada });
    return { latitude: lat, longitude: lng, direccion: direccionDetectada, barrio: barrioDetectado };
  } catch (_err) {
    return null;
  }
}
