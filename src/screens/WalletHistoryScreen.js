/**
 * Archivo: src/screens/WalletHistoryScreen.js
 * Módulo 4.4 y Sección 5: Historial de Movimientos Financieros Conservado
 * - Permite identificar y consultar:
 *   1. Recarga aprobada (`recarga` / `RECHARGE`)
 *   2. Débito por comisión o porcentaje de servicio (`comision_etapa1_3pct` / `comision_etapa2_7pct`)
 *   3. Reversión por anulación de recarga (`reversion_anulacion_recarga` / `RECHARGE_VOID_REVERSAL` / `VOIDED`)
 *   4. Ajustes administrativos y devoluciones (`reembolso_comision` / `ajuste_administrativo`)
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
  sincronizarBilleteraDesdeSupabase,
  useResponsiveLayout,
} from '../theme/colors';

export default function WalletHistoryScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const [filtro, setFiltro] = useState('todos');
  const [movimientos, setMovimientos] = useState([...(sessionStore.wallet.transacciones || [])]);

  useEffect(() => {
    sincronizarBilleteraDesdeSupabase().then(() => {
      setMovimientos([...(sessionStore.wallet.transacciones || [])]);
    });
  }, []);

  const filtrados = movimientos.filter((m) => {
    const tipoStr = String(m.tipo || m.type || '').toLowerCase();
    const estadoStr = String(m.estado || m.status || '').toUpperCase();
    if (filtro === 'todos') return true;
    if (filtro === 'recargas') return tipoStr === 'recarga' || tipoStr === 'recharge';
    if (filtro === 'comisiones') return tipoStr.includes('comision') || tipoStr.includes('commission');
    if (filtro === 'anulaciones')
      return (
        tipoStr.includes('anulacion') ||
        tipoStr.includes('void') ||
        estadoStr === 'VOIDED' ||
        estadoStr === 'REVERSED'
      );
    return true;
  });

  const obtenerEstiloEstado = (estado = 'APPROVED', tipo = '') => {
    const st = String(estado).toUpperCase();
    const tp = String(tipo).toLowerCase();
    if (st === 'VOIDED' || st === 'REVERSED' || tp.includes('anulacion') || tp.includes('void')) {
      return { bg: '#F4ECF7', text: '#8E44AD', label: 'ANULADA (VOIDED)' };
    }
    if (st === 'APPROVED') return { bg: '#E8F6EF', text: '#1E824C', label: 'APROBADO' };
    if (st === 'PENDING') return { bg: '#FEF5E7', text: '#D68910', label: 'PENDIENTE' };
    return { bg: '#FDEDEC', text: '#C0392B', label: st || 'RECHAZADO' };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Movimientos</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filtersRow}>
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'recargas', label: 'Recargas' },
          { id: 'comisiones', label: 'Comisiones' },
          { id: 'anulaciones', label: 'Anulaciones' },
        ].map((f) => {
          const active = filtro === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setFiltro(f.id)}
            >
              <Text style={[styles.filterPillText, active && { color: '#FFFFFF' }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, layout.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {filtrados.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="inbox" size={28} color={colors.textGray} />
            <Text style={styles.emptyTitle}>Sin movimientos en esta categoría</Text>
            <Text style={styles.emptySub}>
              Aquí se conservan todas tus recargas aprobadas, comisiones descontadas y reversiones por anulación de recarga sin borrar ningún registro previo.
            </Text>
          </View>
        ) : (
          filtrados.map((tx, idx) => {
            const positivo = tx.signo > 0;
            const stStyle = obtenerEstiloEstado(tx.estado || tx.status, tx.tipo || tx.type);
            return (
              <TouchableOpacity
                key={tx.id || tx.referencia || idx}
                style={styles.txCard}
                onPress={() => navigation.navigate('WalletTxDetail', { transaction: tx })}
              >
                <View style={styles.txTopRow}>
                  <View style={[styles.statusBadge, { backgroundColor: stStyle.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: stStyle.text }]}>
                      {stStyle.label}
                    </Text>
                  </View>
                  <Text style={styles.refText}>Ref: {tx.referencia || tx.id}</Text>
                </View>

                <View style={styles.txMainRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txTitle}>{tx.descripcion}</Text>
                    <Text style={styles.txDate}>
                      {tx.creado_en} • Saldo posterior: {formatCOP(tx.saldo_posterior_cop)}
                    </Text>
                    {tx.referencia_original ? (
                      <Text style={styles.txLinkRef}>
                        Recarga original asociada: {tx.referencia_original}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: positivo ? '#1E824C' : '#C0392B' },
                    ]}
                  >
                    {positivo ? '+' : '-'}
                    {formatCOP(tx.monto_cop)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
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
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark, flexShrink: 1 },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 6,
    marginBottom: 12,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#EBE6E0',
    alignItems: 'center',
  },
  filterPillActive: { backgroundColor: colors.primary },
  filterPillText: { fontSize: 11, fontWeight: '700', color: colors.textDark, flexShrink: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 34 },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.textDark, marginTop: 8, flexShrink: 1 },
  emptySub: { fontSize: 12, color: colors.textGray, textAlign: 'center', marginTop: 4, lineHeight: 18, flexShrink: 1 },
  txCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 9.5, fontWeight: '800', flexShrink: 1 },
  refText: { fontSize: 10.5, fontWeight: '700', color: colors.textGray, flexShrink: 1 },
  txMainRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txTitle: { fontSize: 13, fontWeight: '800', color: colors.textDark, flexShrink: 1 },
  txDate: { fontSize: 11, color: colors.textGray, marginTop: 3 },
  txLinkRef: { fontSize: 10.5, fontWeight: '700', color: '#8E44AD', marginTop: 3 },
  txAmount: { fontSize: 15, fontWeight: '900' },
});
