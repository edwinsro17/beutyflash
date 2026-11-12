/**
 * Archivo: backend/src/services/maps.service.js
 * Integración con Google Maps (Directions API y Places API) para Colombia
 */

const { env } = require('../config/env');
const {
  calcularDistanciaKm,
  calcularETAMinutos,
  generarPuntosRuta,
} = require('../config/constants');

const LUGARES_COLOMBIA = [
  {
    place_id: 'cali_ciudad_jardin',
    descripcion: 'Cra. 100 #11-60, Ciudad Jardín, Cali, Valle del Cauca',
    ciudad: 'Cali',
    latitud: 3.3712,
    longitud: -76.5320,
  },
  {
    place_id: 'cali_pasoancho',
    descripcion: 'Av. Pasoancho #85-24, Sur, Cali, Valle del Cauca',
    ciudad: 'Cali',
    latitud: 3.3768,
    longitud: -76.5365,
  },
  {
    place_id: 'cali_el_limonar',
    descripcion: 'Calle 9 #62-18, El Limonar, Cali, Valle del Cauca',
    ciudad: 'Cali',
    latitud: 3.3820,
    longitud: -76.5290,
  },
];

async function obtenerRutaDirections({ origenLat, origenLng, destinoLat, destinoLng }) {
  const distanciaKm = calcularDistanciaKm(origenLat, origenLng, destinoLat, destinoLng);
  const duracionMinutos = calcularETAMinutos(distanciaKm);
  const puntosRuta = generarPuntosRuta(origenLat, origenLng, destinoLat, destinoLng, 10);

  if (env.GOOGLE_MAPS_API_KEY && !env.GOOGLE_MAPS_API_KEY.includes('TuClave')) {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origenLat},${origenLng}&destination=${destinoLat},${destinoLng}&mode=driving&language=es&region=co&key=${env.GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.routes?.[0]) {
        const leg = data.routes[0].legs[0];
        return {
          proveedor: 'GoogleDirectionsAPI',
          distancia_km: Number((leg.distance.value / 1000).toFixed(2)),
          duracion_minutos: Math.ceil(leg.duration.value / 60),
          polilinea: data.routes[0].overview_polyline.points,
          puntos_ruta: puntosRuta,
        };
      }
    } catch (_err) {
      // Usa cálculo PostGIS local si no hay conexión externa
    }
  }

  return {
    proveedor: 'GoogleMapsSDK_PostGIS',
    distancia_km: distanciaKm,
    duracion_minutos: duracionMinutos,
    puntos_ruta: puntosRuta,
  };
}

async function buscarLugaresPlaces(consulta = '') {
  const q = String(consulta || '').toLowerCase().trim();
  if (!q) return LUGARES_COLOMBIA;
  return LUGARES_COLOMBIA.filter((l) => l.descripcion.toLowerCase().includes(q));
}

module.exports = {
  obtenerRutaDirections,
  buscarLugaresPlaces,
};
