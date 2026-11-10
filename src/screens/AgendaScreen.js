import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const colors = { background: '#FAFAFA', surface: '#FFFFFF', primary: '#8B503E', textDark: '#1E1E1E', textGray: '#707070', border: '#EAEAEA', accent: '#D89C8F' };

export default function AgendaScreen({ navigation }) {
  const [status, setStatus] = useState('Disponible');
  const toggleStatus = () => {
    if (status === 'Disponible') setStatus('Fuera de servicio');
    else if (status === 'Fuera de servicio') setStatus('Ocupado');
    else setStatus('Disponible');
  };
  const getStatusColor = () => status === 'Disponible' ? '#00C853' : status === 'Fuera de servicio' ? '#9E9E9E' : '#F57C00';

  const [activeDay, setActiveDay] = useState(24);
  const days = [{d: 'LUN', n: 21}, {d: 'MAR', n: 22}, {d: 'MIÉ', n: 23}, {d: 'HOY', n: 24}, {d: 'VIE', n: 25}, {d: 'SÁB', n: 26}];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* HEADER COMPARTIDO */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agenda</Text>
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
        {/* Cabecera de Fecha */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Feather name="calendar" size={20} color={colors.primary} style={{marginRight: 8}} />
            <View>
              <Text style={styles.dateTitle}>Jueves, 24 Octubre</Text>
              <Text style={styles.dateSub}>Atelier Velázquez & BeautyFlash Go</Text>
            </View>
          </View>
          <View style={styles.viewToggle}>
            <TouchableOpacity style={styles.viewBtnActive}><Text style={styles.viewBtnTextActive}>Día</Text></TouchableOpacity>
            <TouchableOpacity style={styles.viewBtn}><Text style={styles.viewBtnText}>Semana</Text></TouchableOpacity>
          </View>
        </View>

        {/* Carrusel de Días interactivo */}
        <View style={styles.daysRow}>
          {days.map((day, i) => (
            <TouchableOpacity key={i} style={[styles.dayCard, activeDay === day.n && styles.dayCardActive]} onPress={() => setActiveDay(day.n)}>
              <Text style={[styles.dayName, activeDay === day.n && styles.dayNameActive]}>{day.d}</Text>
              <Text style={[styles.dayNum, activeDay === day.n && styles.dayNumActive]}>{day.n}</Text>
              {activeDay === day.n && <View style={styles.dayDot} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Resumen Jornada */}
        <View style={styles.statsCard}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12}}>
            <Text style={styles.statsTitle}><View style={styles.dotOrange}/> Ritmo de Jornada</Text>
            <Text style={styles.statsSubOrange}>85% ocupación</Text>
          </View>
          <View style={{flexDirection: 'row', gap: 8}}>
            <View style={styles.miniStat}><Text style={styles.miniLabel}>Citas fijadas</Text><Text style={styles.miniVal}>3</Text><Text style={styles.miniSub}>+1 exprés</Text></View>
            <View style={styles.miniStat}><Text style={styles.miniLabel}>Tiempo activo</Text><Text style={styles.miniVal}>4h 15m</Text><Text style={styles.miniSub}>1 descanso</Text></View>
            <View style={styles.miniStat}><Text style={styles.miniLabel}>Proyección</Text><Text style={styles.miniVal}>285 €</Text><Text style={styles.miniSub}>+15 € extra</Text></View>
          </View>
        </View>

        {/* Cronograma */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
          <Text style={styles.sectionTitleBig}>Cronograma del Día</Text>
          <View style={{flexDirection: 'row', gap: 8}}>
            <TouchableOpacity style={styles.actionPill}><Feather name="slash" size={12} color={colors.textDark}/> <Text style={styles.actionPillText}>Bloquear</Text></TouchableOpacity>
            <TouchableOpacity style={styles.actionPillPrimary}><Feather name="plus" size={12} color="#FFF"/> <Text style={styles.actionPillTextPrimary}>Cita rápida</Text></TouchableOpacity>
          </View>
        </View>

        {/* Timeline Items */}
        <View style={styles.timelineContainer}>
          {/* Linea vertical de fondo */}
          <View style={styles.timelineLine} />

          {/* Item 1: Cita */}
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, {backgroundColor: colors.primary}]} />
            <View style={styles.apptCard}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8}}>
                <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
                  <Text style={styles.timeText}>10:00 - 12:00</Text>
                  <View style={styles.badgeGreen}><Text style={styles.badgeGreenText}>Confirmada</Text></View>
                </View>
                <Text style={styles.priceText}>120 €</Text>
              </View>
              <Text style={styles.apptTitle}>Balayage Babylights + Matiz Gloss</Text>
              <Text style={styles.apptSub}>Elena Morales • Cliente VIP Recurrente</Text>
              <Text style={styles.apptLoc}><Feather name="home" size={10}/> En Salón • Tocador 2 (C/ Velázquez 34)</Text>
              <View style={styles.apptFooter}>
                <View style={styles.tagGray}><Text style={styles.tagGrayText}>✓ Material listo • Decolorante orgánico</Text></View>
                <View style={{flexDirection: 'row', gap: 8}}>
                  <TouchableOpacity style={styles.iconCircle}><Feather name="phone" size={14} color={colors.textDark}/></TouchableOpacity>
                  <TouchableOpacity style={styles.iconCircle}><Feather name="message-square" size={14} color={colors.textDark}/></TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Item 2: Pausa */}
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, {backgroundColor: colors.border}]} />
            <View style={styles.pauseCard}>
              <Feather name="coffee" size={16} color={colors.textGray} style={{marginRight: 12}} />
              <View style={{flex: 1}}>
                <View style={{flexDirection: 'row', gap: 8}}><Text style={styles.timeText}>12:00 - 12:30</Text><Text style={styles.tagGrayText}>Pausa técnica</Text></View>
                <Text style={styles.apptSub}>Limpieza profunda de tocador y esterilización</Text>
              </View>
            </View>
          </View>

          {/* Item 3: Domicilio */}
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, {backgroundColor: colors.primary}]} />
            <View style={styles.apptCard}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8}}>
                <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
                  <Text style={styles.timeText}>13:00 - 13:45</Text>
                  <View style={styles.badgeOrange}><Text style={styles.badgeOrangeText}>⚡ BeautyFlash Go</Text></View>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={styles.priceText}>60 €</Text>
                  <Text style={{fontSize: 9, color: colors.textGray}}>+15 € desplazamiento</Text>
                </View>
              </View>
              <Text style={styles.apptTitle}>Corte de Autor & Blowout Glam</Text>
              <Text style={styles.apptSub}>Carmen Delgado • A Domicilio</Text>
              <Text style={styles.apptLoc}><Feather name="map-pin" size={10}/> C/ Serrano 82, 4º Derecha • 1.2 km</Text>
            </View>
          </View>
        </View>

      </ScrollView>
      <BottomNav navigation={navigation} active="Agenda" />
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
// ESTILOS DE AGENDA
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
  dateTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  dateSub: { fontSize: 10, color: colors.textGray },
  viewToggle: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 16, padding: 4 },
  viewBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  viewBtnActive: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  viewBtnText: { fontSize: 11, fontWeight: '600', color: colors.textGray },
  viewBtnTextActive: { fontSize: 11, fontWeight: '600', color: '#FFF' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dayCard: { alignItems: 'center', paddingVertical: 10, width: '15%', borderRadius: 12 },
  dayCardActive: { backgroundColor: colors.primary },
  dayName: { fontSize: 10, fontWeight: '600', color: colors.textGray, marginBottom: 4 },
  dayNameActive: { color: '#FFF' },
  dayNum: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  dayNumActive: { color: '#FFF' },
  dayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFF', marginTop: 4 },
  statsCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  statsTitle: { fontSize: 12, fontWeight: '700', color: colors.textDark },
  dotOrange: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginRight: 6 },
  statsSubOrange: { fontSize: 10, fontWeight: '700', color: colors.accent },
  miniStat: { flex: 1, backgroundColor: '#F9F9F9', padding: 10, borderRadius: 10 },
  miniLabel: { fontSize: 9, color: colors.textGray },
  miniVal: { fontSize: 16, fontWeight: '800', color: colors.textDark, marginVertical: 2 },
  miniSub: { fontSize: 9, color: colors.textGray },
  sectionTitleBig: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  actionPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  actionPillText: { fontSize: 10, fontWeight: '600', color: colors.textDark, marginLeft: 4 },
  actionPillPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  actionPillTextPrimary: { fontSize: 10, fontWeight: '600', color: '#FFF', marginLeft: 4 },
  timelineContainer: { position: 'relative', marginTop: 10 },
  timelineLine: { position: 'absolute', left: 6, top: 10, bottom: 10, width: 2, backgroundColor: '#F0F0F0' },
  timelineItem: { flexDirection: 'row', marginBottom: 16 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, marginTop: 10, marginRight: 16, borderWidth: 3, borderColor: colors.background },
  apptCard: { flex: 1, backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, elevation: 1 },
  timeText: { fontSize: 11, fontWeight: '700', color: colors.textDark },
  badgeGreen: { backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeGreenText: { fontSize: 9, color: '#2E7D32', fontWeight: '700' },
  badgeOrange: { backgroundColor: colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeOrangeText: { fontSize: 9, color: '#FFF', fontWeight: '700' },
  priceText: { fontSize: 14, fontWeight: '800', color: colors.textDark },
  apptTitle: { fontSize: 13, fontWeight: '700', color: colors.textDark, marginBottom: 4 },
  apptSub: { fontSize: 11, color: colors.textGray, marginBottom: 6 },
  apptLoc: { fontSize: 10, color: colors.textGray, marginBottom: 12 },
  apptFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#F5F5F5', paddingTop: 12 },
  tagGray: { backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagGrayText: { fontSize: 9, color: colors.textGray, fontWeight: '600' },
  iconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  pauseCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', padding: 12, borderRadius: 12 },
});