import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

export const StatCard = ({ label, value }: { label: string; value: string | number }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    padding: 18,
  },
  value: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  label: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
});
