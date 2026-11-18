/**
 * Archivo: src/hooks/useResponsiveLayout.js
 * Sistema de Diseño Adaptable Multiplataforma (iOS y Android — Teléfonos Compactos, Estándar y Tabletas)
 * - Escala tipográfica inteligente (`rf`) para evitar que textos largos se salgan de sus contenedores.
 * - Sombras nativas homologadas (`cardShadow`) para iOS (`shadow*`) y Android (`elevation`).
 * - Márgenes y anchos adaptativos según el tamaño real de pantalla.
 */
import { useWindowDimensions, Platform, PixelRatio } from 'react-native';

export function useResponsiveLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const isSmallPhone = width < 365;
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';

  const numColumns = isLargeTablet ? 3 : isTablet ? 2 : 1;
  const containerMaxWidth = isLargeTablet ? 1040 : isTablet ? 780 : 600;
  const horizontalPadding = isLargeTablet ? 32 : isTablet ? 24 : isSmallPhone ? 14 : 18;
  const mapHeight = isLargeTablet ? 400 : isTablet ? 340 : isSmallPhone ? 230 : 265;
  const cardWidth = isLargeTablet ? '31.8%' : isTablet ? '48.5%' : '100%';
  const modalWidth = isTablet ? Math.min(540, width * 0.88) : Math.min(400, width - 32);

  // Escala tipográfica controlada para evitar desbordamiento por accesibilidad extrema
  const safeScale = Math.min(fontScale || 1, 1.12);
  const rf = (size) => {
    const base = isSmallPhone ? size * 0.92 : size;
    return Math.round(PixelRatio.roundToNearestPixel(base / safeScale));
  };

  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#1F1A17',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 10,
    },
    android: {
      elevation: 3,
    },
    default: {},
  });

  return {
    width,
    height,
    isSmallPhone,
    isTablet,
    isLargeTablet,
    isIOS,
    isAndroid,
    numColumns,
    containerMaxWidth,
    horizontalPadding,
    mapHeight,
    cardWidth,
    modalWidth,
    rf,
    cardShadow,
    contentContainerStyle: {
      width: '100%',
      maxWidth: isTablet ? containerMaxWidth : '100%',
      alignSelf: 'center',
      paddingHorizontal: horizontalPadding,
    },
    gridStyle: {
      flexDirection: isTablet ? 'row' : 'column',
      flexWrap: isTablet ? 'wrap' : 'nowrap',
      justifyContent: 'space-between',
    },
  };
}
