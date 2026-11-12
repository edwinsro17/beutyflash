/**
 * Archivo: src/screens/WelcomeScreen.js
 * Onboarding de exactamente cinco (5) pantallas que se muestra únicamente la primera
 * vez que se instala y abre la aplicación. Al finalizar u omitir, guarda el indicador
 * persistente independiente de la autenticación y redirige a la selección de experiencia / inicio de sesión.
 */

import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  colors,
  marcarOnboardingComoVistoPermanentemente,
  useResponsiveLayout,
} from '../theme/colors';

const PANTALLAS_ONBOARDING = [
  {
    paso: 1,
    etiqueta: 'Bienvenido a una nueva experiencia',
    titulo: 'Todo lo que necesitas, en un solo lugar.',
    descripcion:
      'Descubre una manera sencilla de encontrar profesionales y acceder a servicios de calidad desde donde estés.',
    imagen:
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=900&auto=format&fit=crop',
    icono: 'compass',
  },
  {
    paso: 2,
    etiqueta: 'Encuentra al profesional ideal',
    titulo: 'Profesionales a tu alcance.',
    descripcion:
      'Explora diferentes profesionales, conoce sus perfiles, consulta sus servicios y encuentra la persona indicada para lo que necesitas.',
    imagen:
      'https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=900&auto=format&fit=crop',
    icono: 'user-check',
  },
  {
    paso: 3,
    etiqueta: 'Servicios donde los necesitas',
    titulo: 'Tu servicio, donde estés.',
    descripcion:
      'Solicita servicios a domicilio y conoce la ubicación del profesional, consulta su recorrido y mantente informado durante su desplazamiento.',
    imagen:
      'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=900&auto=format&fit=crop',
    icono: 'map-pin',
  },
  {
    paso: 4,
    etiqueta: 'Comunicación en tiempo real',
    titulo: 'Siempre conectados.',
    descripcion:
      'Comunícate directamente con el profesional mediante el chat, recibe notificaciones y mantente al tanto de cada actualización de tu solicitud.',
    imagen:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=900&auto=format&fit=crop',
    icono: 'message-square',
  },
  {
    paso: 5,
    etiqueta: 'Tu experiencia comienza aquí',
    titulo: 'Todo listo para comenzar.',
    descripcion:
      'Accede a una experiencia organizada, segura y sencilla. Encuentra servicios, conecta con profesionales y gestiona tus solicitudes desde una sola aplicación.',
    imagen:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=900&auto=format&fit=crop',
    icono: 'check-circle',
  },
];

export default function WelcomeScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const [indice, setIndice] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animarCambio = (nuevoIndice) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(() => {
      setIndice(nuevoIndice);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  };

  const finalizarOnboarding = async () => {
    await marcarOnboardingComoVistoPermanentemente();
    navigation.reset({
      index: 0,
      routes: [{ name: 'RoleSelection' }],
    });
  };

  const handleSiguiente = () => {
    if (indice < PANTALLAS_ONBOARDING.length - 1) {
      animarCambio(indice + 1);
    } else {
      finalizarOnboarding();
    }
  };

  const handleAnterior = () => {
    if (indice > 0) {
      animarCambio(indice - 1);
    }
  };

  const actual = PANTALLAS_ONBOARDING[indice];
  const esUltima = indice === PANTALLAS_ONBOARDING.length - 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={[styles.container, layout.contentContainerStyle]}>
        {/* Cabecera con contador de paso y botón Omitir */}
        <View style={styles.topBar}>
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>
              PASO {actual.paso} DE {PANTALLAS_ONBOARDING.length}
            </Text>
          </View>

          {!esUltima ? (
            <TouchableOpacity style={styles.skipBtn} onPress={finalizarOnboarding}>
              <Text style={styles.skipText}>Omitir</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 50 }} />
          )}
        </View>

        {/* Contenido principal con transición suave */}
        <Animated.View style={[styles.slideContent, { opacity: fadeAnim }]}>
          <View style={[styles.imageWrapper, layout.isTablet && { height: 340 }]}>
            <Image source={{ uri: actual.imagen }} style={styles.slideImage} />
            <View style={styles.iconFloatingBadge}>
              <Feather name={actual.icono} size={20} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.textSection}>
            <Text style={styles.categoryLabel}>{actual.etiqueta.toUpperCase()}</Text>
            <Text style={styles.title}>{actual.titulo}</Text>
            <Text style={styles.description}>{actual.descripcion}</Text>
          </View>
        </Animated.View>

        {/* Indicadores de progreso y controles de navegación */}
        <View style={styles.bottomSection}>
          <View style={styles.dotsRow}>
            {PANTALLAS_ONBOARDING.map((item, idx) => {
              const activo = idx === indice;
              return (
                <TouchableOpacity
                  key={item.paso}
                  onPress={() => animarCambio(idx)}
                  style={[styles.dot, activo && styles.dotActive]}
                />
              );
            })}
          </View>

          <View style={styles.buttonsRow}>
            {indice > 0 ? (
              <TouchableOpacity style={styles.backStepBtn} onPress={handleAnterior}>
                <Feather name="arrow-left" size={18} color={colors.textDark} />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.nextBtn} onPress={handleSiguiente}>
              <Text style={styles.nextBtnText}>
                {esUltima ? 'Comenzar' : 'Siguiente'}
              </Text>
              <Feather
                name={esUltima ? 'check' : 'arrow-right'}
                size={18}
                color="#FFFFFF"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 26,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepPill: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  stepPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textGray,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 14,
  },
  imageWrapper: {
    width: '100%',
    height: 265,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#EAE4DC',
    marginBottom: 24,
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  iconFloatingBadge: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  textSection: {
    paddingHorizontal: 4,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textDark,
    lineHeight: 32,
    marginBottom: 12,
  },
  description: {
    fontSize: 14.5,
    color: colors.textGray,
    lineHeight: 22,
  },
  bottomSection: {
    gap: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D6CEC7',
  },
  dotActive: {
    width: 28,
    backgroundColor: colors.primary,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backStepBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
}); 