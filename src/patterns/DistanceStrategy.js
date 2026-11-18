/**
 * PATRÓN DE DISEÑO: STRATEGY
 * Encapsula la validación de coordenadas y los 4 casos de cálculo de distancia/ETA:
 * 1) Misma ubicación (<= umbral GPS) -> 0 m / 0 min
 * 2) Muy cerca (< 300 m) -> metros reales y minutos/segundos
 * 3) Ruta por carretera -> distancia y tiempo reales de ruta
 * 4) Sin ruta disponible -> distancia lineal aproximada + tiempo no disponible
 */
export function normalizarYValidarCoordenadas(latRaw, lngRaw) {
  let lat = Number(latRaw);
  let lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
    return { valida: false, latitud: null, longitud: null };
  }
  if (Math.abs(lat) > 65 && Math.abs(lng) <= 65) {
    const temp = lat;
    lat = lng;
    lng = temp;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { valida: false, latitud: null, longitud: null };
  }
  return { valida: true, latitud: Number(lat.toFixed(6)), longitud: Number(lng.toFixed(6)) };
}

export function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
  const c1 = normalizarYValidarCoordenadas(lat1, lon1);
  const c2 = normalizarYValidarCoordenadas(lat2, lon2);
  if (!c1.valida || !c2.valida) return null;

  const R = 6371000;
  const dLat = ((c2.latitud - c1.latitud) * Math.PI) / 180;
  const dLon = ((c2.longitud - c1.longitud) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.latitud * Math.PI) / 180) *
      Math.cos((c2.latitud * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const m = calcularDistanciaMetros(lat1, lon1, lat2, lon2);
  if (m === null) return null;
  return m <= 25 ? 0 : Number((m / 1000).toFixed(2));
}

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
      distancia_texto: 'Ubicación pendiente',
      tiempo_texto: 'Tiempo estimado no disponible',
      geometria_ruta: [],
    };
  }

  const metrosLineales = calcularDistanciaMetros(
    coordPro.latitud,
    coordPro.longitud,
    coordCli.latitud,
    coordCli.longitud
  );
  const umbral = Math.min(35, Math.max(15, Number(precisionGpsMetros) || 20));

  if (metrosLineales !== null && metrosLineales <= umbral) {
    return {
      caso: 'misma_ubicacion',
      coordenadas_validas: true,
      misma_ubicacion: true,
      ruta_disponible: true,
      eta_disponible: true,
      distancia_metros: metrosLineales,
      distancia_km: 0,
      eta_minutos: 0,
      distancia_texto: metrosLineales <= 5 ? '0 m' : `${metrosLineales} m`,
      tiempo_texto: 'En ubicación',
      geometria_ruta: [
        { latitude: coordPro.latitud, longitude: coordPro.longitud },
        { latitude: coordCli.latitud, longitude: coordCli.longitud },
      ],
    };
  }

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 3500);
    const url = `https://router.project-osrm.org/route/v1/driving/${coordPro.longitud},${coordPro.latitud};${coordCli.longitud},${coordCli.latitud}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(tid);
    if (res.ok) {
      const data = await res.json();
      const route = data?.routes?.[0];
      if (route) {
        const distM = Math.round(Number(route.distance) || metrosLineales);
        const durS = Math.round(Number(route.duration) || 0);
        const puntos = (route.geometry?.coordinates || []).map(([lng, lat]) => ({
          latitude: lat,
          longitude: lng,
        }));
        if (distM <= umbral) {
          return {
            caso: 'misma_ubicacion',
            coordenadas_validas: true,
            misma_ubicacion: true,
            ruta_disponible: true,
            eta_disponible: true,
            distancia_metros: distM,
            distancia_km: 0,
            eta_minutos: 0,
            distancia_texto: `${distM} m`,
            tiempo_texto: 'En ubicación',
            geometria_ruta: puntos,
          };
        }
        const distKm = Number((distM / 1000).toFixed(2));
        const min = Math.max(1, Math.round(durS / 60));
        return {
          caso: distM < 300 ? 'muy_cerca' : 'ruta_carretera',
          coordenadas_validas: true,
          misma_ubicacion: false,
          ruta_disponible: true,
          eta_disponible: true,
          distancia_metros: distM,
          distancia_km: distKm,
          eta_minutos: min,
          distancia_texto: distM < 300 ? `${distM} m` : `${distKm} km`,
          tiempo_texto: durS < 60 ? 'Menos de 1 min' : `${min} min`,
          geometria_ruta: puntos,
        };
      }
    }
  } catch (_e) {}

  const distLinealKm = Number((metrosLineales / 1000).toFixed(2));
  return {
    caso: 'sin_ruta_carretera',
    coordenadas_validas: true,
    misma_ubicacion: false,
    ruta_disponible: false,
    eta_disponible: false,
    distancia_metros: metrosLineales,
    distancia_km: distLinealKm,
    eta_minutos: null,
    distancia_texto:
      metrosLineales < 1000
        ? `${metrosLineales} m en línea recta (aprox.)`
        : `${distLinealKm} km en línea recta (aprox.)`,
    tiempo_texto: 'Tiempo estimado no disponible',
    geometria_ruta: [],
  };
}
