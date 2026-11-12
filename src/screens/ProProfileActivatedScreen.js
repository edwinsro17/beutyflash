/**
 * Archivo: src/screens/ProProfileActivatedScreen.js
 * Confirmación de Cuenta Profesional Creada y Reglas de Billetera ($10.000 COP mín. y 10% comisión)
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, sessionStore, formatCOP } from '../theme/colors';

export default function ProProfileActivatedScreen({ navigation }) {
  const pro = sessionStore.proUser;
  const wallet = sessionStore.wallet;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="star-four-points" size={28} color={colors.primary} />
        </View>

        <Text style={styles.heading}>¡Cuenta Profesional Configurada!</Text>
        <Text style={styles.description}>
          Hola {pro.nombre_completo}. Tu estudio digital está listo. Recuerda recargar mínimo $10.000 COP en tu billetera para recibir solicitudes.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{pro.nombre_artistico}</Text>
          <Text style={styles.cardSub}>
            Estado de validación DNI/Certificado: {pro.estado_verificacion.toUpperCase()}
          </Text>
          <Text style={styles.cardSub}>
            Saldo actual en Billetera: {formatCOP(wallet.saldo_disponible_cop)} COP
          </Text>
        </View>

        <TouchableOpacity
          style={styles.mainBtn}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'ProDashboard' }] })}
        >
          <Text style={styles.mainBtnText}>Entrar a mi Panel Profesional</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.replace('Billetera')}
        >
          <Text style={styles.secondaryBtnText}>Ir a Recargar Billetera ($10.000+ COP)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 22, paddingTop: 40, paddingBottom: 40, alignItems: 'center' },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F6EFEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 13.5,
    color: colors.textGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark, marginBottom: 6 },
  cardSub: { fontSize: 13, color: colors.textGray, marginTop: 2 },
  mainBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mainBtnText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '700' },
  secondaryBtn: {
    width: '100%',
    backgroundColor: '#F3EFEA',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});