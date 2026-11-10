import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const colors = { background: '#FAFAFA', surface: '#FFFFFF', primary: '#8B503E', textDark: '#1E1E1E', textGray: '#707070', border: '#EAEAEA', accent: '#E8C5BE' };

export default function AccountSelectionScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registro De Cuenta</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Títulos */}
        <View style={styles.titleSection}>
          <Text style={styles.heading}>¿Cómo deseas unirte a BeautyFlash?</Text>
          <Text style={styles.description}>
            Selecciona el tipo de cuenta para personalizar tu experiencia de belleza exclusiva.
          </Text>
        </View>

        {/* Tarjeta Cliente VIP */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="star-four-points" size={20} color={colors.primary} />
            </View>
            <View style={styles.pillClient}>
              <Text style={styles.pillTextClient}>EXPERIENCIA PERSONAL</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>Quiero Cuidarme</Text>
          <Text style={styles.cardTitle}>Cliente VIP</Text>
          <Text style={styles.cardDescription}>
            Descubre y agenda rituales exclusivos de peluquería, maquillaje, uñas y faciales en salón o a domicilio en menos de 60 minutos.
          </Text>
          <View style={styles.features}>
            {['Citas Flash inmediatas sin esperas', 'Reserva con los mejores especialistas verificados', 'Pago 100% protegido y seguro garantizado'].map((item, i) => (
              <View key={i} style={styles.featureRow}>
                <Feather name="check" size={14} color="#D16E5A" style={styles.checkIcon} />
                <Text style={styles.featureText}>{item}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity 
            style={styles.clientButton} 
            onPress={() => navigation.navigate('ClientRegistration')}
          >
            <Text style={styles.clientButtonText}>Registrarme como Cliente</Text>
            <Feather name="arrow-right" size={16} color={colors.textDark} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {/* Tarjeta Especialista Pro */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accent }]}>
              <Feather name="scissors" size={20} color={colors.primary} />
            </View>
            <View style={styles.pillPro}>
              <Text style={styles.pillTextPro}>PARA ESPECIALISTAS</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>Quiero Ofrecer Servicios</Text>
          <Text style={styles.cardTitle}>Especialista Pro</Text>
          <Text style={styles.cardDescription}>
            Monetiza tu talento, gestiona tu propia agenda, recibe clientes prémium a domicilio o en tu salón y maximiza tus ingresos.
          </Text>
          <View style={styles.features}>
            {['0% comisiones abusivas con tarifas claras', 'Cobros automáticos e instantáneos a tu cuenta', 'Gestión de agenda y citas Flash Express'].map((item, i) => (
              <View key={i} style={styles.featureRow}>
                <Feather name="check" size={14} color="#D16E5A" style={styles.checkIcon} />
                <Text style={styles.featureText}>{item}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity 
            style={styles.proButton} 
            onPress={() => navigation.navigate('SpecialistRegistration')}
          >
            <Text style={styles.proButtonText}>Crear Cuenta Profesional</Text>
            <Feather name="arrow-right" size={16} color={colors.surface} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.guaranteeBox}>
          <Feather name="shield" size={16} color={colors.primary} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.guaranteeTitle}>GARANTÍA ATELIER</Text>
            <Text style={styles.guaranteeText}>Acceso a profesionales calificados y clientes...</Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿Ya tienes una cuenta registrada? <Text style={styles.footerHighlight} onPress={() => navigation.navigate('Login')}>Inicia Sesión</Text>
          </Text>
          <View style={styles.legalRow}>
            <Feather name="lock" size={10} color={colors.textGray} />
            <Text style={styles.legalText}> Conexión cifrada de 256 bits · Privacidad garantizada</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 20 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#1E1E1E' },
  titleSection: { marginBottom: 24 },
  heading: { fontSize: 24, fontWeight: '800', color: '#1E1E1E', marginBottom: 8 },
  description: { fontSize: 14, color: '#707070', lineHeight: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F0F0F0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  iconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8F8F8', alignItems: 'center', justifyContent: 'center' },
  pillClient: { backgroundColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillTextClient: { fontSize: 10, fontWeight: '700', color: '#707070' },
  pillPro: { backgroundColor: '#C88574', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillTextPro: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  cardSubtitle: { fontSize: 12, fontWeight: '600', color: '#8B503E', marginBottom: 4 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1E1E1E', marginBottom: 8 },
  cardDescription: { fontSize: 13, color: '#707070', lineHeight: 18, marginBottom: 16 },
  features: { marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  checkIcon: { backgroundColor: '#FFF0ED', borderRadius: 10, padding: 2, marginRight: 8, overflow: 'hidden' },
  featureText: { fontSize: 12, color: '#555', flex: 1 },
  clientButton: { backgroundColor: '#EAEAEA', flexDirection: 'row', borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  clientButtonText: { color: '#1E1E1E', fontSize: 14, fontWeight: '600' },
  proButton: { backgroundColor: '#8B503E', flexDirection: 'row', borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  proButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  guaranteeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', padding: 16, borderRadius: 12, marginBottom: 24 },
  guaranteeTitle: { fontSize: 10, fontWeight: '700', color: '#1E1E1E' },
  guaranteeText: { fontSize: 11, color: '#707070' },
  footer: { alignItems: 'center' },
  footerText: { fontSize: 13, color: '#707070', marginBottom: 12 },
  footerHighlight: { color: '#8B503E', fontWeight: '700' },
  legalRow: { flexDirection: 'row', alignItems: 'center' },
  legalText: { fontSize: 11, color: '#A0A0A0' },
});