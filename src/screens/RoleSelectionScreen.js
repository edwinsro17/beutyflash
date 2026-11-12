/**
 * Archivo: src/screens/RoleSelectionScreen.js
 * Selección de Rol (Soy Cliente / Soy Profesional) sincronizada con el Login y Registro
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
import { colors, sessionStore } from '../theme/colors';
import RoleCard from '../components/RoleCard';

export default function RoleSelectionScreen({ navigation }) {
  const [role, setRole] = useState(sessionStore.selectedRole || 'cliente');

  const handleSelectRole = (nuevoRol) => {
    setRole(nuevoRol);
    sessionStore.selectedRole = nuevoRol;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Feather name="star" size={18} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.pill}>
            <Text style={styles.pillText}>• COLOMBIA • DOMICILIO & SALÓN</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.subHeading}>BIENVENIDO A BEAUTYFLASH</Text>
          <Text style={styles.heading}>Elige tu experiencia</Text>
          <Text style={styles.description}>
            ¿Cómo deseas utilizar BeautyFlash hoy?{'\n'}
            Personalizaremos tu inicio de sesión y registro según tu perfil.
          </Text>
        </View>

        <RoleCard
          selected={role === 'cliente'}
          onPress={() => handleSelectRole('cliente')}
          tagText="BUSCO PROFESIONALES"
          iconName="leaf"
          imageUri="https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop"
          imageBadgeIcon="shield"
          imageBadgeText="Domicilio & Salones VIP"
          title="Soy Cliente"
          description="Quiero pedir servicios de corte, cepillado, manicura, maquillaje o barbería a domicilio estilo Uber/DiDi o reservar en un local."
          feature1Icon="clock"
          feature1Text="En vivo en Google Maps"
          feature2Icon="credit-card"
          feature2Text="Precios en COP ($25.000+)"
        />

        <RoleCard
          selected={role === 'profesional'}
          onPress={() => handleSelectRole('profesional')}
          tagText="GANA CON TUS SERVICIOS"
          iconName="content-cut"
          imageUri="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop"
          imageBadgeIcon="bar-chart-2"
          imageBadgeText="Comisión 10% • Recarga $10.000"
          title="Soy Profesional"
          description="Quiero ofrecer mis servicios a domicilio o en mi local, gestionar mi billetera en COP y recibir nuevas solicitudes en tiempo real."
          feature1Icon="calendar"
          feature1Text="Recarga mín. $10.000"
          feature2Icon="trending-up"
          feature2Text="Solo 10% comisión"
        />

        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => navigation.navigate('Welcome', { role })}
        >
          <Text style={styles.mainButtonText}>
            Continuar como {role === 'profesional' ? 'Profesional' : 'Cliente'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿Ya tienes cuenta?{' '}
            <Text
              style={styles.footerHighlight}
              onPress={() => navigation.navigate('Login', { role })}
            >
              Iniciar sesión
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
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillText: { fontSize: 10, fontWeight: '700', color: colors.accent, letterSpacing: 1 },
  titleSection: { marginBottom: 24 },
  subHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: 8,
  },
  heading: { fontSize: 28, fontWeight: '800', color: colors.textDark, marginBottom: 12 },
  description: { fontSize: 14, color: colors.textGray, lineHeight: 22 },
  mainButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  mainButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  footer: { alignItems: 'center' },
  footerText: { fontSize: 14, color: colors.textGray },
  footerHighlight: { color: colors.accent, fontWeight: '700' },
});