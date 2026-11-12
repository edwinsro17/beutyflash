/**
 * Archivo: src/screens/LoginScreen.js
 * Inicio de Sesión conectado a Supabase con persistencia automática de sesión,
 * limpieza de datos de cuentas anteriores y redirección según el rol real en base de datos.
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

export default function LoginScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const initialRole = route?.params?.role || sessionStore.selectedRole || 'cliente';
  const [rolSeleccionado, setRolSeleccionado] = useState(initialRole);
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  const cambiarPerfil = (nuevoRol) => {
    setRolSeleccionado(nuevoRol);
    sessionStore.selectedRole = nuevoRol;
    setMensajeError('');
  };

  const handleIniciarSesion = async () => {
    if (!identificador.trim()) {
      setMensajeError('Por favor ingresa tu correo electrónico o teléfono celular.');
      return;
    }
    if (!password.trim()) {
      setMensajeError('Por favor ingresa tu contraseña.');
      return;
    }

    setCargando(true);
    setMensajeError('');

    try {
      const respuesta = await callBackendApi('/auth/login', 'POST', {
        identificador: identificador.trim(),
        password: password.trim(),
        rol_preferido: rolSeleccionado,
      });

      if (respuesta && respuesta.exito && respuesta.usuario) {
        const u = respuesta.usuario;
        const rolReal = u.rol || rolSeleccionado;

        // Limpiar cualquier estado en memoria de otra sesión anterior antes de hidratar la nueva
        limpiarDatosUsuarioEnMemoria();

        sessionStore.isAuthenticated = true;
        sessionStore.activeRoleSession = rolReal;
        sessionStore.selectedRole = rolReal;
        sessionStore.token = respuesta.token;

        await guardarSesionPersistente({
          usuarioId: u.id,
          token: respuesta.token,
        });

        if (rolReal === 'profesional') {
          sessionStore.proUser = {
            ...sessionStore.proUser,
            ...(u.perfil_profesional || {}),
            id: u.perfil_profesional?.id || u.id,
            usuario_id: u.id,
            nombre_completo: u.nombre_completo || u.nombre,
            nombre_artistico: u.nombre_artistico || u.nombre_completo || u.nombre,
            correo: u.correo || u.email,
            telefono: u.telefono || '',
            barrio: u.barrio || '',
            foto_perfil_url: u.foto_perfil_url || u.avatar_url || null,
            latitud_actual: u.latitud || null,
            longitud_actual: u.longitud || null,
          };
          navigation.reset({ index: 0, routes: [{ name: 'ProDashboard' }] });
          return;
        } else {
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
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          return;
        }
      } 
    } catch (error) {
      setMensajeError(error.message || 'No se pudo iniciar sesión. Verifica tus credenciales.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, layout.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('RoleSelection')}
          >
            <Feather name="arrow-left" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <View style={styles.pill}>
            <Text style={styles.pillText}>ACCESO SEGURO</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

       <View style={styles.titleSection}>
          <Text style={styles.subHeading}>AUTENTICACIÓN</Text>
          <Text style={styles.heading}>Iniciar Sesión</Text>
          <Text style={styles.description}>
            Ingresa tus credenciales registradas para acceder a tu cuenta.
          </Text>
        </View>
        
        <View style={styles.roleSelectorBox}>
          <TouchableOpacity
            style={[styles.roleBtn, rolSeleccionado === 'cliente' && styles.roleBtnActive]}
            onPress={() => cambiarPerfil('cliente')}
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
            >
              Cliente
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleBtn, rolSeleccionado === 'profesional' && styles.roleBtnActive]}
            onPress={() => cambiarPerfil('profesional')}
          >
            <Feather
              name="briefcase"
              size={15}
              color={rolSeleccionado === 'profesional' ? '#FFFFFF' : colors.textDark}
            />
            <Text
              style={[
                styles.roleBtnText,
                rolSeleccionado === 'profesional' && styles.roleBtnTextActive,
              ]}
            >
              Profesional
            </Text>
          </TouchableOpacity>
        </View>

        {mensajeError ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={16} color="#C0392B" />
            <Text style={styles.errorText}>{mensajeError}</Text>
          </View>
        ) : null}

        <CustomInput
          label={`Correo electrónico o teléfono (${rolSeleccionado})`}
          iconName="mail"
          value={identificador}
          onChangeText={setIdentificador}
          autoCapitalize="none"
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
          style={styles.mainButton}
          onPress={handleIniciarSesion}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.mainButtonText}>
                Continuar como {rolSeleccionado === 'profesional' ? 'Profesional' : 'Cliente'}
              </Text>
              <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.dividerText}> ¿NO TIENES CUENTA? </Text>
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
            <Feather name="user-plus" size={15} color={colors.primary} />
            <Text style={styles.socialText}>Registro Cliente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => {
              sessionStore.selectedRole = 'profesional';
              navigation.navigate('SpecialistRegistration');
            }}
          >
            <Feather name="briefcase" size={15} color={colors.primary} />
            <Text style={styles.socialText}>Registro Profesional</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { paddingTop: 18, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  titleSection: { marginBottom: 18 },
  subHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
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
    marginBottom: 18,
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
  mainButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  mainButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 10, fontWeight: '700', color: colors.textGray, letterSpacing: 1 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialText: { fontSize: 13, fontWeight: '700', color: colors.textDark, marginLeft: 8 },
});   