/**
 * Archivo: src/components/CustomInput.js
 * Campo de formulario adaptable para iOS y Android:
 * - Usa `minHeight` y `paddingVertical` en lugar de alturas rígidas para nunca cortar el texto.
 * - Incluye `flexShrink: 1` en las etiquetas para evitar desbordamientos en pantallas compactas.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/palette';

export default function CustomInput({
  label,
  iconName,
  rightIconName,
  onRightIconPress,
  secureTextEntry,
  ...props
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.inputContainer, focused && styles.inputContainerFocused]}>
        {iconName ? (
          <Feather
            name={iconName}
            size={18}
            color={focused ? colors.primary : colors.textGray}
            style={styles.icon}
          />
        ) : null}

        <TextInput
          style={styles.input}
          placeholderTextColor="#9E9690"
          secureTextEntry={secureTextEntry}
          allowFontScaling={false}
          onFocus={(e) => {
            setFocused(true);
            if (props.onFocus) props.onFocus(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            if (props.onBlur) props.onBlur(e);
          }}
          {...props}
        />

        {rightIconName ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name={rightIconName} size={18} color={colors.textGray} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    width: '100%',
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 6,
    lineHeight: 17,
    flexShrink: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFDFB',
  },
  icon: {
    marginRight: 10,
  },
  rightIcon: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    paddingVertical: Platform.OS === 'android' ? 4 : 0,
    textAlignVertical: 'center',
  },
});