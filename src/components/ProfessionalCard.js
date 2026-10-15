import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfessionalCard({ imageUri, name, rating, reviews, role, price }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <ImageBackground 
        source={{ uri: imageUri }} 
        style={styles.imageBackground} 
        imageStyle={{ borderRadius: 16 }}
      >
        {/* El gradiente oscurece la parte inferior para que el texto blanco resalte */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.gradientOverlay}
        >
          {/* Fila del Nombre y Verificado */}
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            <MaterialIcons name="verified" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </View>

          {/* Calificación */}
          <View style={styles.ratingRow}>
            <Feather name="star" size={12} color="#F5A623" />
            <Text style={styles.ratingText}>
              {rating} <Text style={styles.reviewsText}>({reviews})</Text>
            </Text>
          </View>

          {/* Especialidad / Rol */}
          <Text style={styles.role} numberOfLines={1}>{role}</Text>

          {/* Footer: Precio y Botón */}
          <View style={styles.footerRow}>
            <Text style={styles.priceLabel}>
              Desde <Text style={styles.priceValue}>{price}€</Text>
            </Text>
            
            <TouchableOpacity style={styles.reserveButton}>
              <Text style={styles.reserveText}>Reservar</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220, // Tarjeta un poco más estrecha y alta (tipo retrato)
    height: 300,
    marginRight: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end', // Empuja el gradiente hacia abajo
  },
  gradientOverlay: {
    padding: 16,
    borderRadius: 16,
    height: '60%', // El gradiente solo cubre la mitad inferior
    justifyContent: 'flex-end',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  reviewsText: {
    fontWeight: '400',
    color: '#E0E0E0',
  },
  role: {
    fontSize: 13,
    color: '#E0E0E0',
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  priceValue: {
    fontWeight: '700',
    color: '#F5A623', // Tono dorado/naranja para el precio
  },
  reserveButton: {
    backgroundColor: '#F3EFEA', // Tono crema del botón
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reserveText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D221E', // Texto oscuro en el botón claro
  },
});