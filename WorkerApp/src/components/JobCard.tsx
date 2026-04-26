import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { PrimaryButton } from './PrimaryButton';

interface JobCardProps {
  job: any;
  t: (key: string) => string;
  isSaved?: boolean;
  isApplied?: boolean;
  onApply?: () => void;
  onSave?: () => void;
  status?: string;
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  accepted: { bg: '#DCFCE7', text: colors.success },
  rejected: { bg: '#FEE2E2', text: colors.danger },
  pending: { bg: '#FEF3C7', text: '#B45309' },
};

export const JobCard = ({ job, t, isSaved, isApplied, onApply, onSave, status }: JobCardProps) => {
  const badge = status ? statusStyles[status] ?? statusStyles.pending : null;
  const title = job.title || job.projectTitle || 'Untitled Project';
  const contractor = job.contractorName || job.contractorId?.name || job.contractor || '';
  const image = job.image || job.images?.[0];
  const facilities = job.facilities || {};

  return (
    <View style={styles.card}>
      {image ? <Image source={{ uri: image }} style={styles.image} /> : null}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{contractor}</Text>
          </View>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeLabel, { color: badge.text }]}>
                {status === 'accepted'
                  ? t('applicationAccepted')
                  : status === 'rejected'
                    ? t('applicationRejected')
                    : t('applicationPending')}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.metaWrap}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={16} color={colors.muted} />
            <Text style={styles.metaText}>{job.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="currency-inr" size={16} color={colors.primary} />
            <Text style={styles.priceText}>
              {job.wage || 0}
              {t('perDay')}
            </Text>
          </View>
          {job.durationDays ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={colors.muted} />
              <Text style={styles.metaText}>
                {job.durationDays} {t('days')}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.facilityRow}>
          {facilities.food || job.food ? (
            <View style={[styles.facilityChip, { backgroundColor: colors.chipAccent }]}>
              <Text style={styles.facilityText}>{t('food')}</Text>
            </View>
          ) : null}
          {facilities.accommodation || job.accommodation ? (
            <View style={styles.facilityChip}>
              <Text style={styles.facilityText}>{t('accommodation')}</Text>
            </View>
          ) : null}
          {facilities.insurance || job.insurance ? (
            <View style={styles.facilityChip}>
              <Text style={styles.facilityText}>{t('insurance')}</Text>
            </View>
          ) : null}
        </View>

        {onApply ? (
          <View style={styles.actions}>
            <PrimaryButton
              title={isApplied ? t('applied') : t('apply')}
              onPress={onApply}
              disabled={isApplied}
            />
            {onSave ? (
              <PrimaryButton
                title={isSaved ? t('saved') : t('save')}
                onPress={onSave}
                variant="outline"
              />
            ) : null}
          </View>
        ) : onSave ? (
          <Pressable onPress={onSave} style={styles.saveOnly}>
            <Text style={styles.saveOnlyText}>{isSaved ? t('saved') : t('save')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    height: 170,
    width: '100%',
  },
  content: {
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 12,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  metaText: {
    color: colors.muted,
    fontSize: 14,
  },
  priceText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  facilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  facilityChip: {
    backgroundColor: colors.chip,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  facilityText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    gap: 10,
    marginTop: 16,
  },
  saveOnly: {
    marginTop: 12,
  },
  saveOnlyText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
