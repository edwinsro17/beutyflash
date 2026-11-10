import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import BottomMenu from '../components/BottomMenu';

const CATEGORIES_DATA = [
  {
    id: 'cabello',
    title: 'Cabello & Peluquería',
    count: '18 SERVICIOS DISPONIBLES',
    price: '35€',
    desc: 'Corte de autor, Peinado Glow, Balayage, Brushing de seda y...',
    badgeIcon: 'check-decagram',
    badgeText: 'Estilistas Senior',
    icon: 'content-cut',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'maquillaje',
    title: 'Maquillaje Social & Novias',
    count: '12 SERVICIOS DISPONIBLES',
    price: '45€',
    desc: 'Editorial alta fijación, Glow Natural de día, Novias Atelier y eventos de...',
    badgeIcon: 'star',
    badgeText: 'Beauty Artists VIP',
    icon: 'brush',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'unas',
    title: 'Uñas & Manicura',
    count: '15 SERVICIOS DISPONIBLES',
    price: '25€',
    desc: 'Manicura rusa combinada, Gel escultural, Esmaltado...',
    badgeIcon: 'leaf',
    badgeText: 'Esmaltes 10-Free',
    icon: 'hand-Wash-outline',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'facial',
    title: 'Facial & Skincare',
    count: '14 SERVICIOS DISPONIBLES',
    price: '50€',
    desc: 'Higiene profunda con ultrasonidos, Hidratación Glow, Masaje Kobido...',
    badgeIcon: 'shimmer',
    badgeText: 'Alta Cosmética',
    icon: 'flower-outline',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'masajes',
    title: 'Masajes & Bienestar',
    count: '9 SERVICIOS DISPONIBLES',
    price: '55€',
    desc: 'Holístico Relajante con aromaterapia, Drenaje Linfático...',
    badgeIcon: 'medal-outline',
    badgeText: 'Terapeutas Certificados',
    icon: 'spa-outline',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'mirada',
    title: 'Depilación & Mirada',
    count: '11 SERVICIOS DISPONIBLES',
    price: '18€',
    desc: 'Diseño de cejas con hilo, Lifting & tinte de pestañas, Láser diodo y...',
    badgeIcon: 'eye-check-outline',
    badgeText: 'Precisión Milimétrica',
    icon: 'eye-outline',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400&auto=format&fit=crop'
  }
];

const TRENDING_TAGS = [
  { label: 'Manicura Rusa', catId: 'unas' },
  { label: 'Lifting Pestañas', catId: 'mirada' },
  { label: 'Peinado Glow', catId: 'cabello' },
  { label: 'Facial Kobido', catId: 'facial' },
  { label: 'Drenaje Linfático', catId: 'masajes' },
  { label: 'Novias Atelier', catId: 'maquillaje' }
];

