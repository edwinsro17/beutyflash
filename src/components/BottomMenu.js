/**
 * Archivo: src/components/BottomMenu.js
 * Barra de navegación inferior exclusiva del flujo CLIENTE con las 5 opciones
 * desarrolladas: Servicios (Home), Flash, Reservas (con badge de solicitud activa),
 * Categorías (y Favoritos) y Perfil.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, obtenerSolicitudActiva } from '../theme/colors';

export default function BottomMenu({ activeTab = 'Servicios', navigation }) {
  const solicitudActiva = obtenerSolicitudActiva();

  const tabs = [
    {
      name: 'Home',
      iconFamily: 'MaterialCommunityIcons',
      iconName: 'flower-outline',
      label: 'Servicios',
    },
    {
      name: 'CategoryDetail',
      iconFamily: 'Ionicons',
      iconName: 'flash-outline',
      label: 'Flash',
    },
    {
      name: 'SearchResults',
      iconFamily: 'Feather',
      iconName: 'navigation',
      label: 'Reservas',
      badge: solicitudActiva ? '1' : null,
    },
    {
      name: 'AllCategories',
      iconFamily: 'Feather',
      iconName: 'grid',
      label: 'Categorías',
    },
    {
      name: 'Profile',
      iconFamily: 'Feather',
      iconName: 'user',
      label: 'Perfil',
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.label || activeTab === tab.name;
        const color = isActive ? colors.primary : '#9E9894';
        return (
          <TouchableOpacity
            key={tab.label}
            style={styles.tab}
            activeOpacity={0.75}
            onPress={() => navigation && navigation.navigate && navigation.navigate(tab.name)}
          >
            <View style={styles.iconWrap}>
              {tab.iconFamily === 'Feather' && (
                <Feather name={tab.iconName} size={21} color={color} />
              )}
              {tab.iconFamily === 'Ionicons' && (
                <Ionicons name={tab.iconName} size={22} color={color} />
              )}
              {tab.iconFamily === 'MaterialCommunityIcons' && (
                <MaterialCommunityIcons name={tab.iconName} size={22} color={color} />
              )}
              {tab.badge && (
                <View style={styles.badgeDot}>
                  <Text style={styles.badgeDotText}>{tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive, { color }]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: '#EFEAE4',
    elevation: 12,
  },
  tab: { alignItems: 'center', justifyContent: 'center', flex: 1, position: 'relative' },
  iconWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  badgeDot: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#2563EB',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeDotText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  tabLabel: { fontSize: 10.5, marginTop: 4, fontWeight: '600' },
  tabLabelActive: { fontWeight: '800' },
  activeIndicator: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
});
