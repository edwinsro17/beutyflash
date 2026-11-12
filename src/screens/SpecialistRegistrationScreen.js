/**
 * Archivo: src/screens/SpecialistRegistrationScreen.js
 * Registro de Profesional con selección de fotografía desde el dispositivo (expo-image-picker)
 * y subida a Supabase Storage, sin campos para pegar URL.
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
  BLOQUES_HORARIOS_ESTANDAR,
  seleccionarYSubirFotografiaDispositivo,
  obtenerUbicacionExactaGPS,
  useResponsiveLayout,
} from '../theme/colors';

export default function SpecialistRegistrationScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [barrio, setBarrio] = useState(BARRIOS_DISPONIBLES[0]);
  const [especialidadPrincipal, setEspecialidadPrincipal] = useState('Peluquería • Color');
  const [experiencia, setExperiencia] = useState('3a5');
  const [modalidad, setModalidad] = useState('ambos');

  const [fotoUrl, setFotoUrl] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [progresoFoto, setProgresoFoto] = useState(0);

  const [nombreEstablecimiento, setNombreEstablecimiento] = useState('');
  const [direccionEstablecimiento, setDireccionEstablecimiento] = useState('');
  const [diasAtencion, setDiasAtencion] = useState('Lunes a Sábado');
  const [horaApertura, setHoraApertura] = useState('08:00 a.m.');
  const [horaCierre, setHoraCierre] = useState('07:00 p.m.');
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState([...BLOQUES_HORARIOS_ESTANDAR]);

  const [terminosAceptados, setTerminosAceptados] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const tieneEstablecimiento = modalidad === 'local' || modalidad === 'ambos';

  useEffect(() => {
    obtenerUbicacionExactaGPS('profesional').then((gps) => {
      if (gps?.direccion && !direccionEstablecimiento) {
        setDireccionEstablecimiento(gps.direccion);
      }
      if (gps?.barrio) setBarrio(gps.barrio);
    });
  }, []);

  const handleSeleccionarFotoDispositivo = async () => {
    setErrorMsg('');
    setSubiendoFoto(true);
    setProgresoFoto(10);
    try {
      const res = await seleccionarYSubirFotografiaDispositivo({
        carpeta: 'profesionales',
        onProgress: (p) => setProgresoFoto(p),
      });
      if (res && res.urlPublica) {
        setFotoUrl(res.urlPublica);
      }
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo cargar la fotografía desde el dispositivo.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const toggleBloqueHorario = (h) => {
    if (bloquesSeleccionados.includes(h)) {
      if (bloquesSeleccionados.length > 1) {
        setBloquesSeleccionados(bloquesSeleccionados.filter((item) => item !== h));
      }
    } else {
      setBloquesSeleccionados([...bloquesSeleccionados, h]);
    }
  };

  const handleRegistrarProfesional = async () => {
    if (!nombre.trim() || !correo.trim() || !telefono.trim() || !password.trim()) {
      setErrorMsg('Completa tu nombre completo, correo profesional, celular y contraseña.');
      return;
    }
    if (!fotoUrl) {
      setErrorMsg('Selecciona una fotografía de perfil desde tu dispositivo.');
      return;
    }
    if (password.trim().length < 6) {
      setErrorMsg('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    if (tieneEstablecimiento && !nombreEstablecimiento.trim()) {
      setErrorMsg('Ingresa el nombre de tu establecimiento o salón.');
      return;
    }

    setCargando(true);
    setErrorMsg('');

    const telefonoFormateado = telefono.trim().startsWith('+')
      ? telefono.trim()
      : `+57${telefono.trim().replace(/\s+/g, '')}`;

    try {
      const resp = await callBackendApi('/auth/register/professional', 'POST', {
        nombre_completo: nombre.trim(),
        nombre_artistico: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        password: password.trim(),
        telefono: telefonoFormateado,
        foto_perfil_url: fotoUrl,
        barrio,
        tiene_establecimiento: tieneEstablecimiento,
        nombre_establecimiento: nombreEstablecimiento.trim(),
        direccion_establecimiento: direccionEstablecimiento.trim(),
        dias_atencion: diasAtencion,
        horario_apertura: horaApertura,
        horario_cierre: horaCierre,
        bloques_horarios: bloquesSeleccionados,
        especialidades: [especialidadPrincipal],
        anios_experiencia: experiencia === '5mas' ? 6 : 3,
        modalidad,
      });

      sessionStore.selectedRole = 'profesional';
      sessionStore.isAuthenticated = true;
      sessionStore.activeRoleSession = 'profesional';
      sessionStore.token = resp?.token || `token-pro-${Date.now()}`;
      sessionStore.proUser = {
        ...sessionStore.proUser,
        id: resp?.usuario?.perfil_profesional?.id || resp?.usuario?.id || null,
        usuario_id: resp?.usuario?.id || null,
        nombre_completo: nombre.trim(),
        nombre_artistico: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        telefono: telefonoFormateado,
        foto_perfil_url: fotoUrl,
        barrio,
        especialidades: [especialidadPrincipal],
        modalidad,
        tiene_establecimiento: tieneEstablecimiento,
        nombre_establecimiento: nombreEstablecimiento.trim(),
        direccion_base: direccionEstablecimiento.trim(),
        horario_atencion: {
          dias: diasAtencion,
          apertura: horaApertura,
          cierre: horaCierre,
          bloques_disponibles: bloquesSeleccionados,
        },
        estado_verificacion: 'aprobado',
      };

      navigation.reset({ index: 0, routes: [{ name: 'ProDashboard' }] });
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo registrar la cuenta profesional.');
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
            <Feather name="chevron-left" size={22} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registro Profesional</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.heading}>Crea tu Cuenta Profesional</Text>
        <Text style={styles.description}>
          Selecciona tu fotografía desde el dispositivo y configura tu ubicación y horario de atención.
        </Text>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={16} color="#C0392B" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Fotografía desde el dispositivo */}
        <View style={styles.photoCard}>
          {fotoUrl ? (
            <Image source={{ uri: fotoUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Feather name="image" size={26} color={colors.textGray} />
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.photoTitle}>Fotografía profesional *</Text>
            <Text style={styles.photoSub}>
              {subiendoFoto
                ? `Subiendo imagen (${progresoFoto}%)...`
                : fotoUrl
                ? 'Fotografía cargada desde tu dispositivo'
                : 'Selecciona una fotografía desde la galería de tu teléfono'}
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
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => setFotoUrl(null)}
                >
                  <Feather name="trash-2" size={13} color="#C0392B" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Nombre y Apellidos completos *</Text>
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

          <Text style={styles.label}>Correo electrónico profesional *</Text>
          <View style={styles.inputContainer}>
            <Feather name="at-sign" size={18} color={colors.textGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={correo}
              onChangeText={setCorreo}
              placeholder="profesional@ejemplo.com"
              placeholderTextColor="#A0A0A0"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Teléfono celular (+57) *</Text>
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

          <Text style={styles.label}>Contraseña segura *</Text>
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

          <Text style={styles.label}>Barrio / Zona de Cobertura *</Text>
          <View style={styles.pillsContainer}>
            {BARRIOS_DISPONIBLES.map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.pill, barrio === b && styles.pillActive]}
                onPress={() => setBarrio(b)}
              >
                <Text style={[styles.pillText, barrio === b && styles.pillTextActive]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Modalidad de trabajo *</Text>
          {[
            { id: 'domicilio', label: 'Solo a domicilio' },
            { id: 'local', label: 'En establecimiento físico' },
            { id: 'ambos', label: 'Ambas modalidades (Establecimiento y Domicilio)' },
          ].map((opt) => {
            const active = modalidad === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.radioRow, active && styles.radioRowActive]}
                onPress={() => setModalidad(opt.id)}
              >
                <Feather
                  name={active ? 'check-circle' : 'circle'}
                  size={18}
                  color={active ? colors.primary : colors.textGray}
                />
                <Text style={styles.radioText}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}

          {tieneEstablecimiento && (
            <View style={styles.establishmentBox}>
              <Text style={styles.estHeader}>HORARIO DE ATENCIÓN DEL ESTABLECIMIENTO</Text>
              <Text style={styles.label}>Nombre del Establecimiento *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={nombreEstablecimiento}
                  onChangeText={setNombreEstablecimiento}
                  placeholder="Nombre de tu salón o estudio"
                />
              </View>

              <Text style={styles.label}>Dirección del Establecimiento *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={direccionEstablecimiento}
                  onChangeText={setDireccionEstablecimiento}
                  placeholder="Dirección exacta del local"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Hora Apertura *</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={horaApertura}
                      onChangeText={setHoraApertura}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Hora Cierre *</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={horaCierre}
                      onChangeText={setHoraCierre}
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.label}>Bloques de Horario Disponibles *</Text>
              <View style={styles.pillsContainer}>
                {BLOQUES_HORARIOS_ESTANDAR.map((h) => {
                  const sel = bloquesSeleccionados.includes(h);
                  return (
                    <TouchableOpacity
                      key={h}
                      style={[styles.pill, sel && styles.pillActive]}
                      onPress={() => toggleBloqueHorario(h)}
                    >
                      <Text style={[styles.pillText, sel && styles.pillTextActive]}>{h}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.mainBtn}
          onPress={handleRegistrarProfesional}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.mainBtnText}>Completar Registro Profesional</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { paddingTop: 14, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  heading: { fontSize: 24, fontWeight: '800', color: colors.textDark, marginBottom: 6 },
  description: { fontSize: 13, color: colors.textGray, lineHeight: 19, marginBottom: 16 },
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
  section: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  label: { fontSize: 12, fontWeight: '700', color: colors.textDark, marginBottom: 6 },
  inputContainer: {
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
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 13.5, color: colors.textDark },
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8F6F4',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 12, fontWeight: '700', color: colors.textDark },
  pillTextActive: { color: '#FFFFFF' },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  radioRowActive: { borderColor: colors.primary, backgroundColor: '#FDECE7' },
  radioText: { fontSize: 13, fontWeight: '700', color: colors.textDark },
  establishmentBox: {
    marginTop: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FAF5F2',
    borderWidth: 1,
    borderColor: '#E6D5CC',
  },
  estHeader: { fontSize: 11, fontWeight: '800', color: colors.primary, marginBottom: 10 },
  mainBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
