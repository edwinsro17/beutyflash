import React, { useState, useEffect } from 'react';
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

const CATEGORY_CATALOG = {
  maquillaje: {
    headerTitle: 'Maquillaje Social & Novias',
    placeholder: 'Buscar look, técnica o especialista...',
    tabs: ['Todos', 'Maquillaje Social', 'Novias & Bodas', 'Editorial'],
    banner: {
      tag: 'ALTA COSMÉTICA',
      title: 'Luce radiante para tu ocasión especial',
      desc: 'Con productos icónicos de Charlotte Tilbury, Dior y NARS adaptados a tu piel.',
      perks: ['Fijación 16h', 'Acabado Silk-Skin', 'Cruelty-Free'],
      icon: 'brush',
      bg: '#FBF0EC'
    },
    services: [
      {
        id: 'm1',
        proName: 'Lucía Méndez',
        rating: '4.95',
        reviews: '128 opiniones',
        proAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        topBadge: 'A Domicilio Incluido',
        gallery: [
          { uri: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=300&auto=format&fit=crop', label: 'Glow Glam' },
          { uri: 'https://images.unsplash.com/photo-1522337094846-8a818192de1f?q=80&w=300&auto=format&fit=crop', label: 'Lash Lift XL' },
          { uri: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=300&auto=format&fit=crop', label: 'Golden Hour' }
        ],
        title: 'Maquillaje Glow Editorial & Pestañas',
        desc: 'Piel luminosa efecto segunda piel con sellado resistente al agua, diseño de mirada con pestañas...',
        duration: '60 min',
        priceLabel: 'Tarifa completa',
        price: '55€',
        cta: 'Reservar'
      },
      {
        id: 'm2',
        proName: 'Carmen Valero',
        rating: '5.0',
        reviews: '94 novias',
        proAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
        topBadge: 'Kit Retoque Regalo',
        topBadgeDark: true,
        gallery: [
          { uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=300&auto=format&fit=crop', label: 'Día B Real' },
          { uri: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=300&auto=format&fit=crop', label: 'Kit Incluido' },
          { uri: 'https://images.unsplash.com/photo-1457972729786-0411a3b2b626?q=80&w=300&auto=format&fit=crop', label: 'Prueba Previa' }
        ],
        title: 'Pack Novia Exclusiva (Prueba + Día B)',
        desc: 'Asesoría morfológica integral, prueba de 2 looks 30 días antes, atención prioritaria el día del evento y kit...',
        duration: '180 min',
        priceLabel: 'Servicio premium',
        price: '180€',
        cta: 'Reservar'
      },
      {
        id: 'm3',
        proName: 'Sofía Navarro',
        rating: '4.90',
        reviews: '82 opiniones',
        proAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
        topBadge: 'Flash en <45 min',
        gallery: [
          { uri: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=300&auto=format&fit=crop', label: 'Smoky Bronze' },
          { uri: 'https://images.unsplash.com/photo-1503236823255-94609f598e71?q=80&w=300&auto=format&fit=crop', label: 'Party Night' }
        ],
        title: 'Maquillaje Express Noche & Ojos Ahumados',
        desc: 'Ideal antes de cenas o eventos nocturnos. Foco en mirada magnética con sombras pigmentadas de alta...',
        duration: '40 min',
        priceLabel: 'Servicio rápido',
        price: '45€',
        cta: 'Reservar'
      }
    ]
  },
  cabello: {
    headerTitle: 'Cabello & Peluquería',
    placeholder: 'Buscar estilista, balayage o técnica...',
    tabs: ['Todos', 'Corte & Peinado', 'Balayage & Color', 'Tratamientos'],
    banner: {
      tag: 'ATELIER SELECCIÓN',
      title: 'Especialistas en Coloración & Brushing de Alta Gama',
      desc: 'Técnicas a mano alzada, nutrición celular y estilistas verificados en tu salón o a domicilio.',
      perks: ['Diagnóstico Capilar', 'Productos Olaplex & Kérastase'],
      icon: 'content-cut',
      bg: '#F4EFEA'
    },
    services: [
      {
        id: 'c1',
        proName: 'Sofía Alarcón',
        rating: '4.96',
        reviews: '120 min',
        proAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        topBadge: 'Flash Disponible',
        heroImage: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=600&auto=format&fit=crop',
        title: 'Balayage Signature & Matiz Gloss',
        protocol: 'Diagnóstico capilar personalizado, aclaración degradada, baño matizador Gloss Brillo y peinado...',
        duration: '120 min',
        priceLabel: 'Precio cerrado',
        price: 'Desde 95€',
        cta: 'Reservar Cita'
      },
      {
        id: 'c2',
        proName: 'Mateo Rivas',
        rating: '4.94',
        reviews: '45 min',
        proAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        topBadge: 'Salón & Domicilio',
        heroImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
        title: 'Corte & Peinado Blowout',
        protocol: 'Lavado sensorial con masaje craneal, corte de arquitectura de precisión y secado con volumen...',
        duration: '45 min',
        priceLabel: 'Precio cerrado',
        price: 'Desde 45€',
        cta: 'Reservar Cita'
      },
      {
        id: 'c3',
        proName: 'Laura Sanz',
        rating: '4.98',
        reviews: '60 min',
        proAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
        topBadge: 'Hidratación Profunda',
        heroImage: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=600&auto=format&fit=crop',
        title: 'Tratamiento Botox Capilar & Hidratación',
        protocol: 'Infusión de ácido hialurónico, colágeno hidrolizado, cauterización térmica selladora y acabado sedoso.',
        duration: '60 min',
        priceLabel: 'Precio cerrado',
        price: 'Desde 65€',
        cta: 'Reservar Cita'
      }
    ]
  },
  unas: {
    headerTitle: 'Uñas & Manicura',
    placeholder: 'Buscar manicura rusa, gel o salón...',
    tabs: ['Todos', 'Manicura Rusa', 'Uñas Semipermanentes', 'Pedicura Spa'],
    banner: {
      tag: 'COMPROMISO CLÍNICO & ÉTICO',
      title: 'Esterilización Grado Médico & Esmaltes 10-Free',
      desc: 'Instrumental sellado en autoclave y marcas veganas no tóxicas en cada sesión.',
      perks: ['Garantía 14 días', 'Cutícula Perfecta'],
      icon: 'hand-heart-outline',
      bg: '#FBF0EC'
    },
    services: [
      {
        id: 'u1',
        proName: 'Carmen Rivera',
        rating: '4.98',
        reviews: '214 opiniones',
        proAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        topBadge: 'Rusa Combinada',
        heroImage: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop',
        title: 'Manicura Rusa Combinada & Nivelación',
        desc: 'Tratamiento profundo de cutícula con torno diamantado, nivelación de placa con base rubber y...',
        duration: '60 min',
        priceLabel: 'PRECIO TOTAL',
        price: '38€',
        cta: 'Reservar Ahora'
      },
      {
        id: 'u2',
        proName: 'Marta Soler',
        rating: '4.95',
        reviews: '138 opiniones',
        proAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
        topBadge: 'Ritual Spa Relax',
        heroImage: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=600&auto=format&fit=crop',
        title: 'Pedicura Spa Regeneradora con Peeling',
        desc: 'Exfoliación enzimática suave, mascarilla nutritiva de manteca de karité pura y masaje podal relajante...',
        duration: '75 min',
        priceLabel: 'PRECIO TOTAL',
        price: '45€',
        cta: 'Reservar Ahora'
      }
    ]
  },
  facial: {
    headerTitle: 'Facial & Glow Skincare',
    placeholder: 'Buscar Kobido, higiene facial, vitaminas...',
    tabs: ['Todos (14)', 'Higiene Facial Profunda', 'Efecto Glow & Kobido'],
    banner: {
      tag: 'GARANTÍA ATELIER • EN CASA O SALÓN',
      title: 'Diagnóstico dermo-analítico previo',
      desc: 'Escaneo cutáneo digitalizado y anamnesis personalizada antes de iniciar tu ritual.',
      perks: ['Alta Cosmética Médica', 'Resultados Visibles'],
      icon: 'flower-outline',
      bg: '#F4EFEA'
    },
    services: [
      {
        id: 'f1',
        proName: 'Elena Ruiz • Master Facialist',
        rating: '4.99',
        reviews: '112 opiniones',
        proAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        topBadge: 'Efecto Lifting Inmediato',
        heroImage: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&auto=format&fit=crop',
        title: 'Lifting Facial Kobido & Radiofrecuencia',
        desc: 'Efecto tensor inmediato natural mediante maniobras imperiales japonesas y bio-estimulación dérmica.',
        duration: '75 min',
        priceLabel: 'Inversión',
        price: '70€',
        cta: 'Reservar Ritual'
      },
      {
        id: 'f2',
        proName: 'Salón Boutique Serrano',
        rating: '4.92',
        reviews: '185 opiniones',
        proAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
        topBadge: 'Ultrasonidos + Detox',
        heroImage: 'https://images.unsplash.com/photo-1512290900672-1f1f11d00067?q=80&w=600&auto=format&fit=crop',
        title: 'Higiene Facial Profunda con Ultrasonidos',
        desc: 'Piel luminosa, oxigenada y sin rojeces gracias a la extracción atraumática por vibración sónica.',
        duration: '60 min',
        priceLabel: 'Desde',
        price: '50€',
        cta: 'Reservar Ritual'
      }
    ]
  }
};

export default function CategoryDetailScreen({ route, navigation }) {
  const initialCat = route?.params?.categoryId || 'maquillaje';
  const [activeCategory, setActiveCategory] = useState(
    CATEGORY_CATALOG[initialCat] ? initialCat : 'maquillaje'
  );
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    if (route?.params?.categoryId && CATEGORY_CATALOG[route.params.categoryId]) {
      setActiveCategory(route.params.categoryId);
      setSelectedTab(0);
    }
  }, [route?.params?.categoryId]);

  const currentData = CATEGORY_CATALOG[activeCategory];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <View style={styles.topNavLeft}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={20} color="#2C2623" />
          </TouchableOpacity>
          <Text style={styles.topNavTitle}>{currentData.headerTitle}</Text>
        </View>
        <View style={styles.topNavRight}>
          <TouchableOpacity
            onPress={() => navigation?.navigate && navigation.navigate('SearchResults')}
            style={styles.iconBtn}
          >
            <Feather name="search" size={19} color="#2C2623" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="heart" size={19} color="#2C2623" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selector Rápido de Universo (UX para cambiar entre Maquillaje, Cabello, Uñas y Facial al instante) */}
      <View style={styles.universeSwitcher}>
        {[
          { id: 'maquillaje', label: 'Maquillaje' },
          { id: 'cabello', label: 'Cabello' },
          { id: 'unas', label: 'Uñas' },
          { id: 'facial', label: 'Facial' }
        ].map((u) => (
          <TouchableOpacity
            key={u.id}
            style={[styles.universeTab, activeCategory === u.id && styles.universeTabActive]}
            onPress={() => {
              setActiveCategory(u.id);
              setSelectedTab(0);
            }}
          >
            <Text style={[styles.universeTabText, activeCategory === u.id && styles.universeTabTextActive]}>
              {u.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Barra de Búsqueda con Filtro */}
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color="#8C857B" />
          <TextInput
            style={styles.searchInput}
            placeholder={currentData.placeholder}
            placeholderTextColor="#8C857B"
          />
          <TouchableOpacity
            onPress={() => navigation?.navigate && navigation.navigate('SearchResults')}
          >
            <Feather name="sliders" size={16} color="#2C2623" />
          </TouchableOpacity>
        </View>

        {/* Píldoras de Sub-categorías */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabsScroll}>
          {currentData.tabs.map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.subTabPill, selectedTab === index && styles.subTabPillActive]}
              onPress={() => setSelectedTab(index)}
            >
              <Text style={[styles.subTabText, selectedTab === index && styles.subTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Banner Editorial de la Categoría */}
        <View style={[styles.editorialBanner, { backgroundColor: currentData.banner.bg }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.bannerTagPill}>
              <MaterialCommunityIcons name="shimmer" size={11} color="#8D5B4C" />
              <Text style={styles.bannerTagText}>{currentData.banner.tag}</Text>
            </View>
            <Text style={styles.bannerTitle}>{currentData.banner.title}</Text>
            <Text style={styles.bannerDesc}>{currentData.banner.desc}</Text>
            <View style={styles.perksRow}>
              {currentData.banner.perks.map((perk, idx) => (
                <View key={idx} style={styles.perkItem}>
                  <View style={styles.perkDot} />
                  <Text style={styles.perkText}>{perk}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.bannerIconCircle}>
            <MaterialCommunityIcons name={currentData.banner.icon} size={20} color="#8D5B4C" />
          </View>
        </View>

        {/* Listado de Servicios de la Categoría */}
        {currentData.services.map((srv) => (
          <View key={srv.id} style={styles.serviceCard}>
            {/* Cabecera del Profesional */}
            <View style={styles.proHeaderRow}>
              <Image source={{ uri: srv.proAvatar }} style={styles.proAvatar} />
              <View style={{ flex: 1 }}>
                <View style={styles.proNameRow}>
                  <Text style={styles.proName}>{srv.proName}</Text>
                  <MaterialCommunityIcons name="check-decagram" size={14} color="#8D5B4C" />
                </View>
                <View style={styles.ratingRow}>
                  <Feather name="star" size={11} color="#D4AF37" />
                  <Text style={styles.ratingBold}>{srv.rating}</Text>
                  <Text style={styles.reviewsGray}>({srv.reviews})</Text>
                </View>
              </View>
              <View style={[styles.topBadgePill, srv.topBadgeDark && styles.topBadgePillDark]}>
                <Text style={[styles.topBadgeText, srv.topBadgeDark && styles.topBadgeTextWhite]}>
                  {srv.topBadge}
                </Text>
              </View>
            </View>

            {/* Galería Múltiple (Estilo Maquillaje) o Imagen Hero (Estilo Cabello/Uñas/Facial) */}
            {srv.gallery ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryRow}>
                {srv.gallery.map((img, i) => (
                  <View key={i} style={styles.galleryItem}>
                    <Image source={{ uri: img.uri }} style={styles.galleryImg} />
                    <View style={styles.galleryLabelPill}>
                      <Text style={styles.galleryLabelText}>{img.label}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.heroImgWrapper}>
                <Image source={{ uri: srv.heroImage }} style={styles.heroImg} />
                <TouchableOpacity style={styles.favFloatingBtn}>
                  <Feather name="heart" size={15} color="#2C2623" />
                </TouchableOpacity>
              </View>
            )}

            {/* Título y Descripción / Protocolo */}
            <Text style={styles.serviceTitle}>{srv.title}</Text>

            {srv.protocol ? (
              <View style={styles.protocolBox}>
                <Text style={styles.protocolHeading}>INCLUYE PROTOCOLO</Text>
                <Text style={styles.protocolText}>{srv.protocol}</Text>
              </View>
            ) : (
              <Text style={styles.serviceDesc}>{srv.desc}</Text>
            )}

            {/* Etiquetas de Garantía y Duración */}
            <View style={styles.metaPillsRow}>
              <View style={styles.hygienePill}>
                <MaterialCommunityIcons name="shield-check-outline" size={13} color="#8D5B4C" />
                <Text style={styles.hygienePillText}>Material Desinfectado & Hipoalergénico</Text>
              </View>
              <View style={styles.durationPill}>
                <Feather name="clock" size={11} color="#5C554E" />
                <Text style={styles.durationPillText}>{srv.duration}</Text>
              </View>
            </View>

            {/* Footer de Precio y Botón de Reserva */}
            <View style={styles.cardFooterRow}>
              <View>
                <Text style={styles.priceLabel}>{srv.priceLabel}</Text>
                <Text style={styles.priceValue}>{srv.price}</Text>
              </View>
              <TouchableOpacity
                style={styles.bookBtn}
                activeOpacity={0.85}
                onPress={() => navigation?.navigate && navigation.navigate('SearchResults')}
              >
                <Text style={styles.bookBtnText}>{srv.cta}</Text>
                <Feather name="calendar" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

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
    paddingVertical: 10
  },
  topNavLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topNavTitle: { fontSize: 16, fontWeight: '800', color: '#2C2623' },
  topNavRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { padding: 6 },

  universeSwitcher: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6'
  },
  universeTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#EFECE6'
  },
  universeTabActive: { backgroundColor: '#8D5B4C' },
  universeTabText: { fontSize: 11, fontWeight: '600', color: '#5C554E' },
  universeTabTextActive: { color: '#FFFFFF', fontWeight: '700' },

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
    marginBottom: 14
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13, color: '#2C2623' },

  subTabsScroll: { marginBottom: 16 },
  subTabPill: {
    backgroundColor: '#EFECE6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8
  },
  subTabPillActive: { backgroundColor: '#2C2623' },
  subTabText: { fontSize: 12, fontWeight: '600', color: '#5C554E' },
  subTabTextActive: { color: '#FFFFFF' },

  editorialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    gap: 12
  },
  bannerTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    marginBottom: 6
  },
  bannerTagText: { fontSize: 9, fontWeight: '700', color: '#8D5B4C', letterSpacing: 0.4 },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: '#8D5B4C', marginBottom: 4 },
  bannerDesc: { fontSize: 11, color: '#6E675F', lineHeight: 15, marginBottom: 8 },
  perksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  perkItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  perkDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#8D5B4C' },
  perkText: { fontSize: 10, fontWeight: '600', color: '#4A433C' },
  bannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },

  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  proHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  proAvatar: { width: 38, height: 38, borderRadius: 19 },
  proNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  proName: { fontSize: 13, fontWeight: '700', color: '#2C2623' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingBold: { fontSize: 11, fontWeight: '700', color: '#2C2623' },
  reviewsGray: { fontSize: 11, color: '#8C857B' },
  topBadgePill: {
    backgroundColor: '#F9E6E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  topBadgePillDark: { backgroundColor: '#8D5B4C' },
  topBadgeText: { fontSize: 10, fontWeight: '700', color: '#A85844' },
  topBadgeTextWhite: { color: '#FFFFFF' },

  galleryRow: { marginBottom: 12 },
  galleryItem: {
    width: 115,
    height: 138,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 8,
    position: 'relative'
  },
  galleryImg: { width: '100%', height: '100%' },
  galleryLabelPill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(28, 24, 21, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  galleryLabelText: { fontSize: 9, fontWeight: '600', color: '#FFFFFF' },

  heroImgWrapper: {
    width: '100%',
    height: 165,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative'
  },
  heroImg: { width: '100%', height: '100%' },
  favFloatingBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center'
  },

  serviceTitle: { fontSize: 16, fontWeight: '800', color: '#2C2623', marginBottom: 6 },
  serviceDesc: { fontSize: 12, color: '#7A7571', lineHeight: 17, marginBottom: 12 },

  protocolBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFECE6'
  },
  protocolHeading: { fontSize: 9, fontWeight: '800', color: '#8D5B4C', marginBottom: 3, letterSpacing: 0.5 },
  protocolText: { fontSize: 11, color: '#5C554E', lineHeight: 16 },

  metaPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  hygienePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EFEA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5
  },
  hygienePillText: { fontSize: 10, fontWeight: '600', color: '#6E5A4F' },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F1ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4
  },
  durationPillText: { fontSize: 10, fontWeight: '600', color: '#5C554E' },

  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3EFEA',
    paddingTop: 12
  },
  priceLabel: { fontSize: 10, color: '#8C857B' },
  priceValue: { fontSize: 18, fontWeight: '800', color: '#2C2623' },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C88A78',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 8
  },
  bookBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' }
});