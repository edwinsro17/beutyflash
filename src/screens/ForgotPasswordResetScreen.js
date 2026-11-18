/**
 * Archivo: src/screens/ForgotPasswordResetScreen.js
 * Módulo 2.2 — SCREEN 3: Establecer Nueva Contraseña
 * - Campos: Nueva contraseña y Confirmar contraseña con opción de mostrar/ocultar.
 * - Indicador visual de seguridad y complejidad en tiempo real.
 * - Actualiza la contraseña con la sesión temporal de recuperación, invalida sesiones anteriores,
 *   muestra confirmación mediante modal elegante y redirige al Login.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  colors,
  sessionStore,
  evaluarSeguridadPassword,
  establecerNuevaPasswordRecuperada,
  useResponsiveLayout,
} from '../theme/colors';
import CustomInput from '../components/CustomInput';
import ValidationModal from '../components/ui/ValidationModal';

export default function ForgotPasswordResetScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const email = route?.params?.email || sessionStore.recoveryDraft?.email || '';
  const recoverySessionToken =
    route?.params?.recoverySessionToken ||
    sessionStore.recoveryDraft?.recoverySessionToken ||
    null;

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modalState, setModalState] = useState({
    visible: false,
    variant: 'info',
    title: '',
    message: '',
    isSuccess: false,
  });

  const seguridad = evaluarSeguridadPassword(nuevaPassword);

  const handleGuardarPassword = async () => {
    if (!nuevaPassword || !confirmarPassword) {
      setModalState({
        visible: true,
        variant: 'warning',
        title: 'Campos obligatorios',
        message: 'Completa la nueva contraseña y su confirmación.',
        isSuccess: false,
      });
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setModalState({
        visible: true,
        variant: 'error',
        title: 'Las contraseñas no coinciden',
        message: 'Asegúrate de escribir exactamente la misma contraseña en ambos campos.',
        isSuccess: false,
      });
      return;
    }

    if (!seguridad.valida) {
      setModalState({
        visible: true,
        variant: 'warning',
        title: 'Contraseña poco segura',
        message:
          'Tu contraseña debe contener al menos 8 caracteres e incluir letras y números.',
        isSuccess: false,
      });
      return;
    }

    setGuardando(true);
    try {
      const res = await establecerNuevaPasswordRecuperada({
        correo: email,
        recoverySessionToken,
        nuevaPassword,
        confirmarPassword,
      });

      setModalState({
        visible: true,
        variant: 'success',
        title: 'Contraseña actualizada',
        message:
          res.mensaje ||
          'Tu contraseña ha sido actualizada exitosamente y las sesiones anteriores fueron cerradas por seguridad.',
        isSuccess: true,
      });
    } catch (error) {
      setModalState({
        visible: true,
        variant: 'error',
        title: 'No se pudo actualizar',
        message:
          error.message ||
          'La sesión de recuperación ha expirado. Inicia el proceso nuevamente.',
        isSuccess: false,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={[styles.scroll, layout.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate('ForgotPasswordVerify', { email })}
          >
            <Feather name="arrow-left" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>PASO 3 DE 3</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.iconBanner}>
          <Feather name="lock" size={28} color={colors.primary} />
        </View>

        <Text style={styles.title}>Establecer nueva contraseña</Text>
        <Text style={styles.subtitle}>
          Crea una contraseña segura para tu cuenta. Al confirmar, cualquier sesión abierta anteriormente quedará invalidada.
        </Text>

        <CustomInput
          label="Nueva contraseña"
          iconName="lock"
          value={nuevaPassword}
          onChangeText={setNuevaPassword}
          placeholder="Mínimo 8 caracteres, letras y números"
          secureTextEntry={!verNueva}
          rightIconName={verNueva ? 'eye-off' : 'eye'}
          onRightIconPress={() => setVerNueva(!verNueva)}
        />

        {/* Indicador visual de seguridad de contraseña */}
        <View style={styles.meterBox}>
          <View style={styles.meterHeader}>
            <Text style={styles.meterLabel}>Nivel de seguridad:</Text>
            <Text style={[styles.meterValue, { color: seguridad.color }]}>
              {nuevaPassword ? seguridad.etiqueta : 'Sin evaluar'}
            </Text>
          </View>
          <View style={styles.meterTrack}>
            <View
              style={[
                styles.meterFill,
                {
                  width: `${nuevaPassword ? seguridad.porcentaje : 0}%`,
                  backgroundColor: seguridad.color,
                },
              ]}
            />
          </View>
          <View style={styles.rulesRow}>
            <Text
              style={[
                styles.ruleItem,
                seguridad.requisitos.longitudMinima && styles.ruleItemOk,
              ]}
            >
              • Mín. 8 caracteres
            </Text>
            <Text
              style={[
                styles.ruleItem,
                (seguridad.requisitos.tieneMayuscula ||
                  seguridad.requisitos.tieneMinuscula) &&
                  styles.ruleItemOk,
              ]}
            >
              • Letras
            </Text>
            <Text
              style={[
                styles.ruleItem,
                seguridad.requisitos.tieneNumero && styles.ruleItemOk,
              ]}
            >
              • Números
            </Text>
          </View>
        </View>

        <CustomInput
          label="Confirmar nueva contraseña"
          iconName="check-circle"
          value={confirmarPassword}
          onChangeText={setConfirmarPassword}
          placeholder="Repite tu nueva contraseña"
          secureTextEntry={!verConfirmar}
          rightIconName={verConfirmar ? 'eye-off' : 'eye'}
          onRightIconPress={() => setVerConfirmar(!verConfirmar)}
        />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleGuardarPassword}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.primaryBtnText}>Guardar nueva contraseña</Text>
              <Feather name="shield" size={16} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <ValidationModal
        visible={modalState.visible}
        variant={modalState.variant}
        title={modalState.title}
        message={modalState.message}
        primaryText={modalState.isSuccess ? 'Ir a Iniciar Sesión' : 'Entendido'}
        onPrimaryPress={() => {
          setModalState((prev) => ({ ...prev, visible: false }));
          if (modalState.isSuccess) {
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        }}
        onClose={() => setModalState((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPill: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  stepPillText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 1 , flexShrink: 1 },
  iconBanner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.textDark, marginBottom: 8 },
  subtitle: { fontSize: 13.5, color: colors.textGray, lineHeight: 20, marginBottom: 18 },
  meterBox: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  meterLabel: { fontSize: 11.5, fontWeight: '700', color: colors.textGray , flexShrink: 1 },
  meterValue: { fontSize: 11.5, fontWeight: '800' },
  meterTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EBE6E0',
    overflow: 'hidden',
    marginBottom: 8,
  },
  meterFill: { height: '100%', borderRadius: 3 },
  rulesRow: { flexDirection: 'row', gap: 12 },
  ruleItem: { fontSize: 11, color: colors.textGray, fontWeight: '600' },
  ruleItemOk: { color: '#1E824C', fontWeight: '800' },
  primaryBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 10,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '800' , flexShrink: 1 },
});
