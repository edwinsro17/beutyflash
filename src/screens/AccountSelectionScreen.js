/**
 * Archivo: src/screens/AccountSelectionScreen.js
 * Selección de tipo de cuenta para registro con iconografía profesional y diseño minimalista.
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, sessionStore, useResponsiveLayout } from '../theme/colors';
import RoleCard from '../components/RoleCard';

export default function AccountSelectionScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const [role, setRole] = useState(sessionStore.selectedRole || 'cliente');

  const handleContinuar = () => {
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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Cuenta</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.heading}>Elige tu experiencia</Text>
          <Text style={styles.description}>
            Selecciona el perfil con el que deseas registrarte en la plataforma.
          </Text>
        </View>

        <RoleCard
          selected={role === 'cliente'}
          onPress={() => setRole('cliente')}
          roleLabel="CLIENTE"
          iconName="search"
          title="Encuentra lo que necesitas."
          description="Descubre profesionales, solicita servicios y gestiona tus solicitudes fácilmente."
        />

        <RoleCard
          selected={role === 'profesional'}
          onPress={() => setRole('profesional')}
          roleLabel="PROFESIONAL"
          iconName="briefcase"
          title="Ofrece tus servicios."
          description="Conecta con nuevos clientes, administra tus solicitudes y haz crecer tu actividad profesional."
        />

        <TouchableOpacity style={styles.mainBtn} onPress={handleContinuar}>
          <Text style={styles.mainBtnText}>
            Registrarme como {role === 'profesional' ? 'Profesional' : 'Cliente'}
          </Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { paddingTop: 14, paddingBottom: 36 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  titleSection: { marginBottom: 20 },
  heading: { fontSize: 26, fontWeight: '800', color: colors.textDark, marginBottom: 6 },
  description: { fontSize: 14, color: colors.textGray, lineHeight: 20 },
  mainBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  mainBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});