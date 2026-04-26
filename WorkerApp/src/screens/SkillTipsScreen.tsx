import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/theme';

export const SkillTipsScreen = () => {
  const { t } = useLanguage();

  const tips = [
    { icon: 'bulb-outline', title: t('tipTitle1'), description: t('tipDesc1'), color: colors.accent },
    { icon: 'shield-checkmark-outline', title: t('tipTitle2'), description: t('tipDesc2'), color: colors.primary },
    { icon: 'wallet-outline', title: t('tipTitle3'), description: t('tipDesc3'), color: colors.danger },
  ] as const;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.hero}>
        <Text style={styles.heroHeading}>{t('skillTips')}</Text>
      </LinearGradient>

      {tips.map((tip) => (
        <View key={tip.title} style={styles.card}>
          <Ionicons color={tip.color} name={tip.icon} size={26} />
          <View style={styles.textWrap}>
            <Text style={styles.title}>{tip.title}</Text>
            <Text style={styles.description}>{tip.description}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  hero: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 18,
    paddingBottom: 22,
    paddingHorizontal: 20,
    paddingTop: 64,
  },
  heroHeading: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
    marginHorizontal: 20,
    padding: 18,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
});
