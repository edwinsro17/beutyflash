/**
 * Archivo: src/screens/BilleteraScreen.js
 * Billetera del Profesional con Simulación Realista de Pago con Tarjeta Bancaria
 * (Número de tarjeta de 16 dígitos, Titular, Fecha de expiración MM/AA, CVC de 3 dígitos)
 * y Recarga mínima de $10.000 COP.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, sessionStore, formatCOP, callBackendApi, useResponsiveLayout, sincronizarEstadoDesdeSupabase } from '../theme/colors';

const MONTOS_RAPIDOS = [10000, 20000, 50000, 100000];

export default function BilleteraScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const [saldo, setSaldo] = useState(sessionStore.wallet.saldo_disponible_cop);
  const [transacciones, setTransacciones] = useState([...sessionStore.wallet.transacciones]);
  const [montoInput, setMontoInput] = useState('20000');

  // Datos realistas de Tarjeta de Crédito / Débito
  const [numeroTarjeta, setNumeroTarjeta] = useState('4532 8910 3412 8891');
  const [titularTarjeta, setTitularTarjeta] = useState(
    (sessionStore.proUser.nombre_completo || 'SOFIA ALARCON').toUpperCase()
  );
  const [fechaExp, setFechaExp] = useState('08/29');
  const [cvc, setCvc] = useState('482');
  const [procesandoPago, setProcesandoPago] = useState(false);

  const formatearTarjeta = (txt) => {
    const soloDigitos = txt.replace(/\D/g, '').slice(0, 16);
    const grupos = soloDigitos.match(/.{1,4}/g) || [];
    setNumeroTarjeta(grupos.join(' '));
  };

  const formatearExp = (txt) => {
    const limpio = txt.replace(/\D/g, '').slice(0, 4);
    if (limpio.length >= 3) {
      setFechaExp(`${limpio.slice(0, 2)}/${limpio.slice(2)}`);
    } else {
      setFechaExp(limpio);
    }
  };

  const handleRecargarConTarjeta = async () => {
    const monto = Math.round(Number(String(montoInput).replace(/\D/g, '')) || 0);
    if (monto < 10000) {
      Alert.alert(
        'Recarga mínima: $10.000 COP',
        `El valor mínimo de recarga es $10.000 COP. Ingresaste ${formatCOP(monto)} COP.`
      );
      return;
    }

    const digitosTarjeta = numeroTarjeta.replace(/\s/g, '');
    if (digitosTarjeta.length < 15) {
      Alert.alert('Número de tarjeta incompleto', 'Ingresa los 16 dígitos de tu tarjeta de crédito o débito.');
      return;
    }
    if (!titularTarjeta.trim()) {
      Alert.alert('Titular requerido', 'Ingresa el nombre completo como aparece en la tarjeta.');
      return;
    }
    if (fechaExp.length < 4) {
      Alert.alert('Fecha inválida', 'Ingresa el mes y año de vencimiento en formato MM/AA.');
      return;
    }
    if (cvc.trim().length < 3) {
      Alert.alert('CVC inválido', 'Ingresa los 3 dígitos del código de seguridad CVC al respaldo de tu tarjeta.');
      return;
    }

    setProcesandoPago(true);
    try {
      await callBackendApi(`/wallet/${sessionStore.proUser.id}/recharge`, 'POST', {
        monto_cop: monto,
        metodo_pago: 'tarjeta',
      });
    } catch (_e) {}

    const ultimos4 = digitosTarjeta.slice(-4);
    const nuevoSaldo = sessionStore.wallet.saldo_disponible_cop + monto;
    sessionStore.wallet.saldo_disponible_cop = nuevoSaldo;
    sessionStore.wallet.total_recargado_cop += monto;
    sessionStore.proUser.activo_por_saldo = true;
    sessionStore.proUser.disponible = true;

    const nuevaTx = {
      id: `tx-${Date.now()}`,
      tipo: 'recarga',
      monto_cop: monto,
      signo: 1,
      saldo_posterior_cop: nuevoSaldo,
      metodo_pago: `Tarjeta •••• ${ultimos4}`,
      descripcion: `Recarga aprobada por ${formatCOP(monto)} COP con Tarjeta •••• ${ultimos4}`,
      creado_en: 'Ahora mismo',
    };
    sessionStore.wallet.transacciones.unshift(nuevaTx);

    setProcesandoPago(false);
    setSaldo(nuevoSaldo);
    setTransacciones([...sessionStore.wallet.transacciones]);

    Alert.alert(
      '¡Pago Aprobado y Saldo Recargado!',
      `Transacción exitosa con tu tarjeta •••• ${ultimos4} por ${formatCOP(
        monto
      )} COP.\nNuevo saldo disponible: ${formatCOP(nuevoSaldo)} COP.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Billetera & Pasarela (COP)</Text>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: saldo >= 10000 ? '#E8F6EF' : '#FDEDEC' },
          ]}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              color: saldo >= 10000 ? '#1E824C' : '#C0392B',
            }}
          >
            {saldo >= 5000 ? 'Activo para servicios' : 'Inactivo (Saldo bajo)'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, layout.contentContainerStyle]} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>SALDO DISPONIBLE PARA COMISIONES (10%)</Text>
          <Text style={styles.balanceAmount}>{formatCOP(saldo)} COP</Text>
          <Text style={styles.balanceRule}>
            Recarga mínima: $10.000 COP • Se descuenta el 10% únicamente al confirmar un servicio
          </Text>
        </View>

        {/* Tarjeta Bancaria Visual Interactiva */}
        <LinearGradient
          colors={['#1A1A1A', '#3B251E', '#844D3B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.creditCardVisual}
        >
          <View style={styles.cardTopRow}>
            <MaterialCommunityIcons name="integrated-circuit-chip" size={32} color="#D48C70" />
            <Text style={styles.cardBrand}>BEAUTYFLASH PAY • VISA / MASTERCARD</Text>
          </View>
          <Text style={styles.cardNumberPreview}>
            {numeroTarjeta || '•••• •••• •••• ••••'}
          </Text>
          <View style={styles.cardBottomRow}>
            <View>
              <Text style={styles.cardMiniLabel}>TITULAR DE LA TARJETA</Text>
              <Text style={styles.cardHolderPreview}>
                {titularTarjeta || 'NOMBRE DEL TITULAR'}
              </Text>
            </View>
            <View>
              <Text style={styles.cardMiniLabel}>VENCE</Text>
              <Text style={styles.cardHolderPreview}>{fechaExp || 'MM/AA'}</Text>
            </View>
            <View>
              <Text style={styles.cardMiniLabel}>CVC</Text>
              <Text style={styles.cardHolderPreview}>{cvc ? '•••' : 'CVC'}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Formulario Realista de Tarjeta */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos de la Tarjeta y Monto a Recargar</Text>

          <Text style={styles.fieldLabel}>1. Selecciona o escribe el monto en COP (Mín. $10.000)</Text>
          <View style={styles.pillsRow}>
            {MONTOS_RAPIDOS.map((m) => {
              const active = Number(montoInput) === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setMontoInput(String(m))}
                >
                  <Text style={[styles.pillText, active && { color: '#FFFFFF' }]}>
                    {formatCOP(m)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.input}
            value={montoInput}
            onChangeText={setMontoInput}
            keyboardType="number-pad"
            placeholder="Monto en COP (mínimo 10000)"
          />

          <Text style={styles.fieldLabel}>2. Número de Tarjeta (16 dígitos) *</Text>
          <View style={styles.inputWithIcon}>
            <Feather name="credit-card" size={17} color={colors.primary} />
            <TextInput
              style={styles.inputInner}
              value={numeroTarjeta}
              onChangeText={formatearTarjeta}
              keyboardType="number-pad"
              placeholder="4532 8910 3412 8891"
              maxLength={19}
            />
          </View>

          <Text style={styles.fieldLabel}>3. Nombre y Apellido del Titular *</Text>
          <View style={styles.inputWithIcon}>
            <Feather name="user" size={17} color={colors.primary} />
            <TextInput
              style={styles.inputInner}
              value={titularTarjeta}
              onChangeText={(t) => setTitularTarjeta(t.toUpperCase())}
              placeholder="COMO APARECE EN LA TARJETA"
              autoCapitalize="characters"
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>4. Fecha Exp (MM/AA) *</Text>
              <View style={styles.inputWithIcon}>
                <Feather name="calendar" size={16} color={colors.primary} />
                <TextInput
                  style={styles.inputInner}
                  value={fechaExp}
                  onChangeText={formatearExp}
                  keyboardType="number-pad"
                  placeholder="08/29"
                  maxLength={5}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>5. Código CVC *</Text>
              <View style={styles.inputWithIcon}>
                <Feather name="lock" size={16} color={colors.primary} />
                <TextInput
                  style={styles.inputInner}
                  value={cvc}
                  onChangeText={(t) => setCvc(t.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  placeholder="123"
                  secureTextEntry
                  maxLength={4}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.rechargeBtn}
            onPress={handleRecargarConTarjeta}
            disabled={procesandoPago}
          >
            <Feather name="shield" size={16} color="#FFFFFF" />
            <Text style={styles.rechargeBtnText}>
              Pagar y Recargar {formatCOP(Number(montoInput) || 0)} COP
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>HISTORIAL DE RECARGAS Y COMISIONES (10%)</Text>
        {transacciones.map((tx) => (
          <View key={tx.id} style={styles.txRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txDesc}>{tx.descripcion}</Text>
              <Text style={styles.txMeta}>
                {tx.creado_en} • Saldo posterior: {formatCOP(tx.saldo_posterior_cop)}
              </Text>
            </View>
            <Text
              style={[
                styles.txAmount,
                { color: tx.signo > 0 ? '#1E824C' : '#C0392B' },
              ]}
            >
              {tx.signo > 0 ? '+' : '-'}
              {formatCOP(tx.monto_cop)}
            </Text>
          </View>
        ))}
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
  navText: { fontSize: 10, marginTop: 4, fontWeight: '700' },
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
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
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
  headerTitle: { fontSize: 16, fontWeight: '900', color: colors.textDark },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  scroll: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 36 },
  balanceCard: {
    backgroundColor: colors.secondary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  balanceLabel: { fontSize: 10, fontWeight: '800', color: '#D48C70' },
  balanceAmount: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', marginVertical: 4 },
  balanceRule: { fontSize: 11, color: '#D6CEC7' },
  creditCardVisual: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 5,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  cardBrand: { fontSize: 10, fontWeight: '800', color: '#FDECE7', letterSpacing: 1 },
  cardNumberPreview: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2.2,
    marginBottom: 18,
  },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardMiniLabel: { fontSize: 9, color: '#D48C70', fontWeight: '700' },
  cardHolderPreview: { fontSize: 12, color: '#FFFFFF', fontWeight: '800', marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.textDark, marginBottom: 12 },
  fieldLabel: { fontSize: 11.5, fontWeight: '700', color: colors.textDark, marginBottom: 6 },
  pillsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  pill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8F6F4',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 11.5, fontWeight: '700', color: colors.textDark },
  input: {
    backgroundColor: '#F8F6F4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 12,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F6F4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  inputInner: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textDark,
  },
  rechargeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  rechargeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textGray,
    marginBottom: 10,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  txDesc: { fontSize: 13, fontWeight: '700', color: colors.textDark },
  txMeta: { fontSize: 11, color: colors.textGray, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '800' },
});
