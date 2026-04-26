import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/theme';
import { StatCard } from '../components/StatCard';

export const EarningsScreen = () => {
  const { t } = useLanguage();

  const earnings = [
    { label: t('thisMonth'), value: '18,400' },
    { label: t('lastMonth'), value: '22,000' },
  ];

  const recentPayments = [
    { job: 'Building Construction', amount: '4,800', days: 6, date: '2026-02-10' },
    { job: 'House Painting', amount: '4,200', days: 7, date: '2026-02-03' },
    { job: 'Electrical Wiring', amount: '9,000', days: 10, date: '2026-01-20' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.hero}>
        <Text style={styles.heroHeading}>{t('earningsTracker')}</Text>
      </LinearGradient>

      <View style={styles.statsRow}>
        {earnings.map((item) => (
          <StatCard key={item.label} label={item.label} value={`Rs ${item.value}`} />
        ))}
      </View>

      <Text style={styles.sectionHeading}>{t('recentJobs')}</Text>
      {recentPayments.map((payment) => (
        <View key={`${payment.job}-${payment.date}`} style={styles.paymentCard}>
          <View>
            <Text style={styles.jobTitle}>{payment.job}</Text>
            <Text style={styles.subtext}>
              {payment.days} {t('days')} • {payment.date}
            </Text>
          </View>
          <View style={styles.amountWrap}>
            <Ionicons color={colors.accent} name="trending-up-outline" size={18} />
            <Text style={styles.amount}>Rs {payment.amount}</Text>
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
    paddingBottom: 22,
    paddingHorizontal: 20,
    paddingTop: 64,
  },
  heroHeading: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: -18,
    paddingHorizontal: 20,
  },
  sectionHeading: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
    marginTop: 28,
    paddingHorizontal: 20,
  },
  paymentCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginHorizontal: 20,
    padding: 16,
  },
  jobTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  subtext: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 6,
  },
  amountWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  amount: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: '800',
  },
});
