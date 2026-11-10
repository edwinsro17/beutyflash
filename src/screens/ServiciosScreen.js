import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const colors = { background: '#FAFAFA', surface: '#FFFFFF', primary: '#8B503E', textDark: '#1E1E1E', textGray: '#707070', border: '#EAEAEA', accent: '#D89C8F' };

export default function ServiciosScreen({ navigation }) {
  // Interactividad del Header
  const [status, setStatus] = useState('Disponible');
  const toggleStatus = () => {
    if (status === 'Disponible') setStatus('Fuera de servicio');
    else if (status === 'Fuera de servicio') setStatus('Ocupado');
    else setStatus('Disponible');
  };
  const getStatusColor = () => status === 'Disponible' ? '#00C853' : status === 'Fuera de servicio' ? '#9E9E9E' : '#F57C00';

  // Interactividad de Servicios
  const [services, setServices] = useState([
    { id: 1, title: 'Balayage Babylights + Matiz Gloss', price: '120,00 €', time: '120 min', type: 'Salón & Domicilio', active: true, tag: 'Más Reservado' },
    { id: 2, title: 'Corte de Autor & Blowout', price: '45,00 €', time: '45 min', type: 'Salón propio', active: true },
    { id: 3, title: 'Tratamiento Botox Capilar Orgánico', price: '65,00 €', time: '60 min', type: 'Salón & Domicilio', active: true },
    { id: 4, title: 'Manicura Rusa Semipermanente', price: '38,00 €', time: '50 min', type: 'Domicilio exclusivo', active: true, tag2: 'Solo Domicilio' },
    { id: 5, title: 'Peinado Editorial & Ondas Glam', price: '50,00 €', time: '40 min', type: 'Salón & Domicilio', active: false, tag2: 'En pausa temporal' },
  ]);
  const toggleService = (id) => setServices(services.map(s => s.id === id ? { ...s, active: !s.active } : s));

  // Interactividad de Suplementos
  const [supDomicilio, setSupDomicilio] = useState(true);
  const [supExpress, setSupExpress] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* HEADER COMPARTIDO INTERACTIVO */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Servicios</Text>
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
        {/* Top Info */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
          <View>
            <View style={styles.atelierBadge}><Text style={styles.atelierBadgeText}>ATELIER PRO</Text></View>
            <Text style={styles.subText}>Gestiona tus tratamientos, precios y disponibilidad</Text>
          </View>
          <TouchableOpacity style={styles.addBtn}><Text style={styles.addBtnText}>+ Nuevo Servicio</Text></TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}><Text style={styles.statNum}>5</Text><Text style={styles.statLabel}>Activos</Text></View>
          <View style={styles.statBox}><Text style={styles.statNum}>1</Text><Text style={styles.statLabel}>Pausado</Text></View>
          <View style={styles.statBox}><Text style={styles.statNum}>63,60 €</Text><Text style={styles.statLabel}>Ticket medio</Text></View>
        </View>

        {/* Buscador y Filtros */}
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color={colors.textGray} style={{marginLeft: 12}} />
          <TextInput style={styles.searchInput} placeholder="Buscar por técnica, duración o estilo..." />
          <Feather name="sliders" size={16} color={colors.textDark} style={{marginRight: 12}} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
          <TouchableOpacity style={[styles.filterPill, styles.filterPillActive]}><Text style={styles.filterPillTextActive}>Todos (6)</Text></TouchableOpacity>
          <TouchableOpacity style={styles.filterPill}><Text style={styles.filterPillText}>Peluquería (3)</Text></TouchableOpacity>
          <TouchableOpacity style={styles.filterPill}><Text style={styles.filterPillText}>Coloración (2)</Text></TouchableOpacity>
          <TouchableOpacity style={styles.filterPill}><Text style={styles.filterPillText}>Estética & Uñas (1)</Text></TouchableOpacity>
        </ScrollView>

        {/* Lista de Servicios */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12}}>
          <Text style={styles.sectionTitle}>CATÁLOGO VIGENTE</Text>
          <Text style={styles.sectionDrag}>Arrastra para ordenar</Text>
        </View>

        {services.map(s => (
          <View key={s.id} style={[styles.serviceCard, !s.active && {opacity: 0.6}]}>
            <View style={{flexDirection: 'row', flex: 1}}>
              <View style={styles.serviceImgPlaceholder} />
              <View style={{flex: 1, marginLeft: 12}}>
                <View style={{flexDirection: 'row', gap: 6, marginBottom: 4}}>
                  {s.tag && <View style={styles.tagOrange}><Text style={styles.tagOrangeText}>{s.tag}</Text></View>}
                  {s.tag2 && <View style={styles.tagGray}><Text style={styles.tagGrayText}>{s.tag2}</Text></View>}
                </View>
                <Text style={styles.serviceTitle}>{s.title}</Text>
                <Text style={styles.serviceSub}><Feather name="clock" size={10}/> {s.time} • <Feather name="map-pin" size={10}/> {s.type}</Text>
              </View>
            </View>
            <View style={styles.serviceFooter}>
              <Text style={styles.servicePrice}>{s.price}</Text>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                <Switch value={s.active} onValueChange={() => toggleService(s.id)} trackColor={{ false: '#EAEAEA', true: colors.accent }} thumbColor="#FFF" />
                <Feather name="edit-2" size={16} color={colors.textGray} />
                <Feather name="more-vertical" size={16} color={colors.textGray} />
              </View>
            </View>
          </View>
        ))}

        {/* Suplementos */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 12}}>
          <Text style={styles.sectionTitleBig}>Suplementos y Extras</Text>
          <Text style={styles.sectionDrag}>Añadir Regla</Text>
        </View>

        <View style={styles.supCard}>
          <View style={styles.supIcon}><Feather name="truck" size={16} color={colors.primary} /></View>
          <View style={{flex: 1, paddingHorizontal: 12}}>
            <Text style={styles.supTitle}>Desplazamiento a Domicilio</Text>
            <Text style={styles.supSub}>BeautyFlash Go • Radio máx. 12 km</Text>
            <Text style={styles.supPrice}>+15,00 € por trayecto</Text>
          </View>
          <Switch value={supDomicilio} onValueChange={setSupDomicilio} trackColor={{ false: '#EAEAEA', true: colors.accent }} thumbColor="#FFF" />
        </View>

        <View style={styles.supCard}>
          <View style={styles.supIcon}><Feather name="zap" size={16} color={colors.primary} /></View>
          <View style={{flex: 1, paddingHorizontal: 12}}>
            <Text style={styles.supTitle}>Tarifa Express Flash Now</Text>
            <Text style={styles.supSub}>Reserva inmediata con menos de 2h de antelación</Text>
            <Text style={styles.supPrice}>+25% recargo de urgencia</Text>
          </View>
          <Switch value={supExpress} onValueChange={setSupExpress} trackColor={{ false: '#EAEAEA', true: colors.accent }} thumbColor="#FFF" />
        </View>

      </ScrollView>
      <BottomNav navigation={navigation} active="Servicios" />
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
// ESTILOS DE SERVICIOS
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
  atelierBadge: { backgroundColor: '#FFF0ED', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 4 },
  atelierBadgeText: { fontSize: 9, fontWeight: '700', color: colors.primary },
  subText: { fontSize: 10, color: colors.textGray, width: '80%' },
  addBtn: { backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#FFF', alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  statNum: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  statLabel: { fontSize: 10, color: colors.textGray },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  searchInput: { flex: 1, height: 44, paddingHorizontal: 10, fontSize: 13 },
  filterPill: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  filterPillActive: { backgroundColor: colors.textDark, borderColor: colors.textDark },
  filterPillText: { fontSize: 12, color: colors.textGray, fontWeight: '600' },
  filterPillTextActive: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: colors.textGray, letterSpacing: 1 },
  sectionTitleBig: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  sectionDrag: { fontSize: 10, color: colors.primary, fontWeight: '600' },
  serviceCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  serviceImgPlaceholder: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#F0F0F0' },
  tagOrange: { backgroundColor: '#FFF0ED', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagOrangeText: { fontSize: 8, color: colors.primary, fontWeight: '700' },
  tagGray: { backgroundColor: '#F5F5F5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagGrayText: { fontSize: 8, color: colors.textGray, fontWeight: '700' },
  serviceTitle: { fontSize: 13, fontWeight: '700', color: colors.textDark, marginBottom: 4 },
  serviceSub: { fontSize: 10, color: colors.textGray },
  serviceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#F5F5F5' },
  servicePrice: { fontSize: 16, fontWeight: '700', color: colors.textDark },
  supCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  supIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#FFF0ED', alignItems: 'center', justifyContent: 'center' },
  supTitle: { fontSize: 12, fontWeight: '700', color: colors.textDark },
  supSub: { fontSize: 10, color: colors.textGray, marginTop: 2 },
  supPrice: { fontSize: 10, fontWeight: '700', color: colors.primary, marginTop: 4 },
});