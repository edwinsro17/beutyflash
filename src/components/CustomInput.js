import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function CustomInput({ 
  label, 
  iconName, 
  rightIconName, 
  onRightIconPress, 
  secureTextEntry,
  ...props 
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        {/* Icono izquierdo */}
        <Feather name={iconName} size={18} color={colors.textGray} style={styles.icon} />
        
        {/* Caja de texto */}
        <TextInput 
          style={styles.input}
          placeholderTextColor="#A9A4A1"
          secureTextEntry={secureTextEntry}
          {...props}
        />

        {/* Icono derecho (Opcional, ej: Ver contraseña) */}
        {rightIconName && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Feather name={rightIconName} size={18} color={colors.textGray} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  icon: {
    marginRight: 10,
  },
  rightIcon: {
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    height: '100%',
  },
});