import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const colors = { background: '#FAFAFA', surface: '#FFFFFF', primary: '#8B503E', textDark: '#1E1E1E', textGray: '#707070', border: '#EAEAEA', accent: '#D89C8F' };

export default function ServicesAndPricingScreen({ navigation }) {
  const [services, setServices] = useState([
    { id: 1, tag: 'Coloración • Signature', title: 'Balayage Babylights + Matiz Gl...', desc: 'Aclarado artesanal con matiz botánico y sellado hidratante', time: '120 min', price: '120 €', active: true },
    { id: 2, tag: 'Peluquería', title: 'Corte de Autor & Blowout', desc: 'Diagnóstico morfológico, lavado relajante y brushing pulido', time: '45 min', price: '45 €', active: false },
    { id: 3, tag: 'Peluquería • Cuidado', title: 'Tratamiento Botox Capilar Org...', desc: 'Regeneración intensiva profunda anti-frizz libre de formol', time: '60 min', price: '65 €', active: true },
    { id: 4, tag: 'Estética', title: 'Manicura Rusa Semipermanente', desc: 'Limpieza con torno de precisión y esmaltado nivelado', time: '50 min', price: '38 €', active: true },
  ]);

  const [estudio, setEstudio] = useState(true);
  const [domicilio, setDomicilio] = useState(true);

  const toggleService = (index) => {
    const newServices = [...services];
    newServices[index].active = !newServices[index].active;
    setServices(newServices);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 5}}><Feather name="arrow-left" size={24} color={colors.textDark} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Services And Pricing</Text>
        <TouchableOpacity><View style={styles.headerProfileIcon}><Feather name="user" size={16} color="#FFF" /></View></TouchableOpacity>
      </View>
      <View style={styles.progressBar}><View style={[styles.progressFill, {width: '50%'}]} /></View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Configura tu Carta de Servicios</Text>
        <Text style={styles.description}>Selecciona los tratamientos exclusivos que ofreces, fija tus precios base y tiempos estimados.</Text>

        <TouchableOpacity style={styles.addButton}>
          <View style={styles.addIcon}><Feather name="plus" size={20} color={colors.primary} /></View>
          <View style={{flex: 1}}>
            <Text style={styles.addButtonTitle}>+ Añadir Nuevo Tratamiento</Text>
            <Text style={styles.addButtonDesc}>Crea un ritual personalizado con duración y precio</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textGray} />
        </TouchableOpacity>

        <View style={styles.filterRow}>
          <TouchableOpacity style={[styles.filterPill, styles.filterPillActive]}><Text style={styles.filterPillTextActive}>Todos (4)</Text></TouchableOpacity>
          <TouchableOpacity style={styles.filterPill}><Text style={styles.filterPillText}>Peluquería (3)</Text></TouchableOpacity>
          <TouchableOpacity style={styles.filterPill}><Text style={styles.filterPillText}>Coloración (2)</Text></TouchableOpacity>
        </View>

        {/* Lista de Servicios */}
        {services.map((item, index) => (
          <View key={item.id} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <View style={styles.serviceTag}><Text style={styles.serviceTagText}>{item.tag}</Text></View>
              <Switch value={item.active} onValueChange={() => toggleService(index)} trackColor={{ false: '#EAEAEA', true: colors.accent }} thumbColor="#FFF" />
            </View>
            <Text style={styles.serviceTitle}>{item.title}</Text>
            <Text style={styles.serviceDesc}>{item.desc}</Text>
            <View style={styles.serviceFooter}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Feather name="clock" size={12} color={colors.textGray} />
                <Text style={styles.serviceTime}> {item.time}</Text>
                <Text style={styles.servicePrice}>   {item.price}</Text>
              </View>
              <TouchableOpacity style={styles.editIcon}><Feather name="sliders" size={14} color={colors.textDark} /></TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Modalidad de Servicio */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Modalidad de Servicio</Text>
          <Text style={styles.sectionSub}>UBICACIONES</Text>
        </View>

        <TouchableOpacity style={styles.checkboxCard} onPress={() => setEstudio(!estudio)}>
          <View style={[styles.checkbox, estudio && styles.checkboxActive]}>{estudio && <Feather name="check" size={14} color="#FFF" />}</View>
          <View style={{flex: 1}}>
            <Text style={styles.checkTitle}>En mi Estudio / Salón</Text>
            <Text style={styles.checkSub}>Calle Velázquez 34, Salamanca, Madrid</Text>
          </View>
          <Text style={styles.changeText}>Cambiar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.checkboxCard} onPress={() => setDomicilio(!domicilio)}>
          <View style={[styles.checkbox, domicilio && styles.checkboxActive]}>{domicilio && <Feather name="check" size={14} color="#FFF" />}</View>
          <View style={{flex: 1}}>
            <Text style={styles.checkTitle}>A Domicilio (BeautyFlash Go)</Text>
            <Text style={styles.checkSub}>Atiende clientes en residencias, hoteles y suites privadas</Text>
          </View>
          <View style={styles.suplementoBadge}><Text style={styles.suplementoText}>+ Suplemento</Text></View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('AvailabilityAndZone')}>
          <Text style={styles.mainButtonText}>Continuar a Zona y Horarios (Paso 3)</Text>
          <Feather name="arrow-right" size={16} color="#FFF" style={{marginLeft: 8}} />
        </TouchableOpacity>
        <TouchableOpacity style={{alignItems: 'center'}} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Volver al Paso 1</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: colors.textDark },
  headerProfileIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  progressBar: { height: 2, backgroundColor: colors.border, marginBottom: 16 },
  progressFill: { height: 2, backgroundColor: colors.primary },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: colors.textDark, marginBottom: 6 },
  description: { fontSize: 13, color: colors.textGray, lineHeight: 20, marginBottom: 20 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  addIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#F9F1EF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  addButtonTitle: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  addButtonDesc: { fontSize: 11, color: colors.textGray, marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterPill: { backgroundColor: '#F0F0F0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  filterPillActive: { backgroundColor: colors.primary },
  filterPillText: { fontSize: 12, fontWeight: '600', color: colors.textGray },
  filterPillTextActive: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  serviceCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  serviceTag: { backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  serviceTagText: { fontSize: 10, fontWeight: '600', color: colors.textGray },
  serviceTitle: { fontSize: 15, fontWeight: '700', color: colors.textDark, marginBottom: 4 },
  serviceDesc: { fontSize: 12, color: colors.textGray, marginBottom: 12, lineHeight: 18 },
  serviceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceTime: { fontSize: 12, color: colors.textGray },
  servicePrice: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  editIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  sectionSub: { fontSize: 10, fontWeight: '700', color: colors.textGray },
  checkboxCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#A0A0A0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkTitle: { fontSize: 13, fontWeight: '600', color: colors.textDark },
  checkSub: { fontSize: 11, color: colors.textGray, marginTop: 2 },
  changeText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  suplementoBadge: { backgroundColor: '#FFF0ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  suplementoText: { fontSize: 10, color: colors.primary, fontWeight: '600' },
  mainButton: { backgroundColor: colors.primary, flexDirection: 'row', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 12 },
  mainButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  backText: { fontSize: 11, color: colors.textGray }
});