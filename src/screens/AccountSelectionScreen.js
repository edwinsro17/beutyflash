/**
 * Archivo: src/screens/AccountSelectionScreen.js
 * Selección de Cuenta para Registro (Cliente vs Especialista Pro)
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, sessionStore } from '../theme/colors';

export default function AccountSelectionScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registro de Cuenta</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.heading}>¿Cómo deseas unirte a BeautyFlash?</Text>
          <Text style={styles.description}>
            Selecciona el tipo de cuenta para registrarte como Cliente o como Profesional.
          </Text>
        </View>

        {/* Tarjeta Cliente */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="star-four-points" size={20} color={colors.primary} />
            </View>
            <View style={styles.pillClient}>
              <Text style={styles.pillTextClient}>PERFIL DE CLIENTE</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>Quiero Pedir Servicios</Text>
          <Text style={styles.cardTitle}>Cliente VIP</Text>
          <Text style={styles.cardDescription}>
            Solicita servicios de peluquería, maquillaje, uñas y barbería a domicilio estilo Uber/DiDi o reserva cita en un local físico.
          </Text>
          <View style={styles.features}>
            {[
              'Estado "Buscando profesional" en tiempo real',
              'Seguimiento en vivo con ruta en Google Maps',
              'Precios claros en Pesos Colombianos ($25.000+ COP)',
            ].map((item, i) => (
              <View key={i} style={styles.featureRow}>
                <Feather name="check" size={14} color={colors.primary} style={styles.checkIcon} />
                <Text style={styles.featureText}>{item}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.clientButton}
            onPress={() => {
              sessionStore.selectedRole = 'cliente';
              navigation.navigate('ClientRegistration');
            }}
          >
            <Text style={styles.clientButtonText}>Registrarme como Cliente</Text>
            <Feather name="arrow-right" size={16} color={colors.textDark} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {/* Tarjeta Profesional */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Feather name="scissors" size={20} color={colors.primary} />
            </View>
            <View style={styles.pillClient}>
              <Text style={styles.pillTextClient}>PERFIL DE PROFESIONAL</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>Quiero Ofrecer Servicios</Text>
          <Text style={styles.cardTitle}>Especialista Pro</Text>
          <Text style={styles.cardDescription}>
            Recibe solicitudes a domicilio y reservas en tu salón, administra tu catálogo con fotos y gestiona tu billetera en COP.
          </Text>
          <View style={styles.features}>
            {[
              'Recarga mínima de $10.000 COP para estar activo',
              'Comisión del 10% descontada automáticamente de tu saldo',
              'Validación de DNI y Certificado Profesional en 4 estados',
            ].map((item, i) => (
              <View key={i} style={styles.featureRow}>
                <Feather name="check" size={14} color={colors.primary} style={styles.checkIcon} />
                <Text style={styles.featureText}>{item}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.proButton}
            onPress={() => {
              sessionStore.selectedRole = 'profesional';
              navigation.navigate('SpecialistRegistration');
            }}
          >
            <Text style={styles.proButtonText}>Crear Cuenta Profesional</Text>
            <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿Ya tienes una cuenta registrada?{' '}
            <Text
              style={styles.footerHighlight}
              onPress={() => navigation.navigate('Login')}
            >
              Inicia Sesión
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 40 },
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
  heading: { fontSize: 24, fontWeight: '800', color: colors.textDark, marginBottom: 6 },
  description: { fontSize: 13.5, color: colors.textGray, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F6EFEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillClient: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  pillTextClient: { fontSize: 10, fontWeight: '800', color: colors.primary },
  cardSubtitle: { fontSize: 12, fontWeight: '600', color: colors.textGray },
  cardTitle: { fontSize: 20, fontWeight: '800', color: colors.textDark, marginBottom: 6 },
  cardDescription: { fontSize: 13, color: colors.textGray, lineHeight: 19, marginBottom: 14 },
  features: { marginBottom: 16, gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  checkIcon: { marginRight: 8 },
  featureText: { fontSize: 12.5, color: colors.textDark, fontWeight: '600' },
  clientButton: {
    backgroundColor: '#F3EFEA',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientButtonText: { fontSize: 14, fontWeight: '800', color: colors.textDark },
  proButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proButtonText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  footer: { alignItems: 'center', marginTop: 8 },
  footerText: { fontSize: 13.5, color: colors.textGray },
  footerHighlight: { color: colors.primary, fontWeight: '700' },
});