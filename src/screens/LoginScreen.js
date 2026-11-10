import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import CustomInput from '../components/CustomInput';

import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen({ navigation }) {
  const [metodo, setMetodo] = useState('correo'); // 'correo' | 'telefono'
  const [verClave, setVerClave] = useState(false);
  const [recordar, setRecordar] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 1. Header con Botón Atrás y Píldora */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <View style={styles.pill}>
            <Text style={styles.pillText}>• ALTA BELLEZA EXCLUSIVA</Text>
          </View>
          <View style={{ width: 40 }} /> {/* Espaciador invisible para centrar la píldora */}
        </View>

        {/* 2. Textos de Bienvenida */}
        <View style={styles.titleSection}>
          <Text style={styles.subHeading}>BIENVENIDO DE NUEVO</Text>
          <Text style={styles.heading}>Iniciar Sesión</Text>
          <Text style={styles.description}>
            Accede a tus citas, rituales personalizados y especialistas selectos.
          </Text>
        </View>
        
        {/* 3. Tabs para elegir método de inicio */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, metodo === 'correo' && styles.tabActive]}
            onPress={() => setMetodo('correo')}
          >
            <Text style={[styles.tabText, metodo === 'correo' && styles.tabTextActive]}>Correo Electrónico</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, metodo === 'telefono' && styles.tabActive]}
            onPress={() => setMetodo('telefono')}
          >
            <Text style={[styles.tabText, metodo === 'telefono' && styles.tabTextActive]}>Teléfono</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Formulario (Inputs) */}
        <CustomInput 
          label="Correo electrónico o teléfono"
          iconName="mail"
          placeholder="tu@email.com o +34 600 000 000"
          rightIconName="check-circle"
        />

        <CustomInput 
          label="Contraseña"
          iconName="lock"
          placeholder="••••••••••••"
          secureTextEntry={!verClave}
          rightIconName={verClave ? "eye-off" : "eye"}
          onRightIconPress={() => setVerClave(!verClave)}
        />

        {/* 5. Opciones Extra (Recordar datos y Olvidó Clave) */}
        <View style={styles.optionsRow}>
          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => setRecordar(!recordar)}
          >
            <View style={[styles.checkbox, recordar && styles.checkboxActive]}>
              {recordar && <Feather name="check" size={14} color={colors.surface} />}
            </View>
            <Text style={styles.checkboxText}>Recordar mis datos</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.forgotText}>¿Olvidaste tu clave?</Text>
          </TouchableOpacity>
        </View>

        {/* 6. Botón Principal */}
        <TouchableOpacity style={styles.mainButton} onPress={() => navigation.replace('Home')}>
          <Text style={styles.mainButtonText}>Iniciar Sesión</Text>
          <Feather name="arrow-right" size={16} color={colors.surface} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
        
        {/* 7. Separador Social */}
        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>O INICIA CON</Text>
          <View style={styles.line} />
        </View>

        {/* 8. Botones Sociales */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-google" size={18} color="#DB4437" />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-apple" size={18} color="#000" />
            <Text style={styles.socialText}>Apple</Text>
          </TouchableOpacity>
        </View>

        {/* 9. Footer (Registro y Legal) */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿No tienes cuenta? <Text style={styles.footerHighlight} onPress={() => navigation.navigate('AccountSelection')}>Regístrate</Text>
          </Text>
          <View style={styles.legalRow}>
            <Feather name="lock" size={10} color={colors.textGray} />
            <Text style={styles.legalText}> BeautyFlash · Privacidad y Términos</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  pill: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, elevation: 1 },
  pillText: { fontSize: 10, fontWeight: '700', color: colors.accent, letterSpacing: 1 },

  // Textos
  titleSection: { marginBottom: 24 },
  subHeading: { fontSize: 11, fontWeight: '700', color: colors.accent, letterSpacing: 1, marginBottom: 8 },
  heading: { fontSize: 28, fontWeight: '800', color: colors.textDark, marginBottom: 12 },
  description: { fontSize: 14, color: colors.textGray, lineHeight: 22 },

  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: '#EBE6E0', borderRadius: 12, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.surface, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textGray },
  tabTextActive: { color: colors.textDark },

  // Opciones (Checkbox y Olvidaste)
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  checkboxActive: { backgroundColor: colors.accent },
  checkboxText: { fontSize: 13, color: colors.textGray },
  forgotText: { fontSize: 13, color: colors.accent, textDecorationLine: 'underline' },

  // Botón Principal
  mainButton: { backgroundColor: colors.primary, flexDirection: 'row', borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  mainButtonText: { color: colors.surface, fontSize: 16, fontWeight: '700' },

  // Divisor
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 11, fontWeight: '700', color: colors.textGray, paddingHorizontal: 12, letterSpacing: 1 },

  // Sociales
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  socialButton: { flex: 1, flexDirection: 'row', backgroundColor: colors.surface, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  socialText: { fontSize: 14, fontWeight: '600', color: colors.textDark, marginLeft: 8 },

  // Footer
  footer: { alignItems: 'center' },
  footerText: { fontSize: 14, color: colors.textGray, marginBottom: 8 },
  footerHighlight: { color: colors.accent, fontWeight: '700' },
  legalRow: { flexDirection: 'row', alignItems: 'center' },
  legalText: { fontSize: 11, color: colors.textGray },
});