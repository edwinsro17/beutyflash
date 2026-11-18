/**
 * Archivo: src/screens/ForgotPasswordVerifyScreen.js
 * Módulo 2.2 — SCREEN 2: Verificar Código OTP de 6 Dígitos Recibido por Correo
 * - NUNCA muestra ningún código en pantalla: el usuario debe digitar el código que recibió en su correo.
 * - Cajas OTP interactivas y adaptables a cualquier ancho de pantalla en iOS y Android.
 * - Temporizador visual de 60 segundos para reenviar código al correo.
 */

import React, { useState, useEffect, useRef } from 'react';
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
  sessionStore,
  enmascararCorreoDestino,
  solicitarCodigoRecuperacionPassword,
  verificarCodigoRecuperacionPassword,
  useResponsiveLayout,
} from '../theme/colors';
import ValidationModal from '../components/ui/ValidationModal';

export default function ForgotPasswordVerifyScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const inputRef = useRef(null);
  const email = route?.params?.email || sessionStore.recoveryDraft?.email || '';
  const maskedEmail =
    route?.params?.maskedEmail ||
    sessionStore.recoveryDraft?.maskedEmail ||
    enmascararCorreoDestino(email);

  const [codigo, setCodigo] = useState('');
  const [segundosRestantes, setSegundosRestantes] = useState(60);
  const [verificando, setVerificando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [modalState, setModalState] = useState({
    visible: false,
    variant: 'error',
    title: '',
    message: '',
  });

  useEffect(() => {
    if (segundosRestantes <= 0) return undefined;
    const timer = setInterval(() => {
      setSegundosRestantes((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [segundosRestantes]);

  const handleVerificar = async () => {
    const cleanCode = String(codigo || '').replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setModalState({
        visible: true,
        variant: 'warning',
        title: 'Código incompleto',
        message:
          'Introduce los 6 dígitos numéricos del código de verificación que recibiste en tu correo electrónico.',
      });
      return;
    }

    setVerificando(true);
    try {
      const res = await verificarCodigoRecuperacionPassword(email, cleanCode);
      if (res?.exito && res.verificado) {
        navigation.navigate('ForgotPasswordReset', {
          email,
          recoverySessionToken: res.recovery_session_token,
        });
      }
    } catch (error) {
      setModalState({
        visible: true,
        variant: 'error',
        title: 'Código inválido o vencido',
        message:
          error.message ||
          'El código ingresado no coincide o ha expirado. Revisa el correo recibido o solicita un nuevo código.',
      });
    } finally {
      setVerificando(false);
    }
  };

  const handleReenviar = async () => {
    if (segundosRestantes > 0 || reenviando) return;
    setReenviando(true);
    try {
      const res = await solicitarCodigoRecuperacionPassword(email);
      setSegundosRestantes(res.reenvio_segundos || 60);
      setCodigo('');
      setModalState({
        visible: true,
        variant: 'success',
        title: 'Nuevo código enviado a tu correo',
        message: `Hemos enviado un nuevo código de 6 dígitos a ${maskedEmail}. El código anterior quedó invalidado.`,
      });
    } catch (error) {
      setModalState({
        visible: true,
        variant: 'warning',
        title: 'Espera antes de reenviar',
        message: error.message || 'Inténtalo nuevamente en unos segundos.',
      });
    } finally {
      setReenviando(false);
    }
  };

  const digitosVista = Array.from({ length: 6 }, (_, i) => codigo[i] || '');

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
              onPress={() => navigation.navigate('ForgotPasswordRequest')}
            >
              <Feather name="arrow-left" size={20} color={colors.textDark} />
            </TouchableOpacity>
            <View style={styles.stepPill}>
              <Text style={styles.stepPillText}>PASO 2 DE 3 • VERIFICACIÓN</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <View style={[styles.formCard, layout.cardShadow]}>
            <View style={styles.iconBanner}>
              <Feather name="shield" size={26} color={colors.primary} />
            </View>

            <Text style={[styles.title, { fontSize: layout.rf(24) }]}>
              Verificar código
            </Text>
            <Text style={styles.subtitle}>
              Hemos enviado un código de 6 dígitos al correo{' '}
              <Text style={styles.maskedText}>{maskedEmail}</Text>. Abre tu correo e introdúcelo a continuación:
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => inputRef.current && inputRef.current.focus()}
              style={styles.otpBoxesRow}
            >
              {digitosVista.map((dig, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.otpBox,
                    codigo.length === idx && styles.otpBoxActive,
                    Boolean(dig) && styles.otpBoxFilled,
                  ]}
                >
                  <Text style={styles.otpDigitText}>{dig}</Text>
                </View>
              ))}
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={styles.codeInput}
              value={codigo}
              onChangeText={(t) => setCodigo(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              allowFontScaling={false}
              placeholder="Escribe los 6 dígitos recibidos por correo"
              placeholderTextColor={colors.textGray}
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleVerificar}
              disabled={verificando}
              activeOpacity={0.85}
            >
              {verificando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Verificar código</Text>
                  <Feather name="check-circle" size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.resendRow}>
              {segundosRestantes > 0 ? (
                <View style={styles.timerBadge}>
                  <Feather name="clock" size={14} color={colors.textGray} />
                  <Text style={styles.timerText}>
                    Reenviar código al correo en {segundosRestantes}s
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={handleReenviar}
                  disabled={reenviando}
                >
                  <Feather name="refresh-cw" size={14} color={colors.primary} />
                  <Text style={styles.resendBtnText}>
                    {reenviando ? 'Enviando correo...' : 'Reenviar nuevo código al correo'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
  scroll: { paddingTop: 14, paddingBottom: 36 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  stepPill: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  stepPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  flexShrink: 1 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBanner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textGray,
    lineHeight: 20,
    marginBottom: 18,
  },
  maskedText: { fontWeight: '800', color: colors.textDark },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 14,
  },
  otpBox: {
    flex: 1,
    maxWidth: 48,
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#F8F6F4',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: { borderColor: colors.primary, backgroundColor: '#FFFDFB' },
  otpBoxFilled: { backgroundColor: '#FBF8F5', borderColor: colors.primary },
  otpDigitText: { fontSize: 19, fontWeight: '800', color: colors.textDark , flexShrink: 1 },
  codeInput: {
    backgroundColor: '#F8F6F4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    minHeight: 48,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 18,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  primaryBtnText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  resendRow: { alignItems: 'center', marginTop: 18 },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timerText: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textGray,
    textAlign: 'center',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resendBtnText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
});
