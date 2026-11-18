/**
 * Archivo: src/components/ui/ModeSwitcherBanner.js
 * Módulo 1.3 y 1.4: Selector de Modalidad (Modo Cliente <-> Modo Profesional) Sin Cerrar Sesión
 * - Diseño adaptable para iOS y Android con `flexShrink: 1` y `flexWrap: 'wrap'` para que ningún texto se desborde.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/palette';
import { sessionStore } from '../../services/sessionStore';
import { cambiarModalidadSinCerrarSesion } from '../../services/sessionService';
import ValidationModal from './ValidationModal';

export default function ModeSwitcherBanner({ navigation, currentMode = 'cliente' }) {
  const [cambiando, setCambiando] = useState(false);
  const [modalInfo, setModalInfo] = useState({ visible: false, title: '', message: '' });

  const rolesUsuario = sessionStore.roles || ['CLIENT'];
  const tieneRolPro =
    rolesUsuario.includes('PROFESSIONAL') ||
    Boolean(sessionStore.proUser?.id || sessionStore.proUser?.usuario_id);
  const estadoAprobacion =
    sessionStore.proUser?.approval_status ||
    (sessionStore.proUser?.estado_verificacion === 'aprobado' ? 'APPROVED' : 'INCOMPLETE');

  const handleSwitch = async (target) => {
    if (target === currentMode || cambiando) return;

    if (target === 'profesional' && !tieneRolPro) {
      navigation.navigate('ModeSelector', { openUpgradeForm: true });
      return;
    }

    setCambiando(true);
    try {
      const res = await cambiarModalidadSinCerrarSesion(target, navigation);
      if (!res?.exito && res?.requiere_registro_profesional) {
        navigation.navigate('ModeSelector', { openUpgradeForm: true });
      }
    } catch (err) {
      setModalInfo({
        visible: true,
        title: 'No fue posible cambiar de modo',
        message: err.message || 'Inténtalo nuevamente en unos segundos.',
      });
    } finally {
      setCambiando(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <Feather name="repeat" size={13} color={colors.primary} />
          <Text style={styles.label} numberOfLines={1}>
            CAMBIO DE MODO INSTANTÁNEO
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('ModeSelector')}
          style={styles.manageBtn}
        >
          <Text style={styles.manageLink}>Configurar</Text>
          <Feather name="chevron-right" size={13} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.switchTrack}>
        <TouchableOpacity
          style={[styles.modeBtn, currentMode === 'cliente' && styles.modeBtnActive]}
          onPress={() => handleSwitch('cliente')}
          disabled={cambiando}
          activeOpacity={0.85}
        >
          <Feather
            name="user"
            size={14}
            color={currentMode === 'cliente' ? '#FFFFFF' : colors.textDark}
          />
          <Text
            style={[
              styles.modeBtnText,
              currentMode === 'cliente' && styles.modeBtnTextActive,
            ]}
            numberOfLines={1}
          >
            Modo Cliente
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeBtn, currentMode === 'profesional' && styles.modeBtnActive]}
          onPress={() => handleSwitch('profesional')}
          disabled={cambiando}
          activeOpacity={0.85}
        >
          {cambiando ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather
                name="briefcase"
                size={14}
                color={currentMode === 'profesional' ? '#FFFFFF' : colors.textDark}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  currentMode === 'profesional' && styles.modeBtnTextActive,
                ]}
                numberOfLines={1}
              >
                {tieneRolPro ? 'Modo Profesional' : 'Ofrecer Servicios'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {tieneRolPro && currentMode === 'profesional' && estadoAprobacion !== 'APPROVED' ? (
        <View style={styles.approvalNotice}>
          <Feather name="shield" size={14} color="#D68910" />
          <Text style={styles.approvalNoticeText}>
            Perfil en estado {estadoAprobacion}. Completa tu verificación para publicar servicios.
          </Text>
        </View>
      ) : null}

      <ValidationModal
        visible={modalInfo.visible}
        variant="warning"
        title={modalInfo.title}
        message={modalInfo.message}
        onClose={() => setModalInfo({ visible: false, title: '', message: '' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#1F1A17',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  badgeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    flexShrink: 1,
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2,
  },
  manageLink: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.secondary,
  },
  switchTrack: {
    flexDirection: 'row',
    backgroundColor: '#EBE6E0',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
  },
  modeBtnText: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
  },
  approvalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF5E7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
  },
  approvalNoticeText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#9A6700',
    lineHeight: 16,
  },
});
