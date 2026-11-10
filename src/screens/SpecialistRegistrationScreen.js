import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const colors = { background: '#FAFAFA', surface: '#FFFFFF', primary: '#8B503E', textDark: '#1E1E1E', textGray: '#707070', border: '#EAEAEA', inputBg: '#F5F5F5' };

export default function ProfessionalRegistrationScreen({ navigation }) {
  const [verClave, setVerClave] = useState(false);
  const [tipoProfesional, setTipoProfesional] = useState('autonomo');
  const [experiencia, setExperiencia] = useState('3a5');
  const [modalidad, setModalidad] = useState('hibrido');
  const [terminosAceptados, setTerminosAceptados] = useState(false);

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

        <Text style={styles.heading}>Crea tu Cuenta Profesional</Text>
        <Text style={styles.description}>Completa tus datos profesionales para verificar tu perfil y comenzar a recibir citas de clientes exclusivos.</Text>

        {/* Progress */}
        <View style={styles.progressBox}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8}}>
            <Text style={styles.progressText}>Paso 1 de 3: Datos Básicos y Especialidad</Text>
            <Text style={styles.progressText}>33%</Text>
          </View>
          <View style={styles.progressBarBg}><View style={styles.progressBarFill} /></View>
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
            <Feather name="shield" size={12} color={colors.primary} />
            <Text style={styles.progressDisclaimer}> Perfil confidencial verificado bajo estándar Atelier</Text>
          </View>
        </View>

        {/* Sección 1: Datos Personales */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}><Feather name="user" size={16} color={colors.primary} /></View>
            <View>
              <Text style={styles.sectionTitle}>Datos Personales y de Contacto</Text>
              <Text style={styles.sectionSubtitle}>Información para tu credencial exclusiva</Text>
            </View>
          </View>

          <Text style={styles.label}>Nombre y Apellidos completos *</Text>
          <View style={styles.inputContainer}>
            <Feather name="user" size={18} color={colors.textGray} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="ej. Sofía Alarcón Morales" placeholderTextColor="#A0A0A0" />
          </View>

          <Text style={styles.label}>Correo electrónico profesional *</Text>
          <View style={styles.inputContainer}>
            <Feather name="at-sign" size={18} color={colors.textGray} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="ej. sofia.estilista@beautyflash.com" placeholderTextColor="#A0A0A0" keyboardType="email-address" />
          </View>

          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end'}}>
             <Text style={styles.label}>Teléfono móvil *</Text>
             <Text style={{fontSize: 10, color: colors.primary, marginBottom: 8}}>Verificación SMS</Text>
          </View>
          <View style={{flexDirection: 'row', gap: 10, marginBottom: 16}}>
            <View style={[styles.inputContainer, {flex: 0.35, marginBottom: 0, paddingHorizontal: 12}]}>
              <Text style={{color: colors.textDark, fontWeight: '500'}}>ES +34 <Feather name="chevron-down" size={14}/></Text>
            </View>
            <View style={[styles.inputContainer, {flex: 0.65, marginBottom: 0}]}>
              <TextInput style={styles.input} placeholder="612 345 678" keyboardType="phone-pad" placeholderTextColor="#A0A0A0" />
            </View>
          </View>

          <Text style={styles.label}>Contraseña de acceso segura *</Text>
          <View style={styles.inputContainer}>
            <Feather name="lock" size={18} color={colors.textGray} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Mínimo 8 caracteres alfanuméricos" placeholderTextColor="#A0A0A0" secureTextEntry={!verClave} />
            <TouchableOpacity onPress={() => setVerClave(!verClave)} style={{padding: 5}}>
              <Feather name={verClave ? "eye-off" : "eye"} size={18} color={colors.textGray} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección 2: Especialidad y Experiencia */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}><MaterialCommunityIcons name="flower-outline" size={16} color={colors.primary} /></View>
            <View>
              <Text style={styles.sectionTitle}>Especialidad Principal y Experiencia</Text>
              <Text style={styles.sectionSubtitle}>Elige tus disciplinas maestras</Text>
            </View>
          </View>

          <View style={styles.pillsContainer}>
            <TouchableOpacity style={[styles.pill, styles.pillActive]}><Feather name="scissors" size={14} color="#FFF"/> <Text style={styles.pillTextActive}>Peluquería & Color</Text></TouchableOpacity>
            <TouchableOpacity style={styles.pill}><Feather name="edit-2" size={14} color={colors.textDark}/> <Text style={styles.pillText}>Maquillaje & Novias</Text></TouchableOpacity>
          </View>

          <Text style={styles.label}>Años de experiencia profesional *</Text>
          <View style={styles.rowOptions}>
            {['1 a 3 años', '3 a 5 años', '+5 años (Master)'].map((opt, i) => {
              const val = ['1a3', '3a5', '5mas'][i];
              const active = experiencia === val;
              return (
                <TouchableOpacity key={i} style={[styles.optionBox, active && styles.optionBoxActive]} onPress={() => setExperiencia(val)}>
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{opt}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={styles.label}>Modalidad de trabajo preferida *</Text>
          {[['A Domicilio (Kit Móvil)', 'car', 'domicilio'], ['En mi propio Salón / Cabina', 'home', 'salon'], ['Ambas opciones (Híbrido)', 'link', 'hibrido']].map((opt, i) => (
            <TouchableOpacity key={i} style={[styles.radioRow, modalidad === opt[2] && styles.radioRowActive]} onPress={() => setModalidad(opt[2])}>
              <View style={[styles.radioCircle, modalidad === opt[2] && styles.radioCircleActive]}>
                {modalidad === opt[2] && <View style={styles.radioInner} />}
              </View>
              <Feather name={opt[1]} size={16} color={colors.textDark} style={{marginHorizontal: 10}} />
              <Text style={styles.radioText}>{opt[0]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Checkboxes & Button */}
        <TouchableOpacity style={styles.checkboxRow} onPress={() => setTerminosAceptados(!terminosAceptados)}>
          <View style={[styles.checkbox, terminosAceptados && styles.checkboxActive]}>
            {terminosAceptados && <Feather name="check" size={14} color="#FFF" />}
          </View>
          <Text style={styles.checkboxLabel}>Acepto los <Text style={styles.linkText}>Términos y Condiciones</Text> y la <Text style={styles.linkText}>Política de Privacidad</Text></Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('SpecialistProfileSetup')}>
          <Text style={styles.mainButtonText}>Continuar a Experiencia y Tarifas</Text>
          <Feather name="arrow-right" size={18} color="#FFF" style={{marginLeft: 8}} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#1E1E1E' },
  heading: { fontSize: 24, fontWeight: '800', color: '#1E1E1E', marginBottom: 8 },
  description: { fontSize: 13, color: '#707070', lineHeight: 20, marginBottom: 20 },
  progressBox: { backgroundColor: '#F9F1EF', padding: 12, borderRadius: 8, marginBottom: 24 },
  progressText: { fontSize: 11, fontWeight: '700', color: '#8B503E' },
  progressBarBg: { height: 4, backgroundColor: '#EADCD7', borderRadius: 2 },
  progressBarFill: { width: '33%', height: 4, backgroundColor: '#8B503E', borderRadius: 2 },
  progressDisclaimer: { fontSize: 10, color: '#8B503E' },
  section: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F0F0F0', elevation: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconCircle: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFF0ED', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1E1E1E' },
  sectionSubtitle: { fontSize: 11, color: '#707070' },
  label: { fontSize: 12, fontWeight: '600', color: '#1E1E1E', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, height: 48, marginBottom: 16 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: '#1E1E1E' },
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  pillActive: { backgroundColor: '#8B503E' },
  pillText: { fontSize: 12, fontWeight: '600', color: '#1E1E1E', marginLeft: 6 },
  pillTextActive: { fontSize: 12, fontWeight: '600', color: '#FFFFFF', marginLeft: 6 },
  rowOptions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  optionBox: { flex: 1, paddingVertical: 12, backgroundColor: '#F5F5F5', borderRadius: 10, alignItems: 'center' },
  optionBoxActive: { backgroundColor: '#1E1E1E' },
  optionText: { fontSize: 12, fontWeight: '600', color: '#707070' },
  optionTextActive: { color: '#FFFFFF' },
  radioRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', padding: 14, borderRadius: 10, marginBottom: 8 },
  radioRowActive: { backgroundColor: '#FFF0ED' },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#A0A0A0', alignItems: 'center', justifyContent: 'center' },
  radioCircleActive: { borderColor: '#8B503E' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#8B503E' },
  radioText: { fontSize: 13, fontWeight: '500', color: '#1E1E1E' },
  checkboxRow: { flexDirection: 'row', marginTop: 10, marginBottom: 20, paddingRight: 20 },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: '#A0A0A0', borderRadius: 4, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#8B503E', borderColor: '#8B503E' },
  checkboxLabel: { fontSize: 12, color: '#707070', flex: 1, lineHeight: 18 },
  linkText: { color: '#8B503E', textDecorationLine: 'underline' },
  mainButton: { backgroundColor: '#8B503E', flexDirection: 'row', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  mainButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
