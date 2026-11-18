/**
 * Archivo: src/screens/AllCategoriesScreen.js
 * Opción 4 del Navbar del Cliente: "Categorías" (y Mis Favoritos ) en Pesos Colombianos (COP)
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors, sessionStore, formatCOP, useResponsiveLayout, sincronizarEstadoDesdeSupabase } from '../theme/colors';
import BottomMenu from '../components/BottomMenu';

const CATEGORIES_DATA = [
  {
    id: 'cabello',
    title: 'Cabello & Peluquería',
    count: '18 SERVICIOS DISPONIBLES',
    priceCop: 35000,
    desc: 'Corte de autor, Cepillado Blower, Balayage, Keratina orgánica y tratamientos.',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'unas',
    title: 'Uñas & Manicura Rusa',
    count: '15 SERVICIOS DISPONIBLES',
    priceCop: 28000,
    desc: 'Manicura rusa combinada, gel escultural, acrílicas y esmaltado semipermanente.',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'maquillaje',
    title: 'Maquillaje Social & Novias',
    count: '12 SERVICIOS DISPONIBLES',
    priceCop: 65000,
    desc: 'Maquillaje social blindado de larga duración, novias y diseño de mirada.',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'facial',
    title: 'Facial & Cuidado de Piel',
    count: '14 SERVICIOS DISPONIBLES',
    priceCop: 60000,
    desc: 'Limpieza profunda con ultrasonido, hidratación Glow y masaje facial.',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'barberia',
    title: 'Barbería & Corte Clásico',
    count: '10 SERVICIOS DISPONIBLES',
    priceCop: 35000,
    desc: 'Corte Fade degradado, arreglo de barba con toalla caliente y ritual facial.',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400&auto=format&fit=crop',
  },
];

export default function AllCategoriesScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const [searchQuery, setSearchQuery] = useState('');
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [favoritos, setFavoritos] = useState([...(sessionStore.clientFavorites || ['cabello'])]);

  const toggleFavorito = (id) => {
    let nuevos;
    if (favoritos.includes(id)) {
      nuevos = favoritos.filter((item) => item !== id);
    } else {
      nuevos = [...favoritos, id];
    }
    sessionStore.clientFavorites = nuevos;
    setFavoritos(nuevos);
  };

  const filtered = CATEGORIES_DATA.filter((c) => {
    const matchText =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFav = !soloFavoritos || favoritos.includes(c.id);
    return matchText && matchFav;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.iconBtn}>
          <Feather name="arrow-left" size={20} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Categorías y Favoritos (COP)</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, layout.contentContainerStyle]} showsVerticalScrollIndicator={false}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={colors.textGray} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar categoría o tratamiento..."
            placeholderTextColor={colors.textGray}
          />
        </View>

        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, !soloFavoritos && styles.filterTabActive]}
            onPress={() => setSoloFavoritos(false)}
          >
            <Text style={[styles.filterTabText, !soloFavoritos && styles.filterTabTextActive]}>
              Todas las Categorías ({CATEGORIES_DATA.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, soloFavoritos && styles.filterTabActive]}
            onPress={() => setSoloFavoritos(true)}
          >
            <Text style={[styles.filterTabText, soloFavoritos && styles.filterTabTextActive]}>
               Mis Favoritos ({favoritos.length})
            </Text>
          </TouchableOpacity>
        </View>

        {filtered.map((cat) => {
          const esFav = favoritos.includes(cat.id);
          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.card}
              onPress={() => navigation.navigate('CategoryDetail', { categoryId: cat.id })}
            >
              <View style={{ position: 'relative' }}>
                <Image source={{ uri: cat.image }} style={styles.cardImg} />
                <TouchableOpacity
                  style={styles.favBtn}
                  onPress={() => toggleFavorito(cat.id)}
                >
                  <Ionicons
                    name={esFav ? 'heart' : 'heart-outline'}
                    size={20}
                    color={esFav ? '#E11D48' : '#1A1817'}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.badgeRow}>
                  <Text style={styles.tagText}>{cat.count}</Text>
                  <Text style={styles.priceText}>Desde {formatCOP(cat.priceCop)} COP</Text>
                </View>
                <Text style={styles.cardTitle}>{cat.title}</Text>
                <Text style={styles.cardDesc}>{cat.desc}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <BottomMenu activeTab="Categorías" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark , flexShrink: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 30 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13.5, color: colors.textDark },
  filterTabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EBE6E0',
    alignItems: 'center',
  },
  filterTabActive: { backgroundColor: colors.primary },
  filterTabText: { fontSize: 12, fontWeight: '700', color: colors.textDark , flexShrink: 1 },
  filterTabTextActive: { color: '#FFFFFF' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardImg: { width: '100%', height: 135 },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: 14 },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tagText: { fontSize: 10, fontWeight: '800', color: colors.primary , flexShrink: 1 },
  priceText: { fontSize: 13.5, fontWeight: '800', color: colors.primary , flexShrink: 1 },
  cardTitle: { fontSize: 16.5, fontWeight: '800', color: colors.textDark, marginBottom: 4 , flexShrink: 1 },
  cardDesc: { fontSize: 12.5, color: colors.textGray , flexShrink: 1 },
});
