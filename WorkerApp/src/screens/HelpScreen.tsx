import React from 'react';
import { LayoutAnimation, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../contexts/LanguageContext';
import { SUPPORT_PHONE } from '../constants/config';
import { colors } from '../constants/theme';

export const HelpScreen = () => {
  const { t } = useLanguage();
  const [openQuestion, setOpenQuestion] = React.useState<string | null>(null);

  const faqs = [
    { question: t('faqQ1'), answer: t('faqA1') },
    { question: t('faqQ2'), answer: t('faqA2') },
    { question: t('faqQ3'), answer: t('faqA3') },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.hero}>
        <Text style={styles.heroHeading}>{t('helpCenter')}</Text>
      </LinearGradient>

      <Pressable onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} style={styles.callButton}>
        <Ionicons color="#FFFFFF" name="call-outline" size={22} />
        <Text style={styles.callButtonLabel}>{t('callSupport')}</Text>
      </Pressable>

      <Text style={styles.sectionHeading}>{t('faq')}</Text>
      {faqs.map((faq) => (
        <Pressable
          key={faq.question}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setOpenQuestion((current) => (current === faq.question ? null : faq.question));
          }}
          style={styles.faqCard}
        >
          <View style={styles.faqHeader}>
            <View style={styles.faqTitleRow}>
              <Ionicons color={colors.primary} name="help-circle-outline" size={18} />
              <Text style={styles.question}>{faq.question}</Text>
            </View>
            <Ionicons
              color={colors.muted}
              name={openQuestion === faq.question ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={18}
            />
          </View>
          {openQuestion === faq.question ? <Text style={styles.answer}>{faq.answer}</Text> : null}
        </Pressable>
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
    paddingBottom: 22,
    paddingHorizontal: 20,
    paddingTop: 64,
  },
  heroHeading: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  callButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
  },
  callButtonLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  sectionHeading: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 26,
    paddingHorizontal: 20,
  },
  faqCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 16,
  },
  faqHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  faqTitleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    paddingRight: 12,
  },
  question: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  answer: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
});
