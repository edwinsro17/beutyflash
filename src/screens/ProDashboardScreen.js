import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const colors = { background: '#FAFAFA', surface: '#FFFFFF', primary: '#8B503E', textDark: '#1E1E1E', textGray: '#707070', border: '#EAEAEA', accent: '#D89C8F' };

export default function ProDashboardScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Top Navigation / Header */}
      <View style={styles.topNav}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View style={styles.greenDot} />
          <Text style={styles.dashboardTitle}>Dashboard</Text>
        </View>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.statusDropdown}>
            <View style={[styles.greenDot, {marginRight: 6}]} />
            <Text style={styles.statusText}>Disponible</Text>
            <Feather name="chevron-down" size={14} color={colors.textGray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}><Feather name="bell" size={20} color={colors.textDark} /></TouchableOpacity>
          <TouchableOpacity style={styles.profileBtn}><Feather name="user" size={16} color="#FFF" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Saludo */}
        <View style={styles.greetingRow}>
          <View style={{flex: 1}}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
              <Text style={styles.atelierStatus}>ATELIER ACTIVO</Text>
              <View style={styles.nuevoBadge}><Text style={styles.nuevoBadgeText}>Nuevo</Text></View>
            </View>
            <Text style={styles.greetingTitle}>¡Hola, Sofía!</Text>
            <Text style={styles.greetingSub}>Tu espacio estético está listo para recibir clientes.</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.greenDot} />
            <View style={{marginLeft: 6}}>
              <Text style={styles.liveTitle}>En Vivo</Text>
              <Text style={styles.liveSub}>Aceptando citas</Text>
            </View>
          </View>
        </View>

        {/* Tarjeta de Progreso / Onboarding */}
        <View style={styles.onboardingCard}>
          <View style={styles.onboardingHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <MaterialCommunityIcons name="star-four-points" size={18} color={colors.primary} />
              <Text style={styles.onboardingTitle}> Tu Atelier ya está visible</Text>
            </View>
            <View style={styles.progressCircle}><Text style={styles.progressCircleText}>1/3{'\n'}listos</Text></View>
          </View>
          <Text style={styles.onboardingSub}>Completa estos pasos para recibir tu primera cita hoy:</Text>
          <View style={styles.progressBar}><View style={[styles.progressFill, {width: '33%'}]} /></View>

          {/* Tareas */}
          <View style={styles.taskCardActive}>
            <View style={styles.taskHeader}>
              <Feather name="share-2" size={16} color={colors.primary} style={{marginTop: 2}}/>
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={styles.taskTitle}>Compartir enlace en Instagram</Text>
                <Text style={styles.taskSub}>beautyflash.pro/@sofia.atelier</Text>
              </View>
              <View style={styles.circleOutline} />
            </View>
            <TouchableOpacity style={styles.copyBtn}>
              <Feather name="copy" size={14} color={colors.textDark} />
              <Text style={styles.copyBtnText}>Copiar enlace público</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.taskCard}>
            <Feather name="zap" size={18} color={colors.textDark} />
            <View style={{flex: 1, marginLeft: 12}}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.taskTitle}>Modo Flash N...</Text>
                <View style={styles.incomeBadge}><Text style={styles.incomeBadgeText}>+25% ingresos</Text></View>
              </View>
              <Text style={styles.taskSub}>Citas urgentes en {'<'} 60 min</Text>
            </View>
            <TouchableOpacity style={styles.activateBtn}><Text style={styles.activateBtnText}>Activar</Text></TouchableOpacity>
          </View>

          <View style={styles.taskCard}>
            <Feather name="image" size={18} color={colors.textDark} />
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={styles.taskTitle}>Añadir fotos al catálogo</Text>
              <Text style={styles.taskSub}>Muestra tus últimos tratamientos</Text>
            </View>
            <TouchableOpacity style={styles.plusBtn}><Feather name="plus" size={16} color={colors.textDark} /></TouchableOpacity>
          </View>
        </View>

        {/* Métricas del Día */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tu Día en Flash</Text>
          <Text style={styles.sectionSub}>Hoy, 24 Oct</Text>
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricTop}>
              <Text style={styles.metricLabel}>Ganancias</Text>
              <Feather name="dollar-sign" size={12} color={colors.textDark} />
            </View>
            <Text style={styles.metricValue}>0,00 €</Text>
            <Text style={styles.metricSubGreen}>Flash Inmediata</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricTop}>
              <Text style={styles.metricLabel}>Citas hoy</Text>
              <Feather name="calendar" size={12} color={colors.textDark} />
            </View>
            <Text style={styles.metricValue}>0</Text>
            <Text style={styles.metricSub}>09:30 - 14:00 lib...</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricTop}>
              <Text style={styles.metricLabel}>Explorando</Text>
              <Feather name="eye" size={12} color={colors.textDark} />
            </View>
            <Text style={styles.metricValue}>14<View style={styles.greenDot}/></Text>
            <Text style={styles.metricSub}>Clientes VIP</Text>
          </View>
        </View>

        {/* Próximas Solicitudes (Empty State) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximas Solicitudes</Text>
          <Text style={styles.sectionSubOrange}>Tiempo Real</Text>
        </View>
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyIconCircle}>
            <Feather name="monitor" size={24} color={colors.textDark} /> 
            {/* Usando monitor como placeholder para el icono de silla/salón */}
          </View>
          <Text style={styles.emptyTitle}>Esperando tu primera reserva</Text>
          <Text style={styles.emptyDesc}>Los clientes de <Text style={{fontWeight: '700', color: colors.textDark}}>Madrid Centro</Text> pueden descubrir y agendar tus servicios en este mismo instante.</Text>
          <View style={styles.radarPill}>
            <Feather name="navigation" size={12} color={colors.textGray} />
            <Text style={styles.radarText}>Radio de cobertura: 8.5 km</Text>
          </View>
        </View>

        {/* Acciones Rápidas */}
        <Text style={[styles.sectionTitle, {marginTop: 10, marginBottom: 12}]}>Acciones Rápidas de Estudio</Text>
        
        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionIconOrange}><Feather name="plus" size={18} color={colors.primary} /></View>
          <View style={{flex: 1, marginLeft: 12}}>
            <Text style={styles.actionTitle}>Añadir cita manual</Text>
            <Text style={styles.actionSub}>Para clientes presenciales o por WhatsApp</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textGray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionIconGray}><Feather name="clock" size={18} color={colors.textDark} /></View>
          <View style={{flex: 1, marginLeft: 12}}>
            <Text style={styles.actionTitle}>Modificar disponibilidad de hoy</Text>
            <Text style={styles.actionSub}>Bloquear franjas o abrir huecos extra</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textGray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionIconGray}><MaterialCommunityIcons name="qrcode-scan" size={18} color={colors.textDark} /></View>
          <View style={{flex: 1, marginLeft: 12}}>
            <Text style={styles.actionTitle}>Descargar código QR de tu perfil</Text>
            <Text style={styles.actionSub}>Listo para imprimir y colocar en tu tocador</Text>
          </View>
          <Feather name="download" size={18} color={colors.textDark} />
        </TouchableOpacity>

      </ScrollView>

      {/* Bottom Navigation (Visual Only) */}
      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <MaterialCommunityIcons name="view-grid" size={24} color={colors.primary} />
          <Text style={[styles.navText, {color: colors.primary}]}>Dashboard</Text>
        </View>
        <View style={styles.navItem} OnPress={() => navigation.navigate('Agenda')}>
          <Feather name="calendar" size={24} color="#A0A0A0" />
          <Text style={styles.navText}>Agenda</Text>
        </View>
        <View style={styles.navItem} OnPress={() => navigation.navigate('Servicios')}>
          <MaterialCommunityIcons name="flower-outline" size={24} color="#A0A0A0" />
          <Text style={styles.navText}>Servicios</Text>
        </View>
        <View style={styles.navItem} OnPress={() => navigation.navigate('Billetera')}>
          <Feather name="credit-card" size={24} color="#A0A0A0" />
          <Text style={styles.navText}>Billetera</Text>
        </View>
        <View style={styles.navItem} OnPress={() => navigation.navigate('MiPerfil')}>
          <Feather name="briefcase" size={24} color="#A0A0A0" />
          <Text style={styles.navText}>Mi Perfil</Text>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00C853' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: colors.border },
  dashboardTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark, marginLeft: 8 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.textDark, marginRight: 4 },
  iconBtn: { padding: 4 },
  profileBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  
  scrollContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  atelierStatus: { fontSize: 10, fontWeight: '700', color: colors.primary, letterSpacing: 1 },
  nuevoBadge: { backgroundColor: '#FFF0ED', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  nuevoBadgeText: { fontSize: 9, fontWeight: '700', color: colors.primary },
  greetingTitle: { fontSize: 24, fontWeight: '800', color: colors.textDark, marginVertical: 4 },
  greetingSub: { fontSize: 12, color: colors.textGray },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#D7F0DC' },
  liveTitle: { fontSize: 10, fontWeight: '700', color: colors.textDark },
  liveSub: { fontSize: 9, color: colors.textGray },

  onboardingCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 24, elevation: 1 },
  onboardingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  onboardingTitle: { fontSize: 15, fontWeight: '700', color: colors.textDark },
  progressCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9F1EF', alignItems: 'center', justifyContent: 'center' },
  progressCircleText: { fontSize: 10, fontWeight: '700', color: colors.primary, textAlign: 'center', lineHeight: 12 },
  onboardingSub: { fontSize: 12, color: colors.textGray, marginTop: 4, marginBottom: 12 },
  progressBar: { height: 4, backgroundColor: '#F5F5F5', borderRadius: 2, marginBottom: 16 },
  progressFill: { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
  
  taskCardActive: { backgroundColor: '#F9F9F9', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  taskHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  taskTitle: { fontSize: 13, fontWeight: '700', color: colors.textDark },
  taskSub: { fontSize: 11, color: colors.textGray, marginTop: 2 },
  circleOutline: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#A0A0A0' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  copyBtnText: { fontSize: 12, fontWeight: '600', color: colors.textDark, marginLeft: 8 },
  
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  incomeBadge: { backgroundColor: '#FFF0ED', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 },
  incomeBadgeText: { fontSize: 9, fontWeight: '700', color: colors.primary },
  activateBtn: { backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  activateBtnText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  plusBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark },
  sectionSub: { fontSize: 11, color: colors.textGray },
  sectionSubOrange: { fontSize: 10, fontWeight: '700', color: colors.primary },
  
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  metricCard: { flex: 1, backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metricLabel: { fontSize: 10, fontWeight: '600', color: colors.textDark },
  metricValue: { fontSize: 18, fontWeight: '800', color: colors.textDark, marginBottom: 4 },
  metricSub: { fontSize: 9, color: colors.textGray },
  metricSubGreen: { fontSize: 9, fontWeight: '600', color: '#00C853' },

  emptyStateCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  emptyIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: colors.textDark, marginBottom: 8 },
  emptyDesc: { fontSize: 12, color: colors.textGray, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  radarPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  radarText: { fontSize: 10, color: colors.textGray, marginLeft: 6 },

  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  actionIconOrange: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF0ED', alignItems: 'center', justifyContent: 'center' },
  actionIconGray: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 13, fontWeight: '700', color: colors.textDark },
  actionSub: { fontSize: 11, color: colors.textGray, marginTop: 2 },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 10, borderTopWidth: 1, borderColor: colors.border },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 9, color: '#A0A0A0', marginTop: 4, fontWeight: '600' }
});