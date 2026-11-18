/**
 * Archivo: src/screens/CategoryDetailScreen.js
 * Opción 2 del Navbar del Cliente: "Flash"
 * Muestra únicamente los servicios activos creados por los profesionales en su catálogo,
 * con barra de búsqueda por nombre o categoría y apertura del Modal de Reserva / Domicilio.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  colors,
  formatCOP,
  obtenerServiciosActivosParaClientes,
  useResponsiveLayout,
  sincronizarEstadoDesdeSupabase,
} from '../theme/colors';
import BottomMenu from '../components/BottomMenu';
import { ServiceBookingModal } from '../components/ServiceBookingModal';

const CATEGORIAS_FILTRO = [
  { id: 'todos', label: 'Todos Activos' },
  { id: 'cabello', label: 'Peluquería • Color' },
  { id: 'unas', label: 'Uñas • Manicura' },
  { id: 'maquillaje', label: 'Maquillaje' },
  { id: 'facial', label: 'Facial' },
  { id: 'barberia', label: 'Barbería' },
];

export default function CategoryDetailScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const initialCat = route?.params?.categoryId || 'todos';
  const [catActiva, setCatActiva] = useState(initialCat);
  const [busqueda, setBusqueda] = useState(route?.params?.query || '');
  const [servicios, setServicios] = useState([]);
  const [servicioModal, setServicioModal] = useState(null);
  const [modoModal, setModoModal] = useState('local');

  const cargarServiciosActivos = () => {
    setServicios(
      obtenerServiciosActivosParaClientes({
        categoria: catActiva,
        busqueda,
      })
    );
  };

  useEffect(() => {
    cargarServiciosActivos();
  }, [catActiva, busqueda]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', cargarServiciosActivos);
    return unsub;
  }, [navigation, catActiva, busqueda]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.textDark} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="flash" size={16} color={colors.flashIcon} />
          <Text style={styles.headerTitle}>Catálogo Activo & Flash</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, layout.contentContainerStyle]} showsVerticalScrollIndicator={false}>
        {/* Barra de búsqueda */}
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={colors.textGray} />
          <TextInput
            style={styles.searchInput}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por nombre de servicio o categoría..."
            placeholderTextColor={colors.textGray}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {CATEGORIAS_FILTRO.map((c) => {
            const active = catActiva === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.catPill, active && styles.catPillActive]}
                onPress={() => setCatActiva(c.id)}
              >
                <Text style={[styles.catPillText, active && { color: '#FFFFFF' }]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {servicios.map((srv) => (
          <View key={srv.id} style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={{ uri: srv.image }} style={styles.thumb} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={styles.badgeRow}>
                  <View style={styles.hotBadge}>
                    <Text style={styles.hotBadgeText}>{srv.badge || ' Más Reservado'}</Text>
                  </View>
                  <Text style={styles.catText}>{srv.categoryLabel}</Text>
                </View>
                <Text style={styles.title}>{srv.title}</Text>
                <Text style={styles.meta}>
                   {srv.duration} •  {srv.barrio} ({srv.proName})
                </Text>
              </View>
            </View>
            <Text style={styles.desc}>{srv.desc}</Text>
            <View style={styles.footer}>
              <Text style={styles.price}>{formatCOP(srv.priceCop)} COP</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={styles.localBtn}
                  onPress={() => {
                    setModoModal('local');
                    setServicioModal(srv);
                  }}
                >
                  <Text style={styles.localBtnText}>Reservar Cita</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.homeBtn}
                  onPress={() => {
                    setModoModal('domicilio');
                    setServicioModal(srv);
                  }}
                >
                  <Text style={styles.homeBtnText}>A Domicilio</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <ServiceBookingModal
        visible={Boolean(servicioModal)}
        servicio={servicioModal}
        initialMode={modoModal}
        onClose={() => setServicioModal(null)}
        onSuccessDomicilio={() => {
          setServicioModal(null);
          navigation.navigate('SearchResults');
        }}
      />

      <BottomMenu activeTab="Flash" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: colors.textDark , flexShrink: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 30 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13.5, color: colors.textDark },
  catPill: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  catPillActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  catPillText: { fontSize: 12, fontWeight: '700', color: colors.textDark , flexShrink: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  thumb: { width: 76, height: 76, borderRadius: 16 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  hotBadge: {
    backgroundColor: '#FDECE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  hotBadgeText: { fontSize: 10, fontWeight: '800', color: '#B85D43' , flexShrink: 1 },
  catText: { fontSize: 11.5, color: colors.textGray, fontWeight: '600' , flexShrink: 1 },
  title: { fontSize: 15.5, fontWeight: '800', color: colors.textDark },
  meta: { fontSize: 11.5, color: colors.textGray, marginTop: 3 },
  desc: { fontSize: 12.5, color: colors.textGray, marginVertical: 10, lineHeight: 18 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 10,
  },
  price: { fontSize: 18, fontWeight: '900', color: colors.textDark },
  localBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  localBtnText: { fontSize: 12, fontWeight: '800', color: colors.primary , flexShrink: 1 },
  homeBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  homeBtnText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' , flexShrink: 1 },
});
