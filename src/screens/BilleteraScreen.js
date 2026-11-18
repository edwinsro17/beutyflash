/**
 * Archivo: src/screens/BilleteraScreen.js
 * Módulo 4.1: Pantalla Principal de Billetera del Profesional
 * - Muestra: Saldo disponible (prepago), Botón recargar saldo, Total de comisiones descontadas (3% + 7%),
 *   Estado de la billetera, Últimas recargas e Historial de movimientos.
 * - Exclusiva del perfil profesional (el cliente no requiere billetera).
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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  sessionStore,
  formatCOP,
  sincronizarBilleteraDesdeSupabase,
  useResponsiveLayout,
} from '../theme/colors';

export default function BilleteraScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const [wallet, setWallet] = useState({ ...sessionStore.wallet });

  const refrescar = async () => {
    await sincronizarBilleteraDesdeSupabase();
    setWallet({
      ...sessionStore.wallet,
      transacciones: [...(sessionStore.wallet.transacciones || [])],
    });
  };

  useEffect(() => {
    refrescar();
    const unsub = navigation.addListener('focus', refrescar);
    return unsub;
  }, [navigation]);

  const saldo = Number(wallet.saldo_disponible_cop) || 0;
  const totalRecargado = Number(wallet.total_recargado_cop) || 0;
  const totalComisiones = Number(wallet.total_comisiones_pagadas_cop) || 0;
  const transacciones = wallet.transacciones || [];
  const ultimasRecargas = transacciones.filter((t) => t.tipo === 'recarga').slice(0, 3);
  const ultimosMovimientos = transacciones.slice(0, 5);

  const estadoActiva = saldo >= 5000;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Billetera del Profesional</Text>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: estadoActiva ? '#E8F6EF' : '#FDEDEC' },
          ]}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              color: estadoActiva ? '#1E824C' : '#C0392B',
            }}
          >
            {estadoActiva ? 'Billetera Activa' : 'Saldo Bajo (< $5.000)'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, layout.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta Principal de Saldo Disponible */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeaderRow}>
            <Text style={styles.balanceLabel}>SALDO PREPAGO DISPONIBLE (COP)</Text>
            <View style={styles.wompiBadge}>
              <Feather name="shield" size={11} color="#FFFFFF" />
              <Text style={styles.wompiBadgeText}>WOMPI SANDBOX</Text>
            </View>
          </View>

          <Text style={styles.balanceAmount}>{formatCOP(saldo)} COP</Text>
          <Text style={styles.balanceRule}>
            Comisión total por servicio: 10% (3% al confirmar contratación + 7% al iniciar el servicio)
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.rechargeMainBtn}
              onPress={() => navigation.navigate('WalletRecharge')}
            >
              <Feather name="plus-circle" size={16} color="#FFFFFF" />
              <Text style={styles.rechargeMainBtnText}>Recargar Saldo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.historyOutlineBtn}
              onPress={() => navigation.navigate('WalletHistory')}
            >
              <Feather name="list" size={16} color="#FFFFFF" />
              <Text style={styles.historyOutlineBtnText}>Historial</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Indicadores Contables (Separación de saldo prepago y comisiones descontadas) */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Feather name="arrow-down-left" size={18} color="#1E824C" />
            <Text style={styles.metricTitle}>Total Recargado</Text>
            <Text style={[styles.metricValue, { color: '#1E824C' }]}>
              {formatCOP(totalRecargado)}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Feather name="percent" size={18} color="#C0392B" />
            <Text style={styles.metricTitle}>Comisiones Descontadas</Text>
            <Text style={[styles.metricValue, { color: '#C0392B' }]}>
              {formatCOP(totalComisiones)}
            </Text>
          </View>
        </View>

        {/* Últimas Recargas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ÚLTIMAS RECARGAS (WOMPI SANDBOX)</Text>
          <TouchableOpacity onPress={() => navigation.navigate('WalletRecharge')}>
            <Text style={styles.sectionLink}>Nueva recarga</Text>
          </TouchableOpacity>
        </View>

        {ultimasRecargas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="credit-card" size={22} color={colors.textGray} />
            <Text style={styles.emptyText}>
              Aún no has realizado recargas. Recarga desde $10.000 COP con Wompi Sandbox.
            </Text>
          </View>
        ) : (
          ultimasRecargas.map((rec) => (
            <TouchableOpacity
              key={rec.id || rec.referencia}
              style={styles.txRow}
              onPress={() => navigation.navigate('WalletTxDetail', { transaction: rec })}
            >
              <View style={[styles.txIcon, { backgroundColor: '#E8F6EF' }]}>
                <Feather name="plus" size={16} color="#1E824C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txDesc}>{rec.descripcion}</Text>
                <Text style={styles.txMeta}>
                  Ref: {rec.referencia} • {rec.creado_en}
                </Text>
              </View>
              <Text style={[styles.txAmount, { color: '#1E824C' }]}>
                +{formatCOP(rec.monto_cop)}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {/* Historial Reciente de Movimientos */}
        <View style={[styles.sectionHeader, { marginTop: 14 }]}>
          <Text style={styles.sectionTitle}>MOVIMIENTOS RECIENTES</Text>
          <TouchableOpacity onPress={() => navigation.navigate('WalletHistory')}>
            <Text style={styles.sectionLink}>Ver todo ({transacciones.length})</Text>
          </TouchableOpacity>
        </View>

        {ultimosMovimientos.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="activity" size={22} color={colors.textGray} />
            <Text style={styles.emptyText}>
              Aquí aparecerán tus recargas, comisiones (3% y 7%) y devoluciones.
            </Text>
          </View>
        ) : (
          ultimosMovimientos.map((tx) => {
            const positivo = tx.signo > 0;
            return (
              <TouchableOpacity
                key={tx.id || tx.referencia}
                style={styles.txRow}
                onPress={() => navigation.navigate('WalletTxDetail', { transaction: tx })}
              >
                <View
                  style={[
                    styles.txIcon,
                    { backgroundColor: positivo ? '#E8F6EF' : '#FDEDEC' },
                  ]}
                >
                  <Feather
                    name={positivo ? 'arrow-down-left' : 'arrow-up-right'}
                    size={16}
                    color={positivo ? '#1E824C' : '#C0392B'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txDesc}>{tx.descripcion}</Text>
                  <Text style={styles.txMeta}>
                    {tx.creado_en} • Saldo posterior: {formatCOP(tx.saldo_posterior_cop)}
                  </Text>
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
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <ProBottomNav navigation={navigation} active="Billetera" />
    </SafeAreaView>
  );
}

export function ProBottomNav({ navigation, active }) {
  const noLeidas = (sessionStore.notificacionesProfesional || []).filter((n) => !n.leida).length;
  const navItems = [
    { id: 'ProDashboard', icon: 'view-grid', iconType: 'material', label: 'Solicitudes', badge: noLeidas },
    { id: 'Agenda', icon: 'calendar', iconType: 'feather', label: 'Agenda' },
    { id: 'Servicios', icon: 'flower-outline', iconType: 'material', label: 'Catálogo' },
    { id: 'Billetera', icon: 'credit-card', iconType: 'feather', label: 'Billetera' },
    { id: 'MiPerfil', icon: 'briefcase', iconType: 'feather', label: 'Mi Perfil' },
  ];

  return (
    <View style={navStyles.container}>
      {navItems.map((item) => {
        const isActive = active === item.id || active === item.label;
        const color = isActive ? colors.primary : '#9A938C';
        return (
          <TouchableOpacity
            key={item.id}
            style={navStyles.navItem}
            onPress={() => navigation.navigate(item.id)}
          >
            <View style={{ position: 'relative' }}>
              {item.iconType === 'feather' ? (
                <Feather name={item.icon} size={21} color={color} />
              ) : (
                <MaterialCommunityIcons name={item.icon} size={22} color={color} />
              )}
              {item.badge > 0 && (
                <View style={navStyles.badgeDot}>
                  <Text style={navStyles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[navStyles.navText, { color }]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const navStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#EFEAE4',
  },
  navItem: { alignItems: 'center', flex: 1 },
  navText: { fontSize: 10, marginTop: 4, fontWeight: '700' , flexShrink: 1 },
  badgeDot: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#C0392B',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' , flexShrink: 1 },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '900', color: colors.textDark , flexShrink: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  scroll: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 36 },
  balanceCard: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: { fontSize: 10, fontWeight: '800', color: '#D48C70' , flexShrink: 1 },
  wompiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  wompiBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' , flexShrink: 1 },
  balanceAmount: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', marginVertical: 6 },
  balanceRule: { fontSize: 11, color: '#D6CEC7', lineHeight: 16, marginBottom: 14 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  rechargeMainBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  rechargeMainBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' , flexShrink: 1 },
  historyOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  historyOutlineBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' , flexShrink: 1 },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricTitle: { fontSize: 11, fontWeight: '700', color: colors.textGray, marginTop: 6 , flexShrink: 1 },
  metricValue: { fontSize: 16, fontWeight: '900', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 10.5, fontWeight: '800', color: colors.textGray , flexShrink: 1 },
  sectionLink: { fontSize: 12, fontWeight: '800', color: colors.primary },
  emptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  emptyText: { flex: 1, fontSize: 12, color: colors.textGray, lineHeight: 17 , flexShrink: 1 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txDesc: { fontSize: 12.5, fontWeight: '700', color: colors.textDark , flexShrink: 1 },
  txMeta: { fontSize: 11, color: colors.textGray, marginTop: 2 },
  txAmount: { fontSize: 13.5, fontWeight: '800' },
});
