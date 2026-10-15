import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function BottomMenu({ activeTab = 'Servicios' }) {
  // Función auxiliar para renderizar cada botón del menú
  const renderTab = (name, iconFamily, iconName, label) => {
    const isActive = activeTab === label;
    const color = isActive ? '#8D5B4C' : '#A9A4A1'; // Destaca el tab activo

    return (
      <TouchableOpacity style={styles.tab} activeOpacity={0.7}>
        {iconFamily === 'Feather' && <Feather name={iconName} size={24} color={color} />}
        {iconFamily === 'Ionicons' && <Ionicons name={iconName} size={24} color={color} />}
        {iconFamily === 'MaterialCommunityIcons' && <MaterialCommunityIcons name={iconName} size={24} color={color} />}
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive, { color }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {renderTab('Services', 'MaterialCommunityIcons', 'flower-outline', 'Servicios')}
      {renderTab('Flash Now', 'Ionicons', 'flash-outline', 'Flash')}
      {renderTab('Bookings', 'Feather', 'calendar', 'Reservas')}
      {renderTab('Favorites', 'Feather', 'heart', 'Favoritos')}
      {renderTab('Profile', 'Feather', 'user', 'Perfil')}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12, // Espacio extra para la barra de inicio en iOS
    borderTopWidth: 1,
    borderTopColor: '#F3EFEA',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -5 },
    elevation: 8, // Sombra suave en Android
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});