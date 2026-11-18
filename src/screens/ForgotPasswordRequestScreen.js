/**
 * Archivo: src/screens/ForgotPasswordRequestScreen.js
 * Módulo 2.2 — SCREEN 1: Solicitar Recuperación de Contraseña por Correo Electrónico
 * - Envía el código de 6 dígitos EXCLUSIVAMENTE al correo electrónico del usuario (SMTP Gratuito + Supabase Auth).
 * - NUNCA muestra ni expone el código OTP en pantalla.
 * - Diseño editorial adaptable a iOS y Android con KeyboardAvoidingView y prevención de desbordamientos.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  colors,
  solicitarCodigoRecuperacionPassword,
  useResponsiveLayout,
} from '../theme/colors';
import CustomInput from '../components/CustomInput';
import ValidationModal from '../components/ui/ValidationModal';

export default function ForgotPasswordRequestScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const [correo, setCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [modalState, setModalState] = useState({
    visible: false,
    variant: 'info',
    title: '',
    message: '',
    onConfirm: null,
  });

  const handleEnviarCodigo = async () => {
    const clean = String(correo || '').trim().toLowerCase();
    if (!clean) {
      setModalState({
        visible: true,
        variant: 'warning',
        title: 'Campo obligatorio',
        message: 'Por favor introduce tu correo electrónico para enviarte el código de seguridad.',
        onConfirm: null,
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) {
      setModalState({
        visible: true,
        variant: 'error',
        title: 'Correo electrónico inválido',
        message: 'Verifica que el correo electrónico tenga un formato válido (ejemplo@dominio.com).',
        onConfirm: null,
      });
      return;
    }

    setEnviando(true);
    try {
      const res = await solicitarCodigoRecuperacionPassword(clean);
      setModalState({
        visible: true,
        variant: 'success',
        title: 'Código enviado a tu correo',
        message:
          res.mensaje ||
          'Si el correo ingresado está asociado a una cuenta elegible, hemos enviado un código de verificación de 6 dígitos a tu bandeja de entrada.',
        onConfirm: () => {
          setModalState((prev) => ({ ...prev, visible: false }));
          navigation.navigate('ForgotPasswordVerify', {
            email: clean,
            maskedEmail: res.correo_enmascarado,
          });
        },
      });
    } catch (error) {
      setModalState({
        visible: true,
        variant: 'error',
        title: 'No fue posible enviar la solicitud',
        message:
          error.message ||
          'Verifica tu conexión a internet e inténtalo nuevamente en unos instantes.',
        onConfirm: null,
      });
    } finally {
      setEnviando(false);
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
              onPress={() => navigation.navigate('Login')}
            >
              <Feather name="arrow-left" size={20} color={colors.textDark} />
            </TouchableOpacity>
            <View style={styles.stepPill}>
              <Text style={styles.stepPillText}>PASO 1 DE 3 • RECUPERACIÓN</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <View style={[styles.formCard, layout.cardShadow]}>
            <View style={styles.iconBanner}>
              <Feather name="mail" size={26} color={colors.primary} />
            </View>

            <Text style={[styles.title, { fontSize: layout.rf(24) }]}>
              Recuperar contraseña
            </Text>
            <Text style={styles.subtitle}>
              Introduce el correo electrónico asociado a tu cuenta. Te enviaremos un código de seguridad de 6 dígitos directamente a tu bandeja de entrada.
            </Text>

            <CustomInput
              label="Correo electrónico registrado"
              iconName="mail"
              value={correo}
              onChangeText={setCorreo}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="correo@ejemplo.com"
            />

            <View style={styles.infoNote}>
              <Feather name="shield" size={14} color={colors.primary} />
              <Text style={styles.infoNoteText}>
                Revisa tu bandeja principal y también la carpeta de Spam o Promociones.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleEnviarCodigo}
              disabled={enviando}
              activeOpacity={0.85}
            >
              {enviando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Enviar código a mi correo</Text>
                  <Feather name="send" size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backToLoginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Feather name="arrow-left" size={15} color={colors.textDark} />
            <Text style={styles.backToLoginText}>Regresar al inicio de sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <ValidationModal
        visible={modalState.visible}
        variant={modalState.variant}
        title={modalState.title}
        message={modalState.message}
        primaryText={modalState.onConfirm ? 'Ingresar código recibido' : 'Entendido'}
        onPrimaryPress={
          modalState.onConfirm ||
          (() => setModalState((prev) => ({ ...prev, visible: false })))
        }
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
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FBF8F5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  infoNoteText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 12,
    color: colors.textGray,
    lineHeight: 17,
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
  backToLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    marginTop: 10,
  },
  backToLoginText: {
    color: colors.textDark,
    fontSize: 13.5,
    fontWeight: '700',
  flexShrink: 1 },
});
