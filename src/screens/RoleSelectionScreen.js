/**
 * Archivo: src/screens/RoleSelectionScreen.js
 * Apartado «Elige tu experiencia» con diseño comercial, sobrio y minimalista,
 * sin fotografías ni ilustraciones genéricas.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, sessionStore, useResponsiveLayout } from '../theme/colors';
import RoleCard from '../components/RoleCard';

export default function RoleSelectionScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const [role, setRole] = useState(sessionStore.selectedRole || 'cliente');

  const handleSelectRole = (nuevoRol) => {
    setRole(nuevoRol);
    sessionStore.selectedRole = nuevoRol;
  };

  const handleContinuarLogin = () => {
    sessionStore.selectedRole = role;
    navigation.navigate('Login', { role });
  };

  const handleIrARegistro = () => {
    sessionStore.selectedRole = role;
    if (role === 'profesional') {
      navigation.navigate('SpecialistRegistration');
    } else {
      navigation.navigate('ClientRegistration');
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
          <View style={styles.brandRow}>
            <Text style={styles.brandBeauty}>Beauty</Text>
            <Text style={styles.brandFlash}>Flash</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>SELECCIÓN DE PERFIL</Text>
          </View>
        </View> 

        <View style={styles.titleSection}>
          <Text style={styles.subHeading}>CONFIGURA TU ACCESO</Text>
          <Text style={styles.heading}>Elige tu experiencia</Text>
          <Text style={styles.description}>
            Selecciona cómo deseas ingresar para adaptar las herramientas y funciones a tu perfil.
          </Text>
        </View>

        <RoleCard
          selected={role === 'cliente'}
          onPress={() => handleSelectRole('cliente')}
          roleLabel="CLIENTE"
          iconName="search"
          title="Encuentra lo que necesitas."
          description="Descubre profesionales, solicita servicios y gestiona tus solicitudes fácilmente."
          highlights={[
            { icon: 'map-pin', label: 'Seguimiento en tiempo real' },
            { icon: 'message-square', label: 'Comunicación directa' },
          ]}
        />

        <RoleCard
          selected={role === 'profesional'}
          onPress={() => handleSelectRole('profesional')}
          roleLabel="PROFESIONAL"
          iconName="briefcase"
          title="Ofrece tus servicios."
          description="Conecta con nuevos clientes, administra tus solicitudes y haz crecer tu actividad profesional."
          highlights={[
            { icon: 'layers', label: 'Gestión de catálogo y agenda' },
            { icon: 'navigation', label: 'Rutas hacia tus clientes' },
          ]}
        />

        <TouchableOpacity style={styles.mainButton} onPress={handleContinuarLogin}>
          <Text style={styles.mainButtonText}>
            Iniciar sesión como {role === 'profesional' ? 'Profesional' : 'Cliente'}
          </Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleIrARegistro}>
          <Text style={styles.secondaryButtonText}>
            Crear una cuenta de {role === 'profesional' ? 'Profesional' : 'Cliente'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { paddingTop: 18, paddingBottom: 36 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandBeauty: { fontSize: 22, fontStyle: 'italic', color: colors.textDark },
  brandFlash: { fontSize: 22, fontWeight: '800', color: colors.primary },
  pill: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  titleSection: { marginBottom: 22 },
  subHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  heading: { fontSize: 28, fontWeight: '800', color: colors.textDark, marginBottom: 8 },
  description: { fontSize: 14, color: colors.textGray, lineHeight: 21 },
  mainButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  mainButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: { color: colors.textDark, fontSize: 14, fontWeight: '700' },
});