export default function AllCategoriesScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenCategory = (categoryId) => {
    if (navigation && navigation.navigate) {
      navigation.navigate('CategoryDetail', { categoryId });
    }
  };

  const handleOpenSearch = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('SearchResults', { query: searchQuery || 'Balayage y Peinado' });
    }
  };

  const filteredCategories = CATEGORIES_DATA.filter(cat =>
    cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Barra de Navegación Superior */}
      <View style={styles.topNav}>
        <View style={styles.topNavLeft}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={20} color="#2C2623" />
          </TouchableOpacity>
          <Text style={styles.topNavTitle}>Explorar Categorías</Text>
        </View>
        <View style={styles.topNavRight}>
          <TouchableOpacity onPress={handleOpenSearch} style={styles.iconBtn}>
            <Feather name="search" size={19} color="#2C2623" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="heart" size={19} color="#2C2623" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Buscador Rápido */}
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color="#8C857B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar tratamiento o categoría..."
            placeholderTextColor="#8C857B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleOpenSearch}
          />
        </View>

        {/* Banner Reserva Flash Express */}
        <TouchableOpacity style={styles.flashBanner} activeOpacity={0.9} onPress={handleOpenSearch}>
          <View style={styles.flashIconCircle}>
            <MaterialCommunityIcons name="lightning-bolt" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.flashBannerContent}>
            <View style={styles.atelierPill}>
              <View style={styles.whiteDot} />
              <Text style={styles.atelierPillText}>ATELIER ON-DEMAND</Text>
            </View>
            <Text style={styles.flashBannerTitle}>Reserva Flash Express</Text>
            <Text style={styles.flashBannerSub}>Especialista verificado en tu puerta en {'<'} 60 min</Text>
          </View>
          <View style={styles.flashArrowCircle}>
            <Feather name="arrow-right" size={18} color="#8D5B4C" />
          </View>
        </TouchableOpacity>

        {/* Cabecera Explorar Tratamientos */}
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Explorar Tratamientos</Text>
            <Text style={styles.sectionSubtitle}>6 universos de cuidado estético a domicilio o salón</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>6 categorías</Text>
          </View>
        </View>

        {/* Lista de Tarjetas de Categoría */}
        {filteredCategories.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.categoryCard}
            activeOpacity={0.85}
            onPress={() => handleOpenCategory(item.id)}
          >
            <View style={styles.cardImageWrapper}>
              <Image source={{ uri: item.image }} style={styles.cardImage} />
              <View style={styles.miniIconOverlay}>
                <MaterialCommunityIcons name={item.icon === 'hand-Wash-outline' ? 'hand-heart-outline' : item.icon} size={13} color="#8D5B4C" />
              </View>
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.cardTopRow}>
                <Text style={styles.serviceCountText}>{item.count}</Text>
                <Text style={styles.priceFromText}>Desde <Text style={styles.priceBold}>{item.price}</Text></Text>
              </View>

              <Text style={styles.categoryTitle}>{item.title}</Text>
              <Text style={styles.categoryDesc} numberOfLines={2}>{item.desc}</Text>

              <View style={styles.cardBottomRow}>
                <View style={styles.proBadgeRow}>
                  <MaterialCommunityIcons name={item.badgeIcon} size={13} color="#8D5B4C" />
                  <Text style={styles.proBadgeText}>{item.badgeText}</Text>
                </View>
                <View style={styles.chevronCircle}>
                  <Feather name="chevron-right" size={14} color="#2C2623" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Sección: Los más solicitados hoy */}
        <View style={styles.trendingHeader}>
          <View style={styles.trendingTitleRow}>
            <Feather name="trending-up" size={16} color="#8D5B4C" />
            <Text style={styles.trendingTitle}>Los más solicitados hoy</Text>
          </View>
          <Text style={styles.trendingMeta}>TENDENCIAS</Text>
        </View>

        <View style={styles.tagsWrap}>
          {TRENDING_TAGS.map((tag, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.trendPill}
              onPress={() => handleOpenCategory(tag.catId)}
            >
              <View style={styles.trendDot} />
              <Text style={styles.trendPillText}>{tag.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tarjeta Concierge Inferior */}
        <View style={styles.conciergeCard}>
          <View style={styles.conciergeIconBox}>
            <Feather name="headphones" size={18} color="#8D5B4C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.conciergeTitle}>¿Necesitas asesoramiento a medida?</Text>
            <Text style={styles.conciergeSub}>Nuestra beauty concierge te orienta en directo.</Text>
          </View>
          <TouchableOpacity style={styles.chatBtn}>
            <Text style={styles.chatBtnText}>Chatear</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Menú Inferior Fijo conservado */}
      <BottomMenu activeTab="Servicios" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors?.background || '#FAF8F5' },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6'
  },
  topNavLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topNavTitle: { fontSize: 16, fontWeight: '700', color: '#2C2623' },
  topNavRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { padding: 6 },

  scrollContainer: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 28 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#EAE5DF',
    marginBottom: 16
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13, color: '#2C2623' },

  flashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C88A78',
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
    gap: 12
  },
  flashIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  flashBannerContent: { flex: 1 },
  atelierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 5,
    marginBottom: 4
  },
  whiteDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFFFFF' },
  atelierPillText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  flashBannerTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  flashBannerSub: { fontSize: 11, color: '#FFF5F2', marginTop: 2 },
  flashArrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2C2623' },
  sectionSubtitle: { fontSize: 11, color: '#7A7571', marginTop: 2 },
  countBadge: {
    backgroundColor: '#EFECE6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  countBadgeText: { fontSize: 11, fontWeight: '600', color: '#5C554E' },

  categoryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  cardImageWrapper: { width: 92, height: 104, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  miniIconOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardInfo: { flex: 1, justifyContent: 'space-between' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceCountText: { fontSize: 9, fontWeight: '700', color: '#9A938C', letterSpacing: 0.4 },
  priceFromText: { fontSize: 10, color: '#7A7571' },
  priceBold: { fontSize: 12, fontWeight: '800', color: '#2C2623' },
  categoryTitle: { fontSize: 15, fontWeight: '800', color: '#2C2623', marginTop: 2 },
  categoryDesc: { fontSize: 11, color: '#7A7571', lineHeight: 15, marginTop: 2 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  proBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  proBadgeText: { fontSize: 10, fontWeight: '600', color: '#5C554E' },
  chevronCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5F2ED',
    alignItems: 'center',
    justifyContent: 'center'
  },

  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12
  },
  trendingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendingTitle: { fontSize: 15, fontWeight: '800', color: '#2C2623' },
  trendingMeta: { fontSize: 10, fontWeight: '700', color: '#9A938C', letterSpacing: 0.6 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#EFECE6'
  },
  trendDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C88A78' },
  trendPillText: { fontSize: 11, fontWeight: '600', color: '#2C2623' },

  conciergeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFEA',
    borderRadius: 16,
    padding: 14,
    gap: 12
  },
  conciergeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  conciergeTitle: { fontSize: 12, fontWeight: '700', color: '#2C2623' },
  conciergeSub: { fontSize: 11, color: '#7A7571', marginTop: 1 },
  chatBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10
  },
  chatBtnText: { fontSize: 11, fontWeight: '700', color: '#2C2623' }
});