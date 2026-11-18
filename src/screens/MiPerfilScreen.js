/**
 * Archivo: src/screens/MiPerfilScreen.js
 * Perfil del Profesional con selección de fotografía desde el dispositivo (expo-image-picker)
 * y subida a Supabase Storage. Cero emojis.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  colors,
  sessionStore,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  BARRIOS_DISPONIBLES,
  seleccionarYSubirFotografiaDispositivo,
  cerrarSesionActiva,
  useResponsiveLayout,
} from '../theme/colors';
import ModeSwitcherBanner from '../components/ui/ModeSwitcherBanner';
import { ProBottomNav } from './BilleteraScreen';

export default function MiPerfilScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const pro = sessionStore.proUser;
  const [fotoUrl, setFotoUrl] = useState(pro.foto_perfil_url);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [progresoFoto, setProgresoFoto] = useState(0);
  const [nombre, setNombre] = useState(pro.nombre_completo || '');
  const [nombreEst, setNombreEst] = useState(pro.nombre_establecimiento || '');
  const [telefono, setTelefono] = useState(pro.telefono || '');
  const [barrio, setBarrio] = useState(pro.barrio || '');
  const [apertura, setApertura] = useState(pro.horario_atencion?.apertura || '08:00 a.m.');
  const [cierre, setCierre] = useState(pro.horario_atencion?.cierre || '07:00 p.m.');
  const [mensajeGuardado, setMensajeGuardado] = useState('');

  const handleSeleccionarFotoDispositivo = async () => {
    setMensajeGuardado('');
    setSubiendoFoto(true);
    setProgresoFoto(15);
    try {
      const res = await seleccionarYSubirFotografiaDispositivo({
        carpeta: 'profesionales',
        usuarioId: pro.usuario_id || pro.id,
        onProgress: (p) => setProgresoFoto(p),
      });
      if (res && res.urlPublica) {
        setFotoUrl(res.urlPublica);
        sessionStore.proUser.foto_perfil_url = res.urlPublica;
        if (pro.correo) {
          await fetch(
            `${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(pro.correo)}`,
            {
              method: 'PATCH',
              headers: {
                apikey: SUPABASE_PUBLISHABLE_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ avatar_url: res.urlPublica }),
            }
          );
        }
        setMensajeGuardado('Fotografía actualizada correctamente.');
      }
    } catch (err) {
      setMensajeGuardado(err.message || 'No se pudo cargar la fotografía.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardarPerfilPro = async () => {
    sessionStore.proUser.foto_perfil_url = fotoUrl;
    sessionStore.proUser.nombre_completo = nombre.trim();
    sessionStore.proUser.nombre_establecimiento = nombreEst.trim();
    sessionStore.proUser.telefono = telefono.trim();
    sessionStore.proUser.barrio = barrio;
    sessionStore.proUser.horario_atencion = {
      ...(sessionStore.proUser.horario_atencion || {}),
      apertura,
      cierre,
    };

    if (pro.correo) {
      try {
        await fetch(
          `${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(pro.correo)}`,
          {
            method: 'PATCH',
            headers: {
              apikey: SUPABASE_PUBLISHABLE_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nombre: nombre.trim(),
              telefono: telefono.trim(),
              barrio,
              avatar_url: fotoUrl,
            }),
          }
        );
      } catch (_e) {}
    }
    setMensajeGuardado('Información profesional actualizada en la base de datos.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil Profesional</Text>
        <TouchableOpacity style={styles.saveTopBtn} onPress={guardarPerfilPro}>
          <Text style={styles.saveTopBtnText}>Guardar Cambios</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, layout.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        <ModeSwitcherBanner navigation={navigation} currentMode="profesional" />
        {mensajeGuardado ? (
          <View style={styles.infoBanner}>
            <Feather name="check-circle" size={15} color="#1E824C" />
            <Text style={styles.infoBannerText}>{mensajeGuardado}</Text>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <View style={{ position: 'relative' }}>
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={28} color={colors.textGray} />
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={handleSeleccionarFotoDispositivo}
              disabled={subiendoFoto}
            >
              <Feather name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleSeleccionarFotoDispositivo} disabled={subiendoFoto}>
            <Text style={styles.changePhotoText}>
              {subiendoFoto
                ? `Subiendo fotografía (${progresoFoto}%)...`
                : 'Seleccionar fotografía del dispositivo'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.name}>{nombre || 'Profesional'}</Text>
          <Text style={styles.email}>{pro.correo}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Nombre Completo Profesional</Text>
          <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />

          <Text style={styles.label}>Nombre del Establecimiento</Text>
          <TextInput style={styles.input} value={nombreEst} onChangeText={setNombreEst} />

          <Text style={styles.label}>Teléfono de Contacto</Text>
          <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} />

          <Text style={styles.label}>Barrio / Zona Base</Text>
          <View style={styles.pillsRow}>
            {BARRIOS_DISPONIBLES.map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.chip, barrio === b && styles.chipActive]}
                onPress={() => setBarrio(b)}
              >
                <Text style={[styles.chipText, barrio === b && { color: '#FFFFFF' }]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Hora Apertura</Text>
              <TextInput style={styles.input} value={apertura} onChangeText={setApertura} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Hora Cierre</Text>
              <TextInput style={styles.input} value={cierre} onChangeText={setCierre} />
            </View>
          </View>

          <TouchableOpacity style={styles.saveFullBtn} onPress={guardarPerfilPro}>
            <Text style={styles.saveFullBtnText}>Actualizar Información Profesional</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => cerrarSesionActiva(navigation)}
        >
          <Feather name="log-out" size={16} color="#C0392B" />
          <Text style={styles.logoutText}>Cerrar Sesión Profesional</Text>
        </TouchableOpacity>
      </ScrollView>

      <ProBottomNav navigation={navigation} active="MiPerfil" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark , flexShrink: 1 },
  saveTopBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  saveTopBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' , flexShrink: 1 },
  scroll: { paddingTop: 16, paddingBottom: 36 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F6EF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoBannerText: { fontSize: 12, fontWeight: '700', color: '#1E824C' , flexShrink: 1 },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoText: { fontSize: 12, fontWeight: '700', color: colors.primary, marginVertical: 6 , flexShrink: 1 },
  name: { fontSize: 18, fontWeight: '800', color: colors.textDark },
  email: { fontSize: 12, color: colors.textGray, marginTop: 2 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  label: { fontSize: 12, fontWeight: '700', color: colors.textDark, marginBottom: 5 },
  input: {
    backgroundColor: '#F8F6F4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.textDark,
    marginBottom: 12,
  },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#F8F6F4',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 11.5, fontWeight: '700', color: colors.textDark , flexShrink: 1 },
  saveFullBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveFullBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' , flexShrink: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#FDEDEC',
  },
  logoutText: { fontSize: 14, fontWeight: '800', color: '#C0392B' , flexShrink: 1 },
});
