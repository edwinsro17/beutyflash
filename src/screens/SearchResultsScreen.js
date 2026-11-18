/**
 * Archivo: src/screens/SearchResultsScreen.js
 * Seguimiento de Solicitudes y Conversaciones del Cliente:
 * - Permite confirmar definitivamente la solicitud cuando el profesional la ha aceptado (activa Etapa 1 de comisión 3%).
 * - Acceso directo al Mapa de Seguimiento en Tiempo Real (`BookingTracking`).
 * - Usa `BeautyFlashMapView` nativo (cero `WebView` / `generarHtmlMapaUber`).
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  colors,
  sessionStore,
  formatCOP,
  ESTADOS_SOLICITUD_OFICIALES,
  formatearEtiquetaEstado,
  obtenerSolicitudActiva,
  confirmarDefinitivamentePorCliente,
  actualizarEstadoSolicitudActiva,
  sincronizarEstadoDesdeSupabase,
  useResponsiveLayout,
} from '../theme/colors';
import BottomMenu from '../components/BottomMenu';
import BeautyFlashMapView from '../components/map/BeautyFlashMapView';
import ValidationModal from '../components/ui/ValidationModal';
import { ChatServicioModal } from '../components/ServiceBookingModal';

export default function SearchResultsScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const [subTab, setSubTab] = useState('activa');
  const [activa, setActiva] = useState(obtenerSolicitudActiva());
  const [citas, setCitas] = useState([...sessionStore.citasAgendadas]);
  const [historial, setHistorial] = useState([...sessionStore.historialCompletadas]);
  const [chatVisible, setChatVisible] = useState(false);
  const [modalAlert, setModalAlert] = useState({ visible: false, variant: 'info', title: '', message: '' });

  const refrescar = () => {
    const act = obtenerSolicitudActiva();
    setActiva(act ? { ...act } : null);
    setCitas([...sessionStore.citasAgendadas]);
    setHistorial([...sessionStore.historialCompletadas]);
  };

  useEffect(() => {
    sincronizarEstadoDesdeSupabase('cliente').then(refrescar);
    const interval = setInterval(async () => {
      await sincronizarEstadoDesdeSupabase('cliente');
      refrescar();
    }, 2500);
    const unsub = navigation.addListener('focus', refrescar);
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [navigation]);

  const handleConfirmarDefinitivamente = async () => {
    const res = await confirmarDefinitivamentePorCliente();
    if (res?.bloqueadoPorSaldo) {
      setModalAlert({
        visible: true,
        variant: 'insufficient_balance',
        title: 'El profesional requiere recargar saldo',
        message:
          res.detallesSaldo?.mensaje ||
          'El profesional no cuenta con saldo suficiente para cubrir la primera etapa de comisión (3%).',
      });
      return;
    }
    refrescar();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitudes y Seguimiento</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('NotificationsCenter')}
          style={styles.backBtn}
        >
          <Feather name="bell" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, subTab === 'activa' && styles.tabBtnActive]}
          onPress={() => setSubTab('activa')}
        >
          <Text style={[styles.tabBtnText, subTab === 'activa' && { color: '#FFFFFF' }]}>
            Activa ({activa ? '1' : '0'})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, subTab === 'citas' && styles.tabBtnActive]}
          onPress={() => setSubTab('citas')}
        >
          <Text style={[styles.tabBtnText, subTab === 'citas' && { color: '#FFFFFF' }]}>
            Salón ({citas.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, subTab === 'historial' && styles.tabBtnActive]}
          onPress={() => setSubTab('historial')}
        >
          <Text style={[styles.tabBtnText, subTab === 'historial' && { color: '#FFFFFF' }]}>
            Historial ({historial.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, layout.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {subTab === 'activa' && (
          <>
            {!activa ? (
              <View style={styles.emptyBox}>
                <Feather name="inbox" size={28} color={colors.textGray} />
                <Text style={styles.emptyTitle}>No tienes solicitudes pendientes.</Text>
                <Text style={styles.emptySub}>
                  Cuando realices una solicitud de servicio, podrás consultar su estado, mapa en vivo y conversación aquí.
                </Text>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.code}>
                  SOLICITUD #{activa.codigo_reserva} •{' '}
                  {formatearEtiquetaEstado(activa.estado).toUpperCase()}
                </Text>
                <Text style={styles.title}>{activa.servicio_nombre}</Text>
                <Text style={styles.subInfo}>
                  Profesional: {activa.profesional_nombre} • {formatCOP(activa.precio_total_cop)} COP
                </Text>

                {activa.llegada_confirmada ? (
                  <View style={styles.arrivalBanner}>
                    <Feather name="map-pin" size={16} color="#1E824C" />
                    <Text style={styles.arrivalBannerText}>
                      ¡Tu profesional ha llegado! Ya se encuentra en la ubicación indicada.
                    </Text>
                  </View>
                ) : null}

                {(activa.estado === ESTADOS_SOLICITUD_OFICIALES.ACEPTADA_POR_PRO ||
                  activa.estado ===
                    ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_CONFIRMACION_CLIENTE) && (
                  <View style={styles.confirmBox}>
                    <Text style={styles.confirmBoxTitle}>
                      El profesional aceptó tu solicitud
                    </Text>
                    <Text style={styles.confirmBoxDesc}>
                      Confirma definitivamente la contratación para activar el servicio y el seguimiento GPS en tiempo real.
                    </Text>
                    <TouchableOpacity
                      style={styles.confirmBtn}
                      onPress={handleConfirmarDefinitivamente}
                    >
                      <Feather name="check-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.confirmBtnText}>
                        Confirmar Definitivamente la Contratación
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.mapBox}>
                  <BeautyFlashMapView solicitud={activa} height={250} />
                </View>

                <TouchableOpacity
                  style={styles.trackingFullBtn}
                  onPress={() =>
                    navigation.navigate('BookingTracking', {
                      codigo_reserva: activa.codigo_reserva,
                    })
                  }
                >
                  <Feather name="navigation" size={16} color="#FFFFFF" />
                  <Text style={styles.chatBtnText}>
                    Abrir Mapa de Seguimiento en Tiempo Real
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.chatBtn}
                  onPress={() => setChatVisible(true)}
                >
                  <Feather name="message-square" size={16} color="#FFFFFF" />
                  <Text style={styles.chatBtnText}>
                    Abrir conversación ({(activa.mensajes_chat || []).length})
                  </Text>
                </TouchableOpacity>

                {activa.estado === ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_ACEPTACION_PRO && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={async () => {
                      await actualizarEstadoSolicitudActiva(
                        ESTADOS_SOLICITUD_OFICIALES.CANCELADA
                      );
                      refrescar();
                    }}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar Solicitud</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

        {subTab === 'citas' &&
          (citas.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="calendar" size={28} color={colors.textGray} />
              <Text style={styles.emptyTitle}>No tienes solicitudes en salón.</Text>
            </View>
          ) : (
            citas.map((c, idx) => (
              <View key={c.id || idx} style={styles.card}>
                <Text style={styles.code}>
                  #{c.codigo_reserva} • {c.fecha_programada} ({c.hora_programada})
                </Text>
                <Text style={styles.title}>{c.servicio_nombre}</Text>
                <Text style={styles.subInfo}>Profesional: {c.profesional_nombre}</Text>
                <Text style={styles.priceText}>{formatCOP(c.precio_total_cop)} COP</Text>
              </View>
            ))
          ))}

        {subTab === 'historial' &&
          (historial.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="clock" size={28} color={colors.textGray} />
              <Text style={styles.emptyTitle}>Todavía no hay historial de servicios.</Text>
            </View>
          ) : (
            historial.map((h, idx) => (
              <View key={h.id || idx} style={styles.card}>
                <Text style={styles.code}>
                  #{h.codigo_reserva} • {formatearEtiquetaEstado(h.estado).toUpperCase()}
                </Text>
                <Text style={styles.title}>{h.servicio_nombre}</Text>
                <Text style={styles.subInfo}>Profesional: {h.profesional_nombre}</Text>
                <Text style={styles.priceText}>{formatCOP(h.precio_total_cop)} COP</Text>
              </View>
            ))
          ))}
      </ScrollView>

      <ChatServicioModal
        visible={chatVisible}
        solicitud={activa}
        rolActual="cliente"
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
        onClose={() => setModalAlert({ ...modalAlert, visible: false })}
      />

      <BottomMenu activeTab="Reservas" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark , flexShrink: 1 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 14 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EBE6E0',
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: colors.primary },
  tabBtnText: { fontSize: 11.5, fontWeight: '700', color: colors.textDark , flexShrink: 1 },
  scroll: { paddingBottom: 30 },
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.textDark, marginTop: 8 , flexShrink: 1 },
  emptySub: { fontSize: 12.5, color: colors.textGray, textAlign: 'center', marginTop: 4 , flexShrink: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  code: { fontSize: 10.5, fontWeight: '800', color: colors.primary, marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  subInfo: { fontSize: 12.5, color: colors.textGray, marginVertical: 4 },
  priceText: { fontSize: 14, fontWeight: '800', color: colors.primary, marginTop: 4 , flexShrink: 1 },
  arrivalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F6EF',
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  arrivalBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E824C',
  flexShrink: 1 },
  confirmBox: {
    backgroundColor: '#E8F6EF',
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
  },
  confirmBoxTitle: { fontSize: 13.5, fontWeight: '800', color: '#1E824C' , flexShrink: 1 },
  confirmBoxDesc: { fontSize: 12, color: colors.textDark, marginVertical: 6, lineHeight: 17 , flexShrink: 1 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E824C',
    paddingVertical: 12,
    borderRadius: 10,
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' , flexShrink: 1 },
  mapBox: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trackingFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  chatBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' , flexShrink: 1 },
  cancelBtn: {
    backgroundColor: '#FDEDEC',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: { color: '#C0392B', fontSize: 12.5, fontWeight: '700' , flexShrink: 1 },
});
