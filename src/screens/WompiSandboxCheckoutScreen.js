/**
 * Archivo: src/screens/WompiSandboxCheckoutScreen.js
 * Módulo 4.3 y Módulo 7: Pantalla Dedicada del Proceso de Pago en Wompi Sandbox
 * - Implementa exactamente los parámetros oficiales de prueba de Wompi Colombia:
 *   https://docs.wompi.co/docs/colombia/datos-de-prueba-en-sandbox/
 *   - Tarjetas: `4242 4242 4242 4242` (APPROVED), `4111 1111 1111 1111` (DECLINED), otra (ERROR)
 *   - Nequi: `3991111111` (APPROVED), `3992222222` (DECLINED), otro (ERROR)
 *   - PSE: `financial_institution_code: "1"` (Banco que aprueba) vs `"2"` (Banco que rechaza), `CC 1999888777`
 *   - Bancolombia QR: `sandbox_status` (`APPROVED`, `DECLINED`, `ERROR`)
 *   - Daviplata: OTP `574829` (APPROVED), `932015` (DECLINED), `186743` (Sin saldo), `999999` (ERROR), `123456` (PENDING)
 * - No acredita saldo en el frontend; envía el pago al backend para conciliación por Webhook y redirige a `WompiTransactionResult`.
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
  WOMPI_PUBLIC_SANDBOX_KEY,
  WOMPI_OFFICIAL_SANDBOX_DATA,
  ejecutarPagoConDatosPruebaWompiSandbox,
  useResponsiveLayout,
} from '../theme/colors';

export default function WompiSandboxCheckoutScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const tx = route?.params?.transaction || {
    reference: `BF-WOMPI-${Date.now()}`,
    amount_cop: 20000,
    amount_in_cents: 2000000,
    public_key: WOMPI_PUBLIC_SANDBOX_KEY,
    signature_integrity: 'test_integrity_nMaCRvNkgai1TzkWX9L0zWAZAcKOcn5Z',
  };
  const methodType = String(
    route?.params?.paymentMethodType || tx.payment_method_type || 'CARD'
  ).toUpperCase();

  // Estados para Tarjeta Sandbox
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardHolder, setCardHolder] = useState('EDWIN RODRIGUEZ');
  const [cardExp, setCardExp] = useState('08/29');
  const [cardCvc, setCardCvc] = useState('123');

  // Estados para Nequi Sandbox
  const [nequiPhone, setNequiPhone] = useState('3991111111');

  // Estados para PSE Sandbox
  const [pseBankCode, setPseBankCode] = useState('1');
  const [pseUserType, setPseUserType] = useState(0);
  const [pseDocType, setPseDocType] = useState('CC');
  const [pseDocNumber, setPseDocNumber] = useState('1999888777');

  // Estados para Bancolombia QR Sandbox
  const [bancolombiaStatus, setBancolombiaStatus] = useState('APPROVED');

  // Estados para Daviplata Sandbox
  const [daviplataPhone, setDaviplataPhone] = useState('3991111111');
  const [daviplataOtp, setDaviplataOtp] = useState('574829');

  const [procesando, setProcesando] = useState(false);

  const handleEjecutarPagoSandbox = async () => {
    setProcesando(true);
    try {
      const paymentDetails = {
        card_number: cardNumber,
        card_holder: cardHolder,
        exp_date: cardExp,
        cvc: cardCvc,
        phone_number: methodType === 'DAVIPLATA' ? daviplataPhone : nequiPhone,
        financial_institution_code: pseBankCode,
        user_type: pseUserType,
        user_legal_id_type: pseDocType,
        user_legal_id: pseDocNumber,
        sandbox_status: bancolombiaStatus,
        otp_code: daviplataOtp,
      };

      const result = await ejecutarPagoConDatosPruebaWompiSandbox({
        reference: tx.reference,
        paymentMethodType: methodType,
        paymentDetails,
      });

      navigation.replace('WompiTransactionResult', {
        result,
        transaction: tx,
        paymentMethodType: methodType,
        paymentDetails,
      });
    } finally {
      setProcesando(false);
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
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Pasarela Wompi Sandbox</Text>
              <Text style={styles.headerSub}>AMBIENTE OFICIAL DE PRUEBAS</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Resumen de Referencia y Llave Pública del Comercio */}
          <View style={styles.summaryBanner}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Monto a pagar:</Text>
              <Text style={styles.summaryAmount}>{formatCOP(tx.amount_cop)} COP</Text>
            </View>
            <Text style={styles.summaryMeta} numberOfLines={1}>
              Referencia única: {tx.reference}
            </Text>
            <Text style={styles.summaryMeta} numberOfLines={1}>
              Llave pública: {tx.public_key || WOMPI_PUBLIC_SANDBOX_KEY}
            </Text>
            <Text style={styles.summaryMeta} numberOfLines={1}>
              Firma SHA-256: {String(tx.signature_integrity).slice(0, 26)}...
            </Text>
          </View>

          {/* FORMULARIO SEGÚN MÉTODO CON LOS PARÁMETROS OFICIALES DE WOMPI SANDBOX */}
          <View style={[styles.formCard, layout.cardShadow]}>
            {methodType === 'CARD' && (
              <>
                <Text style={styles.sectionTitle}>
                  PARÁMETROS DE PRUEBA WOMPI SANDBOX — TARJETAS
                </Text>
                <Text style={styles.helperText}>
                  Selecciona una tarjeta oficial de prueba de Wompi para obtener el estado deseado:
                </Text>
                {WOMPI_OFFICIAL_SANDBOX_DATA.CARDS.map((item) => {
                  const active = cardNumber.replace(/\s/g, '') === item.raw;
                  return (
                    <TouchableOpacity
                      key={item.raw}
                      style={[styles.presetBtn, active && { borderColor: item.color, backgroundColor: '#FBF8F5' }]}
                      onPress={() => setCardNumber(item.number)}
                    >
                      <View style={[styles.dot, { backgroundColor: item.color }]} />
                      <View style={{ flex: 1, flexShrink: 1 }}>
                        <Text style={styles.presetTitle}>{item.label}</Text>
                        <Text style={styles.presetCode}>{item.number}</Text>
                      </View>
                      <Feather
                        name={active ? 'check-circle' : 'circle'}
                        size={18}
                        color={active ? item.color : colors.textGray}
                      />
                    </TouchableOpacity>
                  );
                })}

                <Text style={styles.fieldLabel}>Número de tarjeta en Sandbox</Text>
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="number-pad"
                  allowFontScaling={false}
                />

                <View style={styles.twoCols}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Expiración futura</Text>
                    <TextInput
                      style={styles.input}
                      value={cardExp}
                      onChangeText={setCardExp}
                      allowFontScaling={false}
                      placeholder="08/29"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>CVC (3 dígitos)</Text>
                    <TextInput
                      style={styles.input}
                      value={cardCvc}
                      onChangeText={setCardCvc}
                      keyboardType="number-pad"
                      maxLength={3}
                      allowFontScaling={false}
                      placeholder="123"
                    />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Nombre del titular</Text>
                <TextInput
                  style={styles.input}
                  value={cardHolder}
                  onChangeText={setCardHolder}
                  allowFontScaling={false}
                />
              </>
            )}

            {methodType === 'NEQUI' && (
              <>
                <Text style={styles.sectionTitle}>
                  PARÁMETROS DE PRUEBA WOMPI SANDBOX — NEQUI
                </Text>
                <Text style={styles.helperText}>
                  En Wompi Sandbox, el número 3991111111 aprueba, 3992222222 declina y cualquier otro retorna ERROR:
                </Text>
                {WOMPI_OFFICIAL_SANDBOX_DATA.NEQUI.map((item) => {
                  const active = nequiPhone === item.phone;
                  return (
                    <TouchableOpacity
                      key={item.phone}
                      style={[styles.presetBtn, active && { borderColor: item.color, backgroundColor: '#FBF8F5' }]}
                      onPress={() => setNequiPhone(item.phone)}
                    >
                      <View style={[styles.dot, { backgroundColor: item.color }]} />
                      <View style={{ flex: 1, flexShrink: 1 }}>
                        <Text style={styles.presetTitle}>{item.label}</Text>
                        <Text style={styles.presetCode}>phone_number: "{item.phone}"</Text>
                      </View>
                      <Feather
                        name={active ? 'check-circle' : 'circle'}
                        size={18}
                        color={active ? item.color : colors.textGray}
                      />
                    </TouchableOpacity>
                  );
                })}

                <Text style={styles.fieldLabel}>Número celular Nequi Sandbox</Text>
                <TextInput
                  style={styles.input}
                  value={nequiPhone}
                  onChangeText={(t) => setNequiPhone(t.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="number-pad"
                  allowFontScaling={false}
                />
              </>
            )}

            {methodType === 'PSE' && (
              <>
                <Text style={styles.sectionTitle}>
                  PARÁMETROS DE PRUEBA WOMPI SANDBOX — PSE
                </Text>
                <Text style={styles.helperText}>
                  Selecciona la institución financiera de prueba (financial_institution_code "1" aprueba y "2" rechaza):
                </Text>
                {WOMPI_OFFICIAL_SANDBOX_DATA.PSE.map((item) => {
                  const active = pseBankCode === item.code;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      style={[styles.presetBtn, active && { borderColor: item.color, backgroundColor: '#FBF8F5' }]}
                      onPress={() => setPseBankCode(item.code)}
                    >
                      <View style={[styles.dot, { backgroundColor: item.color }]} />
                      <View style={{ flex: 1, flexShrink: 1 }}>
                        <Text style={styles.presetTitle}>{item.label}</Text>
                        <Text style={styles.presetCode}>
                          financial_institution_code: "{item.code}"
                        </Text>
                      </View>
                      <Feather
                        name={active ? 'check-circle' : 'circle'}
                        size={18}
                        color={active ? item.color : colors.textGray}
                      />
                    </TouchableOpacity>
                  );
                })}

                <View style={styles.twoCols}>
                  <TouchableOpacity
                    style={[styles.smallToggle, pseUserType === 0 && styles.smallToggleActive]}
                    onPress={() => setPseUserType(0)}
                  >
                    <Text style={[styles.smallToggleText, pseUserType === 0 && { color: '#FFFFFF' }]}>
                      Persona Natural (0)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallToggle, pseUserType === 1 && styles.smallToggleActive]}
                    onPress={() => setPseUserType(1)}
                  >
                    <Text style={[styles.smallToggleText, pseUserType === 1 && { color: '#FFFFFF' }]}>
                      Jurídica (1)
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.twoCols}>
                  <View style={{ width: 95 }}>
                    <Text style={styles.fieldLabel}>Tipo Doc</Text>
                    <TextInput
                      style={styles.input}
                      value={pseDocType}
                      onChangeText={setPseDocType}
                      allowFontScaling={false}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Número de documento (user_legal_id)</Text>
                    <TextInput
                      style={styles.input}
                      value={pseDocNumber}
                      onChangeText={setPseDocNumber}
                      keyboardType="number-pad"
                      allowFontScaling={false}
                    />
                  </View>
                </View>
              </>
            )}

            {methodType === 'BANCOLOMBIA_QR' && (
              <>
                <Text style={styles.sectionTitle}>
                  PARÁMETROS DE PRUEBA WOMPI SANDBOX — BANCOLOMBIA QR
                </Text>
                <Text style={styles.helperText}>
                  Elige el estado de prueba deseado para la propiedad sandbox_status:
                </Text>
                {WOMPI_OFFICIAL_SANDBOX_DATA.BANCOLOMBIA_QR.map((item) => {
                  const active = bancolombiaStatus === item.status;
                  return (
                    <TouchableOpacity
                      key={item.status}
                      style={[styles.presetBtn, active && { borderColor: item.color, backgroundColor: '#FBF8F5' }]}
                      onPress={() => setBancolombiaStatus(item.status)}
                    >
                      <View style={[styles.dot, { backgroundColor: item.color }]} />
                      <View style={{ flex: 1, flexShrink: 1 }}>
                        <Text style={styles.presetTitle}>{item.label}</Text>
                        <Text style={styles.presetCode}>sandbox_status: "{item.status}"</Text>
                      </View>
                      <Feather
                        name={active ? 'check-circle' : 'circle'}
                        size={18}
                        color={active ? item.color : colors.textGray}
                      />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {methodType === 'DAVIPLATA' && (
              <>
                <Text style={styles.sectionTitle}>
                  PARÁMETROS DE PRUEBA WOMPI SANDBOX — DAVIPLATA
                </Text>
                <Text style={styles.helperText}>
                  Selecciona uno de los códigos OTP oficiales de prueba de Daviplata en Wompi Sandbox:
                </Text>
                {WOMPI_OFFICIAL_SANDBOX_DATA.DAVIPLATA.map((item) => {
                  const active = daviplataOtp === item.otp;
                  return (
                    <TouchableOpacity
                      key={item.otp}
                      style={[styles.presetBtn, active && { borderColor: item.color, backgroundColor: '#FBF8F5' }]}
                      onPress={() => setDaviplataOtp(item.otp)}
                    >
                      <View style={[styles.dot, { backgroundColor: item.color }]} />
                      <View style={{ flex: 1, flexShrink: 1 }}>
                        <Text style={styles.presetTitle}>{item.label}</Text>
                        <Text style={styles.presetCode}>OTP: {item.otp} → {item.expected}</Text>
                      </View>
                      <Feather
                        name={active ? 'check-circle' : 'circle'}
                        size={18}
                        color={active ? item.color : colors.textGray}
                      />
                    </TouchableOpacity>
                  );
                })}

                <View style={styles.twoCols}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Celular Daviplata</Text>
                    <TextInput
                      style={styles.input}
                      value={daviplataPhone}
                      onChangeText={setDaviplataPhone}
                      keyboardType="number-pad"
                      allowFontScaling={false}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Código OTP (6 dígitos)</Text>
                    <TextInput
                      style={styles.input}
                      value={daviplataOtp}
                      onChangeText={(t) => setDaviplataOtp(t.replace(/\D/g, '').slice(0, 6))}
                      keyboardType="number-pad"
                      maxLength={6}
                      allowFontScaling={false}
                    />
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.payNowBtn}
              onPress={handleEjecutarPagoSandbox}
              disabled={procesando}
              activeOpacity={0.85}
            >
              {procesando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check-circle" size={17} color="#FFFFFF" />
                  <Text style={styles.payNowBtnText}>
                    Procesar Pago en Wompi Sandbox y Conciliar Webhook
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 14,
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
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 15.5, fontWeight: '800', color: colors.textDark },
  headerSub: { fontSize: 9.5, fontWeight: '800', color: colors.primary, marginTop: 1 },
  summaryBanner: {
    backgroundColor: colors.secondary,
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: '#D48C70' },
  summaryAmount: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  summaryMeta: { fontSize: 10.5, color: '#D6CEC7', marginTop: 2 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: colors.textGray,
    lineHeight: 17,
    marginBottom: 12,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8F6F4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  presetTitle: { fontSize: 12.5, fontWeight: '800', color: colors.textDark },
  presetCode: { fontSize: 11, fontWeight: '600', color: colors.textGray, marginTop: 2 },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 8,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F8F6F4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    minHeight: 46,
    paddingVertical: Platform.OS === 'ios' ? 11 : 7,
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textDark,
  },
  twoCols: { flexDirection: 'row', gap: 10, marginTop: 4 },
  smallToggle: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EBE6E0',
    alignItems: 'center',
    marginVertical: 6,
  },
  smallToggleActive: { backgroundColor: colors.primary },
  smallToggleText: { fontSize: 11.5, fontWeight: '800', color: colors.textDark },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E824C',
    minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 18,
  },
  payNowBtnText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    textAlign: 'center',
  },
});
