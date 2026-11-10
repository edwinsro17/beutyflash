import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import BottomMenu from '../components/BottomMenu';

export default function ProfileScreen() {
  // Estados para los switches interactivos de notificaciones
  const [smsReminders, setSmsReminders] = useState(true);
  const [exclusivePromos, setExclusivePromos] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 1. Header idéntico al que ya tienes en HomeScreen */}
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

        {/* 2. Tarjeta Principal de Perfil (Valentina Morales) */}
        <View style={styles.profileHeroCard}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop' }} 
              style={styles.heroAvatar} 
            />
            <TouchableOpacity style={styles.editAvatarBtn} activeOpacity={0.8}>
              <Feather name="edit-2" size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.userName}>Valentina Morales</Text>
            <MaterialCommunityIcons name="check-decagram" size={18} color="#8D5B4C" />
          </View>

          <View style={styles.vipBadge}>
            <View style={styles.vipDot} />
            <Text style={styles.vipText}>CLIENTE VERIFICADA VIP</Text>
          </View>

          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Feather name="phone" size={12} color={colors.textGray || '#7A7571'} />
              <Text style={styles.contactText}>+34 612 345 678</Text>
            </View>
            <View style={styles.contactRow}>
              <Feather name="mail" size={12} color={colors.textGray || '#7A7571'} />
              <Text style={styles.contactText}>valen.morales@example.com</Text>
            </View>
          </View>
        </View>

        {/* 3. Banner: Historial de Reservas */}
        <TouchableOpacity style={styles.historyBanner} activeOpacity={0.85}>
          <View style={styles.historyIconBox}>
            <MaterialCommunityIcons name="calendar-check-outline" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.historyInfo}>
            <View style={styles.historyTitleRow}>
              <Text style={styles.historyTitle}>Historial de Reservas</Text>
              <View style={styles.notificationDot} />
            </View>
            <Text style={styles.historySubtitle}>3 citas completadas • 1 próxima</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textDark || '#2C2623'} />
        </TouchableOpacity>

        {/* 4. Sección: Ubicaciones Guardadas */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Ubicaciones Guardadas</Text>
          <Text style={styles.sectionMeta}>1 activa</Text>
        </View>

        <View style={styles.cardItem}>
          <View style={styles.softIconBox}>
            <Feather name="home" size={18} color="#8D5B4C" />
          </View>
          <View style={styles.cardItemContent}>
            <View style={styles.titleTagRow}>
              <Text style={styles.cardItemTitle}>Casa</Text>
              <View style={styles.tagBeige}>
                <Text style={styles.tagBeigeText}>Principal</Text>
              </View>
            </View>
            <Text style={styles.cardItemSubtitle}>C/ Serrano 42, 3ºB, Madrid</Text>
            <View style={styles.accessNoteRow}>
              <Feather name="lock" size={10} color={colors.textGray || '#7A7571'} />
              <Text style={styles.accessNoteText}>Acceso con portero físico</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreIconBtn}>
            <Feather name="more-vertical" size={16} color={colors.textGray || '#7A7571'} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.dashedAddBtn} activeOpacity={0.7}>
          <Feather name="plus" size={15} color={colors.textDark || '#2C2623'} />
          <Text style={styles.dashedAddBtnText}>Añadir otra dirección</Text>
        </TouchableOpacity>

        {/* 5. Sección: Métodos de Pago */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Métodos de Pago</Text>
          <MaterialCommunityIcons name="shield-check-outline" size={16} color={colors.textGray || '#7A7571'} />
        </View>

        {/* Tarjeta Mastercard */}
        <TouchableOpacity style={styles.cardItem} activeOpacity={0.85}>
          <View style={styles.softIconBox}>
            <Feather name="credit-card" size={18} color="#8D5B4C" />
          </View>
          <View style={styles.cardItemContent}>
            <View style={styles.titleTagRow}>
              <Text style={styles.cardItemTitle}>Mastercard</Text>
              <View style={styles.tagRose}>
                <Text style={styles.tagRoseText}>Predeterminada</Text>
              </View>
            </View>
            <Text style={styles.cardItemSubtitle}>•••• 4821 • Expira 09/27</Text>
          </View>
          <Ionicons name="checkmark-circle" size={20} color="#8D5B4C" />
        </TouchableOpacity>

        {/* Apple Pay */}
        <TouchableOpacity style={[styles.cardItem, { marginTop: 10 }]} activeOpacity={0.85}>
          <View style={styles.softIconBox}>
            <MaterialCommunityIcons name="contactless-payment-circle-outline" size={20} color={colors.textDark || '#2C2623'} />
          </View>
          <View style={styles.cardItemContent}>
            <Text style={styles.cardItemTitle}>Apple Pay</Text>
            <Text style={styles.cardItemSubtitle}>Vinculado a Wallet</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textGray || '#7A7571'} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dashedAddBtn} activeOpacity={0.7}>
          <Feather name="plus" size={15} color={colors.textDark || '#2C2623'} />
          <Text style={styles.dashedAddBtnText}>Añadir método de pago</Text>
        </TouchableOpacity>

        {/* 6. Sección: Preferencias y Notificaciones */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Preferencias y Notificaciones</Text>
        </View>

        <View style={styles.preferencesGroupCard}>
          {/* Fila 1: SMS */}
          <View style={styles.preferenceRow}>
            <View style={styles.softIconBox}>
              <Feather name="message-square" size={17} color={colors.textDark || '#2C2623'} />
            </View>
            <View style={styles.preferenceInfo}>
              <Text style={styles.cardItemTitle}>Recordatorios por SMS</Text>
              <Text style={styles.cardItemSubtitle}>Avisos de tus citas 2h antes</Text>
            </View>
            <Switch
              value={smsReminders}
              onValueChange={setSmsReminders}
              trackColor={{ false: '#DFDAD4', true: '#C88D7C' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Fila 2: Promociones */}
          <View style={styles.preferenceRow}>
            <View style={styles.softIconBox}>
              <Feather name="tag" size={17} color={colors.textDark || '#2C2623'} />
            </View>
            <View style={styles.preferenceInfo}>
              <Text style={styles.cardItemTitle}>Promociones exclusivas</Text>
              <Text style={styles.cardItemSubtitle}>Ofertas flash y acceso anticipado</Text>
            </View>
            <Switch
              value={exclusivePromos}
              onValueChange={setExclusivePromos}
              trackColor={{ false: '#DFDAD4', true: '#C88D7C' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* 7. Botones Inferiores: Ayuda y Cerrar Sesión */}
        <TouchableOpacity style={styles.helpButton} activeOpacity={0.8}>
          <View style={styles.helpLeft}>
            <Feather name="headphones" size={17} color={colors.textDark || '#2C2623'} />
            <Text style={styles.helpButtonText}>Centro de Ayuda y Concierge</Text>
          </View>
          <Feather name="external-link" size={16} color={colors.textGray || '#7A7571'} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8}>
          <Feather name="log-out" size={16} color="#B93829" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Menú Inferior Fijo activado en Perfil */}
      <BottomMenu activeTab="Perfil" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background || '#FAF8F5',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },

  // 1. Header (Mismo estilo exacto de HomeScreen)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoBeauty: {
    fontSize: 32,
    fontStyle: 'italic',
    fontWeight: '300',
    color: colors.textDark || '#2C2623',
  },
  logoFlash: {
    fontSize: 32,
    fontWeight: '800',
    color: '#8D5B4C',
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F3EFEA',
  },

  // 2. Tarjeta Hero de Perfil
  profileHeroCard: {
    backgroundColor: colors.surface || '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  heroAvatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8D5B4C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textDark || '#2C2623',
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EFEA',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
    marginBottom: 14,
  },
  vipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8D5B4C',
  },
  vipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8D5B4C',
    letterSpacing: 0.5,
  },
  contactInfo: {
    alignItems: 'center',
    gap: 5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 12,
    color: colors.textGray || '#7A7571',
  },

  // 3. Banner Historial de Reservas
  historyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBE6E0',
    borderRadius: 18,
    padding: 14,
    marginBottom: 24,
    gap: 14,
  },
  historyIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#8D5B4C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark || '#2C2623',
  },
  notificationDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#C87D6B',
  },
  historySubtitle: {
    fontSize: 12,
    color: colors.textGray || '#7A7571',
    marginTop: 2,
  },

  // Encabezados de sección
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark || '#2C2623',
  },
  sectionMeta: {
    fontSize: 11,
    color: colors.textGray || '#7A7571',
    fontWeight: '500',
  },

  // Tarjetas de listas (Ubicaciones y Pagos)
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface || '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  softIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardItemContent: {
    flex: 1,
  },
  titleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark || '#2C2623',
  },
  cardItemSubtitle: {
    fontSize: 12,
    color: colors.textGray || '#7A7571',
  },
  tagBeige: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagBeigeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8D5B4C',
  },
  tagRose: {
    backgroundColor: '#F9E6E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagRoseText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B85D4B',
  },
  accessNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  accessNoteText: {
    fontSize: 11,
    color: colors.textGray || '#7A7571',
  },
  moreIconBtn: {
    padding: 4,
  },

  // Botón "+ Añadir..."
  dashedAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EFEA',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 24,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5DFD7',
  },
  dashedAddBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark || '#2C2623',
  },

  // 6. Preferencias y Notificaciones
  preferencesGroupCard: {
    backgroundColor: colors.surface || '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  preferenceInfo: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3EFEA',
  },

  // 7. Botones Inferiores (Ayuda y Cerrar Sesión)
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface || '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  helpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  helpButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark || '#2C2623',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5EFEA',
    borderRadius: 16,
    paddingVertical: 15,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B93829',
  },
});