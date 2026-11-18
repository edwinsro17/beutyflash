/**
 * Archivo: src/screens/SplashScreen.js
 * Pantalla de carga inicial mientras se verifica:
 * 1. Si el Onboarding de 5 pantallas ya fue visualizado.
 * 2. Si existe una sesión activa válida en el dispositivo y cuál es su rol en la base de datos.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { verificarEstadoInicialYSesion } from '../theme/colors';

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();

    let montado = true;

    async function resolverNavegacionInicial() {
      const inicioMs = Date.now();
      const estado = await verificarEstadoInicialYSesion();
      const transcurrido = Date.now() - inicioMs;
      const esperaRestante = Math.max(400, 1400 - transcurrido);

      setTimeout(() => {
        if (!montado) return;
        if (estado.mostrarOnboarding) {
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        } else if (estado.sesionValida && estado.rol === 'profesional') {
          navigation.reset({ index: 0, routes: [{ name: 'ProDashboard' }] });
        } else if (estado.sesionValida && estado.rol === 'cliente') {
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'RoleSelection' }] });
        }
      }, esperaRestante);
    }

    resolverNavegacionInicial();

    return () => {
      montado = false;
    };
  }, [fadeAnim, scaleAnim, navigation]);

  return (
    <LinearGradient colors={['#1A1A1A', '#2B1E1A', '#1A1A1A']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.topBadge, { opacity: fadeAnim }]}>
          <MaterialCommunityIcons name="star-four-points" size={12} color="#D48C70" />
          <Text style={styles.topBadgeText}>PLATAFORMA DE SERVICIOS • COLOMBIA</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.centerBlock,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient colors={['#D48C70', '#844D3B']} style={styles.emblemCircle}>
            <MaterialCommunityIcons name="flower-tulip-outline" size={34} color="#FFFFFF" />
          </LinearGradient>

          <View style={styles.logoRow}>
            <Text style={styles.logoBeauty}>Beauty</Text>
            <Text style={styles.logoFlash}>Flash</Text>
          </View>

          <Text style={styles.subtitle}>CONECTANDO CLIENTES Y PROFESIONALES</Text>
        </Animated.View>

        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#D48C70" style={{ marginBottom: 10 }} />
          <Text style={styles.footerText}>VERIFICANDO SESIÓN</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212, 140, 112, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(212, 140, 112, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    color: '#F8F6F4',
  flexShrink: 1 },
  centerBlock: { alignItems: 'center' },
  emblemCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  logoBeauty: { fontSize: 42, fontStyle: 'italic', fontWeight: '300', color: '#F8F6F4' },
  logoFlash: { fontSize: 42, fontWeight: '900', color: '#D48C70' },
  subtitle: {
    fontSize: 10.5,
    letterSpacing: 1.8,
    fontWeight: '700',
    color: '#D6CEC7',
    textAlign: 'center',
  },
  footer: { alignItems: 'center' },
  footerText: {
    fontSize: 10,
    letterSpacing: 2.2,
    fontWeight: '700',
    color: '#A99E96',
  flexShrink: 1 },
});
