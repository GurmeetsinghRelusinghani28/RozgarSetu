import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../constants/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'solid' | 'outline';
}

export const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'solid',
}: PrimaryButtonProps) => {
  const isOutline = variant === 'outline';

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isOutline ? styles.outlineButton : styles.solidButton,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : '#FFFFFF'} />
      ) : (
        <Text style={[styles.label, isOutline ? styles.outlineLabel : styles.solidLabel]}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
  },
  solidButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  outlineButton: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
  },
  solidLabel: {
    color: '#FFFFFF',
  },
  outlineLabel: {
    color: colors.primary,
  },
});
