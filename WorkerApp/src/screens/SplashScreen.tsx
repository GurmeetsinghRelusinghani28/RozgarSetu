import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

export const SplashScreen = () => {
  return (
    <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.container}>
      <View style={styles.logo}>
        <Ionicons name="hammer-outline" size={42} color={colors.primaryDark} />
      </View>
      <Text style={styles.title}>RozgarSetu</Text>
      <Text style={styles.nativeTitle}>रोजगारसेतु</Text>
      <Text style={styles.subtitle}>Connecting Workers & Contractors</Text>
      <ActivityIndicator color="#FFFFFF" style={styles.loader} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 28,
    height: 96,
    justifyContent: 'center',
    marginBottom: 22,
    width: 96,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
  },
  nativeTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 16,
    marginTop: 14,
  },
  loader: {
    marginTop: 32,
  },
});
