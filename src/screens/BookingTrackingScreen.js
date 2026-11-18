/**
 * Archivo: src/screens/BookingTrackingScreen.js
 * Módulo 5 y Módulo 6: Pantalla Dedicada de Seguimiento Geográfico en Tiempo Real
 * - Muestra: Ubicación del cliente, Ubicación actual animada del profesional, Ruta recomendada,
 *   Distancia restante, Tiempo estimado de llegada (siempre indicado como estimación) y Estado del desplazamiento.
 * - Privacidad (6.3): Oculta direcciones privadas al profesional antes de que la contratación esté confirmada.
 * - Detección de llegada (6.5): Valida la llegada en el servidor y envía la notificación oficial:
 *   "¡Tu profesional ha llegado! Ya se encuentra en la ubicación indicada".
 * - Inicio del servicio (5.2): Descuenta la Segunda Etapa de Comisión (7%) del saldo prepago del profesional.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  colors,
  sessionStore,
  formatCOP,
  calcularDesgloseComisionEtapas,
  ESTADOS_SOLICITUD_OFICIALES,
  formatearEtiquetaEstado,
  obtenerSolicitudActiva,
  confirmarDefinitivamentePorCliente,
  confirmarLlegadaProfesionalAlDestino,
  actualizarEstadoSolicitudActiva,
  sincronizarEstadoDesdeSupabase,
  useResponsiveLayout,
} from '../theme/colors';
import BeautyFlashMapView from '../components/map/BeautyFlashMapView';
import ValidationModal from '../components/ui/ValidationModal';
import { ChatServicioModal } from '../components/ServiceBookingModal';

export default function BookingTrackingScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const modoActual = sessionStore.activeRoleSession || 'cliente';
  const [activa, setActiva] = useState(obtenerSolicitudActiva());
  const [chatVisible, setChatVisible] = useState(false);
  const [modalAlert, setModalAlert] = useState({
    visible: false,
    variant: 'info',
    title: '',
    message: '',
    showRechargeBtn: false,
  });

  const refrescar = () => {
    const sol = obtenerSolicitudActiva();
    setActiva(sol ? { ...sol } : null);
  };

  useEffect(() => {
    sincronizarEstadoDesdeSupabase(modoActual).then(refrescar);
    const timer = setInterval(async () => {
      await sincronizarEstadoDesdeSupabase(modoActual);
      refrescar();
    }, 2500);
    return () => clearInterval(timer);
  }, [modoActual]);

  if (!activa) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seguimiento en Tiempo Real</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Feather name="map-pin" size={32} color={colors.textGray} />
          <Text style={styles.emptyTitle}>No hay un desplazamiento activo</Text>
          <Text style={styles.emptySub}>
            El seguimiento GPS se activa exclusivamente durante una contratación confirmada y se detiene al finalizar o cancelar el servicio.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const desglose = calcularDesgloseComisionEtapas(activa.precio_total_cop);
  const estaConfirmadaOActiva = [
    ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE,
    ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO,
    ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO,
  ].includes(activa.estado);

  // Regla 6.3: No mostrar dirección privada al profesional antes de que el cliente confirme la contratación
  const direccionSegura =
    modoActual === 'profesional' && !estaConfirmadaOActiva
      ? 'Dirección protegida (visible una vez que el cliente confirme la contratación)'
      : activa.direccion_servicio;

  const handleConfirmarClienteEtapa1 = async () => {
    const res = await confirmarDefinitivamentePorCliente();
    if (res?.bloqueadoPorSaldo) {
      setModalAlert({
        visible: true,
        variant: 'insufficient_balance',
        title: 'Saldo insuficiente para comisión (3%)',
        message: res.detallesSaldo?.mensaje || 'El profesional requiere recargar su billetera.',
        showRechargeBtn: modoActual === 'profesional',
      });
      return;
    }
    refrescar();
  };

  const handleAvanzarRutaGPS = async () => {
    await actualizarEstadoSolicitudActiva(ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO);
    refrescar();
  };

  const handleConfirmarLlegada = async () => {
    await confirmarLlegadaProfesionalAlDestino({ confirmacionAdicional: true });
    refrescar();
    setModalAlert({
      visible: true,
      variant: 'success',
      title: 'Llegada registrada en el servidor',
      message:
        'Se notificó al cliente: "¡Tu profesional ha llegado! Ya se encuentra en la ubicación indicada".',
      showRechargeBtn: false,
    });
  };

  const handleIniciarServicioEtapa2 = async () => {
    const res = await actualizarEstadoSolicitudActiva(
      ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO
    );
    if (res?.bloqueadoPorSaldo) {
      setModalAlert({
        visible: true,
        variant: 'insufficient_balance',
        title: 'Saldo insuficiente para Etapa 2 (7%)',
        message:
          res.detallesSaldo?.mensaje ||
          'No tienes saldo suficiente para cubrir el 7% restante de la comisión al iniciar el servicio.',
        showRechargeBtn: true,
      });
      return;
    }
    refrescar();
  };

  const handleFinalizarServicio = async () => {
    await actualizarEstadoSolicitudActiva(ESTADOS_SOLICITUD_OFICIALES.FINALIZADA);
    refrescar();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={colors.textDark} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Seguimiento #{activa.codigo_reserva}</Text>
          <Text style={styles.headerSub}>
            {formatearEtiquetaEstado(activa.estado).toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => setChatVisible(true)}>
          <Feather name="message-square" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <BeautyFlashMapView solicitud={activa} fullScreen />
      </View>

      <ScrollView
        style={styles.bottomSheet}
        contentContainerStyle={[styles.sheetContent, layout.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {activa.llegada_confirmada ? (
          <View style={styles.arrivedAlert}>
            <Feather name="check-circle" size={18} color="#1E824C" />
            <Text style={styles.arrivedAlertText}>
              ¡Tu profesional ha llegado! Ya se encuentra en la ubicación indicada.
            </Text>
          </View>
        ) : null}

        <View style={styles.etaRow}>
          <View style={styles.etaBox}>
            <Text style={styles.etaLabel}>DISTANCIA RESTANTE</Text>
            <Text style={styles.etaValue}>
              {activa.llegada_confirmada
                ? '0 m (En punto)'
                : `${activa.distancia_estimada_km ?? 0.5} km`}
            </Text>
          </View>
          <View style={styles.etaBox}>
            <Text style={styles.etaLabel}>TIEMPO ESTIMADO DE LLEGADA</Text>
            <Text style={styles.etaValue}>
              {activa.llegada_confirmada
                ? 'En ubicación'
                : `~${activa.tiempo_estimado_minutos ?? 4} min (Estimación)`}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.serviceTitle}>{activa.servicio_nombre}</Text>
          <Text style={styles.addressText}>Destino: {direccionSegura}</Text>
          <Text style={styles.commissionBreakdownText}>
            Valor: {formatCOP(activa.precio_total_cop)} COP • Comisión 10% ({formatCOP(desglose.comision_total_cop)}): 3% confirmación ({formatCOP(desglose.comision_etapa1_cop)}) + 7% inicio ({formatCOP(desglose.comision_etapa2_cop)})
          </Text>
        </View>

        {/* Controles según estado y rol */}
        {(activa.estado === ESTADOS_SOLICITUD_OFICIALES.ACEPTADA_POR_PRO ||
          activa.estado === ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_CONFIRMACION_CLIENTE) && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#1E824C' }]}
            onPress={handleConfirmarClienteEtapa1}
          >
            <Feather name="check-circle" size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>
              Confirmar Contratación (Etapa 1: 3% = {formatCOP(desglose.comision_etapa1_cop)})
            </Text>
          </TouchableOpacity>
        )}

        {estaConfirmadaOActiva && activa.estado !== ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO ? (
          <View style={styles.controlsGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={handleAvanzarRutaGPS}
            >
              <Feather name="navigation" size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>
                Emitir Desplazamiento GPS en Tiempo Real
              </Text>
            </TouchableOpacity>

            {!activa.llegada_confirmada ? (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                onPress={handleConfirmarLlegada}
              >
                <Feather name="map-pin" size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>
                  Confirmar Llegada al Destino (Validar en Servidor)
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#1E824C' }]}
              onPress={handleIniciarServicioEtapa2}
            >
              <Feather name="play" size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>
                Confirmar Inicio del Servicio (Etapa 2: 7% = {formatCOP(desglose.comision_etapa2_cop)})
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {activa.estado === ESTADOS_SOLICITUD_OFICIALES.EN_SERVICIO ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#1E824C' }]}
            onPress={handleFinalizarServicio}
          >
            <Feather name="award" size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Finalizar Servicio Completado</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <ChatServicioModal
        visible={chatVisible}
        solicitud={activa}
        rolActual={modoActual}
        onClose={() => setChatVisible(false)}
      />

      <ValidationModal
        visible={modalAlert.visible}
        variant={modalAlert.variant}
        title={modalAlert.title}
        message={modalAlert.message}
        primaryText={modalAlert.showRechargeBtn ? 'Ir a Recargar Saldo' : 'Entendido'}
        onPrimaryPress={() => {
          setModalAlert((prev) => ({ ...prev, visible: false }));
          if (modalAlert.showRechargeBtn) {
            navigation.navigate('WalletRecharge');
          }
        }}
        secondaryText={modalAlert.showRechargeBtn ? 'Cerrar' : null}
        onClose={() => setModalAlert((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '900', color: colors.textDark , flexShrink: 1 },
  headerSub: { fontSize: 10, fontWeight: '800', color: colors.primary, marginTop: 1 , flexShrink: 1 },
  mapContainer: { flex: 1, minHeight: 260 },
  bottomSheet: {
    maxHeight: 330,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sheetContent: { padding: 16, paddingBottom: 26 },
  arrivedAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F6EF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  arrivedAlertText: { flex: 1, fontSize: 12.5, fontWeight: '800', color: '#1E824C' , flexShrink: 1 },
  etaRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  etaBox: {
    flex: 1,
    backgroundColor: '#F8F6F4',
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  etaLabel: { fontSize: 9.5, fontWeight: '800', color: colors.textGray , flexShrink: 1 },
  etaValue: { fontSize: 13.5, fontWeight: '900', color: colors.textDark, marginTop: 3 },
  infoCard: {
    backgroundColor: '#F8F6F4',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  serviceTitle: { fontSize: 14.5, fontWeight: '800', color: colors.textDark , flexShrink: 1 },
  addressText: { fontSize: 12, color: colors.textGray, marginTop: 3 , flexShrink: 1 },
  commissionBreakdownText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 6,
    lineHeight: 16,
  flexShrink: 1 },
  controlsGrid: { gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' , flexShrink: 1 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark, marginTop: 10 , flexShrink: 1 },
  emptySub: { fontSize: 13, color: colors.textGray, textAlign: 'center', marginTop: 6, lineHeight: 19 , flexShrink: 1 },
});
