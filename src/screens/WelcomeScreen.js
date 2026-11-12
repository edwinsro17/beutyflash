/**
 * Archivo: src/screens/WelcomeScreen.js
 * Pantalla de Bienvenida que redirige al Login o al Registro según el perfil elegido (Cliente o Profesional)
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, sessionStore } from '../theme/colors';
import FeatureCard from '../components/FeatureCard';
import CustomButton from '../components/CustomButton';

export default function WelcomeScreen({ navigation, route }) {
  const role = route?.params?.role || sessionStore.selectedRole || 'cliente';

  const handleIrARegistro = () => {
    if (role === 'profesional') {
      navigation.navigate('SpecialistRegistration');
    } else {
      navigation.navigate('ClientRegistration');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoCard}>
            <View style={styles.logoRow}>
              <Text style={styles.logoTextBold}>Beauty</Text>
              <Text style={styles.logoTextThin}>Flash</Text>
            </View>
          </View>
        </View>

        <View style={styles.imageCardContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop',
            }}
            style={styles.heroImage}
          />
          <View style={styles.floatingBadge}>
            <View style={styles.badgeLeft}>
              <Ionicons name="star" size={16} color={colors.accent} />
              <Text style={styles.badgeTitle}>
                Modo: {role === 'profesional' ? 'Especialista Pro' : 'Cliente VIP'}
              </Text>
            </View>
            <View style={styles.badgeRightTag}>
              <Text style={styles.badgeTagText}>Colombia • COP</Text>
            </View>
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.heading}>
            {role === 'profesional' ? 'Impulsa tu talento,' : 'Belleza experta,'}
            {'\n'}
            <Text style={styles.headingHighlight}>
              {role === 'profesional' ? 'gana en cada cita' : 'donde estés'}
            </Text>
          </Text>
          <Text style={styles.description}>
            {role === 'profesional'
              ? 'Recibe solicitudes a domicilio y reservas en tu salón. Activa tu billetera desde $10.000 COP con solo 10% de comisión.'
              : 'Servicios de belleza a domicilio estilo Uber/DiDi y reservas en local. Encuentra estilistas, barberos y manicuristas en segundos.'}
          </Text>
        </View>

        <View style={styles.featuresRow}>
          <FeatureCard iconName="shield" label={'Profesionales\nverificados'} />
          <FeatureCard iconName="map-pin" label={'Ruta en vivo\nGoogle Maps'} />
          <FeatureCard iconName="credit-card" label={'Precios claros\nen COP'} />
        </View>

        <View style={styles.buttonContainer}>
          <CustomButton
            title={`Iniciar Sesión como ${role === 'profesional' ? 'Profesional' : 'Cliente'}`}
            variant="primary"
            onPress={() => navigation.navigate('Login', { role })}
          />
          <CustomButton
            title={`Registrarme como ${role === 'profesional' ? 'Profesional' : 'Cliente'}`}
            variant="secondary"
            onPress={handleIrARegistro}
          />
        </View>

        <TouchableOpacity
          style={{ marginBottom: 16 }}
          onPress={() => navigation.navigate('AccountSelection')}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
            Ver comparativa de cuentas (Cliente vs Profesional)
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <View style={styles.langSelector}>
            <MaterialCommunityIcons name="earth" size={16} color={colors.textGray} />
            <Text style={styles.langText}>Español (Colombia - COP)</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContainer: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 30,
    alignItems: 'center',
  },
  header: { alignItems: 'center', marginBottom: 20 },
  logoCard: {
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 18,
    elevation: 3,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logoTextBold: { fontSize: 18, fontWeight: '800', color: colors.textDark },
  logoTextThin: { fontSize: 18, fontWeight: '600', color: colors.flashIcon },
  imageCardContainer: {
    width: '100%',
    height: 230,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 22,
  },
  heroImage: { width: '100%', height: '100%' },
  floatingBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeTitle: { fontSize: 13, fontWeight: '700', color: colors.secondaryText },
  badgeRightTag: {
    backgroundColor: colors.badgeBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTagText: { fontSize: 11, fontWeight: '700', color: colors.badgeText },
  textBlock: { alignItems: 'center', marginBottom: 20, paddingHorizontal: 8 },
  heading: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 10,
  },
  headingHighlight: { color: colors.accent },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textGray,
    textAlign: 'center',
  },
  featuresRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  buttonContainer: { width: '100%', gap: 10, marginBottom: 16 },
  footer: { alignItems: 'center', gap: 12 },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  langText: { fontSize: 12, color: '#444', fontWeight: '600' },
});