/**
 * Archivo: src/components/ui/ValidationModal.js
 * Módulo 2.3 y 4.6: Sistema Reutilizable de Modales Elegantes de Validación y Estado
 * Reemplaza las alertas nativas inconsistentes con un diseño unificado y seguro:
 * - Icono representativo (Feather)
 * - Título corto y jerarquía clara
 * - Mensaje comprensible (nunca revela datos privados ni permite enumeración de cuentas)
 * - Botón de acción principal y acción secundaria opcional (ej. "Ir a recargar saldo")
 * - Animación sutil de entrada (fade + scale)
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/palette';

const VARIANT_CONFIG = {
  error: {
    icon: 'alert-circle',
    iconBg: '#FDEDEC',
    iconColor: '#C0392B',
    btnBg: colors.primary,
  },
  warning: {
    icon: 'alert-triangle',
    iconBg: '#FEF5E7',
    iconColor: '#D68910',
    btnBg: colors.primary,
  },
  insufficient_balance: {
    icon: 'credit-card',
    iconBg: '#FDEDEC',
    iconColor: '#C0392B',
    btnBg: '#1E824C',
  },
  success: {
    icon: 'check-circle',
    iconBg: '#E8F6EF',
    iconColor: '#1E824C',
    btnBg: '#1E824C',
  },
  info: {
    icon: 'shield',
    iconBg: '#F3EFEA',
    iconColor: colors.primary,
    btnBg: colors.primary,
  },
};

export default function ValidationModal({
  visible = false,
  variant = 'info',
  title = 'Información',
  message = '',
  primaryText = 'Entendido',
  onPrimaryPress = null,
  secondaryText = null,
  onSecondaryPress = null,
  onClose = null,
}) {
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible) return null;

  const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.info;
  const handleMain = () => {
    if (onPrimaryPress) onPrimaryPress();
    else if (onClose) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose || handleMain}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: cfg.iconBg }]}>
            <Feather name={cfg.icon} size={26} color={cfg.iconColor} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: cfg.btnBg }]}
            onPress={handleMain}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>{primaryText}</Text>
          </TouchableOpacity>

          {secondaryText ? (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onSecondaryPress || onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>{secondaryText}</Text>
            </TouchableOpacity>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 23, 21, 0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13.5,
    color: colors.textGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  flexShrink: 1 },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryBtnText: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '700',
  flexShrink: 1 },
});
