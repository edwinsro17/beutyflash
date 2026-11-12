/**
 * Archivo: src/screens/AvailabilityAndZoneScreen.js
 * Configuración de Radio de Cobertura (PostGIS) y Recargo de Domicilio en COP
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, sessionStore, formatCOP } from '../theme/colors';

export default function AvailabilityAndZoneScreen({ navigation }) {
  const [radioKm, setRadioKm] = useState(sessionStore.proUser.radio_cobertura_km || 15);
  const [recargoCop, setRecargoCop] = useState(sessionStore.proUser.tarifa_domicilio_cop || 8000);

  const handleContinuar = () => {
    sessionStore.proUser.radio_cobertura_km = radioKm;
    sessionStore.proUser.tarifa_domicilio_cop = recargoCop;
    navigation.navigate('CredentialsAndInsurance');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disponibilidad y Zona</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Radio de Cobertura a Domicilio</Text>
        <Text style={styles.description}>
          Elige la distancia máxima en kilómetros para recibir solicitudes a domicilio en Cali / Valle del Cauca.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Radio de cobertura: {radioKm} km</Text>
          <View style={styles.row}>
            {[5, 10, 15, 25].map((km) => (
              <TouchableOpacity
                key={km}
                style={[styles.pill, radioKm === km && styles.pillActive]}
                onPress={() => setRadioKm(km)}
              >
                <Text style={[styles.pillText, radioKm === km && { color: '#FFFFFF' }]}>
                  {km} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>
            Recargo por desplazamiento a domicilio (COP):
          </Text>
          <View style={styles.row}>
            {[5000, 8000, 12000, 15000].map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.pill, recargoCop === val && styles.pillActive]}
                onPress={() => setRecargoCop(val)}
              >
                <Text style={[styles.pillText, recargoCop === val && { color: '#FFFFFF' }]}>
                  {formatCOP(val)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.mainBtn} onPress={handleContinuar}>
          <Text style={styles.mainBtnText}>Continuar a Validación DNI y Certificado</Text>
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
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: colors.textDark, marginBottom: 6 },
  description: { fontSize: 13.5, color: colors.textGray, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  label: { fontSize: 13, fontWeight: '700', color: colors.textDark, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 12, fontWeight: '700', color: colors.textDark },
  mainBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});