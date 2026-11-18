/**
 * Archivo: src/screens/LoginScreen.js
 * Módulo 1 y Módulo 2:
 * - Única pantalla de inicio de sesión adaptable para iOS y Android (con KeyboardAvoidingView y flexShrink).
 * - Mensajes de error genéricos que no revelan si un correo existe o no.
 * - Enlace directo al flujo de recuperación por correo electrónico (`ForgotPasswordRequest`).
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
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  colors,
  sessionStore,
  callBackendApi,
  limpiarDatosUsuarioEnMemoria,
  guardarSesionPersistente,
  useResponsiveLayout,
} from '../theme/colors';
import CustomInput from '../components/CustomInput';
import ValidationModal from '../components/ui/ValidationModal';

export default function LoginScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const initialRole = route?.params?.role || sessionStore.selectedRole || 'cliente';
  const [rolSeleccionado, setRolSeleccionado] = useState(initialRole);
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [modalError, setModalError] = useState({
    visible: false,
    variant: 'error',
    title: '',
    message: '',
  });

  const cambiarPerfil = (nuevoRol) => {
    setRolSeleccionado(nuevoRol);
    sessionStore.selectedRole = nuevoRol;
  };

  const handleIniciarSesion = async () => {
    const cleanIdent = identificador.trim();
    if (!cleanIdent || !password.trim()) {
      setModalError({
        visible: true,
        variant: 'warning',
        title: 'Campos obligatorios',
        message: 'Ingresa tu correo electrónico y tu contraseña para continuar.',
      });
      return;
    }

    setCargando(true);
    try {
      const respuesta = await callBackendApi('/auth/login', 'POST', {
        identificador: cleanIdent,
        email: cleanIdent,
        password: password.trim(),
        rol_preferido: rolSeleccionado,
      });

      if (respuesta && respuesta.exito && respuesta.usuario) {
        const u = respuesta.usuario;
        const roles = Array.isArray(respuesta.roles || u.roles)
          ? respuesta.roles || u.roles
          : u.rol === 'profesional'
          ? ['CLIENT', 'PROFESSIONAL']
          : ['CLIENT'];

        const modoInicial =
          rolSeleccionado === 'profesional' && roles.includes('PROFESSIONAL')
            ? 'profesional'
            : u.rol === 'profesional' && roles.includes('PROFESSIONAL')
            ? 'profesional'
            : 'cliente';

        limpiarDatosUsuarioEnMemoria();

        sessionStore.userId = u.id;
        sessionStore.roles = roles;
        sessionStore.isAuthenticated = true;
        sessionStore.activeRoleSession = modoInicial;
        sessionStore.selectedRole = modoInicial;
        sessionStore.token = respuesta.token;

        sessionStore.clientUser = {
          ...sessionStore.clientUser,
          id: u.id,
          nombre_completo: u.nombre_completo || u.nombre,
          correo: u.correo || u.email,
          telefono: u.telefono || '',
          barrio: u.barrio || '',
          direccion_principal: u.direccion_principal || '',
          foto_perfil_url: u.foto_perfil_url || u.avatar_url || null,
          latitud: u.latitud || null,
          longitud: u.longitud || null,
        };

        if (roles.includes('PROFESSIONAL') || u.perfil_profesional) {
          sessionStore.proUser = {
            ...sessionStore.proUser,
            ...(u.perfil_profesional || {}),
            id: u.perfil_profesional?.id || u.id,
            usuario_id: u.id,
            nombre_completo: u.nombre_completo || u.nombre,
            nombre_artistico:
              u.nombre_artistico ||
              u.perfil_profesional?.nombre_artistico ||
              u.nombre_completo ||
              u.nombre,
            correo: u.correo || u.email,
            telefono: u.telefono || '',
            barrio: u.barrio || u.perfil_profesional?.barrio || '',
            foto_perfil_url: u.foto_perfil_url || u.avatar_url || null,
            latitud_actual: u.latitud || null,
            longitud_actual: u.longitud || null,
            approval_status: u.perfil_profesional?.approval_status || 'APPROVED',
          };
        }

        await guardarSesionPersistente({
          usuarioId: u.id,
          token: respuesta.token,
          selectedMode: modoInicial,
        });

        if (modoInicial === 'profesional') {
          navigation.reset({ index: 0, routes: [{ name: 'ProDashboard' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }
        return;
      }

      throw new Error(
        'No fue posible iniciar sesión. Verifica tus datos e inténtalo nuevamente.'
      );
    } catch (error) {
      setModalError({
        visible: true,
        variant: 'error',
        title: 'No fue posible iniciar sesión',
        message:
          error.message ||
          'No fue posible iniciar sesión. Verifica tus datos e inténtalo nuevamente.',
      });
    } finally {
      setCargando(false);
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
          contentContainerStyle={[styles.scrollContainer, layout.contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backButton, layout.cardShadow]}
              onPress={() => navigation.navigate('RoleSelection')}
            >
              <Feather name="arrow-left" size={20} color={colors.textDark} />
            </TouchableOpacity>
            <View style={styles.pill}>
              <Text style={styles.pillText}>ACCESO UNIFICADO SEGURO</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <View style={[styles.authCard, layout.cardShadow]}>
            <Text style={styles.subHeading}>CUENTA ÚNICA BEAUTYFLASH</Text>
            <Text style={[styles.heading, { fontSize: layout.rf(26) }]}>
              Iniciar Sesión
            </Text>
            <Text style={styles.description}>
              Usa una sola cuenta para contratar servicios como cliente o gestionar tu actividad como profesional.
            </Text>

            <View style={styles.roleSelectorBox}>
              <TouchableOpacity
                style={[
                  styles.roleBtn,
                  rolSeleccionado === 'cliente' && styles.roleBtnActive,
                ]}
                onPress={() => cambiarPerfil('cliente')}
                activeOpacity={0.85}
              >
                <Feather
                  name="search"
                  size={15}
                  color={rolSeleccionado === 'cliente' ? '#FFFFFF' : colors.textDark}
                />
                <Text
                  style={[
                    styles.roleBtnText,
                    rolSeleccionado === 'cliente' && styles.roleBtnTextActive,
                  ]}
                  numberOfLines={1}
                >
                  Modo Cliente
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleBtn,
                  rolSeleccionado === 'profesional' && styles.roleBtnActive,
                ]}
                onPress={() => cambiarPerfil('profesional')}
                activeOpacity={0.85}
              >
                <Feather
                  name="briefcase"
                  size={15}
                  color={
                    rolSeleccionado === 'profesional' ? '#FFFFFF' : colors.textDark
                  }
                />
                <Text
                  style={[
                    styles.roleBtnText,
                    rolSeleccionado === 'profesional' && styles.roleBtnTextActive,
                  ]}
                  numberOfLines={1}
                >
                  Modo Profesional
                </Text>
              </TouchableOpacity>
            </View>

            <CustomInput
              label="Correo electrónico"
              iconName="mail"
              value={identificador}
              onChangeText={setIdentificador}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="correo@ejemplo.com"
            />

            <CustomInput
              label="Contraseña"
              iconName="lock"
              value={password}
              onChangeText={setPassword}
              placeholder="Ingresa tu contraseña"
              secureTextEntry={!verClave}
              rightIconName={verClave ? 'eye-off' : 'eye'}
              onRightIconPress={() => setVerClave(!verClave)}
            />

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => navigation.navigate('ForgotPasswordRequest')}
            >
              <Feather name="mail" size={14} color={colors.primary} />
              <Text style={styles.forgotBtnText}>
                ¿Olvidaste tu contraseña? Recibir código por correo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mainButton}
              onPress={handleIniciarSesion}
              disabled={cargando}
              activeOpacity={0.85}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.mainButtonText}>
                    Continuar en {rolSeleccionado === 'profesional' ? 'Modo Profesional' : 'Modo Cliente'}
                  </Text>
                  <Feather name="arrow-right" size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.dividerText}> ¿NUEVO EN BEAUTYFLASH? </Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[styles.socialButton, layout.cardShadow]}
              onPress={() => {
                sessionStore.selectedRole = 'cliente';
                navigation.navigate('ClientRegistration');
              }}
            >
              <Feather name="user-plus" size={15} color={colors.primary} />
              <Text style={styles.socialText} numberOfLines={1}>
                Cuenta Cliente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, layout.cardShadow]}
              onPress={() => {
                sessionStore.selectedRole = 'profesional';
                navigation.navigate('SpecialistRegistration');
              }}
            >
              <Feather name="briefcase" size={15} color={colors.primary} />
              <Text style={styles.socialText} numberOfLines={1}>
                Cuenta Profesional
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ValidationModal
        visible={modalError.visible}
        variant={modalError.variant}
        title={modalError.title}
        message={modalError.message}
        onClose={() => setModalError((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { paddingTop: 14, paddingBottom: 38 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pill: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 0.8 , flexShrink: 1 },
  authCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 22,
  },
  subHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heading: { fontWeight: '800', color: colors.textDark, marginBottom: 6 },
  description: { fontSize: 13.5, color: colors.textGray, lineHeight: 19, marginBottom: 16 },
  roleSelectorBox: {
    flexDirection: 'row',
    backgroundColor: '#EBE6E0',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  roleBtnActive: { backgroundColor: colors.primary },
  roleBtnText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
  },
  roleBtnTextActive: { color: '#FFFFFF' },
  forgotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingVertical: 6,
    marginBottom: 10,
  },
  forgotBtnText: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'right',
  },
  mainButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    borderRadius: 14,
    minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  mainButtonText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 10, fontWeight: '800', color: colors.textGray, letterSpacing: 0.8 , flexShrink: 1 },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    minHeight: 46,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  socialText: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.textDark,
  },
});
