/**
 * Archivo: src/screens/WalletRechargeScreen.js
 * Módulo 4.2: Pantalla 1 de Recarga — Selección de Monto y Medio de Pago Oficial de Wompi Sandbox
 * - Montos sugeridos: $20.000 COP, $50.000 COP, $100.000 COP y Otro valor.
 * - Valida límites ($10.000 a $5.000.000 COP), valores positivos y enteros en COP.
 * - Al continuar, genera la referencia única y la firma de integridad SHA-256 en el servidor
 *   y redirige a la pantalla dedicada de Checkout Wompi Sandbox (`WompiSandboxCheckout`).
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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  colors,
  formatCOP,
  iniciarTransaccionWompiSandbox,
  useResponsiveLayout,
} from '../theme/colors';
import ValidationModal from '../components/ui/ValidationModal';

const MONTOS_SUGERIDOS = [20000, 50000, 100000];

const METODOS_WOMPI_SANDBOX = [
  {
    id: 'CARD',
    title: 'Tarjeta de Crédito / Débito',
    subtitle: 'Visa / Mastercard Sandbox (4242...4242 o 4111...1111)',
    icon: 'credit-card',
  },
  {
    id: 'NEQUI',
    title: 'Cuenta Nequi',
    subtitle: 'Celulares de prueba Sandbox (3991111111 o 3992222222)',
    icon: 'smartphone',
  },
  {
    id: 'PSE',
    title: 'Transferencia PSE',
    subtitle: 'Banco que aprueba (cód. 1) o Banco que rechaza (cód. 2)',
    icon: 'globe',
  },
  {
    id: 'BANCOLOMBIA_QR',
    title: 'Bancolombia QR / Botón',
    subtitle: 'Simulación con sandbox_status (APPROVED, DECLINED, ERROR)',
    icon: 'grid',
  },
  {
    id: 'DAVIPLATA',
    title: 'Daviplata Pago Simple',
    subtitle: 'Códigos OTP oficiales (574829, 932015, 186743, 999999)',
    icon: 'dollar-sign',
  },
];

export default function WalletRechargeScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const initialAmount = route?.params?.suggestedAmount
    ? String(Math.max(10000, Math.ceil(Number(route.params.suggestedAmount) / 1000) * 1000))
    : '20000';

  const [montoSeleccionado, setMontoSeleccionado] = useState(initialAmount);
  const [modoOtroValor, setModoOtroValor] = useState(!MONTOS_SUGERIDOS.includes(Number(initialAmount)));
  const [metodoSeleccionado, setMetodoSeleccionado] = useState('CARD');
  const [generandoRef, setGenerandoRef] = useState(false);
  const [modalState, setModalState] = useState({
    visible: false,
    variant: 'warning',
    title: '',
    message: '',
  });

  const handleSeleccionarSugerido = (valor) => {
    setModoOtroValor(false);
    setMontoSeleccionado(String(valor));
  };

  const handleContinuarAWompiCheckout = async () => {
    const limpio = String(montoSeleccionado || '').trim();
    if (!/^\d+$/.test(limpio)) {
      setModalState({
        visible: true,
        variant: 'warning',
        title: 'Monto inválido',
        message: 'Ingresa un valor entero positivo en pesos colombianos (COP) sin decimales.',
      });
      return;
    }

    const monto = Number(limpio);
    if (monto < 10000) {
      setModalState({
        visible: true,
        variant: 'error',
        title: 'Monto mínimo: $10.000 COP',
        message: `El monto mínimo de recarga es $10.000 COP. Ingresaste ${formatCOP(monto)} COP.`,
      });
      return;
    }

    if (monto > 5000000) {
      setModalState({
        visible: true,
        variant: 'error',
        title: 'Límite máximo excedido',
        message: 'El monto máximo permitido por transacción es $5.000.000 COP.',
      });
      return;
    }

    setGenerandoRef(true);
    try {
      const txWompi = await iniciarTransaccionWompiSandbox({
        montoCop: monto,
        metodoPago: metodoSeleccionado,
      });

      navigation.navigate('WompiSandboxCheckout', {
        transaction: txWompi,
        paymentMethodType: metodoSeleccionado,
      });
    } catch (error) {
      setModalState({
        visible: true,
        variant: 'error',
        title: 'No se pudo iniciar la transacción',
        message: error.message || 'Verifica tu conexión e inténtalo nuevamente.',
      });
    } finally {
      setGenerandoRef(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, layout.contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backBtn, layout.cardShadow]}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={20} color={colors.textDark} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Recargar Saldo Profesional</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={[styles.card, layout.cardShadow]}>
            <Text style={styles.sectionLabel}>1. MONTO A RECARGAR EN PESOS (COP)</Text>
            <View style={styles.amountsGrid}>
              {MONTOS_SUGERIDOS.map((m) => {
                const active = !modoOtroValor && Number(montoSeleccionado) === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.amountBtn, active && styles.amountBtnActive]}
                    onPress={() => handleSeleccionarSugerido(m)}
                  >
                    <Text style={[styles.amountBtnText, active && { color: '#FFFFFF' }]}>
                      {formatCOP(m)} COP
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.amountBtn, modoOtroValor && styles.amountBtnActive]}
                onPress={() => setModoOtroValor(true)}
              >
                <Text style={[styles.amountBtnText, modoOtroValor && { color: '#FFFFFF' }]}>
                  Otro valor
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>
              Valor exacto en COP (Mínimo $10.000 • Máximo $5.000.000)
            </Text>
            <TextInput
              style={styles.amountInput}
              value={montoSeleccionado}
              onChangeText={(t) => {
                setModoOtroValor(true);
                setMontoSeleccionado(t.replace(/\D/g, ''));
              }}
              keyboardType="number-pad"
              allowFontScaling={false}
              placeholder="Ej. 20000"
            />

            <Text style={styles.sectionLabel}>
              2. MEDIO DE PAGO EN WOMPI SANDBOX (https://sandbox.wompi.co/v1)
            </Text>

            {METODOS_WOMPI_SANDBOX.map((met) => {
              const active = metodoSeleccionado === met.id;
              return (
                <TouchableOpacity
                  key={met.id}
                  style={[styles.methodCard, active && styles.methodCardActive]}
                  onPress={() => setMetodoSeleccionado(met.id)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.methodIconWrap,
                      active && { backgroundColor: colors.primary },
                    ]}
                  >
                    <Feather
                      name={met.icon}
                      size={18}
                      color={active ? '#FFFFFF' : colors.primary}
                    />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodTitle}>{met.title}</Text>
                    <Text style={styles.methodSubtitle}>{met.subtitle}</Text>
                  </View>
                  <Feather
                    name={active ? 'check-circle' : 'circle'}
                    size={19}
                    color={active ? colors.primary : colors.textGray}
                  />
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={handleContinuarAWompiCheckout}
              disabled={generandoRef}
              activeOpacity={0.85}
            >
              {generandoRef ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="shield" size={16} color="#FFFFFF" />
                  <Text style={styles.continueBtnText}>
                    Continuar a Wompi Sandbox ({formatCOP(Number(montoSeleccionado) || 0)} COP)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ValidationModal
        visible={modalState.visible}
        variant={modalState.variant}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingTop: 12, paddingBottom: 36 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  headerTitle: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textDark,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  amountBtn: {
    width: '48%',
    minHeight: 44,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F8F6F4',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  amountBtnText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textGray,
    marginBottom: 6,
  },
  amountInput: {
    backgroundColor: '#F8F6F4',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: colors.border,
    paddingHorizontal: 14,
    minHeight: 48,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 18,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8F6F4',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: colors.border,
    marginBottom: 8,
  },
  methodCardActive: {
    backgroundColor: '#FBF8F5',
    borderColor: colors.primary,
  },
  methodIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFE9E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: { flex: 1, flexShrink: 1 },
  methodTitle: { fontSize: 13, fontWeight: '800', color: colors.textDark },
  methodSubtitle: {
    fontSize: 11,
    color: colors.textGray,
    marginTop: 2,
    lineHeight: 15,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 12,
  },
  continueBtnText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    textAlign: 'center',
  },
});
