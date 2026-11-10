import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';

const colors = { background: '#FAFAFA', surface: '#FFFFFF', primary: '#D89C8F', textDark: '#1E1E1E', textGray: '#707070', border: '#EAEAEA' };

export default function ClientRegistrationScreen({ navigation }) {
  const [verClave, setVerClave] = useState(false);
  const [aceptaPromos, setAceptaPromos] = useState(true);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header con Píldora */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <View style={styles.pill}>
            <MaterialCommunityIcons name="flower-tulip-outline" size={14} color="#8B503E" />
            <Text style={styles.pillText}>ALTA BELLEZA EXCLUSIVA</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Títulos */}
        <View style={styles.titleSection}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
            <View style={{width: 6, height: 6, borderRadius: 3, backgroundColor: '#8B503E', marginRight: 6}} />
            <Text style={styles.subHeading}>CONCIERGE PRIVADO</Text>
          </View>
          <Text style={styles.heading}>Crea tu Cuenta de Cliente</Text>
          <Text style={styles.description}>Accede a citas Flash exclusivas a domicilio o en salones selectos en menos de 60 minutos.</Text>
        </View>

        {/* Botones Sociales */}
        <TouchableOpacity style={styles.socialButtonGoogle}>
          <Ionicons name="logo-google" size={18} color="#DB4437" />
          <Text style={styles.socialTextGoogle}>Continuar con Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButtonApple}>
          <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
          <Text style={styles.socialTextApple}>Continuar con Apple</Text>
        </TouchableOpacity>

        {/* Divisor */}
        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>O REGÍSTRATE CON TU CORREO</Text>
          <View style={styles.line} />
        </View>

        {/* Formulario */}
        <Text style={styles.label}>Nombre y Apellidos</Text>
        <View style={styles.inputContainer}>
          <Feather name="user" size={18} color={colors.textGray} style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="ej. Valentina Rossi" placeholderTextColor="#A0A0A0" />
        </View>

        <Text style={styles.label}>Correo Electrónico</Text>
        <View style={styles.inputContainer}>
          <Feather name="mail" size={18} color={colors.textGray} style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="ej. valentina@beauty.com" placeholderTextColor="#A0A0A0" keyboardType="email-address" />
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end'}}>
           <Text style={styles.label}>Teléfono Móvil</Text>
           <Text style={{fontSize: 10, color: '#8B503E', marginBottom: 8}}>Verificación instantánea</Text>
        </View>
        <View style={{flexDirection: 'row', gap: 10, marginBottom: 4}}>
          <View style={[styles.inputContainer, {flex: 0.35, marginBottom: 0, paddingHorizontal: 12}]}>
            <Text style={{color: colors.textDark, fontWeight: '500'}}>ES +34 <Feather name="chevron-down" size={14}/></Text>
          </View>
          <View style={[styles.inputContainer, {flex: 0.65, marginBottom: 0}]}>
            <Feather name="phone" size={16} color={colors.textGray} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="612 345 678" keyboardType="phone-pad" placeholderTextColor="#A0A0A0" />
          </View>
        </View>
        <Text style={{fontSize: 11, color: colors.textGray, marginBottom: 16}}>ⓘ Para avisos de llegada de tu especialista</Text>

        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text style={styles.label}>Contraseña de acceso</Text>
          <Text style={{fontSize: 10, color: colors.textGray}}>Mínimo 8 caracteres</Text>
        </View>
        <View style={styles.inputContainer}>
          <Feather name="lock" size={18} color={colors.textGray} style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#A0A0A0" secureTextEntry={!verClave} />
          <TouchableOpacity onPress={() => setVerClave(!verClave)} style={{padding: 5}}>
            <Feather name={verClave ? "eye-off" : "eye"} size={18} color={colors.textGray} />
          </TouchableOpacity>
        </View>
        {/* Nivel Seguro Bar */}
        <View style={{flexDirection: 'row', gap: 4, marginBottom: 20}}>
          <View style={{flex: 1, height: 4, backgroundColor: '#D89C8F', borderRadius: 2}} />
          <View style={{flex: 1, height: 4, backgroundColor: '#D89C8F', borderRadius: 2}} />
          <View style={{flex: 1, height: 4, backgroundColor: '#EAEAEA', borderRadius: 2}} />
          <Text style={{fontSize: 10, color: '#707070', marginLeft: 8, marginTop: -4}}>Nivel seguro</Text>
        </View>

        {/* Checkboxes */}
        <TouchableOpacity style={styles.checkboxRow} onPress={() => setAceptaPromos(!aceptaPromos)}>
          <View style={[styles.checkbox, aceptaPromos && styles.checkboxActive]} />
          <Text style={styles.checkboxLabel}>Deseo recibir promociones exclusivas y créditos de bienvenida</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkboxRow} onPress={() => setAceptaTerminos(!aceptaTerminos)}>
          <View style={[styles.checkbox, aceptaTerminos && styles.checkboxActive]} />
          <Text style={styles.checkboxLabel}>Acepto los <Text style={styles.linkText}>Términos y Condiciones</Text> y la <Text style={styles.linkText}>Política de Privacidad</Text> de BeautyFlash</Text>
        </TouchableOpacity>

        {/* Botón Principal */}
        <TouchableOpacity style={styles.mainButton}>
          <Text style={styles.mainButtonText}>Crear Mi Cuenta VIP</Text>
          <Feather name="arrow-right" size={18} color="#FFF" style={{marginLeft: 8}} />
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿Ya tienes una cuenta registrada? <Text style={styles.footerHighlight} onPress={() => navigation.navigate('Login')}>Inicia Sesión</Text>
          </Text>
          <View style={styles.secureBadge}>
            <Feather name="lock" size={12} color="#707070" />
            <Text style={styles.secureBadgeText}>Conexión cifrada de 256 bits · Privacidad garantizada</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// Asegúrate de importar MaterialCommunityIcons de @expo/vector-icons arriba
