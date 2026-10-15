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
import { colors } from '../theme/colors';
import RoleCard from '../components/RoleCard';
// Quita el SafeAreaView de la primera importación y ponlo en esta nueva:
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleSelectionScreen({ navigation }) {
  // Estado para guardar la selección. 'cliente' por defecto.
  const [role, setRole] = useState('cliente');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 1. Header con Botón Atrás y Píldora */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Feather name="arrow-left" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <View style={styles.pill}>
            <Text style={styles.pillText}>• ALTA BELLEZA EXCLUSIVA</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* 2. Textos Introductorios */}
        <View style={styles.titleSection}>
          <Text style={styles.subHeading}>BIENVENIDO A BEAUTYFLASH</Text>
          <Text style={styles.heading}>Elige tu experiencia</Text>
          <Text style={styles.description}>
            ¿Cómo deseas utilizar BeautyFlash hoy?{'\n'}
            Personalizaremos tu portal según tu decisión.
          </Text>
        </View>

        {/* 3. Tarjeta: Soy Cliente */}
        <RoleCard 
          selected={role === 'cliente'}
          onPress={() => setRole('cliente')}
          tagText="BUSCO PROFESIONALES"
          iconName="leaf" // Icono similar a la flor/hoja
          imageUri="https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop"
          imageBadgeIcon="shield"
          imageBadgeText="Concierge & Salones VIP"
          title="Soy Cliente"
          description="Quiero agendar citas para corte, peinado, manicura, maquillaje o barbería a domicilio o en salón."
          feature1Icon="clock"
          feature1Text="Reserva 24/7"
          feature2Icon="credit-card"
          feature2Text="Pago sin contacto"
        />

        {/* 4. Tarjeta: Soy Profesional */}
        <RoleCard 
          selected={role === 'profesional'}
          onPress={() => setRole('profesional')}
          tagText="GANA CON TUS SERVICIOS"
          iconName="content-cut" // Icono de tijeras
          imageUri="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop"
          imageBadgeIcon="bar-chart-2"
          imageBadgeText="Comisión preferencial"
          title="Soy Profesional"
          description="Quiero ofrecer mis servicios, gestionar mi agenda, fijar mis tarifas y recibir nuevas reservas."
          feature1Icon="calendar"
          feature1Text="Control total"
          feature2Icon="trending-up"
          feature2Text="Pagos inmediatos"
        />

        {/* 👇 Modifica tu botón Continuar */}
        <TouchableOpacity 
          style={styles.mainButton}
          onPress={() => navigation.navigate('Welcome')}
        >
          <Text style={styles.mainButtonText}>Continuar</Text>
        </TouchableOpacity>

        {/* 6. Footer (Iniciar sesión) */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿Ya tienes cuenta? <Text style={styles.footerHighlight}>Iniciar sesión</Text>
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  pill: { backgroundColor: '#F3EFEA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  pillText: { fontSize: 10, fontWeight: '700', color: colors.accent, letterSpacing: 1 },

  // Textos
  titleSection: { marginBottom: 24 },
  subHeading: { fontSize: 11, fontWeight: '700', color: colors.accent, letterSpacing: 1, marginBottom: 8 },
  heading: { fontSize: 28, fontWeight: '800', color: colors.textDark, marginBottom: 12 },
  description: { fontSize: 14, color: colors.textGray, lineHeight: 22 },

  // Botón Continuar (Usaremos un tono ligeramente más claro/salmón como en el diseño)
  mainButton: { 
    backgroundColor: '#D18C7C', 
    borderRadius: 14, 
    paddingVertical: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 8,
    marginBottom: 24 
  },
  mainButtonText: { color: colors.textDark, fontSize: 16, fontWeight: '600' },

  // Footer
  footer: { alignItems: 'center' },
  footerText: { fontSize: 14, color: colors.textGray },
  footerHighlight: { color: colors.accent, fontWeight: '600' },
});