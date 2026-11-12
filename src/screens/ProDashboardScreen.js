/**
 * Archivo: src/screens/ProDashboardScreen.js
 * Panel del Profesional:
 * - Paso 2 y 3 del flujo: Recibe la solicitud en `pendiente_aceptacion_profesional` y decide
 *   Aceptar o Rechazar. Al aceptar, queda pendiente de la confirmación definitiva del cliente.
 * - Paso 5: Cuando el cliente confirma un servicio a domicilio (`confirmada_por_cliente`,
 *   `en_camino`, `en_servicio`), la vista se transforma en un MAPA DE GOOGLE A PANTALLA COMPLETA
 *   con paneles flotantes compactos (foto y nombre del cliente, dirección, distancia y ETA,
 *   acceso directo al chat, botón para llamar y acciones del servicio).
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Linking,
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
  obtenerSolicitudActiva,
  responderSolicitudPorProfesional,
  actualizarEstadoSolicitudActiva,
  generarHtmlMapaUber,
  obtenerUbicacionExactaGPS,
  sincronizarEstadoDesdeSupabase,
  marcarNotificacionesComoLeidas,
  useResponsiveLayout,
} from '../theme/colors';
import { ProBottomNav } from './BilleteraScreen';
import { ChatServicioModal } from '../components/ServiceBookingModal';

export default function ProDashboardScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const pro = sessionStore.proUser;
  const [saldo, setSaldo] = useState(sessionStore.wallet.saldo_disponible_cop);
  const [solicitud, setSolicitud] = useState(obtenerSolicitudActiva());
  const [notificaciones, setNotificaciones] = useState([...sessionStore.notificacionesProfesional]);
  const [verNotificaciones, setVerNotificaciones] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);

  const refrescar = () => {
    setSaldo(sessionStore.wallet.saldo_disponible_cop);
    const act = obtenerSolicitudActiva();
    setSolicitud(act ? { ...act } : null);
    setNotificaciones([...sessionStore.notificacionesProfesional]);
  };

  useEffect(() => {
    obtenerUbicacionExactaGPS('profesional').then(refrescar);
    sincronizarEstadoDesdeSupabase('profesional').then(refrescar);
    const interval = setInterval(async () => {
      await sincronizarEstadoDesdeSupabase('profesional');
      refrescar();
    }, 2500);
    const unsub = navigation.addListener('focus', () => {
      sincronizarEstadoDesdeSupabase('profesional').then(refrescar);
    });
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [navigation]);

  const toggleBandejaNotificaciones = async () => {
    const nuevoEstado = !verNotificaciones;
    setVerNotificaciones(nuevoEstado);
    if (nuevoEstado) {
      await marcarNotificacionesComoLeidas('profesional');
      setNotificaciones([...sessionStore.notificacionesProfesional]);
    }
  };

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  // Determinar si debe activarse la experiencia de MAPA A PANTALLA COMPLETA
  const esDomicilioConfirmado =
    solicitud &&
    solicitud.modalidad === 'domicilio' &&
    [
      ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE,
      ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO,
      ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO,
    ].includes(solicitud.estado);

  // EXPERIENCIA DE MAPA A PANTALLA COMPLETA PARA SERVICIOS A DOMICILIO CONFIRMADOS
  if (esDomicilioConfirmado) {
    return (
      <SafeAreaView style={styles.fullScreenContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Mapa de Google ocupando toda la pantalla disponible */}
        <View style={styles.fullScreenMapArea}>
          <WebView
            key={`pro-fullmap-${solicitud.codigo_reserva}-${solicitud.estado}-${solicitud.progreso_ruta}`}
            originWhitelist={['*']}
            source={{
              html: generarHtmlMapaUber({
                solicitud,
                vista: 'profesional',
              }),
            }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
          />

          {/* Panel Flotante Superior: Estado, Distancia y Tiempo Estimado */}
          <View style={styles.floatingTopBar}>
            <View style={styles.statusDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.floatingStatusLabel}>
                {formatearEtiquetaEstado(solicitud.estado).toUpperCase()}
              </Text>
              <Text style={styles.floatingEtaText}>
                {solicitud.distancia_estimada_km === 0 || (solicitud.distancia_estimada_km !== null && solicitud.distancia_estimada_km <= 0.03)
                  ? 'Ya estás en el lugar'
                  : solicitud.tiempo_estimado_minutos === null || solicitud.tiempo_estimado_minutos === undefined
                  ? `Distancia aprox.: ${solicitud.distancia_estimada_km ?? '--'} km • Tiempo estimado no disponible`
                  : `Distancia: ${solicitud.distancia_estimada_km} km • Tiempo estimado: ${solicitud.tiempo_estimado_minutos} min`}
              </Text>
            </View>
          </View>

          {/* Panel Flotante Inferior Compacto: Información del Cliente, Chat, Llamada y Acciones */}
          <View style={styles.floatingBottomCard}>
            <View style={styles.clientRow}>
              {solicitud.cliente_foto ? (
                <Image source={{ uri: solicitud.cliente_foto }} style={styles.clientAvatar} />
              ) : (
                <View style={styles.clientAvatarPlaceholder}>
                  <Feather name="user" size={20} color={colors.primary} />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.clientName}>{solicitud.cliente_nombre}</Text>
                <Text style={styles.serviceSub}>{solicitud.servicio_nombre}</Text>
                <View style={styles.addrRow}>
                  <Feather name="map-pin" size={12} color={colors.primary} />
                  <Text style={styles.addrText} numberOfLines={1}>
                    {solicitud.direccion_servicio}
                  </Text>
                </View>
              </View>

              {/* Botones compactos de Chat y Llamada */}
              <View style={styles.commButtonsRow}>
                <TouchableOpacity
                  style={styles.iconCircleBtn}
                  onPress={() => setChatVisible(true)}
                >
                  <Feather name="message-square" size={18} color={colors.primary} />
                </TouchableOpacity>
                {solicitud.cliente_telefono ? (
                  <TouchableOpacity
                    style={styles.iconCircleBtn}
                    onPress={() => Linking.openURL(`tel:${solicitud.cliente_telefono}`)}
                  >
                    <Feather name="phone" size={18} color={colors.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Acciones del servicio según el estado */}
            <View style={styles.actionsRow}>
              {solicitud.estado === ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE && (
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={async () => {
                    await actualizarEstadoSolicitudActiva(
                      ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO,
                      35
                    );
                    refrescar();
                  }}
                >
                  <Feather name="navigation" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>Iniciar Ruta (En camino)</Text>
                </TouchableOpacity>
              )}

              {solicitud.estado === ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO && (
                <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                  <TouchableOpacity
                    style={[styles.secondaryActionBtn, { flex: 1 }]}
                    onPress={async () => {
                      await actualizarEstadoSolicitudActiva(
                        ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO,
                        Math.min(92, (solicitud.progreso_ruta || 35) + 30)
                      );
                      refrescar();
                    }}
                  >
                    <Text style={styles.secondaryActionText}>Actualizar ubicación</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { flex: 1.3 }]}
                    onPress={async () => {
                      await actualizarEstadoSolicitudActiva(
                        ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO,
                        100
                      );
                      refrescar();
                    }}
                  >
                    <Feather name="scissors" size={15} color="#FFFFFF" />
                    <Text style={styles.primaryActionText}>Iniciar Servicio</Text>
                  </TouchableOpacity>
                </View>
              )}

              {solicitud.estado === ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO && (
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: '#1E824C' }]}
                  onPress={async () => {
                    await actualizarEstadoSolicitudActiva(
                      ESTADOS_SOLICITUD_OFICIALES.FINALIZADA,
                      100
                    );
                    refrescar();
                  }}
                >
                  <Feather name="check-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>Finalizar Servicio</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <ChatServicioModal
          visible={chatVisible}
          solicitud={solicitud}
          rolActual="profesional"
          onClose={() => {
            setChatVisible(false);
            refrescar();
          }}
        />

        <ProBottomNav navigation={navigation} active="ProDashboard" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.topNav}>
        <View style={{ flex: 1 }}>
          <Text style={styles.dashboardTitle}>Panel Profesional</Text>
          <Text style={styles.proSubtitle}>
            {pro.nombre_completo || 'Profesional'} {pro.barrio ? `• ${pro.barrio}` : ''}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity style={styles.bellBtn} onPress={toggleBandejaNotificaciones}>
            <Feather name="bell" size={18} color={colors.textDark} />
            {noLeidas > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{noLeidas}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.walletBadge}
            onPress={() => navigation.navigate('Billetera')}
          >
            <Feather name="credit-card" size={13} color="#FFFFFF" />
            <Text style={styles.walletBadgeText}>{formatCOP(saldo)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, layout.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {/* Panel desplegable en línea de Notificaciones (sin modales invasivos) */}
        {verNotificaciones && (
          <View style={styles.inlineNotifPanel}>
            <View style={styles.inlineNotifHeader}>
              <Text style={styles.inlineNotifTitle}>
                Historial de Notificaciones ({notificaciones.length})
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

        <Text style={styles.sectionTitle}>SOLICITUDES DE SERVICIO</Text>

        {!solicitud ? (
          <View style={styles.emptyCard}>
            <Feather name="inbox" size={28} color={colors.textGray} />
            <Text style={styles.emptyTitle}>No tienes solicitudes pendientes.</Text>
            <Text style={styles.emptySub}>
              Cuando un cliente solicite uno de tus servicios activos, aparecerá aquí en tiempo real.
            </Text>
          </View>
        ) : (
          <View style={styles.reqCard}>
            <View style={styles.reqTop}>
              <Text style={styles.reqBadge}>
                {solicitud.modalidad === 'domicilio' ? 'A DOMICILIO' : 'EN SALÓN'} • #
                {solicitud.codigo_reserva}
              </Text>
              <Text style={styles.reqState}>
                {formatearEtiquetaEstado(solicitud.estado).toUpperCase()}
              </Text>
            </View>

            <Text style={styles.reqTitle}>{solicitud.servicio_nombre}</Text>
            <Text style={styles.reqMeta}>
              Cliente: {solicitud.cliente_nombre} • Valor: {formatCOP(solicitud.precio_total_cop)} COP
            </Text>
            <View style={styles.addrRow}>
              <Feather name="map-pin" size={13} color={colors.textGray} />
              <Text style={styles.reqAddr}>{solicitud.direccion_servicio}</Text>
            </View>

            {/* PASO 3: El profesional acepta o rechaza la solicitud */}
            {solicitud.estado === ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_ACEPTACION_PRO && (
              <View style={styles.decisionRow}>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={async () => {
                    await responderSolicitudPorProfesional('rechazar');
                    refrescar();
                  }}
                >
                  <Feather name="x-circle" size={16} color="#C0392B" />
                  <Text style={styles.rejectBtnText}>Rechazar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={async () => {
                    await responderSolicitudPorProfesional('aceptar');
                    refrescar();
                  }}
                >
                  <Feather name="check-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.acceptBtnText}>Aceptar Solicitud</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Estado intermedio: Aceptada por el profesional, esperando que el CLIENTE confirme definitivamente */}
            {(solicitud.estado === ESTADOS_SOLICITUD_OFICIALES.ACEPTADA_POR_PRO ||
              solicitud.estado === ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_CONFIRMACION_CLIENTE) && (
              <View style={styles.pendingClientBox}>
                <Feather name="clock" size={16} color={colors.primary} />
                <Text style={styles.pendingClientText}>
                  Has aceptado la solicitud. Esperando a que el cliente confirme definitivamente el servicio para activarlo.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.openChatBtn}
              onPress={() => setChatVisible(true)}
            >
              <Feather name="message-square" size={15} color={colors.textDark} />
              <Text style={styles.openChatBtnText}>
                Abrir conversación con el cliente ({(solicitud.mensajes_chat || []).length})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ChatServicioModal
        visible={chatVisible}
        solicitud={solicitud}
        rolActual="profesional"
        onClose={() => {
          setChatVisible(false);
          refrescar();
        }}
      />

      <ProBottomNav navigation={navigation} active="ProDashboard" />
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
  clientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  clientAvatar: { width: 48, height: 48, borderRadius: 24 },
  clientAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientName: { fontSize: 15, fontWeight: '800', color: colors.textDark },
  serviceSub: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  addrText: { fontSize: 11.5, color: colors.textGray, flex: 1 },
  commButtonsRow: { flexDirection: 'row', gap: 8 },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6EFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: { flexDirection: 'row' },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
  },
  primaryActionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  secondaryActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EFEA',
    paddingVertical: 13,
    borderRadius: 12,
  },
  secondaryActionText: { color: colors.textDark, fontSize: 12, fontWeight: '700' },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  dashboardTitle: { fontSize: 17, fontWeight: '800', color: colors.textDark },
  proSubtitle: { fontSize: 11.5, color: colors.textGray, marginTop: 2 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F6F4',
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
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  walletBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  scroll: { paddingTop: 14, paddingBottom: 36 },
  inlineNotifPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  inlineNotifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inlineNotifTitle: { fontSize: 14, fontWeight: '800', color: colors.textDark },
  emptyNotifText: { fontSize: 12.5, color: colors.textGray, paddingVertical: 10 },
  notifItem: {
    backgroundColor: '#F8F6F4',
    padding: 11,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notifTitle: { fontSize: 12.5, fontWeight: '800', color: colors.textDark },
  notifTime: { fontSize: 10.5, color: colors.textGray },
  notifMsg: { fontSize: 12, color: colors.textGray, marginTop: 3 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textGray,
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.textDark, marginTop: 10 },
  emptySub: {
    fontSize: 12.5,
    color: colors.textGray,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  reqCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reqTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reqBadge: { fontSize: 10.5, fontWeight: '800', color: colors.primary },
  reqState: { fontSize: 10.5, fontWeight: '800', color: '#1E824C' },
  reqTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark, marginBottom: 4 },
  reqMeta: { fontSize: 12.5, color: colors.textDark, marginBottom: 4 },
  reqAddr: { fontSize: 12, color: colors.textGray },
  decisionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FDEDEC',
  },
  rejectBtnText: { color: '#C0392B', fontSize: 13, fontWeight: '700' },
  acceptBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  acceptBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  pendingClientBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F6EFEB',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  pendingClientText: { flex: 1, fontSize: 12, color: colors.textDark, lineHeight: 17 },
  openChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8F6F4',
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  openChatBtnText: { fontSize: 12.5, fontWeight: '700', color: colors.textDark },
});