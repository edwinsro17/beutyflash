/**
 * Archivo: src/screens/HomeScreen.js
 * Pantalla principal del CLIENTE:
 * - Muestra únicamente profesionales y servicios reales procedentes de Supabase.
 * - Paso 4 del flujo: cuando el profesional acepta (`aceptada_por_profesional`), el cliente
 *   es quien confirma definitivamente la solicitud para activar el servicio.
 * - Paso 5: cuando un servicio a domicilio está confirmado (`confirmada_por_cliente`, `en_camino`,
 *   `en_servicio`), activa la experiencia de Mapa de Google a Pantalla Completa con paneles flotantes.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

import {
  colors,
  sessionStore,
  formatCOP,
  ESTADOS_SOLICITUD_OFICIALES,
  formatearEtiquetaEstado,
  useResponsiveLayout,
  obtenerUbicacionExactaGPS,
  sincronizarEstadoDesdeSupabase,
  marcarNotificacionesComoLeidas,
  obtenerServiciosActivosParaClientes,
  obtenerSolicitudActiva,
  confirmarDefinitivamentePorCliente,
  actualizarEstadoSolicitudActiva,
  generarHtmlMapaUber,
  calcularRutaYDistanciaReal,
} from '../theme/colors';
import CategoryItem from '../components/CategoryItem';
import BottomMenu from '../components/BottomMenu';
import { ServiceBookingModal, ChatServicioModal } from '../components/ServiceBookingModal';

export default function HomeScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const cliente = sessionStore.clientUser;
  const [modalidad, setModalidad] = useState('domicilio');
  const [busqueda, setBusqueda] = useState('');
  const [coords, setCoords] = useState({
    latitude: cliente.latitud || 3.4516,
    longitude: cliente.longitud || -76.5320,
  });
  const [direccionActual, setDireccionActual] = useState(
    cliente.direccion_principal || 'Detectando ubicación...'
  );
  const [loadingMap, setLoadingMap] = useState(false);
  const [, setTick] = useState(0);
  const [reservaActiva, setReservaActiva] = useState(obtenerSolicitudActiva());
  const [notificaciones, setNotificaciones] = useState([...sessionStore.notificacionesCliente]);
  const [verNotificaciones, setVerNotificaciones] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [modoModalInicial, setModoModalInicial] = useState('domicilio');
  const [chatVisible, setChatVisible] = useState(false);

  const refrescarTodo = () => {
    const act = obtenerSolicitudActiva();
    setReservaActiva(act ? { ...act } : null);
    setNotificaciones([...sessionStore.notificacionesCliente]);
    if (sessionStore.clientUser.direccion_principal) {
      setDireccionActual(sessionStore.clientUser.direccion_principal);
    }
    if (sessionStore.clientUser.latitud && sessionStore.clientUser.longitud) {
      setCoords({
        latitude: sessionStore.clientUser.latitud,
        longitude: sessionStore.clientUser.longitud,
      });
    }
    setTick((t) => t + 1);
  };

  useEffect(() => {
    detectarMiUbicacionExacta();
    sincronizarEstadoDesdeSupabase('cliente').then(refrescarTodo);

    const interval = setInterval(async () => {
      await sincronizarEstadoDesdeSupabase('cliente');
      refrescarTodo();
    }, 2500);

    const unsub = navigation.addListener('focus', () => {
      sincronizarEstadoDesdeSupabase('cliente').then(refrescarTodo);
    });

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [navigation]);

  const detectarMiUbicacionExacta = async () => {
    setLoadingMap(true);
    const gps = await obtenerUbicacionExactaGPS('cliente');
    if (gps) {
      setCoords({ latitude: gps.latitude, longitude: gps.longitude });
      setDireccionActual(gps.direccion);
    }
    setLoadingMap(false);
    setTick((t) => t + 1);
  };

  const toggleNotificacionesCliente = async () => {
    const nuevo = !verNotificaciones;
    setVerNotificaciones(nuevo);
    if (nuevo) {
      await marcarNotificacionesComoLeidas('cliente');
      setNotificaciones([...sessionStore.notificacionesCliente]);
    }
  };

  const abrirModalServicio = (srv, modoElegido = modalidad) => {
    setModoModalInicial(modoElegido);
    setServicioSeleccionado(srv);
  };

  const noLeidas = notificaciones.filter((n) => !n.leida).length;
  const filtrados = obtenerServiciosActivosParaClientes({ busqueda });
  const estilistasEnMapa = sessionStore.estilistasMapa || [];

  // EXPERIENCIA DE MAPA A PANTALLA COMPLETA PARA EL CLIENTE CUANDO EL SERVICIO A DOMICILIO ESTÁ CONFIRMADO
  const mostrarSeguimientoPantallaCompleta =
    reservaActiva &&
    reservaActiva.modalidad === 'domicilio' &&
    [
      ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE,
      ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO,
      ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO,
    ].includes(reservaActiva.estado);

  if (mostrarSeguimientoPantallaCompleta) {
    return (
      <SafeAreaView style={styles.fullScreenContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.fullScreenMapArea}>
          <WebView
            key={`cli-fullmap-${reservaActiva.codigo_reserva}-${reservaActiva.estado}-${reservaActiva.progreso_ruta}`}
            originWhitelist={['*']}
            source={{
              html: generarHtmlMapaUber({
                solicitud: reservaActiva,
                coordsCliente: coords,
                vista: 'cliente',
              }),
            }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
          />

          {/* Panel Flotante Superior: Estado del Servicio y Tiempo Estimado */}
          <View style={styles.floatingTopBar}>
            <View style={styles.statusDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.floatingStatusLabel}>
                {formatearEtiquetaEstado(reservaActiva.estado).toUpperCase()}
              </Text>
              <Text style={styles.floatingEtaText}>
                {reservaActiva.distancia_estimada_km === 0 || (reservaActiva.distancia_estimada_km !== null && reservaActiva.distancia_estimada_km <= 0.03)
                  ? 'El profesional se encuentra en tu ubicación'
                  : reservaActiva.tiempo_estimado_minutos === null || reservaActiva.tiempo_estimado_minutos === undefined
                  ? `Distancia aprox.: ${reservaActiva.distancia_estimada_km ?? '--'} km • Tiempo estimado no disponible`
                  : `Distancia: ${reservaActiva.distancia_estimada_km} km • Tiempo estimado: ${reservaActiva.tiempo_estimado_minutos} min`}
              </Text>
            </View>
          </View>

          {/* Panel Flotante Inferior: Información del Profesional, Chat y Detalles */}
          <View style={styles.floatingBottomCard}>
            <View style={styles.proFloatingRow}>
              {reservaActiva.profesional_foto ? (
                <Image
                  source={{ uri: reservaActiva.profesional_foto }}
                  style={styles.proFloatingAvatar}
                />
              ) : (
                <View style={styles.proAvatarPlaceholder}>
                  <Feather name="user" size={20} color={colors.primary} />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.proFloatingName}>{reservaActiva.profesional_nombre}</Text>
                <Text style={styles.proFloatingService}>{reservaActiva.servicio_nombre}</Text>
                <Text style={styles.proFloatingPrice}>
                  {formatCOP(reservaActiva.precio_total_cop)} COP • #{reservaActiva.codigo_reserva}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.chatFloatingBtn}
                onPress={() => setChatVisible(true)}
              >
                <Feather name="message-square" size={16} color="#FFFFFF" />
                <Text style={styles.chatFloatingBtnText}>Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ChatServicioModal
          visible={chatVisible}
          solicitud={reservaActiva}
          rolActual="cliente"
          onClose={() => {
            setChatVisible(false);
            refrescarTodo();
          }}
        />

        <BottomMenu activeTab="Servicios" navigation={navigation} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, layout.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con Indicador de Notificaciones No Leídas */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={styles.logoRow}>
              <Text style={styles.logoBeauty}>Beauty</Text>
              <Text style={styles.logoFlash}>Flash</Text>
            </View>
            <Text style={styles.welcomeUser} numberOfLines={1}>
              {cliente.nombre_completo ? `Hola, ${cliente.nombre_completo}` : 'Bienvenido'} •{' '}
              {direccionActual}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity style={styles.bellBtn} onPress={toggleNotificacionesCliente}>
              <Feather name="bell" size={18} color={colors.textDark} />
              {noLeidas > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{noLeidas}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              {cliente.foto_perfil_url ? (
                <Image source={{ uri: cliente.foto_perfil_url }} style={styles.profilePic} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Feather name="user" size={18} color={colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Historial de Notificaciones en Línea (Sin modales invasivos) */}
        {verNotificaciones && (
          <View style={styles.inlineNotifPanel}>
            <View style={styles.inlineNotifHeader}>
              <Text style={styles.inlineNotifTitle}>
                Notificaciones ({notificaciones.length})
              </Text>
              <TouchableOpacity onPress={() => setVerNotificaciones(false)}>
                <Feather name="x" size={18} color={colors.textGray} />
              </TouchableOpacity>
            </View>
            {notificaciones.length === 0 ? (
              <Text style={styles.emptyNotifText}>No hay notificaciones nuevas.</Text>
            ) : (
              notificaciones.map((n) => (
                <View key={n.id} style={styles.notifItem}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.notifTitle}>{n.titulo}</Text>
                    <Text style={styles.notifTime}>{n.hora}</Text>
                  </View>
                  <Text style={styles.notifMsg}>{n.mensaje}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Tarjeta de Solicitud en Curso (Paso 1 a Paso 4 del Flujo) */}
        {reservaActiva && (
          <View style={styles.activeOrderCard}>
            <View style={styles.activeBadgeRow}>
              <Text style={styles.activeOrderBadge}>
                SOLICITUD #{reservaActiva.codigo_reserva} •{' '}
                {formatearEtiquetaEstado(reservaActiva.estado).toUpperCase()}
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  await actualizarEstadoSolicitudActiva(ESTADOS_SOLICITUD_OFICIALES.CANCELADA);
                  refrescarTodo();
                }}
              >
                <Text style={styles.cancelSmallText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.activeOrderTitle}>{reservaActiva.servicio_nombre}</Text>
            <Text style={styles.activeOrderSub}>
              Profesional: {reservaActiva.profesional_nombre} •{' '}
              {formatCOP(reservaActiva.precio_total_cop)} COP
            </Text>

            {/* PASO 4: El profesional aceptó; el CLIENTE debe confirmar definitivamente para activar el servicio */}
            {(reservaActiva.estado === ESTADOS_SOLICITUD_OFICIALES.ACEPTADA_POR_PRO ||
              reservaActiva.estado ===
                ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_CONFIRMACION_CLIENTE) && (
              <View style={styles.clientConfirmSection}>
                <Text style={styles.clientConfirmHint}>
                  El profesional aceptó tu solicitud. Confirma definitivamente para activar el servicio.
                </Text>
                <TouchableOpacity
                  style={styles.confirmDefinitiveBtn}
                  onPress={async () => {
                    await confirmarDefinitivamentePorCliente();
                    refrescarTodo();
                  }}
                >
                  <Feather name="check-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.confirmDefinitiveText}>
                    Confirmar Definitivamente el Servicio
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.inlineChatBtn}
              onPress={() => setChatVisible(true)}
            >
              <Feather name="message-square" size={14} color="#FFFFFF" />
              <Text style={styles.inlineChatBtnText}>
                Abrir conversación y estado ({(reservaActiva.mensajes_chat || []).length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Búsqueda */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color={colors.textGray} />
            <TextInput
              style={styles.searchInput}
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar servicio o categoría..."
              placeholderTextColor={colors.textGray}
            />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={detectarMiUbicacionExacta}>
            <Feather name="crosshair" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Selector de modalidad */}
        <View style={styles.locationRow}>
          <View style={styles.togglePill}>
            <TouchableOpacity
              style={modalidad === 'domicilio' ? styles.toggleActive : styles.toggleInactive}
              onPress={() => setModalidad('domicilio')}
            >
              <Text
                style={
                  modalidad === 'domicilio'
                    ? styles.toggleTextActive
                    : styles.toggleTextInactive
                }
              >
                A domicilio
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalidad === 'local' ? styles.toggleActive : styles.toggleInactive}
              onPress={() => setModalidad('local')}
            >
              <Text
                style={
                  modalidad === 'local' ? styles.toggleTextActive : styles.toggleTextInactive
                }
              >
                En salón
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.locationSelector} onPress={detectarMiUbicacionExacta}>
            <Feather name="navigation" size={12} color={colors.primary} />
            <Text style={styles.locationText}>Actualizar GPS</Text>
          </TouchableOpacity>
        </View>

        {/* Mapa de Google */}
        <View style={[styles.mapContainer, { height: layout.mapHeight }]}>
          {loadingMap ? (
            <View style={styles.mapLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ fontSize: 12, color: colors.textGray, marginTop: 8 }}>
                Obteniendo ubicación GPS...
              </Text>
            </View>
          ) : (
            <WebView
              key={`map-${coords.latitude}-${coords.longitude}-${estilistasEnMapa.length}`}
              originWhitelist={['*']}
              source={{
                html: generarHtmlMapaUber({
                  solicitud: reservaActiva,
                  coordsCliente: coords,
                  vista: 'cliente',
                }),
              }}
              style={styles.webViewMap}
              javaScriptEnabled
              domStorageEnabled
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Profesionales Disponibles en la Base de Datos */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profesionales Disponibles</Text>
        </View>
        {estilistasEnMapa.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Feather name="users" size={22} color={colors.textGray} />
            <Text style={styles.emptyBlockText}>No se encontraron profesionales disponibles.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
            {estilistasEnMapa.map((est) => (
              <View key={est.id} style={styles.stylistPinCard}>
                {est.foto ? (
                  <Image source={{ uri: est.foto }} style={styles.stylistPinAvatar} />
                ) : (
                  <View style={styles.proAvatarPlaceholder}>
                    <Feather name="user" size={18} color={colors.primary} />
                  </View>
                )}
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.stylistPinName}>{est.nombre}</Text>
                  <Text style={styles.stylistPinSpec}>{est.especialidad}</Text>
                  <Text style={styles.stylistPinCoords}>{est.direccion_exacta}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Categorías */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllCategories')}>
            <Text style={styles.seeAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <CategoryItem
            iconName="content-cut"
            title="Cabello"
            subtitle="Peluquería"
            onPress={() => navigation.navigate('CategoryDetail', { categoryId: 'cabello' })}
          />
          <CategoryItem
            iconName="hand-heart-outline"
            title="Uñas"
            subtitle="Manicura"
            onPress={() => navigation.navigate('CategoryDetail', { categoryId: 'unas' })}
          />
          <CategoryItem
            iconName="brush"
            title="Maquillaje"
            subtitle="Social"
            onPress={() => navigation.navigate('CategoryDetail', { categoryId: 'maquillaje' })}
          />
          <CategoryItem
            iconName="flower-outline"
            title="Facial"
            subtitle="Cuidado piel"
            onPress={() => navigation.navigate('CategoryDetail', { categoryId: 'facial' })}
          />
        </ScrollView>

        {/* Servicios Activos en la Base de Datos */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Servicios Disponibles</Text>
        </View>

        {filtrados.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Feather name="grid" size={22} color={colors.textGray} />
            <Text style={styles.emptyBlockText}>
              Todavía no hay servicios registrados en la base de datos.
            </Text>
          </View>
        ) : (
          <View style={layout.gridStyle}>
            {filtrados.map((srv) => (
              <View
                key={srv.id}
                style={[
                  styles.luxuryServiceCard,
                  layout.isTablet && { width: layout.cardWidth },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {srv.image ? (
                    <Image source={{ uri: srv.image }} style={styles.srvThumb} />
                  ) : (
                    <View style={[styles.srvThumb, { backgroundColor: '#F3EFEA' }]} />
                  )}
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.catSub}>{srv.categoryLabel}</Text>
                    <Text style={styles.srvTitle}>{srv.title}</Text>
                    <Text style={styles.srvMeta}>
                      {srv.duration} • {srv.proName}
                    </Text>
                  </View>
                </View>
                <View style={styles.srvFooter}>
                  <Text style={styles.srvPrice}>{formatCOP(srv.priceCop)} COP</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={styles.outlineBtn}
                      onPress={() => abrirModalServicio(srv, 'local')}
                    >
                      <Text style={styles.outlineBtnText}>En salón</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={() => abrirModalServicio(srv, 'domicilio')}
                    >
                      <Text style={styles.primaryBtnText}>Solicitar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <ServiceBookingModal
        visible={Boolean(servicioSeleccionado)}
        servicio={servicioSeleccionado}
        initialMode={modoModalInicial}
        onClose={() => {
          setServicioSeleccionado(null);
          refrescarTodo();
        }}
        onSuccessDomicilio={() => {
          setServicioSeleccionado(null);
          refrescarTodo();
        }}
        onSuccessCita={() => {
          setServicioSeleccionado(null);
          refrescarTodo();
        }}
      />

      <ChatServicioModal
        visible={chatVisible}
        solicitud={reservaActiva}
        rolActual="cliente"
        onClose={() => {
          setChatVisible(false);
          refrescarTodo();
        }}
      />

      <BottomMenu activeTab="Servicios" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  fullScreenContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  fullScreenMapArea: { flex: 1, position: 'relative' },
  floatingTopBar: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(26,26,26,0.92)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' },
  floatingStatusLabel: { color: '#D48C70', fontSize: 10.5, fontWeight: '800' },
  floatingEtaText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700', marginTop: 2 },
  floatingBottomCard: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  proFloatingRow: { flexDirection: 'row', alignItems: 'center' },
  proFloatingAvatar: { width: 48, height: 48, borderRadius: 24 },
  proAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proFloatingName: { fontSize: 15, fontWeight: '800', color: colors.textDark },
  proFloatingService: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  proFloatingPrice: { fontSize: 11.5, color: colors.textGray, marginTop: 2 },
  chatFloatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  chatFloatingBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  scrollContainer: { paddingTop: 14, paddingBottom: 30 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoBeauty: { fontSize: 23, fontStyle: 'italic', color: colors.textDark },
  logoFlash: { fontSize: 23, fontWeight: '900', color: colors.primary },
  welcomeUser: { fontSize: 11.5, fontWeight: '600', color: colors.textGray, marginTop: 2 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#C0392B',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  profilePic: { width: 40, height: 40, borderRadius: 20 },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineNotifPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  inlineNotifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inlineNotifTitle: { fontSize: 13.5, fontWeight: '800', color: colors.textDark },
  emptyNotifText: { fontSize: 12, color: colors.textGray, paddingVertical: 8 },
  notifItem: {
    backgroundColor: '#F8F6F4',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notifTitle: { fontSize: 12, fontWeight: '800', color: colors.textDark },
  notifTime: { fontSize: 10, color: colors.textGray },
  notifMsg: { fontSize: 11.5, color: colors.textGray, marginTop: 2 },
  activeOrderCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#D48C70',
  },
  activeBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeOrderBadge: { fontSize: 10, fontWeight: '800', color: '#D48C70' },
  cancelSmallText: { fontSize: 11.5, fontWeight: '700', color: '#FCA5A5' },
  activeOrderTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },
  activeOrderSub: { fontSize: 12, color: '#D6CEC7', marginTop: 2 },
  clientConfirmSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  clientConfirmHint: { fontSize: 12, color: '#E5DCD4', marginBottom: 8 },
  confirmDefinitiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E824C',
    paddingVertical: 12,
    borderRadius: 10,
  },
  confirmDefinitiveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  inlineChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  inlineChatBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13.5, color: colors.textDark },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: '#EBE6E0',
    borderRadius: 12,
    padding: 3,
  },
  toggleActive: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  toggleInactive: { paddingHorizontal: 12, paddingVertical: 7 },
  toggleTextActive: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' },
  toggleTextInactive: { color: colors.textGray, fontSize: 11.5, fontWeight: '600' },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationText: { fontSize: 11.5, fontWeight: '700', color: colors.primary },
  mapContainer: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  webViewMap: { width: '100%', height: '100%' },
  mapLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3EFEA' },
  emptyBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  emptyBlockText: { fontSize: 12.5, color: colors.textGray, marginTop: 6, textAlign: 'center' },
  stylistPinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
    minWidth: 230,
  },
  stylistPinAvatar: { width: 44, height: 44, borderRadius: 22 },
  stylistPinName: { fontSize: 13.5, fontWeight: '800', color: colors.textDark },
  stylistPinSpec: { fontSize: 11.5, color: colors.primary, fontWeight: '600' },
  stylistPinCoords: { fontSize: 10.5, color: colors.textGray, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15.5, fontWeight: '800', color: colors.textDark },
  seeAllText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  luxuryServiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  srvThumb: { width: 68, height: 68, borderRadius: 14 },
  catSub: { fontSize: 11, color: colors.primary, fontWeight: '700' },
  srvTitle: { fontSize: 15, fontWeight: '800', color: colors.textDark, marginTop: 2 },
  srvMeta: { fontSize: 11.5, color: colors.textGray, marginTop: 3 },
  srvFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F4F1ED',
    paddingTop: 10,
    marginTop: 10,
  },
  srvPrice: { fontSize: 16.5, fontWeight: '800', color: colors.textDark },
  outlineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  outlineBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  primaryBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
});