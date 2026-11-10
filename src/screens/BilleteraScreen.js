import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const colors = { background: '#FAFAFA', surface: '#FFFFFF', primary: '#8B503E', textDark: '#1E1E1E', textGray: '#707070', border: '#EAEAEA', accent: '#D89C8F' };

export default function BilleteraScreen({ navigation }) {
  const [status, setStatus] = useState('Disponible');
  const toggleStatus = () => {
    if (status === 'Disponible') setStatus('Fuera de servicio');
    else if (status === 'Fuera de servicio') setStatus('Ocupado');
    else setStatus('Disponible');
  };
  const getStatusColor = () => status === 'Disponible' ? '#00C853' : status === 'Fuera de servicio' ? '#9E9E9E' : '#F57C00';

  const [timeFilter, setTimeFilter] = useState('Esta Semana');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Billetera</Text>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.statusDropdown} onPress={toggleStatus}>
            <View style={[styles.statusDot, {backgroundColor: getStatusColor()}]} />
            <Text style={styles.statusText}>{status}</Text>
            <Feather name="chevron-down" size={14} color={colors.textGray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}><Feather name="bell" size={20} color={colors.textDark} /></TouchableOpacity>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('MiPerfil')}><Feather name="user" size={16} color="#FFF" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
          <Text style={styles.sectionTitle}>FINANZAS & FACTURACIÓN</Text>
          <TouchableOpacity style={styles.reportBtn}><Feather name="file-text" size={12} color={colors.primary}/> <Text style={styles.reportBtnText}>Informe PDF</Text></TouchableOpacity>
        </View>

        {/* Tarjeta Principal de Saldo */}
        <View style={styles.balanceCard}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Feather name="credit-card" size={14} color="#FFF" style={{marginRight: 8, opacity: 0.8}} />
              <Text style={styles.balanceLabel}>Saldo disponible para retiro</Text>
            </View>
            <View style={styles.badgeReady}><View style={styles.dotGreen}/><Text style={styles.badgeReadyText}>Listo</Text></View>
          </View>
          <Text style={styles.balanceAmount}>485,50 <Text style={{fontSize: 24, fontWeight: '400'}}>€</Text></Text>
          
          <TouchableOpacity style={styles.transferBtn}>
            <Feather name="zap" size={14} color={colors.primary} />
            <Text style={styles.transferBtnText}>Transferir Fondos a Banco (Instantáneo)</Text>
          </TouchableOpacity>
          
          <View style={styles.processingRow}>
            <Text style={styles.processingLabel}>En proceso de liquidación:</Text>
            <Text style={styles.processingVal}>120,00 € <Text style={{fontWeight: '400'}}>(Hoy)</Text></Text>
          </View>
        </View>

        {/* Filtros de Tiempo interactivos */}
        <View style={styles.timeFilters}>
          {['Esta Semana', 'Este Mes', 'Año 2025'].map(f => (
            <TouchableOpacity key={f} style={[styles.timeBtn, timeFilter === f && styles.timeBtnActive]} onPress={() => setTimeFilter(f)}>
              <Text style={[styles.timeBtnText, timeFilter === f && styles.timeBtnTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Gráfico Simulado */}
        <View style={styles.chartCard}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16}}>
            <View>
              <Text style={styles.chartSub}>RITMO DE FACTURACIÓN</Text>
              <Text style={styles.chartTitle}>Ingresos diarios</Text>
            </View>
            <View style={styles.trendBadge}><Feather name="trending-up" size={12} color="#2E7D32"/> <Text style={styles.trendText}>+18%</Text></View>
          </View>
          <View style={styles.barsContainer}>
            {/* Alturas relativas simuladas */}
            <View style={styles.barCol}><View style={[styles.bar, {height: 40}]}/><Text style={styles.barLabel}>L</Text></View>
            <View style={styles.barCol}><View style={[styles.bar, {height: 60}]}/><Text style={styles.barLabel}>M</Text></View>
            <View style={styles.barCol}><View style={[styles.bar, {height: 80}]}/><Text style={styles.barLabel}>X</Text></View>
            <View style={styles.barCol}><View style={[styles.bar, {height: 50}]}/><Text style={styles.barLabel}>J</Text></View>
            <View style={styles.barCol}><View style={[styles.bar, {height: 90}]}/><Text style={styles.barLabel}>V</Text></View>
            <View style={styles.barCol}>
              <Text style={styles.barPeak}>245€</Text>
              <View style={[styles.bar, styles.barPeakActive, {height: 100}]}/>
              <Text style={[styles.barLabel, {fontWeight: '700', color: colors.textDark}]}>S</Text>
            </View>
            <View style={styles.barCol}><View style={[styles.bar, {height: 30}]}/><Text style={styles.barLabel}>D</Text></View>
          </View>
        </View>

        {/* Grid de Estadísticas */}
        <View style={styles.statsGrid}>
          <View style={styles.gridItem}>
            <View style={styles.gridTop}><Text style={styles.gridLabel}>FACTURADO</Text><Feather name="dollar-sign" size={14} color={colors.textDark}/></View>
            <Text style={styles.gridVal}>2.340,00 €</Text>
            <Text style={styles.gridSubGreen}>+18% vs anterior</Text>
          </View>
          <View style={styles.gridItem}>
            <View style={styles.gridTop}><Text style={styles.gridLabel}>CITAS</Text><Feather name="calendar" size={14} color={colors.textDark}/></View>
            <Text style={styles.gridVal}>24 Citas</Text>
            <Text style={styles.gridSub}>100% de asistencia</Text>
          </View>
          <View style={styles.gridItem}>
            <View style={styles.gridTop}><Text style={styles.gridLabel}>TICKET MEDIO</Text><Feather name="activity" size={14} color={colors.textDark}/></View>
            <Text style={styles.gridVal}>97,50 €</Text>
            <Text style={styles.gridSub}>Por servicio prémium</Text>
          </View>
          <View style={styles.gridItem}>
            <View style={styles.gridTop}><Text style={styles.gridLabel}>PROPINAS</Text><Feather name="heart" size={14} color={colors.textDark}/></View>
            <Text style={styles.gridVal}>145,00 €</Text>
            <Text style={styles.gridSub}>100% netas (0% com.)</Text>
          </View>
        </View>

        {/* Cuenta Vinculada */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12}}>
          <Text style={styles.sectionTitle}>CUENTA DE COBRO VINCULADA</Text>
          <Text style={styles.sectionDrag}>Configurar</Text>
        </View>
        <View style={styles.bankCard}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <View style={styles.bankIcon}><MaterialCommunityIcons name="bank" size={20} color={colors.primary}/></View>
              <View style={{marginLeft: 12}}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.bankTitle}>CaixaBank S.A. </Text>
                  <Feather name="check-circle" size={12} color="#2E7D32"/>
                </View>
                <Text style={styles.bankSub}>IBAN •••• 9842</Text>
              </View>
            </View>
            <Text style={styles.stripeText}>Stripe Connect ✓</Text>
          </View>
          <View style={styles.bankFooter}>
            <View style={styles.dotGreen}/><Text style={styles.bankFooterText}> Modo: Pago Flash Inmediato activo</Text>
          </View>
        </View>

      </ScrollView>
      <BottomNav navigation={navigation} active="Billetera" />
    </SafeAreaView>
  );
}
// Agrega esto al final de ServiciosScreen.js, AgendaScreen.js, BilleteraScreen.js y MiPerfilScreen.js
const BottomNav = ({ navigation, active }) => {
  const navItems = [
    { id: 'ProDashboard', icon: 'view-grid', iconType: 'material', label: 'Dashboard' },
    { id: 'Agenda', icon: 'calendar', iconType: 'feather', label: 'Agenda' },
    { id: 'Servicios', icon: 'flower-outline', iconType: 'material', label: 'Servicios' },
    { id: 'Billetera', icon: 'credit-card', iconType: 'feather', label: 'Billetera' },
    { id: 'MiPerfil', icon: 'briefcase', iconType: 'feather', label: 'Mi Perfil' },
  ];

  return (
    <View style={navStyles.container}>
      {navItems.map(item => {
        const isActive = active === item.id || active === item.label;
        const color = isActive ? '#8B503E' : '#A0A0A0';
        return (
          <TouchableOpacity key={item.id} style={navStyles.navItem} onPress={() => navigation.navigate(item.id)}>
            {item.iconType === 'feather' ? (
              <Feather name={item.icon} size={24} color={color} />
            ) : (
              <MaterialCommunityIcons name={item.icon} size={24} color={color} />
            )}
            <Text style={[navStyles.navText, { color }]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const navStyles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 10, borderTopWidth: 1, borderColor: '#EAEAEA' },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 9, marginTop: 4, fontWeight: '600' }
});
// ESTILOS DE BILLETERA
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.textDark, marginRight: 4 },
  profileBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  scrollContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: colors.textGray, letterSpacing: 1 },
  reportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0ED', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  reportBtnText: { fontSize: 10, fontWeight: '700', color: colors.primary, marginLeft: 4 },
  balanceCard: { backgroundColor: colors.primary, borderRadius: 16, padding: 20, marginTop: 12, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2 },
  balanceLabel: { fontSize: 12, color: '#FFF', opacity: 0.9 },
  badgeReady: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  dotGreen: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 4 },
  badgeReadyText: { fontSize: 10, color: '#FFF', fontWeight: '700' },
  balanceAmount: { fontSize: 36, fontWeight: '800', color: '#FFF', marginBottom: 20 },
  transferBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', paddingVertical: 14, borderRadius: 12, marginBottom: 16 },
  transferBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary, marginLeft: 8 },
  processingRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingTop: 12 },
  processingLabel: { fontSize: 11, color: '#FFF', opacity: 0.8 },
  processingVal: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  timeFilters: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  timeBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  timeBtnActive: { backgroundColor: '#F5F5F5' },
  timeBtnText: { fontSize: 11, fontWeight: '600', color: colors.textGray },
  timeBtnTextActive: { color: colors.textDark },
  chartCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  chartSub: { fontSize: 9, fontWeight: '700', color: colors.textGray, letterSpacing: 1 },
  chartTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark, marginTop: 2 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  trendText: { fontSize: 11, fontWeight: '700', color: '#2E7D32', marginLeft: 4 },
  barsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingTop: 20 },
  barCol: { alignItems: 'center' },
  bar: { width: 30, backgroundColor: '#EAEAEA', borderRadius: 4, marginBottom: 8 },
  barPeakActive: { backgroundColor: colors.accent },
  barLabel: { fontSize: 10, color: colors.textGray },
  barPeak: { fontSize: 10, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  gridItem: { width: '48%', backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  gridTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  gridLabel: { fontSize: 9, fontWeight: '700', color: colors.textGray, letterSpacing: 0.5 },
  gridVal: { fontSize: 16, fontWeight: '800', color: colors.textDark, marginBottom: 4 },
  gridSub: { fontSize: 9, color: colors.textGray },
  gridSubGreen: { fontSize: 9, fontWeight: '600', color: '#2E7D32' },
  sectionDrag: { fontSize: 10, color: colors.primary, fontWeight: '600' },
  bankCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  bankIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#F9F1EF', alignItems: 'center', justifyContent: 'center' },
  bankTitle: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  bankSub: { fontSize: 11, color: colors.textGray, marginTop: 2 },
  stripeText: { fontSize: 9, fontWeight: '700', color: '#00897B' },
  bankFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderColor: '#F5F5F5' },
  bankFooterText: { fontSize: 10, color: colors.textDark, fontWeight: '500' },
});