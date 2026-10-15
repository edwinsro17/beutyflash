import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { colors } from '../theme/colors';
// Quita el SafeAreaView de la primera importación y ponlo en esta nueva:
import { SafeAreaView } from 'react-native-safe-area-context';
export default function SplashScreen({ navigation }) {
  // Valores iniciales de la animación (Opacidad 0, Escala 0.9)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.90)).current;

  useEffect(() => {
    // Iniciar las animaciones en paralelo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, // Llega a opacidad 1 (visible)
        duration: 1500, // 1.5 segundos
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1, // Llega a escala 1 (tamaño normal)
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Cuando termina la animación, esperamos 1.5 segundos más y cambiamos de pantalla
      setTimeout(() => {
        navigation.replace('RoleSelection');
      }, 1500);
    });
  }, [fadeAnim, scaleAnim, navigation]); // <-- ¡Aquí cambiamos onFinish por navigation!

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.content, 
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
        ]}
      >
        {/* Píldora Superior */}
        <View style={styles.topPill}>
          <Text style={styles.topPillText}>✨ EXPERIENCIA PREMIUM</Text>
        </View>

        {/* Centro: Logo y Textos */}
        <View style={styles.centerBlock}>
          <View style={styles.logoRow}>
            {/* Simulando una fuente elegante (Itálica + Bold) */}
            <Text style={styles.logoBeauty}>Beauty</Text>
            <Text style={styles.logoFlash}>Flash</Text>
          </View>
          
          <Text style={styles.subtitle}>
            BELLEZA Y ALTA PELUQUERÍA A DOMICILIO
          </Text>

          <View style={styles.divider} />

          <Text style={styles.welcomeText}>
            Bienvenida a tu santuario de belleza.
          </Text>
        </View>

        {/* Footer: Nueva frase */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>EL LUJO DE CUIDAR DE TI</Text>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5F2', // Un tono crema un poco más cálido para el splash
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  
  // Píldora Superior
  topPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#8D5B4C',
  },

  // Centro
  centerBlock: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBeauty: {
    fontSize: 48,
    fontStyle: 'italic', // Le da el toque elegante/serif clásico
    fontWeight: '300',
    color: '#2D221E',
  },
  logoFlash: {
    fontSize: 48,
    fontWeight: '800', // Contraste moderno
    color: '#8D5B4C',
  },
  subtitle: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
    color: '#66615E',
    textAlign: 'center',
    marginBottom: 20,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: '#8D5B4C',
    opacity: 0.3,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: '#8D5B4C',
    fontStyle: 'italic',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerDivider: {
    width: 30,
    height: 1,
    backgroundColor: '#ccc',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '600',
    color: '#888',
  },
});