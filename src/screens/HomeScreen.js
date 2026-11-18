import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  colors,
  sessionStore,
  ESTADOS_SOLICITUD_OFICIALES,
  useResponsiveLayout,
  obtenerUbicacionExactaGPS,
  marcarNotificacionesComoLeidas,
  obtenerServiciosActivosParaClientes,
  obtenerSolicitudActiva,
  confirmarDefinitivamentePorCliente,
  actualizarEstadoSolicitudActiva,
} from '../theme/colors';
import { useSupabaseSync } from '../hooks/useSupabaseSync';
import BeautyFlashMapView from '../components/map/BeautyFlashMapView';
import EmptyStateCard from '../components/ui/EmptyStateCard';
import NotificationBannerList from '../components/ui/NotificationBannerList';
import ModeSwitcherBanner from '../components/ui/ModeSwitcherBanner';
import ActiveRequestCard from '../components/booking/ActiveRequestCard';
import ServiceCatalogCard from '../components/booking/ServiceCatalogCard';
import { FloatingTopEtaBanner, FloatingBottomTrackingCard } from '../components/booking/FloatingTrackingPanel';
import CategoryItem from '../components/CategoryItem';
import BottomMenu from '../components/BottomMenu';
import ValidationModal from '../components/ui/ValidationModal';
import { ServiceBookingModal, ChatServicioModal } from '../components/ServiceBookingModal';

