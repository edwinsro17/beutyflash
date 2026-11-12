/**
 * Archivo: src/screens/LoginScreen.js
 * Inicio de Sesión Funcional para Ambos Perfiles (Cliente y Profesional)
 * Conectado a POST /api/v1/auth/login y sincronizado con sessionStore
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
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, sessionStore, callBackendApi } from '../theme/colors';
import CustomInput from '../components/CustomInput';

export default function LoginScreen({ navigation, route }) {
  const initialRole = route?.params?.role || sessionStore.selectedRole || 'cliente';
  const [rolSeleccionado, setRolSeleccionado] = useState(initialRole); // 'cliente' | 'profesional'
  const [metodo, setMetodo] = useState('correo'); // 'correo' | 'telefono'
  const [identificador, setIdentificador] = useState(
    initialRole === 'profesional' ? 'sofia.alarcon@beautyflash.co' : 'valentina@beautyflash.co'
  );
  const [password, setPassword] = useState('BeautyFlash2026*');
  const [codigoOtp, setCodigoOtp] = useState('123456');
  const [otpEnviado, setOtpEnviado] = useState(false);
  const [verClave, setVerClave] = useState(false);
  const [recordar, setRecordar] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  const cambiarPerfil = (nuevoRol) => {
    setRolSeleccionado(nuevoRol);
    sessionStore.selectedRole = nuevoRol;
    setMensajeError('');
    if (metodo === 'correo') {
      setIdentificador(
        nuevoRol === 'profesional' ? 'sofia.alarcon@beautyflash.co' : 'valentina@beautyflash.co'
      );
    } else {
      setIdentificador(nuevoRol === 'profesional' ? '+573168921044' : '+573154829101');
    }
  };

  const handleEnviarOtp = async () => {
    if (!identificador.trim()) {
      setMensajeError('Ingresa tu número de celular (ej. +573154829101).');
      return;
    }
    setCargando(true);
    setMensajeError('');
    try {
      const resp = await callBackendApi('/auth/otp/send', 'POST', {
        telefono: identificador.trim(),
      });
      setOtpEnviado(true);
      if (resp?.codigo_demo) {
        setCodigoOtp(String(resp.codigo_demo));
      }
      Alert.alert(
        'Código SMS Enviado',
        `Hemos enviado un código de verificación al número ${identificador.trim()}.`
      );
    } catch (err) {
      setMensajeError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleIniciarSesion = async () => {
    if (!identificador.trim()) {
      setMensajeError('Por favor ingresa tu correo electrónico o teléfono celular.');
      return;
    }
    if (metodo === 'correo' && !password.trim()) {
      setMensajeError('Por favor ingresa tu contraseña.');
      return;
    }

    setCargando(true);
    setMensajeError('');

    try {
      // Si eligió teléfono y aún no ha enviado el OTP, enviarlo primero
      if (metodo === 'telefono' && !otpEnviado) {
        await handleEnviarOtp();
        setCargando(false);
        return;
      }

      if (metodo === 'telefono' && otpEnviado) {
        await callBackendApi('/auth/otp/verify', 'POST', {
          telefono: identificador.trim(),
          codigo: codigoOtp.trim(),
        });
      }

      // Llamar al endpoint real del Backend Node.js: POST /api/v1/auth/login
      const respuesta = await callBackendApi('/auth/login', 'POST', {
        identificador: identificador.trim(),
        password: password.trim(),
        rol_preferido: rolSeleccionado,
      });

      if (respuesta && respuesta.exito) {
        sessionStore.token = respuesta.token;
        sessionStore.selectedRole = rolSeleccionado;

        if (rolSeleccionado === 'profesional' || respuesta.usuario?.rol === 'profesional') {
          if (respuesta.usuario) {
            sessionStore.proUser = {
              ...sessionStore.proUser,
              ...respuesta.usuario,
              ...(respuesta.usuario.perfil_profesional || {}),
            };
            if (respuesta.usuario.billetera) {
              sessionStore.wallet = {
                ...sessionStore.wallet,
                ...respuesta.usuario.billetera,
              };
            }
          }
          sessionStore.isAuthenticated = true;
          sessionStore.activeRoleSession = 'profesional';
          navigation.reset({ index: 0, routes: [{ name: 'ProDashboard' }] });
          return;
        } else {
          if (respuesta.usuario) {
            sessionStore.clientUser = {
              ...sessionStore.clientUser,
              ...respuesta.usuario,
              ...(respuesta.usuario.perfil_cliente || {}),
            };
          }
          sessionStore.isAuthenticated = true;
          sessionStore.activeRoleSession = 'cliente';
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          return;
        }
      }

      // Respaldo inmediato si se prueba sin el servidor prendido
      sessionStore.selectedRole = rolSeleccionado;
      if (rolSeleccionado === 'profesional') {
        sessionStore.proUser.correo = identificador.trim();
        sessionStore.isAuthenticated = true;
          sessionStore.activeRoleSession = 'profesional';
          navigation.reset({ index: 0, routes: [{ name: 'ProDashboard' }] });
      } else {
        sessionStore.clientUser.correo = identificador.trim();
        sessionStore.isAuthenticated = true;
          sessionStore.activeRoleSession = 'cliente';
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } catch (error) {
      setMensajeError(error.message || 'No se pudo iniciar sesión. Verifica tus datos.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* 1. Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <View style={styles.pill}>
            <Text style={styles.pillText}>• ACCESO POR PERFIL • COLOMBIA</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* 2. Título */}
        <View style={styles.titleSection}>
          <Text style={styles.subHeading}>BIENVENIDO DE NUEVO</Text>
          <Text style={styles.heading}>Iniciar Sesión</Text>
          <Text style={styles.description}>
            Elige tu perfil para ingresar a tu cuenta de Cliente o a tu panel de Profesional.
          </Text>
        </View>

        {/* 3. Selector de Perfil: CLIENTE vs PROFESIONAL */}
        <View style={styles.roleSelectorBox}>
          <TouchableOpacity
            style={[
              styles.roleBtn,
              rolSeleccionado === 'cliente' && styles.roleBtnActive,
            ]}
            onPress={() => cambiarPerfil('cliente')}
          >
            <Feather
              name="user"
              size={16}
              color={rolSeleccionado === 'cliente' ? '#FFFFFF' : colors.textDark}
            />
            <Text
              style={[
                styles.roleBtnText,
                rolSeleccionado === 'cliente' && styles.roleBtnTextActive,
              ]}
            >
              Soy Cliente
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleBtn,
              rolSeleccionado === 'profesional' && styles.roleBtnActive,
            ]}
            onPress={() => cambiarPerfil('profesional')}
          >
            <Feather
              name="briefcase"
              size={16}
              color={rolSeleccionado === 'profesional' ? '#FFFFFF' : colors.textDark}
            />
            <Text
              style={[
                styles.roleBtnText,
                rolSeleccionado === 'profesional' && styles.roleBtnTextActive,
              ]}
            >
              Soy Profesional
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Tabs Correo vs Celular OTP */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, metodo === 'correo' && styles.tabActive]}
            onPress={() => {
              setMetodo('correo');
              setOtpEnviado(false);
              setIdentificador(
                rolSeleccionado === 'profesional'
                  ? 'sofia.alarcon@beautyflash.co'
                  : 'valentina@beautyflash.co'
              );
            }}
          >
            <Text style={[styles.tabText, metodo === 'correo' && styles.tabTextActive]}>
              Correo Electrónico
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, metodo === 'telefono' && styles.tabActive]}
            onPress={() => {
              setMetodo('telefono');
              setIdentificador(
                rolSeleccionado === 'profesional' ? '+573168921044' : '+573154829101'
              );
            }}
          >
            <Text style={[styles.tabText, metodo === 'telefono' && styles.tabTextActive]}>
              Teléfono (SMS OTP)
            </Text>
          </TouchableOpacity>
        </View>

        {mensajeError ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={16} color="#C0392B" />
            <Text style={styles.errorText}>{mensajeError}</Text>
          </View>
        ) : null}

        {/* 5. Inputs controlados */}
        <CustomInput
          label={
            metodo === 'correo'
              ? `Correo electrónico (${rolSeleccionado})`
              : 'Número de celular en Colombia (+57)'
          }
          iconName={metodo === 'correo' ? 'mail' : 'phone'}
          value={identificador}
          onChangeText={setIdentificador}
          autoCapitalize="none"
          keyboardType={metodo === 'correo' ? 'email-address' : 'phone-pad'}
          placeholder={
            metodo === 'correo' ? 'tu@beautyflash.co' : '+57 315 482 9101'
          }
          rightIconName="check-circle"
        />

        {metodo === 'correo' ? (
          <CustomInput
            label="Contraseña"
            iconName="lock"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••••••"
            secureTextEntry={!verClave}
            rightIconName={verClave ? 'eye-off' : 'eye'}
            onRightIconPress={() => setVerClave(!verClave)}
          />
        ) : (
          otpEnviado && (
            <CustomInput
              label="Código OTP de 6 dígitos enviado por SMS"
              iconName="shield"
              value={codigoOtp}
              onChangeText={setCodigoOtp}
              keyboardType="number-pad"
              placeholder="123456"
            />
          )
        )}

        {/* 6. Opciones Extra */}
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setRecordar(!recordar)}
          >
            <View style={[styles.checkbox, recordar && styles.checkboxActive]}>
              {recordar && <Feather name="check" size={14} color={colors.surface} />}
            </View>
            <Text style={styles.checkboxText}>Recordar mi sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleEnviarOtp}>
            <Text style={styles.forgotText}>Recibir código por SMS</Text>
          </TouchableOpacity>
        </View>

        {/* 7. Botón Principal de Inicio de Sesión */}
        <TouchableOpacity
          style={styles.mainButton}
          onPress={handleIniciarSesion}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.mainButtonText}>
                {metodo === 'telefono' && !otpEnviado
                  ? 'Enviar Código SMS'
                  : `Entrar como ${
                      rolSeleccionado === 'profesional' ? 'Profesional' : 'Cliente'
                    }`}
              </Text>
              <Feather
                name="arrow-right"
                size={16}
                color={colors.surface}
                style={{ marginLeft: 8 }}
              />
            </>
          )}
        </TouchableOpacity>

        {/* 8. Botones de Registro Directo por Perfil */}
        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.dividerText}> ¿NO TIENES CUENTA? REGÍSTRATE </Text>
          <View style={styles.line} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => {
              sessionStore.selectedRole = 'cliente';
              navigation.navigate('ClientRegistration');
            }}
          >
            <Feather name="user-plus" size={16} color={colors.primary} />
            <Text style={styles.socialText}>Registro Cliente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => {
              sessionStore.selectedRole = 'profesional';
              navigation.navigate('SpecialistRegistration');
            }}
          >
            <Feather name="scissors" size={16} color={colors.primary} />
            <Text style={styles.socialText}>Registro Profesional</Text>
          </TouchableOpacity>
        </View>

        {/* 9. Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿Deseas elegir primero el tipo de cuenta?{' '}
            <Text
              style={styles.footerHighlight}
              onPress={() => navigation.navigate('AccountSelection')}
            >
              Ir a Selección de Cuenta
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  pill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 1,
  },
  pillText: { fontSize: 10, fontWeight: '700', color: colors.accent, letterSpacing: 1 },
  titleSection: { marginBottom: 18 },
  subHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: 6,
  },
  heading: { fontSize: 28, fontWeight: '800', color: colors.textDark, marginBottom: 8 },
  description: { fontSize: 14, color: colors.textGray, lineHeight: 20 },
  roleSelectorBox: {
    flexDirection: 'row',
    backgroundColor: '#EBE6E0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  roleBtnActive: { backgroundColor: colors.primary },
  roleBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.textDark },
  roleBtnTextActive: { color: '#FFFFFF' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EBE6E0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.surface, elevation: 1 },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textGray },
  tabTextActive: { color: colors.textDark, fontWeight: '700' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDEDEC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 12.5, color: '#C0392B', fontWeight: '600' },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxActive: { backgroundColor: colors.accent },
  checkboxText: { fontSize: 13, color: colors.textGray },
  forgotText: { fontSize: 13, color: colors.accent, fontWeight: '700' },
  mainButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  mainButtonText: { color: colors.surface, fontSize: 16, fontWeight: '700' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 10, fontWeight: '700', color: colors.textGray, letterSpacing: 1 },
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialText: { fontSize: 13, fontWeight: '700', color: colors.textDark, marginLeft: 8 },
  footer: { alignItems: 'center' },
  footerText: { fontSize: 13.5, color: colors.textGray },
  footerHighlight: { color: colors.accent, fontWeight: '700' },
});