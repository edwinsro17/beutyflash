/**
 * Archivo: src/screens/SplashScreen.js
 * Splash Screen Luxury Editorial con animación multicapa (Halo pulsante, entrada
 * tipográfica escalonada y barra de progreso en tonos Terracota/Obsidiana).
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.86)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideUpAnim = useRef(new Animated.Value(24)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.14,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 1100,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2400,
        useNativeDriver: false,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('RoleSelection');
    }, 2600);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, pulseAnim, slideUpAnim, progressAnim, navigation]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient
      colors={['#1A1A1A', '#2B1E1A', '#1A1A1A']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      <SafeAreaView style={styles.safe}>
        {/* Píldora Luxury Superior */}
        <Animated.View style={[styles.topBadge, { opacity: fadeAnim }]}>
          <MaterialCommunityIcons name="star-four-points" size={12} color="#D48C70" />
          <Text style={styles.topBadgeText}>ATELIER DIGITAL • COLOMBIA</Text>
          <MaterialCommunityIcons name="star-four-points" size={12} color="#D48C70" />
        </Animated.View>

        {/* Bloque Central con Halo Pulsante */}
        <Animated.View
          style={[
            styles.centerBlock,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideUpAnim }],
            },
          ]}
        >
          <View style={styles.emblemWrapper}>
            <Animated.View
              style={[
                styles.haloOuter,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <LinearGradient
              colors={['#D48C70', '#844D3B']}
              style={styles.emblemCircle}
            >
              <MaterialCommunityIcons name="flower-tulip-outline" size={38} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <View style={styles.logoRow}>
            <Text style={styles.logoBeauty}>Beauty</Text>
            <Text style={styles.logoFlash}>Flash</Text>
          </View>

          <Text style={styles.subtitle}>
            ALTA PELUQUERÍA & ESTÉTICA A DOMICILIO Y EN SALÓN
          </Text>

          <View style={styles.goldLine} />

          <Text style={styles.welcomeQuote}>
            “La excelencia del salón de lujo, donde tú estés.”
          </Text>
        </Animated.View>

        {/* Barra de Progreso Minimalista Inferior */}
        <View style={styles.footer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.footerText}>EXPERIENCIA DE LUJO VERIFICADA</Text>
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
    paddingVertical: 46,
    paddingHorizontal: 26,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212, 140, 112, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(212, 140, 112, 0.35)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.2,
    color: '#F8F6F4',
  },
  centerBlock: { alignItems: 'center' },
  emblemWrapper: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  haloOuter: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(212, 140, 112, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(212, 140, 112, 0.42)',
  },
  emblemCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logoBeauty: {
    fontSize: 46,
    fontStyle: 'italic',
    fontWeight: '300',
    color: '#F8F6F4',
  },
  logoFlash: {
    fontSize: 46,
    fontWeight: '900',
    color: '#D48C70',
  },
  subtitle: {
    fontSize: 10.5,
    letterSpacing: 2,
    fontWeight: '700',
    color: '#D6CEC7',
    textAlign: 'center',
    marginBottom: 18,
  },
  goldLine: {
    width: 64,
    height: 1.5,
    backgroundColor: '#D48C70',
    opacity: 0.65,
    marginBottom: 16,
  },
  welcomeQuote: {
    fontSize: 13.5,
    color: '#E5DCD4',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  footer: { width: '100%', alignItems: 'center' },
  progressTrack: {
    width: 190,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D48C70',
    borderRadius: 2,
  },
  footerText: {
    fontSize: 9.5,
    letterSpacing: 2.8,
    fontWeight: '700',
    color: '#A99E96',
  },
});
