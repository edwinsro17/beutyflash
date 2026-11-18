/**
 * Archivo: src/screens/SpecialistProfileSetupScreen.js
 * Paso 2 de Registro Profesional: Identidad, Biografía y Fotos de Trabajos
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, sessionStore } from '../theme/colors';

export default function SpecialistProfileSetupScreen({ navigation }) {
  const [nombreArtistico, setNombreArtistico] = useState(sessionStore.proUser.nombre_artistico);
  const [lema, setLema] = useState(sessionStore.proUser.lema_profesional);
  const [biografia, setBiografia] = useState(sessionStore.proUser.biografia);

  const handleGuardarPaso2 = () => {
    sessionStore.proUser.nombre_artistico = nombreArtistico.trim() || sessionStore.proUser.nombre_artistico;
    sessionStore.proUser.lema_profesional = lema.trim();
    sessionStore.proUser.biografia = biografia.trim();
    navigation.navigate('ServicesAndPricing');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paso 2: Perfil y Fotos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Define tu Identidad Profesional</Text>
        <Text style={styles.desc}>
          Personaliza cómo te verán los clientes al buscar servicios a domicilio o en tu local.
        </Text>

        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <Image source={{ uri: sessionStore.proUser.foto_perfil_url }} style={styles.avatar} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardTitle}>{sessionStore.proUser.nombre_completo}</Text>
              <Text style={styles.cardSub}>Foto optimizada en Supabase Storage</Text>
            </View>
          </View>

          <Text style={styles.label}>Nombre profesional o de tu salón</Text>
          <TextInput
            style={styles.input}
            value={nombreArtistico}
            onChangeText={setNombreArtistico}
          />

          <Text style={styles.label}>Lema o especialidad destacada</Text>
          <TextInput style={styles.input} value={lema} onChangeText={setLema} />

          <Text style={styles.label}>Biografía breve</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            multiline
            value={biografia}
            onChangeText={setBiografia}
          />
        </View>

        <TouchableOpacity style={styles.mainBtn} onPress={handleGuardarPaso2}>
          <Text style={styles.mainBtnText}>Continuar a Tarifas en COP (Paso 3)</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark , flexShrink: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: colors.textDark, marginBottom: 6 },
  desc: { fontSize: 13.5, color: colors.textGray, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.textDark , flexShrink: 1 },
  cardSub: { fontSize: 12, color: colors.textGray , flexShrink: 1 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textDark, marginBottom: 6 },
  input: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.textDark,
    marginBottom: 12,
  },
  mainBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' , flexShrink: 1 },
});