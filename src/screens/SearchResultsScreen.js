import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import BottomMenu from '../components/BottomMenu';

const PROFESSIONALS_RESULTS = [
  {
    id: 'p1',
    name: 'Sofía Alarcón',
    role: 'Master Colorist Atelier',
    rating: '4.98',
    reviews: '214 reseñas',
    distance: 'A 1.2 km (Salamanca)',
    modality: 'A domicilio & Salón',
    availability: 'Hoy 16:30',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    portfolio: [
      'https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=300&auto=format&fit=crop'
    ],
    featuredService: 'Balayage Signature & Matiz',
    subService: 'Brushing Sedoso + Gotas Nutritivas',
    price: 'desde 95€',
    oldPrice: 'antes 115€',
    ctaDark: true,
    ctaText: 'Ver Perfil & Reservar'
  },
  {
    id: 'p2',
    name: 'Mateo Rivas',
    role: 'Color & Cut Specialist',
    rating: '4.94',
    reviews: '158 reseñas',
    distance: 'A 2.4 km (Chamberí)',
    modality: 'Solo en salón',
    availability: 'Mañana 11:00',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    portfolio: [
      'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=300&auto=format&fit=crop'
    ],
    featuredService: 'Melted Caramel Balayage +...',
    subService: 'Peinado Onda Suave Blowout',
    price: 'desde 110€',
    oldPrice: 'antes 130€',
    ctaDark: true,
    ctaText: 'Ver Perfil & Reservar'
  },
  {
    id: 'p3',
    name: 'Elena Valdés',
    role: 'VIP Mobile Hair Concierge',
    rating: '5.0',
    reviews: '89 reseñas',
    distance: 'A domicilio (Llega en 35m)',
    modality: 'Flash Express',
    availability: 'Disponible ahora',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    portfolio: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522337094846-8a818192de1f?q=80&w=300&auto=format&fit=crop'
    ],
    featuredService: 'Full Balayage & Blowout in...',
    subService: 'Peinado para Eventos & Ondas',
    price: 'desde 130€',
    oldPrice: 'antes 150€',
    ctaDark: false,
    ctaText: 'Reservar Flash Now (Hoy)'
  }
];

