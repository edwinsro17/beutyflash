import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const colors = { background: '#FFF6F4', surface: '#FFFFFF', primary: '#8B503E', textDark: '#1E1E1E', textGray: '#707070', border: '#EAEAEA', accent: '#D89C8F' };

export default function ProProfileActivatedScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Fondo con degradado simulado */}
      <View style={styles.bgGradientTop} />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header Icon */}
        <View style={styles.headerIconContainer}>
          <View style={styles.sparkleCircle}>
            <MaterialCommunityIcons name="star-four-points" size={24} color={colors.primary} />
          </View>
          <View style={styles.pillActive}>
            <Text style={styles.pillTextActive}>• MEMBRESÍA EXCLUSIVA ACTIVADA</Text>
          </View>
        </View>

        <Text style={styles.heading}>¡Perfil Pro Activado con Éxito!</Text>
        <Text style={styles.description}>
          Bienvenida a la comunidad selecta de BeautyFlash. Tu atelier digital ya está listo para recibir clientes VIP y reservas express.
        </Text>

        {/* Tarjeta de Identidad */}
        <View style={styles.idCard}>
          <View style={styles.idHeaderRow}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarPlaceholder}><Feather name="user" size={30} color={colors.textGray}/></View>
              <View style={styles.verifiedBadge}><Feather name="check" size={10} color="#FFF"/></View>
            </View>
            <View style={{flex: 1, marginLeft: 12}}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.specialistLabel}>ESPECIALISTA VERIFICADA</Text>
                <MaterialCommunityIcons name="check-decagram" size={14} color={colors.primary} style={{marginLeft: 4}} />
              </View>
              <Text style={styles.nameText}>Sofía Alarcón</Text>
              <Text style={styles.atelierText}>Hair & Color Atelier</Text>
              <View style={styles.proIdPill}><Text style={styles.proIdText}>PRO ID: #BF-8842</Text></View>
            </View>
          </View>
          <View style={styles.guaranteeBox}>
            <Feather name="shield" size={16} color={colors.primary} />
            <View style={{flex: 1, marginLeft: 10}}>
              <Text style={styles.guaranteeTitle}>Garantía y Confianza Atelier</Text>
              <Text style={styles.guaranteeText}>Verificación de identidad KYS completada • Cobertura de seguro y cobros protegidos</Text>
            </View>
          </View>
        </View>

        {/* Resumen de Configuración */}
        <View style={styles.configCard}>
          <View style={styles.configHeader}>
            <Text style={styles.configTitle}>Configuración Completada</Text>
            <View style={styles.configBadge}><Text style={styles.configBadgeText}>4 de 4 listo</Text></View>
          </View>
          
          {[
            'Identidad y Portfolio validado con Instagram',
            'Carta de 4 servicios activos y tarifas sincronizadas',
            'Zona de atención Madrid Centro (12 km) y horarios listos',
            'Depósito directo a CaixaBank configurado (Stripe + Bizum)'
          ].map((item, i) => (
            <View key={i} style={styles.checkRow}>
              <View style={styles.checkCircle}><Feather name="check" size={12} color={colors.primary} /></View>
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Bono Bienvenida */}
        <View style={styles.bonusCard}>
          <View style={styles.bonusIconBox}><Feather name="gift" size={20} color={colors.primary} /></View>
          <View style={{flex: 1, marginLeft: 12}}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
              <Text style={styles.bonusTitle}>Bono de Bienvenida Pro </Text>
              <View style={styles.bonusBadge}><Text style={styles.bonusBadgeText}>30 DÍAS</Text></View>
            </View>
            <Text style={styles.bonusText}>
              Durante tus primeros 30 días, disfruta de <Text style={{fontWeight: '700', color: colors.primary}}>0% comisión de plataforma</Text> y visibilidad destacada en búsquedas prioritarias de tu zona.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('ProDashboard')}>
          <Text style={styles.mainButtonText}>Ir a mi Dashboard Profesional</Text>
          <Feather name="arrow-right" size={16} color="#FFF" style={{marginLeft: 8}} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.previewBtn}>
          <Feather name="eye" size={14} color={colors.textDark} />
          <Text style={styles.previewBtnText}>Ver cómo ven los clientes mi perfil público</Text>
        </TouchableOpacity>

        <View style={styles.secureFooter}>
          <Feather name="lock" size={10} color={colors.textGray} />
          <Text style={styles.secureFooterText}>Conexión cifrada de extremo a extremo • Cumplimiento RGPD & PSD2</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  bgGradientTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 300, backgroundColor: '#FDF7F5' },
  scrollContainer: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40, alignItems: 'center' },
  headerIconContainer: { alignItems: 'center', marginBottom: 20 },
  sparkleCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF0ED', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  pillActive: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, elevation: 1 },
  pillTextActive: { fontSize: 10, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  heading: { fontSize: 26, fontWeight: '800', color: colors.textDark, textAlign: 'center', marginBottom: 12, lineHeight: 32 },
  description: { fontSize: 13, color: colors.textGray, textAlign: 'center', lineHeight: 20, marginBottom: 30, paddingHorizontal: 10 },
  
  idCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 20 },
  idHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarWrapper: { position: 'relative' },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  specialistLabel: { fontSize: 9, fontWeight: '700', color: colors.textGray, letterSpacing: 1 },
  nameText: { fontSize: 18, fontWeight: '700', color: colors.textDark, marginTop: 2 },
  atelierText: { fontSize: 12, color: colors.textGray, marginBottom: 6 },
  proIdPill: { alignSelf: 'flex-start', backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  proIdText: { fontSize: 10, fontWeight: '700', color: colors.textDark },
  guaranteeBox: { flexDirection: 'row', backgroundColor: '#F9F9F9', padding: 12, borderRadius: 12 },
  guaranteeTitle: { fontSize: 11, fontWeight: '700', color: colors.textDark, marginBottom: 2 },
  guaranteeText: { fontSize: 10, color: colors.textGray, lineHeight: 14 },

  configCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20 },
  configHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  configTitle: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  configBadge: { backgroundColor: '#FFF0ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  configBadgeText: { fontSize: 9, fontWeight: '700', color: colors.primary },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF0ED', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  checkText: { flex: 1, fontSize: 12, color: colors.textDark, lineHeight: 18 },

  bonusCard: { width: '100%', flexDirection: 'row', backgroundColor: '#FFF0ED', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#FAD8D2' },
  bonusIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  bonusTitle: { fontSize: 13, fontWeight: '700', color: colors.primary },
  bonusBadge: { backgroundColor: colors.textDark, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  bonusBadgeText: { fontSize: 9, fontWeight: '700', color: '#FFF' },
  bonusText: { fontSize: 11, color: colors.textDark, lineHeight: 16 },

  mainButton: { width: '100%', backgroundColor: '#C88574', flexDirection: 'row', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  mainButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  previewBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  previewBtnText: { fontSize: 12, fontWeight: '600', color: colors.textDark, marginLeft: 8 },
  
  secureFooter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  secureFooterText: { fontSize: 9, color: colors.textGray, textAlign: 'center', marginLeft: 6, lineHeight: 14 }
});