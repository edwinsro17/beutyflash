/**
 * Archivo: src/screens/CredentialsAndInsuranceScreen.js
 * Validación simulada de DNI y Certificado Profesional con los 4 estados:
 * pendiente, en_revision, aprobado, rechazado
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, sessionStore, callBackendApi } from '../theme/colors';

const ESTADOS = ['pendiente', 'en_revision', 'aprobado', 'rechazado'];

export default function CredentialsAndInsuranceScreen({ navigation }) {
  const [estado, setEstado] = useState(sessionStore.proUser.estado_verificacion || 'aprobado');
  const [dni, setDni] = useState(sessionStore.proUser.dni_numero || '1144092831');
  const [entidad, setEntidad] = useState(
    sessionStore.proUser.entidad_certificadora || 'SENA & Academia L’Oréal Colombia'
  );

  const handleCambiarEstado = async (nuevoEstado) => {
    setEstado(nuevoEstado);
    sessionStore.proUser.estado_verificacion = nuevoEstado;
    sessionStore.proUser.dni_numero = dni;
    sessionStore.proUser.entidad_certificadora = entidad;
    try {
      await callBackendApi(`/professionals/${sessionStore.proUser.id}/verification`, 'PATCH', {
        dni_numero: dni,
        entidad_certificadora: entidad,
        estado_verificacion: nuevoEstado,
      });
    } catch (_e) {}
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Validación DNI y Certificado</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Verificación de Identidad y Certificado Profesional</Text>
        <Text style={styles.desc}>
          Estado actual: <Text style={{ fontWeight: '800', color: colors.primary }}>{estado.toUpperCase()}</Text>
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Simular estado de validación (4 estados):</Text>
          <View style={styles.grid}>
            {ESTADOS.map((st) => {
              const active = estado === st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[styles.stateBtn, active && styles.stateBtnActive]}
                  onPress={() => handleCambiarEstado(st)}
                >
                  <Text style={[styles.stateBtnText, active && { color: '#FFFFFF' }]}>
                    {st.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Número de DNI / Cédula *</Text>
          <TextInput style={styles.input} value={dni} onChangeText={setDni} />

          <Text style={styles.label}>Entidad del Certificado Profesional *</Text>
          <TextInput style={styles.input} value={entidad} onChangeText={setEntidad} />

          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => {
              handleCambiarEstado('aprobado');
              Alert.alert(
                'Documentos Validados',
                'Tu DNI y Certificado Profesional han sido validados y aprobados.'
              );
            }}
          >
            <Feather name="upload-cloud" size={16} color={colors.primary} />
            <Text style={styles.uploadBtnText}>Subir DNI y Certificado y Aprobar Perfil</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.mainBtn}
          onPress={() => navigation.navigate('ProProfileActivated')}
        >
          <Text style={styles.mainBtnText}>Continuar a Activación de Perfil Pro</Text>
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
    marginBottom: 16,
  },
  label: { fontSize: 12, fontWeight: '700', color: colors.textDark, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stateBtn: {
    width: '48%',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  stateBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stateBtnText: { fontSize: 11.5, fontWeight: '800', color: colors.textDark , flexShrink: 1 },
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
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F6EFEB',
    paddingVertical: 12,
    borderRadius: 12,
  },
  uploadBtnText: { fontSize: 12.5, fontWeight: '700', color: colors.primary , flexShrink: 1 },
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