/**
 * Archivo: src/screens/InsufficientBalanceScreen.js
 * Módulo 4.6 y Módulo 7: Pantalla Dedicada de Gestión de Saldo Insuficiente
 * - Se presenta cuando el profesional no cuenta con saldo prepago suficiente para cubrir
 *   una etapa de comisión (Etapa 1: 3% al confirmar o Etapa 2: 7% al iniciar servicio).
 * - Impide que la operación financiera se ejecute parcialmente o deje saldo negativo,
 *   y ofrece acceso directo a recargar con Wompi Sandbox.
 */

import React from 'react';
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
  useResponsiveLayout,
} from '../theme/colors';

export default function InsufficientBalanceScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const saldoActual = Number(
    route?.params?.saldoActual ?? sessionStore.wallet?.saldo_disponible_cop ?? 0
  );
  const montoRequerido = Number(route?.params?.montoRequerido ?? 5000);
  const etapa = route?.params?.etapa || 1;
  const codigoReserva = route?.params?.codigoReserva || null;
  const faltante = Math.max(0, montoRequerido - saldoActual);
  const recargaSugerida = Math.max(10000, Math.ceil(faltante / 10000) * 10000);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, layout.cardShadow]}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saldo Insuficiente</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, layout.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, layout.cardShadow]}>
          <View style={styles.iconCircle}>
            <Feather name="alert-triangle" size={30} color="#C0392B" />
          </View>

          <Text style={styles.title}>
            Recarga requerida para cubrir la comisión ({etapa === 1 ? '3%' : '7%'})
          </Text>
          <Text style={styles.subtitle}>
            Por seguridad financiera, ninguna operación puede descontar un saldo negativo ni ejecutarse parcialmente. Recarga tu billetera mediante Wompi Sandbox para continuar.
          </Text>

          <View style={styles.breakdownBox}>
            {codigoReserva ? (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Contratación</Text>
                <Text style={styles.rowValue}>#{codigoReserva}</Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Tu saldo disponible actual</Text>
              <Text style={styles.rowValue}>{formatCOP(saldoActual)} COP</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>
                Comisión requerida (Etapa {etapa}: {etapa === 1 ? '3%' : '7%'})
              </Text>
              <Text style={[styles.rowValue, { color: '#C0392B' }]}>
                {formatCOP(montoRequerido)} COP
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Valor faltante</Text>
              <Text style={[styles.rowValue, { color: '#C0392B' }]}>
                {formatCOP(faltante)} COP
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.rechargeBtn}
            onPress={() =>
              navigation.navigate('WalletRecharge', {
                suggestedAmount: recargaSugerida,
              })
            }
          >
            <Feather name="plus-circle" size={17} color="#FFFFFF" />
            <Text style={styles.rechargeBtnText}>
              Recargar {formatCOP(recargaSugerida)} COP en Wompi Sandbox
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Billetera')}
          >
            <Text style={styles.secondaryBtnText}>Ir al resumen de mi Billetera</Text>
          </TouchableOpacity>
        </View>
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  scroll: { paddingTop: 10, paddingBottom: 34 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FDEDEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textGray,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  breakdownBox: {
    width: '100%',
    backgroundColor: '#F8F6F4',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  rowLabel: { flex: 1, fontSize: 12, color: colors.textGray, fontWeight: '600' },
  rowValue: { fontSize: 13, color: colors.textDark, fontWeight: '800' },
  rechargeBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E824C',
    minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  rechargeBtnText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryBtn: {
    paddingVertical: 14,
    marginTop: 6,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
  },
});
