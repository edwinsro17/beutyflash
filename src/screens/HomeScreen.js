import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

import { colors } from '../theme/colors';
import CategoryItem from '../components/CategoryItem';
import ProfessionalCard from '../components/ProfessionalCard';
import BottomMenu from '../components/BottomMenu';

export default function HomeScreen() {
  // Coordenadas iniciales (Madrid por defecto mientras carga tu GPS real)
  const [coords, setCoords] = useState({
    latitude: 40.4168,
    longitude: -3.7038,
  });
  const [loadingMap, setLoadingMap] = useState(true);

  useEffect(() => {
    obtenerUbicacionActual();
  }, []);

  const obtenerUbicacionActual = async () => {
    try {
      setLoadingMap(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Ubicación', 'Permiso denegado. Mostrando ubicación por defecto.');
        setLoadingMap(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLoadingMap(false);
    } catch (error) {
      console.log('Error obteniendo ubicación:', error);
      setLoadingMap(false);
    }
  };

  // HTML del Mapa Real Interactivo (Google Maps Tiles + Marcador de Usuario y Profesional)
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #EAE6E1; }
        .leaflet-control-attribution, .leaflet-control-zoom { display: none !important; }
        /* Punto azul de tu ubicación actual */
        .user-dot {
          width: 16px; height: 16px; background: #4285F4; border: 3px solid #fff;
          border-radius: 50%; box-shadow: 0 0 10px rgba(66,133,244,0.8);
        }
        /* Pin café de BeautyFlash para profesionales */
        .pro-pin {
          width: 24px; height: 24px; background: #8D5B4C; border: 2px solid #fff;
          border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${coords.latitude}, ${coords.longitude}], 16);
        
        // Usamos las capas oficiales de Google Maps (Calles reales de Google)
        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 20
        }).addTo(map);

        // 1. Tu ubicación exacta (Punto Azul)
        var userIcon = L.divIcon({ className: 'user-dot', iconSize: [16, 16] });
        L.marker([${coords.latitude}, ${coords.longitude}], { icon: userIcon }).addTo(map);

        // 2. Profesional cercana (Lucía Méndez a unas cuadras de ti)
        var proIcon = L.divIcon({ className: 'pro-pin', iconSize: [24, 24] });
        L.marker([${coords.latitude + 0.0018}, ${coords.longitude + 0.0018}], { icon: proIcon }).addTo(map);
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 1. Header: Logo y Foto de Perfil del Usuario */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Text style={styles.logoBeauty}>Beauty</Text>
            <Text style={styles.logoFlash}>Flash</Text>
          </View>
          <TouchableOpacity>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop' }} 
              style={styles.profilePic} 
            />
          </TouchableOpacity>
        </View>

        {/* 2. Búsqueda */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color={colors.textGray} />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Buscar cortes, maquillaje, uñas..." 
              placeholderTextColor={colors.textGray} 
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Feather name="sliders" size={18} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        {/* 3. Filtros de Ubicación */}
        <View style={styles.locationRow}>
          <View style={styles.togglePill}>
            <TouchableOpacity style={styles.toggleActive}>
              <Text style={styles.toggleTextActive}>A domicilio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toggleInactive}>
              <Text style={styles.toggleTextInactive}>En salón</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.locationSelector} onPress={obtenerUbicacionActual}>
            <Feather name="send" size={14} color="#8D5B4C" />
            <Text style={styles.locationText}>Mi Ubicación</Text>
            <Feather name="chevron-down" size={14} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        {/* 4. MAPA REAL DE GOOGLE INTERACTIVO */}
        <View style={styles.mapContainer}>
          {loadingMap ? (
            <View style={styles.mapLoading}>
              <ActivityIndicator size="large" color="#8D5B4C" />
              <Text style={styles.loadingText}>Obteniendo tu ubicación exacta...</Text>
            </View>
          ) : (
            <WebView
              originWhitelist={['*']}
              source={{ html: mapHtml }}
              style={styles.webViewMap}
              scrollEnabled={false}
              nestedScrollEnabled={true}
            />
          )}

          {/* Overlays flotantes encima del mapa */}
          <View style={styles.mapOverlays} pointerEvents="box-none">
            <View style={styles.mapBadgesRow} pointerEvents="box-none">
              <View style={styles.mapBadge}>
                <View style={styles.dot} />
                <Text style={styles.mapBadgeText}>14 ARTISTAS CERCA</Text>
              </View>
              <TouchableOpacity style={styles.mapBadgeWhite} onPress={obtenerUbicacionActual}>
                <Feather name="map-pin" size={12} color="#8D5B4C" />
                <Text style={styles.mapBadgeTextDark}>Centrar mapa</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.floatingProCard}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop' }} 
                style={styles.floatingImg} 
              />
              <View style={styles.floatingInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.floatingName}>Lucía Méndez</Text>
                  <Feather name="check-circle" size={12} color="#8D5B4C" />
                </View>
                <Text style={styles.floatingRole}>Maquillaje Glow & Editorial</Text>
                <View style={styles.timeRow}>
                  <Feather name="clock" size={10} color="#8D5B4C" />
                  <Text style={styles.floatingDetails}>A 6 min de ti</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.floatingBtn}>
                <Text style={styles.floatingBtnText}>Pedir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 5. Categorías */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorías</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <CategoryItem iconName="content-cut" title="Cabello" subtitle="Corte & Color" />
          <CategoryItem iconName="brush" title="Maquillaje" subtitle="Social & Novias" />
          <CategoryItem iconName="palette" title="Uñas" subtitle="Manicura Gel" />
          <CategoryItem iconName="flower-outline" title="Facial" subtitle="Glow & Detox" />
        </ScrollView>

        {/* 6. Top Rated Flash */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Top Rated Flash</Text>
            <Text style={styles.sectionSubtitle}>Los profesionales mejor valorados en tu área</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topRatedScroll}>
          <ProfessionalCard 
            imageUri="https://i.pinimg.com/736x/c4/ec/10/c4ec10bae129fa256a845edbaf358f9b.jpg" 
            name="Sofía Navarro" 
            rating="4.95" 
            reviews="210" 
            role="Master Balayage & Brushing" 
            price="48" 
          />
          <ProfessionalCard 
            imageUri="https://i.pinimg.com/736x/e1/ca/24/e1ca246c0432ed26ff633260ca695a3f.jpg" 
            name="Valeria Ríos" 
            rating="4.88" 
            reviews="145" 
            role="Cejas & Pestañas Premium" 
            price="32" 
          />
          <ProfessionalCard 
            imageUri="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=400&auto=format&fit=crop" 
            name="Camila Ortiz" 
            rating="4.98" 
            reviews="320" 
            role="Maquillaje Social & Novias" 
            price="65" 
          />
        </ScrollView>
      </ScrollView>

      <BottomMenu activeTab="Servicios" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logoRow: { flexDirection: 'row', alignItems: 'baseline' },
  logoBeauty: { fontSize: 32, fontStyle: 'italic', fontWeight: '300', color: colors.textDark },
  logoFlash: { fontSize: 32, fontWeight: '800', color: '#8D5B4C' },
  profilePic: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#F3EFEA' },
  
  searchRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: colors.textDark },
  filterButton: { width: 50, height: 50, backgroundColor: colors.surface, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  
  locationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  togglePill: { flexDirection: 'row', backgroundColor: '#EAE6E1', borderRadius: 20, padding: 4 },
  toggleActive: { backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, elevation: 1 },
  toggleInactive: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  toggleTextActive: { fontSize: 12, fontWeight: '600', color: colors.textDark },
  toggleTextInactive: { fontSize: 12, fontWeight: '500', color: colors.textGray },
  locationSelector: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { fontSize: 13, fontWeight: '700', color: colors.textDark },
  
  mapContainer: { height: 280, borderRadius: 20, overflow: 'hidden', marginBottom: 24, position: 'relative', backgroundColor: '#EAE6E1' },
  webViewMap: { flex: 1, backgroundColor: 'transparent' },
  mapLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, fontSize: 12, color: '#8D5B4C', fontWeight: '600' },
  mapOverlays: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 12, justifyContent: 'space-between' },
  mapBadgesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  mapBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8D5B4C' },
  mapBadgeText: { fontSize: 10, fontWeight: '700', color: colors.textDark },
  mapBadgeWhite: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
  mapBadgeTextDark: { fontSize: 10, fontWeight: '600', color: colors.textDark },
  
  floatingProCard: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, padding: 10, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  floatingImg: { width: 40, height: 40, borderRadius: 20 },
  floatingInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  floatingName: { fontSize: 13, fontWeight: '700', color: colors.textDark },
  floatingRole: { fontSize: 10, color: colors.textGray },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  floatingDetails: { fontSize: 10, color: '#8D5B4C', fontWeight: '600' },
  floatingBtn: { backgroundColor: '#8D5B4C', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  floatingBtnText: { color: colors.surface, fontSize: 12, fontWeight: '600' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.textDark },
  sectionSubtitle: { fontSize: 12, color: colors.textGray, marginTop: 2 },
  categoriesScroll: { marginBottom: 24 },
  topRatedScroll: { marginBottom: 10, paddingBottom: 10, paddingRight: 20 },
});