export default function SearchResultsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* 1. Header de BeautyFlash conservado */}
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

          {/* 2. Barra de Búsqueda Activa */}
          <View style={styles.searchHeaderRow}>
            <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
              <Feather name="arrow-left" size={18} color="#2C2623" />
            </TouchableOpacity>
            <View style={styles.activeSearchBox}>
              <Feather name="search" size={15} color="#8D5B4C" />
              <Text style={styles.activeSearchText} numberOfLines={1}>
                Balayage y Peinado en...
              </Text>
              <Feather name="x-circle" size={15} color="#9A938C" />
            </View>
            <TouchableOpacity style={styles.filterBtn}>
              <Feather name="sliders" size={16} color="#2C2623" />
              <View style={styles.filterDot} />
            </TouchableOpacity>
          </View>

          {/* 3. Píldoras de Filtros Activos */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <View style={styles.filterChipDark}>
              <Text style={styles.filterChipDarkText}>{'<'} 5 km ×</Text>
            </View>
            <View style={styles.filterChipDark}>
              <Text style={styles.filterChipDarkText}>€€ ×</Text>
            </View>
            <View style={styles.filterChipLight}>
              <Feather name="star" size={11} color="#D4AF37" />
              <Text style={styles.filterChipLightText}>4.8+</Text>
            </View>
            <View style={styles.filterChipLight}>
              <MaterialCommunityIcons name="lightning-bolt" size={12} color="#8D5B4C" />
              <Text style={styles.filterChipLightText}>Hoy</Text>
            </View>
          </ScrollView>

          {/* Contador de resultados */}
          <View style={styles.resultsCountRow}>
            <Text style={styles.resultsCountText}>24 profesionales disponibles</Text>
            <Text style={styles.sortByText}>Ordenar: <Text style={styles.sortByBold}>Más recomendados</Text></Text>
          </View>

          {/* 4. Tarjetas de Profesionales */}
          {PROFESSIONALS_RESULTS.map((pro) => (
            <View key={pro.id} style={styles.proCard}>
              {/* Fila Superior */}
              <View style={styles.proCardHeader}>
                <Image source={{ uri: pro.avatar }} style={styles.proAvatar} />
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.proName}>{pro.name}</Text>
                    <MaterialCommunityIcons name="check-decagram" size={14} color="#8D5B4C" />
                  </View>
                  <Text style={styles.proRole}>{pro.role}</Text>
                  <View style={styles.ratingRow}>
                    <Feather name="star" size={11} color="#D4AF37" />
                    <Text style={styles.ratingBold}>{pro.rating}</Text>
                    <Text style={styles.reviewsGray}>• {pro.reviews}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.heartBtn}>
                  <Feather name="heart" size={16} color="#7A7571" />
                </TouchableOpacity>
              </View>

              {/* Chips de Ubicación y Disponibilidad */}
              <View style={styles.proBadgesRow}>
                <View style={styles.infoChip}>
                  <Feather name="map-pin" size={10} color="#5C554E" />
                  <Text style={styles.infoChipText}>{pro.distance}</Text>
                </View>
                <View style={styles.infoChip}>
                  <Text style={styles.infoChipText}>{pro.modality}</Text>
                </View>
                <View style={styles.availChip}>
                  <Feather name="clock" size={10} color="#A85844" />
                  <Text style={styles.availChipText}>{pro.availability}</Text>
                </View>
              </View>

              {/* Portafolio de 3 Fotos */}
              <View style={styles.portfolioGrid}>
                {pro.portfolio.map((imgUrl, i) => (
                  <Image key={i} source={{ uri: imgUrl }} style={styles.portfolioImg} />
                ))}
              </View>

              {/* Resumen de Servicio y Precio */}
              <View style={styles.servicePriceBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featuredServiceTitle} numberOfLines={1}>• {pro.featuredService}</Text>
                  <Text style={styles.subServiceTitle} numberOfLines={1}>• {pro.subService}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.priceNow}>{pro.price}</Text>
                  <Text style={styles.priceOld}>{pro.oldPrice}</Text>
                </View>
              </View>

              {/* Botón de Acción */}
              <TouchableOpacity
                style={[styles.actionBtn, !pro.ctaDark && styles.actionBtnCoral]}
                activeOpacity={0.85}
              >
                {!pro.ctaDark && <MaterialCommunityIcons name="lightning-bolt" size={15} color="#FFFFFF" />}
                <Text style={styles.actionBtnText}>{pro.ctaText}</Text>
                {pro.ctaDark && <Feather name="arrow-right" size={14} color="#FFFFFF" />}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Botón Flotante "Ver mapa (24)" */}
        <TouchableOpacity
          style={styles.floatingMapPill}
          activeOpacity={0.9}
          onPress={() => navigation?.navigate && navigation.navigate('Home')}
        >
          <Feather name="map" size={14} color="#FFFFFF" />
          <Text style={styles.floatingMapText}>Ver mapa (24)</Text>
        </TouchableOpacity>
      </View>

      <BottomMenu activeTab="Servicios" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors?.background || '#FAF8F5' },
  scrollContainer: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 80 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  logoRow: { flexDirection: 'row', alignItems: 'baseline' },
  logoBeauty: { fontSize: 28, fontStyle: 'italic', fontWeight: '300', color: '#2C2623' },
  logoFlash: { fontSize: 28, fontWeight: '800', color: '#8D5B4C' },
  profilePic: { width: 38, height: 38, borderRadius: 19 },

  searchHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE5DF'
  },
  activeSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#EAE5DF'
  },
  activeSearchText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#2C2623' },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE5DF',
    position: 'relative'
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#C88A78'
  },

  filtersScroll: { marginBottom: 14 },
  filterChipDark: {
    backgroundColor: '#2C2623',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8
  },
  filterChipDarkText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  filterChipLight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#EAE5DF'
  },
  filterChipLightText: { fontSize: 11, fontWeight: '600', color: '#2C2623' },

  resultsCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  resultsCountText: { fontSize: 11, color: '#7A7571', fontWeight: '600' },
  sortByText: { fontSize: 11, color: '#7A7571' },
  sortByBold: { fontWeight: '700', color: '#2C2623' },

  proCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  proCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  proAvatar: { width: 44, height: 44, borderRadius: 22 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  proName: { fontSize: 14, fontWeight: '800', color: '#2C2623' },
  proRole: { fontSize: 11, color: '#7A7571' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingBold: { fontSize: 11, fontWeight: '700', color: '#2C2623' },
  reviewsGray: { fontSize: 11, color: '#8C857B' },
  heartBtn: { padding: 6 },

  proBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F2ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  infoChipText: { fontSize: 10, color: '#5C554E', fontWeight: '500' },
  availChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF0EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  availChipText: { fontSize: 10, color: '#A85844', fontWeight: '700' },

  portfolioGrid: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  portfolioImg: { flex: 1, height: 82, borderRadius: 10 },

  servicePriceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12
  },
  featuredServiceTitle: { fontSize: 11, fontWeight: '700', color: '#2C2623' },
  subServiceTitle: { fontSize: 10, color: '#7A7571', marginTop: 2 },
  priceNow: { fontSize: 13, fontWeight: '800', color: '#2C2623' },
  priceOld: { fontSize: 10, color: '#9A938C', textDecorationLine: 'line-through' },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#24201E',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6
  },
  actionBtnCoral: { backgroundColor: '#C88A78' },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  floatingMapPill: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#24201E',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6
  },
  floatingMapText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' }
});