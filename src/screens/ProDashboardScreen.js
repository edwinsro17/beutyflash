import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  colors,
  sessionStore,
  formatCOP,
  ESTADOS_SOLICITUD_OFICIALES,
  formatearEtiquetaEstado,
  useResponsiveLayout,
  obtenerSolicitudActiva,
  responderSolicitudPorProfesional,
  actualizarEstadoSolicitudActiva,
  obtenerUbicacionExactaGPS,
  marcarNotificacionesComoLeidas,
  sincronizarBilleteraDesdeSupabase,
} from '../theme/colors';
import { useSupabaseSync } from '../hooks/useSupabaseSync';
import BeautyFlashMapView from '../components/map/BeautyFlashMapView';
import EmptyStateCard from '../components/ui/EmptyStateCard';
import NotificationBannerList from '../components/ui/NotificationBannerList';
import ModeSwitcherBanner from '../components/ui/ModeSwitcherBanner';
import ValidationModal from '../components/ui/ValidationModal';
import { FloatingTopEtaBanner, FloatingBottomTrackingCard } from '../components/booking/FloatingTrackingPanel';
import { ProBottomNav } from './BilleteraScreen';
import { ChatServicioModal } from '../components/ServiceBookingModal';

export default function ProDashboardScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const pro = sessionStore.proUser;
  const [, setTick] = useState(0);
  const [verNotificaciones, setVerNotificaciones] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [modalAlert, setModalAlert] = useState({
    visible: false,
    variant: 'info',
    title: '',
    message: '',
    showRechargeBtn: false,
  });

  const refrescar = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useSupabaseSync('profesional', refrescar);

  useEffect(() => {
    sincronizarBilleteraDesdeSupabase().then(refrescar);
    obtenerUbicacionExactaGPS('profesional').then(refrescar);
  }, [refrescar]);

  const saldo = Number(sessionStore.wallet?.saldo_disponible_cop) || 0;
  const solicitud = obtenerSolicitudActiva();
  const notificaciones = sessionStore.notificacionesProfesional || [];
  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const handleAceptarSolicitud = async () => {
    const res = await responderSolicitudPorProfesional('aceptar');
    if (res?.bloqueadoPorSaldo) {
      setModalAlert({
        visible: true,
        variant: 'insufficient_balance',
        title: 'Saldo insuficiente en tu billetera',
        message:
          res.mensaje ||
          'No tienes saldo suficiente en tu billetera profesional para aceptar solicitudes. Tus servicios han quedado desactivados hasta que realices una recarga.',
        showRechargeBtn: true,
      });
      refrescar();
      return;
    }
    refrescar();
  };

  const esDomicilioConfirmado =
    solicitud &&
    solicitud.modalidad === 'domicilio' &&
    [
      ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE,
      ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO,
      ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO,
    ].includes(solicitud.estado);

  if (esDomicilioConfirmado) {
    const botonesAccion = (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {solicitud.estado === ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE && (
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={async () => {
              await actualizarEstadoSolicitudActiva(ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO, 35);
              refrescar();
            }}
          >
            <Feather name="navigation" size={16} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Iniciar Ruta (En camino)</Text>
          </TouchableOpacity>
        )}
        {solicitud.estado === ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO && (
          <>
            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={async () => {
                await actualizarEstadoSolicitudActiva(
                  ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO,
                  Math.min(92, (solicitud.progreso_ruta || 35) + 30)
                );
                refrescar();
              }}
            >
              <Text style={styles.secondaryActionText}>Actualizar ruta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={async () => {
                const res = await actualizarEstadoSolicitudActiva(
                  ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO,
                  100
                );
                if (res?.bloqueadoPorSaldo) {
                  setModalAlert({
                    visible: true,
                    variant: 'insufficient_balance',
                    title: 'Saldo insuficiente para Etapa 2 (7%)',
                    message:
                      res.detallesSaldo?.mensaje ||
                      'Necesitas recargar tu billetera para cubrir el 7% restante de comisión al iniciar el servicio.',
                    showRechargeBtn: true,
                  });
                }
                refrescar();
              }}
            >
              <Feather name="scissors" size={15} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>Iniciar Servicio</Text>
            </TouchableOpacity>
          </>
        )}
        {solicitud.estado === ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO && (
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: colors.success }]}
            onPress={async () => {
              await actualizarEstadoSolicitudActiva(ESTADOS_SOLICITUD_OFICIALES.FINALIZADA, 100);
              refrescar();
            }}
          >
            <Feather name="check-circle" size={16} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Finalizar Servicio</Text>
          </TouchableOpacity>
        )}
      </View>
    );

    return (
      <SafeAreaView style={styles.fullScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={{ flex: 1, position: 'relative' }}>
          <BeautyFlashMapView solicitud={solicitud} fullScreen />
          <FloatingTopEtaBanner solicitud={solicitud} />
          <FloatingBottomTrackingCard
            personaNombre={solicitud.cliente_nombre}
            personaFoto={solicitud.cliente_foto}
            personaTelefono={solicitud.cliente_telefono}
            servicioNombre={solicitud.servicio_nombre}
            direccion={solicitud.direccion_servicio}
            precioTotalCop={solicitud.precio_total_cop}
            codigoReserva={solicitud.codigo_reserva}
            onOpenChat={() => setChatVisible(true)}
            actionButtons={botonesAccion}
          />
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
        <ValidationModal
          visible={modalAlert.visible}
          variant={modalAlert.variant}
          title={modalAlert.title}
          message={modalAlert.message}
          primaryText={modalAlert.showRechargeBtn ? 'Ir a Recargar Billetera' : 'Entendido'}
          onPrimaryPress={() => {
            setModalAlert((prev) => ({ ...prev, visible: false }));
            if (modalAlert.showRechargeBtn) navigation.navigate('WalletRecharge');
          }}
          secondaryText={modalAlert.showRechargeBtn ? 'Cerrar' : null}
          onClose={() => setModalAlert((prev) => ({ ...prev, visible: false }))}
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
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={async () => {
              const next = !verNotificaciones;
              setVerNotificaciones(next);
              if (next) {
                await marcarNotificacionesComoLeidas('profesional');
                refrescar();
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
          <TouchableOpacity style={styles.walletBadge} onPress={() => navigation.navigate('Billetera')}>
            <Feather name="credit-card" size={13} color="#FFFFFF" />
            <Text style={styles.walletBadgeText}>{formatCOP(saldo)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, layout.contentContainerStyle]} showsVerticalScrollIndicator={false}>
        <ModeSwitcherBanner navigation={navigation} currentMode="profesional" />
        {verNotificaciones && (
          <NotificationBannerList notificaciones={notificaciones} onClose={() => setVerNotificaciones(false)} />
        )}

        {saldo <= 0 && (
          <View style={styles.noBalanceBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Feather name="alert-triangle" size={18} color="#C0392B" />
              <Text style={styles.noBalanceTitle}>
                Servicios ocultos y desactivados por falta de saldo
              </Text>
            </View>
            <Text style={styles.noBalanceDesc}>
              Tu saldo disponible es {formatCOP(saldo)} COP. Tus servicios han sido desactivados automáticamente y no se muestran a los clientes hasta que recargues tu billetera.
            </Text>
            <TouchableOpacity
              style={styles.noBalanceBtn}
              onPress={() => navigation.navigate('WalletRecharge')}
            >
              <Feather name="plus-circle" size={15} color="#FFFFFF" />
              <Text style={styles.noBalanceBtnText}>Recargar Billetera con Wompi</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>SOLICITUDES DE SERVICIO</Text>
        {!solicitud ? (
          <EmptyStateCard
            icon="inbox"
            title="No tienes solicitudes pendientes."
            subtitle="Cuando un cliente solicite uno de tus servicios activos, aparecerá aquí en tiempo real."
          />
        ) : (
          <View style={styles.reqCard}>
            <View style={styles.reqTop}>
              <Text style={styles.reqBadge}>
                {solicitud.modalidad === 'domicilio' ? 'A DOMICILIO' : 'EN SALÓN'} • #{solicitud.codigo_reserva}
              </Text>
              <Text style={styles.reqState}>{formatearEtiquetaEstado(solicitud.estado).toUpperCase()}</Text>
            </View>
            <Text style={styles.reqTitle}>{solicitud.servicio_nombre}</Text>
            <Text style={styles.reqMeta}>
              Cliente: {solicitud.cliente_nombre} • {formatCOP(solicitud.precio_total_cop)} COP
            </Text>
            <Text style={styles.reqAddr}>{solicitud.direccion_servicio}</Text>

            {solicitud.estado === ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_ACEPTACION_PRO && (
              <View style={styles.decisionRow}>
                <TouchableOpacity style={styles.rejectBtn} onPress={async () => { await responderSolicitudPorProfesional('rechazar'); refrescar(); }}>
                  <Feather name="x-circle" size={16} color="#C0392B" />
                  <Text style={styles.rejectBtnText}>Rechazar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn} onPress={handleAceptarSolicitud}>
                  <Feather name="check-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.acceptBtnText}>Aceptar Solicitud</Text>
                </TouchableOpacity>
              </View>
            )}

            {(solicitud.estado === ESTADOS_SOLICITUD_OFICIALES.ACEPTADA_POR_PRO ||
              solicitud.estado === ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_CONFIRMACION_CLIENTE) && (
              <View style={styles.pendingClientBox}>
                <Feather name="clock" size={16} color={colors.primary} />
                <Text style={styles.pendingClientText}>
                  Has aceptado la solicitud. Esperando confirmación definitiva del cliente para activar el servicio.
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.openChatBtn} onPress={() => setChatVisible(true)}>
              <Feather name="message-square" size={15} color={colors.textDark} />
              <Text style={styles.openChatBtnText}>
                Abrir conversación ({(solicitud.mensajes_chat || []).length})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ChatServicioModal
        visible={chatVisible}
        solicitud={solicitud}
        rolActual="profesional"
        onClose={() => { setChatVisible(false); refrescar(); }}
      />
      <ValidationModal
        visible={modalAlert.visible}
        variant={modalAlert.variant}
        title={modalAlert.title}
        message={modalAlert.message}
        primaryText={modalAlert.showRechargeBtn ? 'Ir a Recargar Billetera' : 'Entendido'}
        onPrimaryPress={() => {
          setModalAlert((prev) => ({ ...prev, visible: false }));
          if (modalAlert.showRechargeBtn) navigation.navigate('WalletRecharge');
        }}
        secondaryText={modalAlert.showRechargeBtn ? 'Cerrar' : null}
        onClose={() => setModalAlert((prev) => ({ ...prev, visible: false }))}
      />
      <ProBottomNav navigation={navigation} active="ProDashboard" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  fullScreen: { flex: 1, backgroundColor: '#FFFFFF' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: colors.border },
  dashboardTitle: { fontSize: 17, fontWeight: '800', color: colors.textDark , flexShrink: 1 },
  proSubtitle: { fontSize: 11.5, color: colors.textGray, marginTop: 2 },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F6F4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  bellBadge: { position: 'absolute', top: -3, right: -3, backgroundColor: '#C0392B', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  bellBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' , flexShrink: 1 },
  walletBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  walletBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' , flexShrink: 1 },
  scroll: { paddingTop: 14, paddingBottom: 36 },
  noBalanceBanner: { backgroundColor: '#FDEDEC', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F5B7B1', marginBottom: 16 },
  noBalanceTitle: { flex: 1, fontSize: 13.5, fontWeight: '800', color: '#C0392B' , flexShrink: 1 },
  noBalanceDesc: { fontSize: 12, color: '#78281F', lineHeight: 17, marginBottom: 10 },
  noBalanceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#C0392B', paddingVertical: 10, borderRadius: 10 },
  noBalanceBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: colors.textGray, letterSpacing: 0.7, marginBottom: 10 , flexShrink: 1 },
  reqCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  reqTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reqBadge: { fontSize: 10.5, fontWeight: '800', color: colors.primary },
  reqState: { fontSize: 10.5, fontWeight: '800', color: '#1E824C' },
  reqTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark, marginBottom: 4 , flexShrink: 1 },
  reqMeta: { fontSize: 12.5, color: colors.textDark, marginBottom: 4 },
  reqAddr: { fontSize: 12, color: colors.textGray },
  decisionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FDEDEC' },
  rejectBtnText: { color: '#C0392B', fontSize: 13, fontWeight: '700' , flexShrink: 1 },
  acceptBtn: { flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary },
  acceptBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' , flexShrink: 1 },
  pendingClientBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F6EFEB', padding: 12, borderRadius: 12, marginTop: 12 },
  pendingClientText: { flex: 1, fontSize: 12, color: colors.textDark, lineHeight: 17 , flexShrink: 1 },
  openChatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F8F6F4', paddingVertical: 11, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: colors.border },
  openChatBtnText: { fontSize: 12.5, fontWeight: '700', color: colors.textDark , flexShrink: 1 },
  primaryActionBtn: { flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 12 },
  primaryActionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' , flexShrink: 1 },
  secondaryActionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3EFEA', paddingVertical: 12, borderRadius: 12 },
  secondaryActionText: { color: colors.textDark, fontSize: 12, fontWeight: '700' , flexShrink: 1 },
});
