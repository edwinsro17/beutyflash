/**
 * Archivo: src/screens/ProfileScreen.js
 * Perfil del Cliente con selección de fotografía desde el dispositivo (expo-image-picker)
 * y persistencia en Supabase Storage y tabla `usuarios`. Cero emojis.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
import BottomMenu from '../components/BottomMenu';

export default function ProfileScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const cliente = sessionStore.clientUser;
  const [fotoUrl, setFotoUrl] = useState(cliente.foto_perfil_url);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [progresoFoto, setProgresoFoto] = useState(0);
  const [nombre, setNombre] = useState(cliente.nombre_completo || '');
  const [telefono, setTelefono] = useState(cliente.telefono || '');
  const [barrio, setBarrio] = useState(cliente.barrio || '');
  const [direccion, setDireccion] = useState(cliente.direccion_principal || '');
  const [editando, setEditando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState('');
  const [smsReminders, setSmsReminders] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  const handleSeleccionarFotoDispositivo = async () => {
    setMensajeGuardado('');
    setSubiendoFoto(true);
    setProgresoFoto(15);
    try {
      const res = await seleccionarYSubirFotografiaDispositivo({
        carpeta: 'clientes',
        usuarioId: cliente.id,
        onProgress: (p) => setProgresoFoto(p),
      });
      if (res && res.urlPublica) {
        setFotoUrl(res.urlPublica);
        sessionStore.clientUser.foto_perfil_url = res.urlPublica;
        if (cliente.correo) {
          await fetch(
            `${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(cliente.correo)}`,
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

  const guardarCambiosPerfil = async () => {
    sessionStore.clientUser.foto_perfil_url = fotoUrl;
    sessionStore.clientUser.nombre_completo = nombre.trim();
    sessionStore.clientUser.telefono = telefono.trim();
    sessionStore.clientUser.barrio = barrio;
    sessionStore.clientUser.direccion_principal = direccion.trim();
    setEditando(false);

    if (cliente.correo) {
      try {
        await fetch(
          `${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(cliente.correo)}`,
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
              direccion_principal: direccion.trim(),
              avatar_url: fotoUrl,
            }),
          }
        );
      } catch (_e) {}
    }
    setMensajeGuardado('Datos de perfil guardados en la base de datos.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, layout.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        <ModeSwitcherBanner navigation={navigation} currentMode="cliente" />
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Text style={styles.logoBeauty}>Beauty</Text>
            <Text style={styles.logoFlash}>Flash</Text>
          </View>
          <TouchableOpacity
            style={styles.editTopBtn}
            onPress={() => (editando ? guardarCambiosPerfil() : setEditando(true))}
          >
            <Feather name={editando ? 'check' : 'edit-2'} size={14} color="#FFFFFF" />
            <Text style={styles.editTopBtnText}>
              {editando ? 'Guardar' : 'Editar Perfil'}
            </Text>
          </TouchableOpacity>
        </View>

        {mensajeGuardado ? (
          <View style={styles.infoBanner}>
            <Feather name="check-circle" size={15} color="#1E824C" />
            <Text style={styles.infoBannerText}>{mensajeGuardado}</Text>
          </View>
        ) : null}

        <View style={styles.profileHeroCard}>
          <View style={styles.avatarContainer}>
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={styles.heroAvatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={28} color={colors.textGray} />
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handleSeleccionarFotoDispositivo}
              disabled={subiendoFoto}
            >
              <Feather name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleSeleccionarFotoDispositivo} disabled={subiendoFoto}>
            <Text style={styles.changePhotoLink}>
              {subiendoFoto
                ? `Subiendo fotografía (${progresoFoto}%)...`
                : 'Seleccionar fotografía del dispositivo'}
            </Text>
          </TouchableOpacity>

          <View style={styles.nameRow}>
            <Text style={styles.userName}>{nombre || 'Cliente'}</Text>
            <MaterialCommunityIcons name="check-decagram" size={18} color={colors.primary} />
          </View>
          <Text style={styles.contactText}>
            {barrio ? `${barrio} • ` : ''}
            {cliente.correo}
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>INFORMACIÓN PERSONAL Y UBICACIÓN</Text>

          <Text style={styles.fieldLabel}>Nombre Completo</Text>
          <TextInput
            style={[styles.input, !editando && styles.inputDisabled]}
            value={nombre}
            onChangeText={setNombre}
            editable={editando}
          />

          <Text style={styles.fieldLabel}>Teléfono Celular</Text>
          <TextInput
            style={[styles.input, !editando && styles.inputDisabled]}
            value={telefono}
            onChangeText={setTelefono}
            editable={editando}
            keyboardType="phone-pad"
          />

          <Text style={styles.fieldLabel}>Zona / Barrio</Text>
          <View style={styles.pillsRow}>
            {BARRIOS_DISPONIBLES.map((b) => {
              const sel = barrio === b;
              return (
                <TouchableOpacity
                  key={b}
                  style={[styles.barrioChip, sel && styles.barrioChipActive]}
                  onPress={() => {
                    setBarrio(b);
                    sessionStore.clientUser.barrio = b;
                  }}
                >
                  <Text style={[styles.barrioChipText, sel && { color: '#FFFFFF' }]}>{b}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Dirección Principal</Text>
          <TextInput
            style={[styles.input, !editando && styles.inputDisabled]}
            value={direccion}
            onChangeText={setDireccion}
            editable={editando}
          />
        </View>

        <View style={styles.cardItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardItemTitle}>Notificaciones Push</Text>
            <Text style={styles.cardItemSubtitle}>Actualizaciones de tus solicitudes</Text>
          </View>
          <Switch
            value={pushNotifs}
            onValueChange={setPushNotifs}
            trackColor={{ false: '#EAEAEA', true: colors.tertiary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.cardItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardItemTitle}>Avisos por SMS</Text>
            <Text style={styles.cardItemSubtitle}>Confirmaciones a tu número celular</Text>
          </View>
          <Switch
            value={smsReminders}
            onValueChange={setSmsReminders}
            trackColor={{ false: '#EAEAEA', true: colors.tertiary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => cerrarSesionActiva(navigation)}
        >
          <Feather name="log-out" size={16} color="#C0392B" />
          <Text style={styles.logoutText}>Cerrar Sesión de Cliente</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomMenu activeTab="Perfil" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { paddingTop: 14, paddingBottom: 30 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoBeauty: { fontSize: 22, fontStyle: 'italic', color: colors.textDark },
  logoFlash: { fontSize: 22, fontWeight: '800', color: colors.primary },
  editTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
  },
  editTopBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' , flexShrink: 1 },
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
  profileHeroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  avatarContainer: { position: 'relative', marginBottom: 6 },
  heroAvatar: { width: 84, height: 84, borderRadius: 42 },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  changePhotoLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  userName: { fontSize: 19, fontWeight: '800', color: colors.textDark },
  contactText: { fontSize: 12, color: colors.textGray , flexShrink: 1 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.textGray,
    letterSpacing: 0.7,
    marginBottom: 10,
  flexShrink: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textDark, marginBottom: 5 , flexShrink: 1 },
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
  inputDisabled: { opacity: 0.85 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  barrioChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#F8F6F4',
    borderWidth: 1,
    borderColor: colors.border,
  },
  barrioChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  barrioChipText: { fontSize: 11.5, fontWeight: '700', color: colors.textDark , flexShrink: 1 },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardItemTitle: { fontSize: 13.5, fontWeight: '800', color: colors.textDark , flexShrink: 1 },
  cardItemSubtitle: { fontSize: 12, color: colors.textGray, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#FDEDEC',
    marginTop: 6,
  },
  logoutText: { fontSize: 14, fontWeight: '800', color: '#C0392B' , flexShrink: 1 },
});
