/**
 * Archivo: src/components/map/BeautyFlashMapView.js
 * Módulo 6: Componente UI dedicado al Mapa Real de Google Maps (`react-native-maps`) con:
 * - Seguimiento dinámico en tiempo real e interpolación suave del marcador del profesional
 * - Evita saltos bruscos cuando llegan nuevas coordenadas GPS
 * - Trazado de ruta (`Polyline`), distancia restante, tiempo estimado de llegada y estado de llegada
 */
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/palette';
import { ESTADOS_SOLICITUD_OFICIALES } from '../../patterns/RequestStateFactory';
import { calcularRutaYDistanciaReal } from '../../patterns/DistanceStrategy';

export default function BeautyFlashMapView({
  coordsCliente = null,
  estilistas = [],
  solicitud = null,
  fullScreen = false,
  height = 280,
  onPressMarker = null,
}) {
  const mapRef = useRef(null);
  const [rutaCoords, setRutaCoords] = useState([]);
  const [cargandoRuta, setCargandoRuta] = useState(false);

  const latCli = Number(coordsCliente?.latitude || solicitud?.latitud_servicio || 3.4516);
  const lngCli = Number(coordsCliente?.longitude || solicitud?.longitud_servicio || -76.5320);
  const targetLatPro = Number(
    solicitud?.latitud_profesional || solicitud?.latitud_origen_pro || latCli
  );
  const targetLngPro = Number(
    solicitud?.longitud_profesional || solicitud?.longitud_origen_pro || lngCli
  );

  // Estado interpolado para animar suavemente el desplazamiento del marcador del profesional (Módulo 6.2)
  const [animatedProCoord, setAnimatedProCoord] = useState({
    latitude: targetLatPro,
    longitude: targetLngPro,
  });

  useEffect(() => {
    const startLat = animatedProCoord.latitude;
    const startLng = animatedProCoord.longitude;
    const dLat = targetLatPro - startLat;
    const dLng = targetLngPro - startLng;

    if (Math.abs(dLat) < 0.00001 && Math.abs(dLng) < 0.00001) {
      return;
    }

    let step = 0;
    const totalSteps = 8;
    const timer = setInterval(() => {
      step += 1;
      const t = step / totalSteps;
      // Ease-out quad para movimiento fluido sin saltos bruscos
      const ease = t * (2 - t);
      setAnimatedProCoord({
        latitude: Number((startLat + dLat * ease).toFixed(6)),
        longitude: Number((startLng + dLng * ease).toFixed(6)),
      });
      if (step >= totalSteps) {
        clearInterval(timer);
      }
    }, 60);

    return () => clearInterval(timer);
  }, [targetLatPro, targetLngPro]);

  const mostrarRuta =
    solicitud &&
    [
      ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE,
      ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO,
      ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO,
    ].includes(solicitud.estado);

  useEffect(() => {
    let activo = true;
    async function cargarGeometriaRuta() {
      if (!mostrarRuta) {
        setRutaCoords([]);
        return;
      }
      setCargandoRuta(true);
      const info = await calcularRutaYDistanciaReal({
        latProfesional: targetLatPro,
        lngProfesional: targetLngPro,
        latCliente: latCli,
        lngCliente: lngCli,
      });
      if (!activo) return;
      if (Array.isArray(info.geometria_geojson) && info.geometria_geojson.length > 1) {
        setRutaCoords(
          info.geometria_geojson.map(([lon, lat]) => ({
            latitude: Number(lat),
            longitude: Number(lon),
          }))
        );
      } else {
        setRutaCoords([
          { latitude: targetLatPro, longitude: targetLngPro },
          { latitude: latCli, longitude: lngCli },
        ]);
      }
      setCargandoRuta(false);
    }
    cargarGeometriaRuta();
    return () => {
      activo = false;
    };
  }, [mostrarRuta, targetLatPro, targetLngPro, latCli, lngCli]);

  const centrarMapa = () => {
    if (!mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: latCli,
        longitude: lngCli,
        latitudeDelta: 0.018,
        longitudeDelta: 0.018,
      },
      450
    );
  };

  return (
    <View style={[styles.wrapper, fullScreen ? styles.fullScreen : { height }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: latCli,
          longitude: lngCli,
          latitudeDelta: 0.022,
          longitudeDelta: 0.022,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
      >
        <Marker
          coordinate={{ latitude: latCli, longitude: lngCli }}
          title="Punto de Atención"
          description={solicitud?.direccion_servicio || 'Tu ubicación actual'}
        >
          <View style={styles.clientPin}>
            <Feather name="user" size={14} color="#FFFFFF" />
          </View>
        </Marker>

        {!mostrarRuta &&
          estilistas.map((pro) => (
            <Marker
              key={pro.id || pro.usuario_id}
              coordinate={{
                latitude: Number(pro.latitud || latCli),
                longitude: Number(pro.longitud || lngCli),
              }}
              title={pro.nombre}
              description={`${pro.especialidad || 'Especialista'} • ${pro.barrio || ''}`}
              onPress={() => onPressMarker && onPressMarker(pro)}
            >
              <View style={styles.proPin}>
                <Feather name="Scissors" size={13} color="#FFFFFF" />
              </View>
            </Marker>
          ))}

        {mostrarRuta && (
          <Marker
            coordinate={animatedProCoord}
            title={solicitud?.profesional_nombre || 'Profesional asignado'}
            description={
              solicitud?.llegada_confirmada
                ? '¡Ya se encuentra en tu ubicación!'
                : `Tiempo estimado: ~${solicitud?.tiempo_estimado_minutos || 1} min`
            }
          >
            <View
              style={[
                styles.proPin,
                solicitud?.llegada_confirmada && { backgroundColor: '#1E824C' },
              ]}
            >
              <Feather
                name={solicitud?.llegada_confirmada ? 'check' : 'navigation'}
                size={14}
                color="#FFFFFF"
              />
            </View>
          </Marker>
        )}

        {mostrarRuta && rutaCoords.length > 1 && (
          <Polyline
            coordinates={rutaCoords}
            strokeColor={colors.primary}
            strokeWidth={4}
          />
        )}
      </MapView>

      {mostrarRuta && (
        <View style={styles.liveEtaBadge}>
          <Feather
            name={solicitud?.llegada_confirmada ? 'check-circle' : 'clock'}
            size={13}
            color={solicitud?.llegada_confirmada ? '#1E824C' : colors.primary}
          />
          <Text style={styles.liveEtaText}>
            {solicitud?.llegada_confirmada
              ? '¡Profesional en puerta!'
              : `Estimación: ~${solicitud?.tiempo_estimado_minutos ?? 4} min (${
                  solicitud?.distancia_estimada_km ?? 0.4
                } km)`}
          </Text>
        </View>
      )}

      {cargandoRuta && (
        <View style={styles.routeLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.routeLoaderText}>Actualizando ruta y estimación...</Text>
        </View>
      )}

      <TouchableOpacity style={styles.centerBtn} onPress={centrarMapa}>
        <Feather name="crosshair" size={18} color={colors.textDark} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E5E3DF',
    position: 'relative',
  },
  fullScreen: {
    flex: 1,
    borderRadius: 0,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  clientPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A1715',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveEtaBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  liveEtaText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textDark,
  flexShrink: 1 },
  centerBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routeLoader: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  routeLoaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDark,
  flexShrink: 1 },
});