export default function HomeScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const cliente = sessionStore.clientUser;
  const [busqueda, setBusqueda] = useState('');
  const [coords, setCoords] = useState({
    latitude: cliente.latitud || 3.4516,
    longitude: cliente.longitud || -76.5320,
  });
  const [direccionActual, setDireccionActual] = useState(cliente.direccion_principal || 'Detectando ubicación...');
  const [, setTick] = useState(0);
  const [verNotificaciones, setVerNotificaciones] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [modoModalInicial, setModoModalInicial] = useState('domicilio');
  const [chatVisible, setChatVisible] = useState(false);
  const [modalAlert, setModalAlert] = useState({
    visible: false,
    variant: 'info',
    title: '',
    message: '',
  });

  const refrescarTodo = useCallback(() => {
    if (sessionStore.clientUser.direccion_principal) setDireccionActual(sessionStore.clientUser.direccion_principal);
    if (sessionStore.clientUser.latitud && sessionStore.clientUser.longitud) {
      setCoords({ latitude: sessionStore.clientUser.latitud, longitude: sessionStore.clientUser.longitud });
    }
    setTick((t) => t + 1);
  }, []);

  useSupabaseSync('cliente', refrescarTodo);

  useEffect(() => {
    obtenerUbicacionExactaGPS('cliente').then(refrescarTodo);
  }, [refrescarTodo]);

  const handleConfirmarDefinitivoDesdeHome = async () => {
    const res = await confirmarDefinitivamentePorCliente();
    if (res?.bloqueadoPorSaldo) {
      setModalAlert({
        visible: true,
        variant: 'insufficient_balance',
        title: 'El profesional no tiene saldo disponible',
        message:
          res.detallesSaldo?.mensaje ||
          'El profesional asignado no cuenta con saldo suficiente en su billetera profesional para activar el servicio.',
      });
      refrescarTodo();
      return;
    }
    refrescarTodo();
  };

  const reservaActiva = obtenerSolicitudActiva();
  const notificaciones = sessionStore.notificacionesCliente || [];
  const noLeidas = notificaciones.filter((n) => !n.leida).length;
  const filtrados = obtenerServiciosActivosParaClientes({ busqueda });
  const estilistasEnMapa = sessionStore.estilistasMapa || [];

  const seguimientoFullScreen =
    reservaActiva &&
    reservaActiva.modalidad === 'domicilio' &&
    [
      ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE,
      ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO,
      ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO,
    ].includes(reservaActiva.estado);

  if (seguimientoFullScreen) {
    return (
      <SafeAreaView style={styles.fullScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={{ flex: 1, position: 'relative' }}>
          <BeautyFlashMapView coordsCliente={coords} solicitud={reservaActiva} fullScreen />
          <FloatingTopEtaBanner solicitud={reservaActiva} />
          <FloatingBottomTrackingCard
            personaNombre={reservaActiva.profesional_nombre}
            personaFoto={reservaActiva.profesional_foto}
            personaTelefono={reservaActiva.profesional_telefono}
            servicioNombre={reservaActiva.servicio_nombre}
            precioTotalCop={reservaActiva.precio_total_cop}
            codigoReserva={reservaActiva.codigo_reserva}
            onOpenChat={() => setChatVisible(true)}
          />
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={[styles.scroll, layout.contentContainerStyle]} showsVerticalScrollIndicator={false}>
        <ModeSwitcherBanner navigation={navigation} currentMode="cliente" />
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={styles.logoRow}>
              <Text style={styles.logoBeauty}>Beauty</Text>
              <Text style={styles.logoFlash}>Flash</Text>
            </View>
            <Text style={styles.welcomeUser} numberOfLines={1}>
              {cliente.nombre_completo ? `Hola, ${cliente.nombre_completo}` : 'Bienvenido'} • {direccionActual}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={async () => {
                const next = !verNotificaciones;
                setVerNotificaciones(next);
                if (next) {
                  await marcarNotificacionesComoLeidas('cliente');
                  refrescarTodo();
                }
              }}
            >
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

        {verNotificaciones && (
          <NotificationBannerList notificaciones={notificaciones} onClose={() => setVerNotificaciones(false)} />
        )}

        <ActiveRequestCard
          solicitud={reservaActiva}
          onConfirmDefinitive={handleConfirmarDefinitivoDesdeHome}
          onCancel={async () => {
            await actualizarEstadoSolicitudActiva(ESTADOS_SOLICITUD_OFICIALES.CANCELADA);
            refrescarTodo();
          }}
          onOpenChat={() => setChatVisible(true)}
        />

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
          <TouchableOpacity style={styles.filterBtn} onPress={() => obtenerUbicacionExactaGPS('cliente').then(refrescarTodo)}>
            <Feather name="crosshair" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 16 }}>
          <BeautyFlashMapView
            coordsCliente={coords}
            estilistas={estilistasEnMapa}
            solicitud={reservaActiva}
            height={layout.mapHeight}
          />
        </View>

        <Text style={styles.sectionTitle}>Categorías</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
          <CategoryItem iconName="content-cut" title="Cabello" subtitle="Peluquería" onPress={() => navigation.navigate('CategoryDetail', { categoryId: 'cabello' })} />
          <CategoryItem iconName="hand-heart-outline" title="Uñas" subtitle="Manicura" onPress={() => navigation.navigate('CategoryDetail', { categoryId: 'unas' })} />
          <CategoryItem iconName="brush" title="Maquillaje" subtitle="Social" onPress={() => navigation.navigate('CategoryDetail', { categoryId: 'maquillaje' })} />
          <CategoryItem iconName="flower-outline" title="Facial" subtitle="Cuidado piel" onPress={() => navigation.navigate('CategoryDetail', { categoryId: 'facial' })} />
        </ScrollView>

        <Text style={styles.sectionTitle}>Servicios Disponibles</Text>
        {filtrados.length === 0 ? (
          <EmptyStateCard icon="grid" title="No se encontraron servicios disponibles." subtitle="Solo se muestran los servicios activos cuyos profesionales cuentan con saldo disponible en su billetera." />
        ) : (
          <View style={layout.gridStyle}>
            {filtrados.map((srv) => (
              <ServiceCatalogCard
                key={srv.id}
                servicio={srv}
                widthStyle={layout.isTablet ? { width: layout.cardWidth } : null}
                onSelectSalon={() => { setModoModalInicial('local'); setServicioSeleccionado(srv); }}
                onSelectDomicilio={() => { setModoModalInicial('domicilio'); setServicioSeleccionado(srv); }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <ServiceBookingModal
        visible={Boolean(servicioSeleccionado)}
        servicio={servicioSeleccionado}
        initialMode={modoModalInicial}
        onClose={() => { setServicioSeleccionado(null); refrescarTodo(); }}
        onSuccessDomicilio={() => { setServicioSeleccionado(null); refrescarTodo(); }}
        onSuccessCita={() => { setServicioSeleccionado(null); refrescarTodo(); }}
      />
      <ChatServicioModal
        visible={chatVisible}
        solicitud={reservaActiva}
        rolActual="cliente"
        onClose={() => { setChatVisible(false); refrescarTodo(); }}
      />
      <ValidationModal
        visible={modalAlert.visible}
        variant={modalAlert.variant}
        title={modalAlert.title}
        message={modalAlert.message}
        onClose={() => setModalAlert((prev) => ({ ...prev, visible: false }))}
      />
      <BottomMenu activeTab="Servicios" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  fullScreen: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingTop: 14, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoBeauty: { fontSize: 23, fontStyle: 'italic', color: colors.textDark },
  logoFlash: { fontSize: 23, fontWeight: '900', color: colors.primary },
  welcomeUser: { fontSize: 11.5, fontWeight: '600', color: colors.textGray, marginTop: 2 },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  bellBadge: { position: 'absolute', top: -3, right: -3, backgroundColor: '#C0392B', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  bellBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' , flexShrink: 1 },
  profilePic: { width: 40, height: 40, borderRadius: 20 },
  profilePlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3EFEA', alignItems: 'center', justifyContent: 'center' },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13.5, color: colors.textDark },
  filterBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 15.5, fontWeight: '800', color: colors.textDark, marginBottom: 10 , flexShrink: 1 },
});
