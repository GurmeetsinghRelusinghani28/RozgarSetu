import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { RootStackParamList } from '../navigation/RootNavigator';
import { getErrorMessage, normalizeProfile } from '../utils/workerData';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { token, logout } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await api.get('/worker/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(normalizeProfile(response.data.profile || null));
    } catch (error: any) {
      Alert.alert(t('error'), getErrorMessage(error, t('failedToLoad')));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  const reviews = profile?.reviews || [];
  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }, [reviews]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>{profile?.name?.charAt(0) || 'W'}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{profile?.name || t('workerProfile')}</Text>
          <Text style={styles.rating}>
            {averageRating} • {reviews.length} {t('reviews')}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('workerProfile')}</Text>
        <View style={styles.infoRow}>
          <Ionicons color={colors.primary} name="briefcase-outline" size={18} />
          <Text style={styles.infoText}>
            {t('experience')}: {profile?.experience ?? 0} {t('years')}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons color={colors.accent} name="cash-outline" size={18} />
          <Text style={styles.infoText}>
            {t('expectedWage')}: {profile?.expectedWage ?? 0}
            {t('perDay')}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons color={colors.muted} name="location-outline" size={18} />
          <Text style={styles.infoText}>
            {t('city')}: {profile?.city || '-'}
          </Text>
        </View>

        <Text style={[styles.cardTitle, { marginTop: 18 }]}>{t('skillsLabel')}</Text>
        <View style={styles.skillsWrap}>
          {(profile?.skills || []).map((skill: string) => (
            <View key={skill} style={styles.skillChip}>
              <Text style={styles.skillText}>{t(skill)}</Text>
            </View>
          ))}
        </View>
      </View>

      <PrimaryButton title={t('edit')} onPress={() => navigation.navigate('ProfileSetup')} variant="outline" />

      <Text style={styles.reviewHeading}>{t('reviews')}</Text>
      {loading ? <Text style={styles.emptyText}>{t('loading')}...</Text> : null}
      {!loading && reviews.length === 0 ? <Text style={styles.emptyText}>{t('noRatingsYet')}</Text> : null}
      {reviews.map((review: any) => (
        <View key={review._id || `${review.contractorId?.name}-${review.createdAt}`} style={styles.reviewCard}>
          <Text style={styles.reviewAuthor}>{review.contractorId?.name || 'Contractor'}</Text>
          <Text style={styles.reviewScore}>{review.rating}/5</Text>
          {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
        </View>
      ))}

      <Pressable onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutLabel}>{t('logout')}</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 64,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 20,
    padding: 18,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarLabel: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  headerText: {
    marginLeft: 14,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  rating: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  infoText: {
    color: colors.text,
    fontSize: 15,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillChip: {
    backgroundColor: colors.chip,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skillText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewHeading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    marginTop: 22,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  reviewAuthor: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  reviewScore: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  reviewComment: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 8,
  },
  logoutButton: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 14,
  },
  logoutLabel: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
  },
});
