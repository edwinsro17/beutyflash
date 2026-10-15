import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import FeatureCard from '../components/FeatureCard';
import CustomButton from '../components/CustomButton';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header con Logo y Subtítulo */}
        <View style={styles.header}>
          <View style={styles.logoCard}>
            <View style={styles.logoRow}>
              <Text style={styles.logoTextBold}>Beauty</Text>
              <Text style={styles.logoTextThin}>Flash</Text>
            </View>
          </View>
        </View>

        {/* 2. Tarjeta con Imagen Principal y Badge Flotante */}
        <View style={styles.imageCardContainer}>
          <Image
            source={{ uri: 'https://i.pinimg.com/736x/53/4e/14/534e1486771eec2f801c4718c443c073.jpg' }}
            style={styles.heroImage}
          />
          <View style={styles.floatingBadge}>
            <View style={styles.badgeLeft}>
              <Ionicons name="star" size={16} color={colors.accent} />
              <Text style={styles.badgeTitle}>Experiencia 5 Estrellas</Text>
            </View>
            <View style={styles.badgeRightTag}>
              <Text style={styles.badgeTagText}>+400 Especialistas</Text>
            </View>
          </View>
        </View>

        {/* 3. Título y Descripción */}
        <View style={styles.textBlock}>
          <Text style={styles.heading}>
            Belleza experta,{'\n'}
            <Text style={styles.headingHighlight}>donde estés</Text>
          </Text>
          <Text style={styles.description}>
            Servicios de belleza a domicilio y en local. Encuentra a los mejores barberos, estilistas,
            maquilladores y especialistas en segundos.
          </Text>
        </View>

        {/* 4. Tarjetas de Beneficios usando el COMPONENTE REUTILIZABLE */}
        <View style={styles.featuresRow}>
          <FeatureCard iconName="shield" label={"Profesionales\nverificados"} />
          <FeatureCard iconName="calendar" label={"Citas\nflexibles"} />
          <FeatureCard iconName="lock" label={"Pagos\nseguros"} />
        </View>

        {/* 5. Botones de Acción usando el COMPONENTE REUTILIZABLE */}
        <View style={styles.buttonContainer}>
          <CustomButton 
            title="Iniciar Sesión" 
            variant="primary" 
            onPress={() => navigation.navigate('Login')} 
          />
          <CustomButton 
            title="Registrarse" 
            variant="secondary" 
            onPress={() => alert('Registrarse')} 
          />
        </View>

        {/* 6. Selector de Idioma y Legal */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.langSelector}>
            <MaterialCommunityIcons name="earth" size={16} color={colors.textGray} />
            <Text style={styles.langText}>Español (ES)</Text>
            <Feather name="chevron-down" size={14} color={colors.textGray} />
          </TouchableOpacity>

          <View style={styles.legalRow}>
            <TouchableOpacity><Text style={styles.legalText}>Términos del Servicio</Text></TouchableOpacity>
            <Text style={styles.legalDot}>•</Text>
            <TouchableOpacity><Text style={styles.legalText}>Privacidad</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Estilos reducidos (solo los de estructura base, ya que componentes y colores se extrajeron)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    marginBottom: 10,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logoTextBold: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  logoTextThin: { fontSize: 16, fontWeight: '400', color: colors.flashIcon },
  conciergeText: { fontSize: 11, letterSpacing: 2, fontWeight: '700', color: colors.accent },
  
  imageCardContainer: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 22,
  },
  heroImage: { width: '100%', height: '100%' },
  floatingBadge: {
    position: 'absolute', bottom: 12, left: 12, right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  badgeLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeTitle: { fontSize: 13, fontWeight: '700', color: colors.secondaryText },
  badgeRightTag: { backgroundColor: colors.badgeBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeTagText: { fontSize: 11, fontWeight: '700', color: colors.badgeText },

  textBlock: { alignItems: 'center', marginBottom: 20, paddingHorizontal: 8 },
  heading: { fontSize: 27, fontWeight: '800', color: colors.textDark, textAlign: 'center', lineHeight: 34, marginBottom: 10 },
  headingHighlight: { color: colors.accent },
  description: { fontSize: 14, lineHeight: 20, color: colors.textGray, textAlign: 'center' },

  featuresRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 8, marginBottom: 24 },
  buttonContainer: { width: '100%', gap: 10, marginBottom: 24 },

  footer: { alignItems: 'center', gap: 12 },
  langSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.border, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 6 },
  langText: { fontSize: 12, color: '#444', fontWeight: '500' },
  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legalText: { fontSize: 12, color: '#7C7773' },
  legalDot: { fontSize: 12, color: '#7C7773' },
});