import { MaterialCommunityIcons } from '@expo/vector-icons';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0ED', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  pillText: { fontSize: 10, fontWeight: '700', color: '#8B503E', marginLeft: 4, letterSpacing: 0.5 },
  titleSection: { marginBottom: 24 },
  subHeading: { fontSize: 10, fontWeight: '700', color: '#8B503E', letterSpacing: 1 },
  heading: { fontSize: 26, fontWeight: '800', color: '#1E1E1E', marginBottom: 12 },
  description: { fontSize: 14, color: '#707070', lineHeight: 22 },
  socialButtonGoogle: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEAEA', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12, elevation: 1 },
  socialTextGoogle: { fontSize: 14, fontWeight: '600', color: '#1E1E1E', marginLeft: 8 },
  socialButtonApple: { flexDirection: 'row', backgroundColor: '#1E1E1E', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  socialTextApple: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginLeft: 8 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#EAEAEA' },
  dividerText: { fontSize: 11, fontWeight: '600', color: '#A0A0A0', paddingHorizontal: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#1E1E1E', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEAEA', borderRadius: 10, paddingHorizontal: 12, height: 50, marginBottom: 16 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: '#1E1E1E' },
  checkboxRow: { flexDirection: 'row', marginBottom: 16, paddingRight: 20 },
  checkbox: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#EAEAEA', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#8B503E' },
  checkboxLabel: { fontSize: 12, color: '#707070', flex: 1, lineHeight: 18 },
  linkText: { color: '#8B503E', textDecorationLine: 'underline' },
  mainButton: { backgroundColor: '#D89C8F', flexDirection: 'row', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  mainButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  footer: { alignItems: 'center' },
  footerText: { fontSize: 14, color: '#707070', marginBottom: 16 },
  footerHighlight: { color: '#8B503E', fontWeight: '700' },
  secureBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  secureBadgeText: { fontSize: 10, color: '#707070', marginLeft: 6 },
});