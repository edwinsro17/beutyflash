import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, StatusBar, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const colors = { background: '#FAFAFA', surface: '#FFFFFF', primary: '#8B503E', textDark: '#1E1E1E', textGray: '#707070', border: '#EAEAEA', accent: '#D89C8F' };

export default function SpecialistProfileSetupScreen({ navigation }) {
  const [experiencia, setExperiencia] = useState('7+');
  const [especialidades, setEspecialidades] = useState(['balayage', 'organicos', 'botanica']);
  const [insignia, setInsignia] = useState(true);

  const toggleEspecialidad = (esp) => {
    if (especialidades.includes(esp)) setEspecialidades(especialidades.filter(e => e !== esp));
    else setEspecialidades([...especialidades, esp]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 5}}><Feather name="arrow-left" size={24} color={colors.textDark} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Specialist Profile Setup</Text>
        <TouchableOpacity><View style={styles.headerProfileIcon}><Feather name="user" size={16} color="#FFF" /></View></TouchableOpacity>
      </View>

      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>PASO 1 DE 4 • IDENTIDAD Y PERFIL</Text>
        <Text style={styles.skipText}>Omitir por ahora</Text>
      </View>
      <View style={styles.progressBar}><View style={[styles.progressFill, {width: '25%'}]} /></View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Define tu Identidad de Autor</Text>
        <Text style={styles.description}>Tu foto de estudio, nombre artístico y biografía son la carta de presentación para clientes de alto poder adquisitivo.</Text>

        {/* Foto de Perfil */}
        <View style={styles.photoSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}><Feather name="user" size={40} color={colors.textGray} /></View>
            <TouchableOpacity style={styles.cameraBadge}><Feather name="camera" size={14} color="#FFF" /></TouchableOpacity>
          </View>
          <View style={styles.photoHint}><Feather name="chevron-left" size={12} color={colors.textGray}/><Text style={styles.photoHintText}> Foto nítida, luz natural, fondo neutro</Text></View>
          <TouchableOpacity style={styles.uploadButton}><Feather name="upload-cloud" size={16} color={colors.textDark}/> <Text style={styles.uploadButtonText}>Subir desde galería</Text></TouchableOpacity>
        </View>

        {/* Datos del Profesional */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="briefcase" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Datos del Profesional</Text>
          </View>
          <Text style={styles.label}>Nombre profesional o de estudio</Text>
          <View style={styles.inputContainer}>
            <TextInput style={styles.input} value="Sofía Alarcón — Hair & Color Atelier" />
            <MaterialCommunityIcons name="check-decagram" size={18} color={colors.primary} />
          </View>
          <Text style={styles.label}>Lema distintivo / Tagline</Text>
          <TextInput style={styles.inputBox} value="Colorista de Autor & Estilista Capilar Botánica" />
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 12}}>
            <Text style={styles.label}>Biografía breve</Text>
            <Text style={styles.charCount}>175/300</Text>
          </View>
          <TextInput style={[styles.inputBox, {height: 80, textAlignVertical: 'top'}]} multiline value="Especialista en técnicas artesanales de balayage, coloración botánica y salud capilar con más de 7 años transformando melenas exclusivas en Madrid y Milán." />
          
          <Text style={[styles.label, {marginTop: 12}]}>Años de experiencia</Text>
          <View style={styles.row}>
            {['1-3 años', '4-6 años', '7+ años Master'].map((exp, i) => {
              const val = ['1-3', '4-6', '7+'][i];
              const active = experiencia === val;
              return (
                <TouchableOpacity key={i} style={[styles.expPill, active && styles.expPillActive]} onPress={() => setExperiencia(val)}>
                  <Text style={[styles.expPillText, active && styles.expPillTextActive]}>{exp}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Especialidades */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBetween}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <MaterialCommunityIcons name="star-four-points-outline" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>Especialidades principales</Text>
            </View>
            <View style={styles.limitBadge}><Text style={styles.limitText}>Hasta 4</Text></View>
          </View>
          <Text style={styles.subText}>Selecciona las destrezas que mejor comunican tu sello de lujo.</Text>
          <View style={styles.wrapContainer}>
            {[{id:'balayage', label:'Balayage & Babylights'}, {id:'organicos', label:'Tratamientos Orgánicos'}, {id:'corte', label:'Corte Morfológico'}, {id:'botanica', label:'Coloración Botánica'}, {id:'peinado', label:'Peinado Editorial'}, {id:'manicura', label:'Manicura de Autor'}].map(esp => {
              const active = especialidades.includes(esp.id);
              return (
                <TouchableOpacity key={esp.id} style={[styles.specPill, active && styles.specPillActive]} onPress={() => toggleEspecialidad(esp.id)}>
                  {active ? <Feather name="check-circle" size={14} color="#FFF" style={{marginRight: 6}} /> : <Feather name="plus" size={14} color={colors.textDark} style={{marginRight: 6}} />}
                  <Text style={[styles.specPillText, active && styles.specPillTextActive]}>{esp.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Instagram & Portfolio */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="instagram" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Instagram & Portfolio</Text>
          </View>
          <Text style={styles.label}>Usuario de Instagram Profesional</Text>
          <View style={styles.row}>
            <TextInput style={[styles.inputBox, {flex: 1, marginBottom: 0}]} value="@ sofia_beauty_atelier" />
            <TouchableOpacity style={styles.verifyBtn}><Text style={styles.verifyBtnText}>Verificar cuenta</Text></TouchableOpacity>
          </View>
          <View style={styles.switchRow}>
            <View style={{flex: 1}}>
              <Text style={styles.switchLabel}>Insignia verificada en perfil</Text>
              <Text style={styles.switchSub}>Mostrar badge de Instagram verificado a tus clientes</Text>
            </View>
            <Switch value={insignia} onValueChange={setInsignia} trackColor={{ false: '#EAEAEA', true: colors.accent }} thumbColor="#FFF" />
          </View>
        </View>

        <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('ServicesAndPricing')}>
          <Text style={styles.mainButtonText}>Continuar a Servicios y Tarifas (Paso 2)</Text>
          <Feather name="arrow-right" size={16} color="#FFF" style={{marginLeft: 8}} />
        </TouchableOpacity>
        <Text style={styles.footerNote}>Paso 1 de 4 • Podrás editar estos datos en cualquier momento desde tu cuenta</Text>
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
  description: { fontSize: 13, color: colors.textGray, lineHeight: 20, marginBottom: 24 },
  photoSection: { alignItems: 'center', marginBottom: 24, backgroundColor: '#FFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.accent, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  photoHint: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  photoHintText: { fontSize: 10, color: colors.textGray },
  uploadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  uploadButtonText: { fontSize: 12, fontWeight: '600', color: colors.textDark, marginLeft: 6 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardHeaderBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.textDark, marginLeft: 8 },
  label: { fontSize: 11, color: colors.textGray, marginBottom: 6 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', borderRadius: 8, paddingHorizontal: 12, height: 44, marginBottom: 12 },
  inputBox: { backgroundColor: '#F9F9F9', borderRadius: 8, paddingHorizontal: 12, height: 44, marginBottom: 12, fontSize: 13, color: colors.textDark },
  input: { flex: 1, fontSize: 13, color: colors.textDark },
  charCount: { fontSize: 10, color: '#A0A0A0' },
  row: { flexDirection: 'row', gap: 8 },
  expPill: { flex: 1, alignItems: 'center', backgroundColor: '#F5F5F5', paddingVertical: 10, borderRadius: 8 },
  expPillActive: { backgroundColor: colors.accent },
  expPillText: { fontSize: 11, fontWeight: '600', color: colors.textGray },
  expPillTextActive: { color: '#FFF' },
  limitBadge: { backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  limitText: { fontSize: 10, color: colors.textGray, fontWeight: '600' },
  subText: { fontSize: 12, color: colors.textGray, marginBottom: 12 },
  wrapContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  specPillActive: { backgroundColor: colors.accent },
  specPillText: { fontSize: 12, fontWeight: '600', color: colors.textDark },
  specPillTextActive: { color: '#FFF' },
  verifyBtn: { backgroundColor: '#F0F0F0', paddingHorizontal: 12, justifyContent: 'center', borderRadius: 8, marginLeft: 8 },
  verifyBtnText: { fontSize: 11, fontWeight: '600', color: colors.textDark },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  switchLabel: { fontSize: 13, fontWeight: '600', color: colors.textDark },
  switchSub: { fontSize: 11, color: colors.textGray },
  mainButton: { backgroundColor: colors.accent, flexDirection: 'row', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 12 },
  mainButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  footerNote: { fontSize: 10, color: colors.textGray, textAlign: 'center' }
});