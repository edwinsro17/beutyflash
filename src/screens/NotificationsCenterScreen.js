/**
 * Archivo: src/screens/NotificationsCenterScreen.js
 * Módulo 3 y Módulo 7: Centro Unificado de Notificaciones
 * - Muestra las notificaciones direccionadas exclusivamente al usuario actual.
 * - Al pulsar una notificación, resuelve la ruta correspondiente (`navegarDesdeNotificacion`)
 *   y abre la pantalla específica validando permisos.
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
  marcarNotificacionesComoLeidas,
  navegarDesdeNotificacion,
  sincronizarEstadoDesdeSupabase,
  useResponsiveLayout,
} from '../theme/colors';

export default function NotificationsCenterScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const rolActivo = sessionStore.activeRoleSession || 'cliente';
  const [notificaciones, setNotificaciones] = useState([]);

  const cargar = () => {
    const lista =
      rolActivo === 'profesional'
        ? sessionStore.notificacionesProfesional
        : sessionStore.notificacionesCliente;
    setNotificaciones([...(lista || [])]);
  };

  useEffect(() => {
    sincronizarEstadoDesdeSupabase(rolActivo).then(cargar);
  }, [rolActivo]);

  const handleMarcarTodas = async () => {
    await marcarNotificacionesComoLeidas(rolActivo);
    cargar();
  };

  const handlePulsarNotificacion = async (notif) => {
    notif.leida = true;
    notif.is_read = true;
    cargar();
    await navegarDesdeNotificacion(notif, navigation);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centro de Notificaciones</Text>
        <TouchableOpacity style={styles.markReadBtn} onPress={handleMarcarTodas}>
          <Feather name="check-circle" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, layout.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBanner}>
          <Feather name="bell" size={15} color={colors.primary} />
          <Text style={styles.infoBannerText}>
            Notificaciones privadas sincronizadas con Supabase Realtime para tu modo actual ({rolActivo.toUpperCase()}). Toca cualquiera para ir a su pantalla de destino.
          </Text>
        </View>

        {notificaciones.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="bell-off" size={28} color={colors.textGray} />
            <Text style={styles.emptyTitle}>No tienes notificaciones pendientes</Text>
            <Text style={styles.emptySub}>
              Recibirás avisos instantáneos cuando cambie el estado de una solicitud, llegue tu profesional o se acredite una recarga en tu billetera.
            </Text>
          </View>
        ) : (
          notificaciones.map((n, idx) => (
            <TouchableOpacity
              key={n.id || idx}
              style={[styles.notifCard, !n.leida && styles.notifCardUnread]}
              onPress={() => handlePulsarNotificacion(n)}
            >
              <View style={styles.notifIcon}>
                <Feather
                  name={n.leida ? 'bell' : 'zap'}
                  size={17}
                  color={n.leida ? colors.textGray : colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.notifTopRow}>
                  <Text style={styles.notifTitle}>{n.titulo || n.title}</Text>
                  <Text style={styles.notifTime}>{n.hora || ''}</Text>
                </View>
                <Text style={styles.notifBody}>{n.mensaje || n.body}</Text>
                <Text style={styles.notifRouteHint}>
                  Destino: {n.target_screen || 'Detalle'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  markReadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark , flexShrink: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 34 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3EFEA',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  infoBannerText: { flex: 1, fontSize: 11.5, color: colors.textDark, lineHeight: 16 , flexShrink: 1 },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.textDark, marginTop: 8 , flexShrink: 1 },
  emptySub: { fontSize: 12, color: colors.textGray, textAlign: 'center', marginTop: 4, lineHeight: 18 , flexShrink: 1 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  notifCardUnread: {
    borderColor: colors.primary,
    backgroundColor: '#FBF8F5',
  },
  notifIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: { flex: 1, fontSize: 13.5, fontWeight: '800', color: colors.textDark , flexShrink: 1 },
  notifTime: { fontSize: 10.5, fontWeight: '700', color: colors.textGray },
  notifBody: { fontSize: 12.5, color: colors.textGray, marginTop: 4, lineHeight: 17 },
  notifRouteHint: { fontSize: 10.5, fontWeight: '800', color: colors.primary, marginTop: 6 },
});
