/**
 * Archivo: src/screens/ServicesAndPricingScreen.js
 * Configuración de Carta de Servicios en Pesos Colombianos (COP) y Comisión del 10%
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, formatCOP, calcularComisionCOP } from '../theme/colors';

export default function ServicesAndPricingScreen({ navigation }) {
  const [services, setServices] = useState([
    {
      id: 1,
      title: 'Balayage Signature + Matiz Gloss',
      time: '120 min',
      priceCop: 180000,
      active: true,
    },
    {
      id: 2,
      title: 'Corte de Autor & Cepillado Blower',
      time: '50 min',
      priceCop: 55000,
      active: true,
    },
    {
      id: 3,
      title: 'Manicura Rusa Semipermanente',
      time: '60 min',
      priceCop: 45000,
      active: true,
    },
  ]);

  const toggleService = (index) => {
    const copy = [...services];
    copy[index].active = !copy[index].active;
    setServices(copy);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Servicios y Precios (COP)</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Configura tus Tarifas en COP</Text>
        <Text style={styles.description}>
          Recuerda que la plataforma descuenta el 10% de comisión de tu saldo por cada servicio que aceptes.
        </Text>

        {services.map((item, idx) => (
          <View key={item.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.serviceTitle}>{item.title}</Text>
              <Switch
                value={item.active}
                onValueChange={() => toggleService(idx)}
                trackColor={{ false: '#EAEAEA', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Text style={styles.meta}>Duración: {item.time}</Text>
            <Text style={styles.price}>
              Precio: {formatCOP(item.priceCop)} COP • Comisión 10%:{' '}
              {formatCOP(calcularComisionCOP(item.priceCop))}
            </Text>
          </View>
        ))}

        <TouchableOpacity
          style={styles.mainBtn}
          onPress={() => navigation.navigate('AvailabilityAndZone')}
        >
          <Text style={styles.mainBtnText}>Continuar a Zona y Cobertura</Text>
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  serviceTitle: { fontSize: 15, fontWeight: '800', color: colors.textDark, flex: 1 },
  meta: { fontSize: 12, color: colors.textGray, marginVertical: 4 },
  price: { fontSize: 13.5, fontWeight: '800', color: colors.primary },
  mainBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  mainBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});