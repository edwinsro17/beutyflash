import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const colors = { background: '#FAFAFA', surface: '#FFFFFF', primary: '#8B503E', textDark: '#1E1E1E', textGray: '#707070', border: '#EAEAEA', accent: '#D89C8F' };

export default function AvailabilityAndZoneScreen({ navigation }) {
  const [flashNow, setFlashNow] = useState(true);
  const [descanso, setDescanso] = useState('15');
  const [modoReserva, setModoReserva] = useState('inmediata');
  const dias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const diasActivos = ['L', 'M', 'X', 'J', 'V', 'S'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 5}}><Feather name="arrow-left" size={24} color={colors.textDark} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Availability And Travel Zone</Text>
        <TouchableOpacity><View style={styles.headerProfileIcon}><Feather name="user" size={16} color="#FFF" /></View></TouchableOpacity>
      </View>
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>PASO 3 DE 4 • DISPONIBILIDAD Y ZONA</Text>
        <Text style={styles.skipText}>Omitir por ahora</Text>
      </View>
      <View style={styles.progressBar}><View style={[styles.progressFill, {width: '75%'}]} /></View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Disponibilidad y Zona de Atención</Text>
        <Text style={styles.description}>Define tus horarios de atención para clientes y el radio geográfico donde realizas servicios a domicilio.</Text>

        {/* Mapa y Radio */}
        <View style={styles.sectionTitleRow}>
          <Feather name="navigation" size={18} color={colors.primary} />
          <View style={{marginLeft: 8}}>
            <Text style={styles.sectionTitle}>Radio de Cobertura a Domicilio</Text>
            <Text style={styles.sectionSub}>BeautyFlash Go Concierge</Text>
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapMockup}>
            <View style={styles.mapPin}><Feather name="map-pin" size={10} color={colors.textGray}/> <Text style={styles.mapPinText}>Madrid Centro <Text style={{color: '#A0A0A0'}}>• Salamanca, Retiro</Text></Text></View>
            <View style={styles.mapCircleOuter}><View style={styles.mapCircleInner}><View style={styles.mapDot}/></View></View>
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 8}}>
            <Text style={styles.sliderLabel}>Radio de desplazamiento</Text>
            <Text style={styles.sliderValue}>12 km</Text>
          </View>
          <View style={styles.sliderTrack}><View style={styles.sliderFill}/><View style={styles.sliderThumb}/></View>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16}}>
            <Text style={styles.sliderMinMax}>5 km</Text>
            <Text style={styles.sliderMinMax}>15 km</Text>
            <Text style={styles.sliderMinMax}>30 km</Text>
          </View>

          <View style={styles.addonRow}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Feather name="truck" size={16} color={colors.textGray}/>
              <View style={{marginLeft: 10}}>
                <Text style={styles.addonTitle}>Suplemento por traslado</Text>
                <Text style={styles.addonSub}>Coste fijo por desplazamiento</Text>
              </View>
            </View>
            <View style={styles.priceBox}><Text style={styles.priceBoxText}>15 €</Text></View>
          </View>
          <View style={styles.addonRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
              <Feather name="zap" size={16} color={colors.primary}/>
              <View style={{marginLeft: 10, flex: 1, paddingRight: 10}}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.addonTitle}>Servicios urgentes Flash Now </Text>
                  <View style={styles.badge}><Text style={styles.badgeText}>+25%</Text></View>
                </View>
                <Text style={styles.addonSub}>Citas en menos de 60 minutos con tarifa premium express integrada.</Text>
              </View>
            </View>
            <Switch value={flashNow} onValueChange={setFlashNow} trackColor={{ false: '#EAEAEA', true: colors.primary }} thumbColor="#FFF" />
          </View>
        </View>

        {/* Horarios */}
        <View style={styles.sectionTitleRow}>
          <Feather name="calendar" size={18} color={colors.primary} />
          <View style={{marginLeft: 8}}>
            <Text style={styles.sectionTitle}>Días y Horarios Habituales</Text>
            <Text style={styles.sectionSub}>Sincronización semanal recurrente</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.daysRow}>
            {dias.map((d, i) => (
              <View key={i} style={[styles.dayCircle, diasActivos.includes(d) ? styles.dayCircleActive : null]}>
                <Text style={[styles.dayText, diasActivos.includes(d) ? styles.dayTextActive : null]}>{d}</Text>
                {diasActivos.includes(d) && <View style={styles.dayDot} />}
              </View>
            ))}
          </View>

          <View style={styles.shiftRow}>
            <Feather name="sun" size={16} color={colors.textGray} />
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={styles.shiftTitle}>Jornada mañana</Text>
              <Text style={styles.shiftTime}>09:30 — 14:00</Text>
            </View>
            <Feather name="edit-2" size={14} color={colors.textGray} />
          </View>
          <View style={styles.shiftRow}>
            <Feather name="moon" size={16} color={colors.primary} />
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={styles.shiftTitle}>Jornada tarde</Text>
              <Text style={styles.shiftTime}>15:30 — 20:00</Text>
            </View>
            <Feather name="edit-2" size={14} color={colors.textGray} />
          </View>
          <TouchableOpacity style={styles.addShiftBtn}><Text style={styles.addShiftBtnText}>+ Añadir tramo horario</Text></TouchableOpacity>
          
          <Text style={styles.restTitle}>Tiempo de descanso entre citas</Text>
          <View style={{flexDirection: 'row', gap: 8}}>
            {['15', '30', '45'].map((min) => (
              <TouchableOpacity key={min} style={[styles.restPill, descanso === min && styles.restPillActive]} onPress={() => setDescanso(min)}>
                <Text style={[styles.restPillText, descanso === min && styles.restPillTextActive]}>{min} min</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Aceptación */}
        <View style={styles.sectionTitleRow}>
          <MaterialCommunityIcons name="gesture-tap-button" size={20} color={colors.primary} />
          <View style={{marginLeft: 8}}>
            <Text style={styles.sectionTitle}>Modo de Aceptación de Citas</Text>
            <Text style={styles.sectionSub}>Flujo de reserva para tus clientes</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.radioCard, modoReserva === 'inmediata' && styles.radioCardActive]} onPress={() => setModoReserva('inmediata')}>
          <View style={[styles.radio, modoReserva === 'inmediata' && styles.radioActive]}>{modoReserva === 'inmediata' && <Feather name="check" size={12} color="#FFF"/>}</View>
          <View style={{flex: 1}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.radioTitle}>Reserva Inmediata </Text>
              <View style={styles.badge}><Text style={styles.badgeText}>Recomendado</Text></View>
            </View>
            <Text style={styles.radioSub}>Los clientes confirman cita en huecos libres de tu agenda automáticamente. Maximiza tu tasa de ocupación.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.radioCard} onPress={() => setModoReserva('manual')}>
          <View style={styles.radio} />
          <View style={{flex: 1}}>
            <Text style={styles.radioTitle}>Aprobación Manual</Text>
            <Text style={styles.radioSub}>Revisas y confirmas cada solicitud de cita en un plazo de 30 minutos antes de hacerla efectiva.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('CredentialsAndInsurance')}>
          <Text style={styles.mainButtonText}>Continuar a Verificación y Cobros (Paso 4)</Text>
          <Feather name="arrow-right" size={16} color="#FFF" style={{marginLeft: 8}} />
        </TouchableOpacity>
        <TouchableOpacity style={{alignItems: 'center'}} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Volver al Paso 2</Text>
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
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  progressText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  skipText: { fontSize: 11, color: colors.textGray },
  progressBar: { height: 2, backgroundColor: colors.border, marginBottom: 20 },
  progressFill: { height: 2, backgroundColor: colors.primary },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: colors.textDark, marginBottom: 6 },
  description: { fontSize: 13, color: colors.textGray, lineHeight: 20, marginBottom: 20 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textDark },
  sectionSub: { fontSize: 10, color: colors.textGray },
  mapCard: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20, overflow: 'hidden' },
  mapMockup: { height: 120, backgroundColor: '#F9F1EF', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  mapPin: { position: 'absolute', top: 10, left: 10, backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  mapPinText: { fontSize: 10, fontWeight: '600', color: colors.textDark, marginLeft: 4 },
  mapCircleOuter: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(216,156,143,0.3)', alignItems: 'center', justifyContent: 'center' },
  mapCircleInner: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(216,156,143,0.6)', alignItems: 'center', justifyContent: 'center' },
  mapDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  sliderLabel: { fontSize: 13, color: colors.textGray, marginLeft: 16 },
  sliderValue: { fontSize: 14, fontWeight: '700', color: colors.primary, marginRight: 16 },
  sliderTrack: { height: 4, backgroundColor: colors.border, marginHorizontal: 16, borderRadius: 2, position: 'relative' },
  sliderFill: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', backgroundColor: colors.primary, borderRadius: 2 },
  sliderThumb: { position: 'absolute', left: '40%', top: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary, marginLeft: -8 },
  sliderMinMax: { fontSize: 9, color: '#A0A0A0', marginHorizontal: 16 },
  addonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderColor: colors.border },
  addonTitle: { fontSize: 13, fontWeight: '600', color: colors.textDark },
  addonSub: { fontSize: 11, color: colors.textGray, marginTop: 2, lineHeight: 16 },
  priceBox: { backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  priceBoxText: { fontSize: 13, fontWeight: '700', color: colors.textDark },
  badge: { backgroundColor: '#FFF0ED', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 },
  badgeText: { fontSize: 9, color: colors.primary, fontWeight: '700' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  dayCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  dayCircleActive: { backgroundColor: colors.textDark },
  dayText: { fontSize: 12, fontWeight: '600', color: '#A0A0A0' },
  dayTextActive: { color: '#FFF' },
  dayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, position: 'absolute', bottom: 4 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', padding: 12, borderRadius: 10, marginBottom: 10 },
  shiftTitle: { fontSize: 12, fontWeight: '600', color: colors.textDark },
  shiftTime: { fontSize: 11, color: colors.textGray },
  addShiftBtn: { backgroundColor: '#F0F0F0', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  addShiftBtnText: { fontSize: 12, fontWeight: '600', color: colors.textDark },
  restTitle: { fontSize: 11, color: colors.textGray, marginBottom: 8 },
  restPill: { flex: 1, backgroundColor: '#F5F5F5', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  restPillActive: { backgroundColor: colors.primary },
  restPillText: { fontSize: 12, fontWeight: '600', color: colors.textGray },
  restPillTextActive: { color: '#FFF' },
  radioCard: { flexDirection: 'row', backgroundColor: '#F9F9F9', padding: 16, borderRadius: 12, marginBottom: 10 },
  radioCardActive: { backgroundColor: '#FFF0ED' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#A0A0A0', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  radioActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  radioTitle: { fontSize: 13, fontWeight: '700', color: colors.textDark },
  radioSub: { fontSize: 11, color: colors.textGray, marginTop: 4, lineHeight: 16 },
  mainButton: { backgroundColor: colors.primary, flexDirection: 'row', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 12 },
  mainButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  backText: { fontSize: 11, color: colors.textGray }
});