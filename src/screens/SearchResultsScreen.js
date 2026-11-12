/**
 * Archivo: src/screens/SearchResultsScreen.js
 * Seguimiento de Solicitudes y Conversaciones del Cliente:
 * - Permite confirmar definitivamente la solicitud cuando el profesional la ha aceptado.
 * - Muestra estados vacíos elegantes si no hay registros en la base de datos.
 * - Cero emojis.
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
import { WebView } from 'react-native-webview';
import {
  colors,
  sessionStore,
  formatCOP,
  ESTADOS_SOLICITUD_OFICIALES,
  formatearEtiquetaEstado,
  obtenerSolicitudActiva,
  confirmarDefinitivamentePorCliente,
  actualizarEstadoSolicitudActiva,
  generarHtmlMapaUber,
  sincronizarEstadoDesdeSupabase,
  useResponsiveLayout,
} from '../theme/colors';
import BottomMenu from '../components/BottomMenu';
import { ChatServicioModal } from '../components/ServiceBookingModal';

export default function SearchResultsScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const [subTab, setSubTab] = useState('activa');
  const [activa, setActiva] = useState(obtenerSolicitudActiva());
  const [citas, setCitas] = useState([...sessionStore.citasAgendadas]);
  const [historial, setHistorial] = useState([...sessionStore.historialCompletadas]);
  const [chatVisible, setChatVisible] = useState(false);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitudes y Seguimiento</Text>
        <View style={{ width: 40 }} />
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
                  Cuando realices una solicitud de servicio, podrás consultar su estado, mapa y conversación aquí.
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

                {/* PASO 4: Confirmación definitiva por parte del cliente */}
                {(activa.estado === ESTADOS_SOLICITUD_OFICIALES.ACEPTADA_POR_PRO ||
                  activa.estado ===
                    ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_CONFIRMACION_CLIENTE) && (
                  <View style={styles.confirmBox}>
                    <Text style={styles.confirmBoxTitle}>
                      El profesional aceptó tu solicitud
                    </Text>
                    <Text style={styles.confirmBoxDesc}>
                      Confirma definitivamente la solicitud para activar el servicio y el seguimiento en tiempo real.
                    </Text>
                    <TouchableOpacity
                      style={styles.confirmBtn}
                      onPress={async () => {
                        await confirmarDefinitivamentePorCliente();
                        refrescar();
                      }}
                    >
                      <Feather name="check-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.confirmBtnText}>
                        Confirmar Definitivamente la Solicitud
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.mapBox}>
                  <WebView
                    key={`${activa.id}-${activa.estado}-${activa.progreso_ruta}`}
                    originWhitelist={['*']}
                    source={{
                      html: generarHtmlMapaUber({
                        solicitud: activa,
                        vista: 'cliente',
                      }),
                    }}
                    style={{ width: '100%', height: '100%' }}
                    scrollEnabled={false}
                  />
                </View>

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
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 14 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EBE6E0',
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: colors.primary },
  tabBtnText: { fontSize: 11.5, fontWeight: '700', color: colors.textDark },
  scroll: { paddingBottom: 30 },
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.textDark, marginTop: 8 },
  emptySub: { fontSize: 12.5, color: colors.textGray, textAlign: 'center', marginTop: 4 },
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
  priceText: { fontSize: 14, fontWeight: '800', color: colors.primary, marginTop: 4 },
  confirmBox: {
    backgroundColor: '#E8F6EF',
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
  },
  confirmBoxTitle: { fontSize: 13.5, fontWeight: '800', color: '#1E824C' },
  confirmBoxDesc: { fontSize: 12, color: colors.textDark, marginVertical: 6, lineHeight: 17 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E824C',
    paddingVertical: 12,
    borderRadius: 10,
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  mapBox: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  chatBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  cancelBtn: {
    backgroundColor: '#FDEDEC',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: { color: '#C0392B', fontSize: 12.5, fontWeight: '700' },
});
