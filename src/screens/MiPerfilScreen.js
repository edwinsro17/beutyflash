import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const colors = { background: '#FAFAFA', surface: '#FFFFFF', primary: '#8B503E', textDark: '#1E1E1E', textGray: '#707070', border: '#EAEAEA', accent: '#D89C8F' };

export default function MiPerfilScreen({ navigation }) {
  const [status, setStatus] = useState('Disponible');
  const toggleStatus = () => {
    if (status === 'Disponible') setStatus('Fuera de servicio');
    else if (status === 'Fuera de servicio') setStatus('Ocupado');
    else setStatus('Disponible');
  };
  const getStatusColor = () => status === 'Disponible' ? '#00C853' : status === 'Fuera de servicio' ? '#9E9E9E' : '#F57C00';

  const [aceptacionInmediata, setAceptacionInmediata] = useState(true);
  const [modoVacaciones, setModoVacaciones] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.statusDropdown} onPress={toggleStatus}>
            <View style={[styles.statusDot, {backgroundColor: getStatusColor()}]} />
            <Text style={styles.statusText}>{status}</Text>
            <Feather name="chevron-down" size={14} color={colors.textGray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}><Feather name="bell" size={20} color={colors.textDark} /></TouchableOpacity>
          <TouchableOpacity style={styles.profileBtn}><Feather name="user" size={16} color="#FFF" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Cabecera del Perfil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}><Feather name="user" size={40} color={colors.textGray}/></View>
            <View style={styles.verifiedBadge}><Feather name="check" size={12} color="#FFF"/></View>
          </View>
          <Text style={styles.profileName}>Sofía Alarcón <Text style={{fontWeight: '400', color: colors.textGray}}>— Hair & Color Atelier</Text></Text>
          <Text style={styles.profileTagline}>Colorista de Autor & Estilista Capilar Botánico</Text>
          
          <View style={{flexDirection: 'row', gap: 10, marginTop: 12}}>
            <View style={styles.ratingBadge}><MaterialCommunityIcons name="star" size={14} color={colors.primary}/><Text style={styles.ratingText}> 4.98 <Text style={{color: colors.textGray, fontWeight: '400'}}>(124 reseñas VIP)</Text></Text></View>
            <View style={styles.idBadge}><Text style={styles.idText}>PRO ID: #BF-8842</Text></View>
          </View>

          <View style={{flexDirection: 'row', gap: 12, marginTop: 20, width: '100%'}}>
            <TouchableOpacity style={styles.editBtn}><Feather name="edit-2" size={14} color="#FFF"/><Text style={styles.editBtnText}> Editar Perfil</Text></TouchableOpacity>
            <TouchableOpacity style={styles.viewBtn}><Feather name="eye" size={14} color={colors.textDark}/><Text style={styles.viewBtnText}> Vista Clientes</Text></TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={styles.statIconGreen}><Feather name="clock" size={14} color="#2E7D32"/></View>
            <Text style={styles.statVal}>99.4%</Text>
            <Text style={styles.statLabel}>Puntualidad</Text>
          </View>
          <View style={styles.statBox}>
            <View style={styles.statIconRed}><Feather name="calendar" size={14} color="#D32F2F"/></View>
            <Text style={styles.statVal}>0</Text>
            <Text style={styles.statLabel}>Canceladas</Text>
          </View>
          <View style={styles.statBox}>
            <View style={styles.statIconGold}><Feather name="award" size={14} color="#F57F17"/></View>
            <Text style={styles.statVal}>Master</Text>
            <Text style={styles.statLabel}>Nivel Pro</Text>
          </View>
        </View>

        {/* Gestión de Atelier */}
        <Text style={styles.sectionTitle}>GESTIÓN DE ATELIER</Text>
        <View style={styles.listCard}>
          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listIcon}><Feather name="image" size={16} color={colors.primary}/></View>
            <View style={styles.listTextContainer}>
              <Text style={styles.listTitle}>Galería y Portafolio Visual</Text>
              <Text style={styles.listSub}>8 fotos • IG @sofia_beauty_atelier</Text>
            </View>
            <View style={styles.dotGreen}/>
            <Feather name="chevron-right" size={16} color={colors.textGray} style={{marginLeft: 8}}/>
          </TouchableOpacity>
          <View style={styles.divider}/>
          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listIcon}><Feather name="navigation" size={16} color={colors.primary}/></View>
            <View style={styles.listTextContainer}>
              <Text style={styles.listTitle}>Zona y Desplazamiento</Text>
              <Text style={styles.listSub}>Madrid Centro • Radio 12 km</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textGray}/>
          </TouchableOpacity>
          <View style={styles.divider}/>
          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listIcon}><Feather name="clock" size={16} color={colors.primary}/></View>
            <View style={styles.listTextContainer}>
              <Text style={styles.listTitle}>Horarios y Apertura</Text>
              <Text style={styles.listSub}>Lun - Sáb • 09:30 a 20:00</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textGray}/>
          </TouchableOpacity>
        </View>

        {/* Condiciones de Reserva con INTERACTIVIDAD */}
        <Text style={styles.sectionTitle}>CONDICIONES DE RESERVA</Text>
        <View style={styles.listCard}>
          <View style={styles.listItem}>
            <View style={styles.listIcon}><Feather name="zap" size={16} color={colors.primary}/></View>
            <View style={styles.listTextContainer}>
              <Text style={styles.listTitle}>Aceptación Inmediata</Text>
              <Text style={styles.listSub}>Citas confirmadas sin espera</Text>
            </View>
            <Switch value={aceptacionInmediata} onValueChange={setAceptacionInmediata} trackColor={{ false: '#EAEAEA', true: colors.primary }} thumbColor="#FFF" />
          </View>
          <View style={styles.divider}/>
          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listIcon}><Feather name="shield" size={16} color={colors.textDark}/></View>
            <View style={styles.listTextContainer}>
              <Text style={styles.listTitle}>Política de Cancelación</Text>
              <Text style={styles.listSub}>Flexible (24h de cortesía)</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textGray}/>
          </TouchableOpacity>
          <View style={styles.divider}/>
          <View style={styles.listItem}>
            <View style={styles.listIcon}><Feather name="moon" size={16} color={colors.textDark}/></View>
            <View style={styles.listTextContainer}>
              <Text style={styles.listTitle}>Modo Vacaciones / Pausa</Text>
              <Text style={styles.listSub}>Agenda abierta y recibiendo citas</Text>
            </View>
            <Switch value={modoVacaciones} onValueChange={setModoVacaciones} trackColor={{ false: '#EAEAEA', true: colors.primary }} thumbColor="#FFF" />
          </View>
        </View>

        {/* Cuenta y Finanzas */}
        <Text style={styles.sectionTitle}>CUENTA & FINANZAS</Text>
        <View style={styles.listCard}>
          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listIconGray}><MaterialCommunityIcons name="bank" size={16} color={colors.textDark}/></View>
            <View style={styles.listTextContainer}>
              <Text style={styles.listTitle}>Datos Bancarios y Cobros</Text>
              <Text style={styles.listSub}>CaixaBank •••• 9842</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textGray}/>
          </TouchableOpacity>
          <View style={styles.divider}/>
          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listIconGray}><Feather name="file-text" size={16} color={colors.textDark}/></View>
            <View style={styles.listTextContainer}>
              <Text style={styles.listTitle}>Facturación y Fiscalidad</Text>
              <Text style={styles.listSub}>Retención IRPF (15%) activa</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textGray}/>
          </TouchableOpacity>
          <View style={styles.divider}/>
          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listIconGray}><Feather name="bell" size={16} color={colors.primary}/></View>
            <View style={styles.listTextContainer}>
              <Text style={styles.listTitle}>Alertas y Notificaciones Flash</Text>
              <Text style={styles.listSub}>Push instantáneo y WhatsApp VIP</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textGray}/>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn}>
          <Feather name="log-out" size={16} color="#D32F2F" />
          <Text style={styles.logoutBtnText}>Cerrar Sesión Pro</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>BEAUTYFLASH PRO{'\n'}Versión 2.4.1 Atelier • Edición Especialista</Text>

      </ScrollView>
      <BottomNav navigation={navigation} active="MiPerfil" />
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
// ESTILOS DE MI PERFIL
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.textDark, marginRight: 4 },
  profileBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  scrollContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EAEAEA', alignItems: 'center', justifyContent: 'center' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  profileName: { fontSize: 18, fontWeight: '800', color: colors.textDark, marginBottom: 4 },
  profileTagline: { fontSize: 12, color: colors.textGray },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0ED', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  ratingText: { fontSize: 11, fontWeight: '700', color: colors.textDark },
  idBadge: { backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  idText: { fontSize: 11, fontWeight: '700', color: colors.textGray },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 12 },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  viewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.border, paddingVertical: 12, borderRadius: 12 },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: colors.textDark },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#FFF', alignItems: 'center', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  statIconGreen: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statIconRed: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statIconGold: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF8E1', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statVal: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  statLabel: { fontSize: 10, color: colors.textGray, marginTop: 2 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: colors.textGray, letterSpacing: 1, marginBottom: 8, marginTop: 10 },
  listCard: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  listIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F9F1EF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listIconGray: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listTextContainer: { flex: 1 },
  listTitle: { fontSize: 13, fontWeight: '700', color: colors.textDark },
  listSub: { fontSize: 11, color: colors.textGray, marginTop: 2 },
  dotGreen: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, marginTop: 10 },
  logoutBtnText: { fontSize: 13, fontWeight: '700', color: '#D32F2F', marginLeft: 8 },
  versionText: { fontSize: 9, color: colors.textGray, textAlign: 'center', lineHeight: 14, marginTop: 8 }
});