/**
 * Archivo: src/screens/ClientRegistrationScreen.js
 * Registro de Cliente con selección de fotografía desde el dispositivo (expo-image-picker)
 * y subida a Supabase Storage, sin campos de texto para pegar URLs y sin modales invasivos.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  colors,
  sessionStore,
  callBackendApi,
  BARRIOS_DISPONIBLES,
  seleccionarYSubirFotografiaDispositivo,
  obtenerUbicacionExactaGPS,
  useResponsiveLayout,
} from '../theme/colors';

export default function ClientRegistrationScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [barrio, setBarrio] = useState(BARRIOS_DISPONIBLES[0]);
  const [direccion, setDireccion] = useState('');
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);

  // Estado de fotografía seleccionada desde el dispositivo
  const [fotoUrl, setFotoUrl] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [progresoFoto, setProgresoFoto] = useState(0);

  const [aceptaTerminos, setAceptaTerminos] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    obtenerUbicacionExactaGPS('cliente').then((gps) => {
      if (gps?.direccion && !direccion) setDireccion(gps.direccion);
      if (gps?.barrio) setBarrio(gps.barrio);
    });
  }, []);

  const handleSeleccionarFotoDispositivo = async () => {
    setErrorMsg('');
    setSubiendoFoto(true);
    setProgresoFoto(10);
    try {
      const resultado = await seleccionarYSubirFotografiaDispositivo({
        carpeta: 'clientes',
        onProgress: (p) => setProgresoFoto(p),
      });
      if (resultado && resultado.urlPublica) {
        setFotoUrl(resultado.urlPublica);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al seleccionar la fotografía desde el dispositivo.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleEliminarFoto = () => {
    setFotoUrl(null);
    setProgresoFoto(0);
  };

  const handleRegistrarCliente = async () => {
    if (!nombre.trim() || !correo.trim() || !telefono.trim() || !password.trim()) {
      setErrorMsg('Completa tu nombre, correo electrónico, celular y contraseña.');
      return;
    }
    if (!fotoUrl) {
      setErrorMsg('Selecciona una fotografía de perfil desde tu dispositivo.');
      return;
    }
    if (password.trim().length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!aceptaTerminos) {
      setErrorMsg('Debes aceptar los Términos y Condiciones para continuar.');
      return;
    }

    setCargando(true);
    setErrorMsg('');

    const telefonoFormateado = telefono.trim().startsWith('+')
      ? telefono.trim()
      : `+57${telefono.trim().replace(/\s+/g, '')}`;

    try {
      const resp = await callBackendApi('/auth/register/client', 'POST', {
        nombre_completo: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        password: password.trim(),
        telefono: telefonoFormateado,
        barrio,
        direccion_principal: direccion.trim(),
        foto_perfil_url: fotoUrl,
      });

      sessionStore.selectedRole = 'cliente';
      sessionStore.isAuthenticated = true;
      sessionStore.activeRoleSession = 'cliente';
      sessionStore.token = resp?.token || `token-cliente-${Date.now()}`;
      sessionStore.clientUser = {
        ...sessionStore.clientUser,
        id: resp?.usuario?.id || null,
        nombre_completo: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        telefono: telefonoFormateado,
        barrio,
        direccion_principal: direccion.trim(),
        foto_perfil_url: fotoUrl,
      };

      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error al registrar tu cuenta.');
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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <View style={styles.pill}>
            <Feather name="user-check" size={13} color={colors.primary} />
            <Text style={styles.pillText}>REGISTRO DE CLIENTE</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.heading}>Crea tu Cuenta de Cliente</Text>
          <Text style={styles.description}>
            Completa tus datos reales y selecciona tu fotografía de perfil desde tu dispositivo.
          </Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={16} color="#C0392B" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Selector de Fotografía desde el Dispositivo */}
        <View style={styles.photoCard}>
          {fotoUrl ? (
            <Image source={{ uri: fotoUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Feather name="image" size={26} color={colors.textGray} />
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.photoTitle}>Fotografía de perfil *</Text>
            <Text style={styles.photoSub}>
              {subiendoFoto
                ? `Subiendo al almacenamiento (${progresoFoto}%)...`
                : fotoUrl
                ? 'Fotografía cargada desde tu dispositivo'
                : 'Selecciona una imagen desde la galería de tu teléfono'}
            </Text>

            {subiendoFoto && (
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progresoFoto}%` }]} />
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <TouchableOpacity
                style={styles.changePhotoBtn}
                onPress={handleSeleccionarFotoDispositivo}
                disabled={subiendoFoto}
              >
                <Feather name="upload" size={13} color={colors.primary} />
                <Text style={styles.changePhotoText}>
                  {fotoUrl ? 'Cambiar fotografía' : 'Seleccionar del dispositivo'}
                </Text>
              </TouchableOpacity>

              {fotoUrl && !subiendoFoto && (
                <TouchableOpacity style={styles.removePhotoBtn} onPress={handleEliminarFoto}>
                  <Feather name="trash-2" size={13} color="#C0392B" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <Text style={styles.label}>Nombre y Apellidos *</Text>
        <View style={styles.inputContainer}>
          <Feather name="user" size={18} color={colors.textGray} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ingresa tu nombre completo"
            placeholderTextColor="#A0A0A0"
          />
        </View>

        <Text style={styles.label}>Correo Electrónico *</Text>
        <View style={styles.inputContainer}>
          <Feather name="mail" size={18} color={colors.textGray} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={correo}
            onChangeText={setCorreo}
            placeholder="correo@ejemplo.com"
            placeholderTextColor="#A0A0A0"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.label}>Teléfono Celular (+57) *</Text>
        <View style={styles.inputContainer}>
          <Feather name="phone" size={18} color={colors.textGray} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={telefono}
            onChangeText={setTelefono}
            placeholder="300 000 0000"
            keyboardType="phone-pad"
            placeholderTextColor="#A0A0A0"
          />
        </View>

        <Text style={styles.label}>Zona / Barrio *</Text>
        <View style={styles.pillsRow}>
          {BARRIOS_DISPONIBLES.map((b) => (
            <TouchableOpacity
              key={b}
              style={[styles.barrioChip, barrio === b && styles.barrioChipActive]}
              onPress={() => setBarrio(b)}
            >
              <Text style={[styles.barrioChipText, barrio === b && { color: '#FFFFFF' }]}>
                {b}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Dirección principal para servicios a domicilio *</Text>
        <View style={styles.inputContainer}>
          <Feather name="map-pin" size={18} color={colors.textGray} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={direccion}
            onChangeText={setDireccion}
            placeholder="Ingresa tu dirección exacta"
            placeholderTextColor="#A0A0A0"
          />
        </View>

        <Text style={styles.label}>Contraseña de acceso *</Text>
        <View style={styles.inputContainer}>
          <Feather name="lock" size={18} color={colors.textGray} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#A0A0A0"
            secureTextEntry={!verClave}
          />
          <TouchableOpacity onPress={() => setVerClave(!verClave)} style={{ padding: 5 }}>
            <Feather name={verClave ? 'eye-off' : 'eye'} size={18} color={colors.textGray} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAceptaTerminos(!aceptaTerminos)}
        >
          <View style={[styles.checkbox, aceptaTerminos && styles.checkboxActive]}>
            {aceptaTerminos && <Feather name="check" size={12} color="#FFFFFF" />}
          </View>
          <Text style={styles.checkboxLabel}>
            Acepto los Términos y Condiciones y la Política de Privacidad.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mainButton}
          onPress={handleRegistrarCliente}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.mainButtonText}>Crear Cuenta de Cliente</Text>
              <Feather name="arrow-right" size={18} color="#FFF" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { paddingTop: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  titleSection: { marginBottom: 18 },
  heading: { fontSize: 24, fontWeight: '800', color: colors.textDark, marginBottom: 6 },
  description: { fontSize: 13.5, color: colors.textGray, lineHeight: 20 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDEDEC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: { flex: 1, fontSize: 12.5, color: '#C0392B', fontWeight: '600' },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  avatarImg: { width: 68, height: 68, borderRadius: 34 },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoTitle: { fontSize: 13.5, fontWeight: '700', color: colors.textDark },
  photoSub: { fontSize: 11.5, color: colors.textGray, marginTop: 2 },
  progressBarBg: {
    width: '100%',
    height: 5,
    backgroundColor: '#EAE4DC',
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: colors.primary },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F6EFEB',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  changePhotoText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  removePhotoBtn: {
    backgroundColor: '#FDEDEC',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 12, fontWeight: '700', color: colors.textDark, marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: colors.textDark },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  barrioChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  barrioChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  barrioChipText: { fontSize: 12, fontWeight: '700', color: colors.textDark },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: { backgroundColor: colors.primary },
  checkboxLabel: { flex: 1, fontSize: 12.5, color: colors.textGray },
  mainButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
