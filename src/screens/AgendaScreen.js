/**
 * Archivo: src/screens/AgendaScreen.js
 * Agenda del Profesional donde SOLO aparecen las citas reales que los clientes
 * han agendado con él, además de mostrar su horario de atención configurado.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, sessionStore, formatCOP, useResponsiveLayout, sincronizarEstadoDesdeSupabase } from '../theme/colors';
import { ProBottomNav } from './BilleteraScreen';

export default function AgendaScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const pro = sessionStore.proUser;
  const [citas, setCitas] = useState([...sessionStore.citasAgendadas]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      setCitas([...sessionStore.citasAgendadas]);
    });
    return unsub;
  }, [navigation]);

  const cancelarCita = (id) => {
    sessionStore.citasAgendadas = sessionStore.citasAgendadas.filter((c) => c.id !== id);
    setCitas([...sessionStore.citasAgendadas]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mi Agenda de Citas Reservadas</Text>
          <Text style={styles.headerSub}>
            Horario establecimiento: {pro.horario_atencion?.dias} ({pro.horario_atencion?.apertura} -{' '}
            {pro.horario_atencion?.cierre})
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, layout.contentContainerStyle]} showsVerticalScrollIndicator={false}>
        <View style={styles.scheduleBanner}>
          <Feather name="clock" size={16} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.scheduleTitle}>
              Bloques habilitados en {pro.nombre_establecimiento || 'tu Salón'}:
            </Text>
            <Text style={styles.scheduleSub}>
              {(pro.horario_atencion?.bloques_disponibles || []).join(' • ')}
            </Text>
          </View>
        </View>

        <Text style={styles.secLabel}>
          CITAS AGENDADAS POR LOS CLIENTES CONMIGO ({citas.length})
        </Text>

        {citas.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="calendar" size={32} color={colors.primary} />
            <Text style={styles.emptyTitle}>Aún no tienes citas agendadas</Text>
            <Text style={styles.emptySub}>
              En esta agenda únicamente aparecen las citas que los clientes reserven contigo verificando tu disponibilidad de horario.
            </Text>
          </View>
        ) : (
          citas.map((c) => (
            <View key={c.id} style={styles.citaCard}>
              <View style={styles.topRow}>
                <Text style={styles.code}>
                  CITA #{c.codigo_reserva} • {c.estado.toUpperCase()}
                </Text>
                <Text style={styles.dateBadge}>
                   {c.fecha_programada} •  {c.hora_programada}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
                {c.servicio_foto && (
                  <Image source={{ uri: c.servicio_foto }} style={styles.srvThumb} />
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.title}>{c.servicio_nombre}</Text>
                  <Text style={styles.meta}>
                    Cliente: {c.cliente_nombre} ({c.cliente_telefono})
                  </Text>
                  <Text style={styles.meta}> {c.nombre_establecimiento}</Text>
                </View>
              </View>
              <View style={styles.footerRow}>
                <Text style={styles.price}>
                  Valor: {formatCOP(c.precio_total_cop)} COP
                </Text>
                <TouchableOpacity onPress={() => cancelarCita(c.id)}>
                  <Text style={styles.cancelLink}>Liberar Horario</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <ProBottomNav navigation={navigation} active="Agenda" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: colors.textDark },
  headerSub: { fontSize: 11.5, color: colors.textGray, marginTop: 2 },
  scroll: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 36 },
  scheduleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECE7',
    padding: 13,
    borderRadius: 14,
    marginBottom: 16,
  },
  scheduleTitle: { fontSize: 12, fontWeight: '800', color: colors.primary },
  scheduleSub: { fontSize: 11.5, color: colors.textDark, marginTop: 2 },
  secLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textGray,
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark, marginTop: 10 },
  emptySub: {
    fontSize: 12.5,
    color: colors.textGray,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
  citaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  code: { fontSize: 10.5, fontWeight: '800', color: '#1E824C' },
  dateBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: '#FDECE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  srvThumb: { width: 54, height: 54, borderRadius: 12 },
  title: { fontSize: 15, fontWeight: '800', color: colors.textDark },
  meta: { fontSize: 12, color: colors.textGray, marginTop: 2 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 4,
  },
  price: { fontSize: 14.5, fontWeight: '900', color: colors.primary },
  cancelLink: { fontSize: 12, fontWeight: '800', color: '#C0392B' },
});
