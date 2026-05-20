import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/theme';
import { JobCard } from '../components/JobCard';
import { StatCard } from '../components/StatCard';
import { getErrorMessage, getProjectId, normalizeProfile, normalizeProjects } from '../utils/workerData';

export const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [profileName, setProfileName] = useState('');
  const [activeTab, setActiveTab] = useState<'recommended' | 'myJobs' | 'saved'>('recommended');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; timeAgo: number }>>([]);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      const [dashboardResponse, profileResponse] = await Promise.all([
        api.get('/worker/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/worker/profile', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const recommended = normalizeProjects(dashboardResponse.data.recommendedJobs || []);
      const applied = normalizeProjects(dashboardResponse.data.appliedJobs || []);
      const saved = normalizeProjects(dashboardResponse.data.savedJobs || []);
      const profile = normalizeProfile(profileResponse.data.profile || {});

      setRecommendedJobs(recommended);
      setMyJobs(applied);
      setSavedJobs(saved);
      setProfileName(profile.name);
      setNotifications(
        recommended.slice(0, 3).map((job, index) => ({
          id: `${job.id}-${index}`,
          title: job.title,
          timeAgo: index * 8,
        })),
      );
    } catch (error: any) {
      Alert.alert(t('error'), getErrorMessage(error, t('failedToLoad')));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard]),
  );

  const toggleSave = async (projectId: string) => {
    if (!token) return;

    try {
      await api.post(
        `/worker/dashboard/save/${projectId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchDashboard();
    } catch (error: any) {
      Alert.alert(t('error'), getErrorMessage(error, t('failedToLoad')));
    }
  };

  const applyToJob = async (projectId: string) => {
    if (!token) return;

    try {
      await api.post(
        `/worker/dashboard/apply/${projectId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchDashboard();
    } catch (error: any) {
      Alert.alert(t('error'), getErrorMessage(error, t('failedToLoad')));
    }
  };

  const savedIds = useMemo(() => new Set(savedJobs.map((job) => getProjectId(job))), [savedJobs]);
  const appliedIds = useMemo(() => new Set(myJobs.map((job) => getProjectId(job))), [myJobs]);

  const jobsToRender =
    activeTab === 'recommended' ? recommendedJobs : activeTab === 'myJobs' ? myJobs : savedJobs;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.hero}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroLabel}>{t('hello')}</Text>
            <Text style={styles.heroName}>{profileName || t('worker')}</Text>
          </View>
          <Pressable onPress={() => setShowNotifications((current) => !current)} style={styles.notificationBubble}>
            <Ionicons color="#FFFFFF" name="notifications-outline" size={22} />
            {notifications.length > 0 ? (
              <View style={styles.notificationCount}>
                <Text style={styles.notificationCountLabel}>{notifications.length}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <StatCard label={t('jobsApplied')} value={myJobs.length} />
        <StatCard label={t('activeJobs')} value={myJobs.filter((job) => ['accepted', 'approved'].includes(job.applicationStatus?.toLowerCase() || '')).length} />
      </View>

      <View style={styles.quickRow}>
        <Pressable onPress={() => navigation.navigate('SkillTips')} style={styles.quickCard}>
          <Ionicons color={colors.accent} name="bulb-outline" size={24} />
          <Text style={styles.quickLabel}>{t('skillTips')}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Earnings')} style={styles.quickCard}>
          <Ionicons color={colors.primary} name="trending-up-outline" size={24} />
          <Text style={styles.quickLabel}>{t('earningsTracker')}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Help')} style={styles.quickCard}>
          <Ionicons color={colors.danger} name="help-circle-outline" size={24} />
          <Text style={styles.quickLabel}>{t('helpCenter')}</Text>
        </Pressable>
      </View>

      {showNotifications ? (
        <View style={styles.noticePanel}>
          <View style={styles.noticeHeader}>
            <Text style={styles.sectionTitle}>{t('notifications')}</Text>
            <Pressable onPress={() => setNotifications([])}>
              <Text style={styles.clearText}>{t('markAllRead')}</Text>
            </Pressable>
          </View>
          {notifications.length === 0 ? (
            <Text style={styles.emptyLabel}>{t('noData')}</Text>
          ) : (
            notifications.map((item) => (
              <View key={item.id} style={styles.noticeCard}>
                <Text style={styles.noticeTitle}>{item.title}</Text>
                <Text style={styles.noticeTime}>
                  {item.timeAgo === 0 ? t('justNow') : `${item.timeAgo} ${t('minutesAgo')}`}
                </Text>
              </View>
            ))
          )}
        </View>
      ) : null}

      <Pressable onPress={() => navigation.navigate('Jobs')} style={styles.findJobsCta}>
        <Ionicons color="#FFFFFF" name="search-outline" size={20} />
        <Text style={styles.findJobsLabel}>{t('findJobs')}</Text>
      </Pressable>

      <View style={styles.tabRow}>
        {[
          { key: 'recommended', label: t('recommendedJobs') },
          { key: 'myJobs', label: t('myJobs') },
          { key: 'saved', label: t('savedJobs') },
        ].map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setActiveTab(item.key as 'recommended' | 'myJobs' | 'saved')}
            style={[styles.tabChip, activeTab === item.key && styles.tabChipActive]}
          >
            <Text style={[styles.tabChipText, activeTab === item.key && styles.tabChipTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <Text style={styles.emptyLabel}>{t('loading')}...</Text>
      ) : jobsToRender.length === 0 ? (
        <Text style={styles.emptyLabel}>{t('noJobsFound')}</Text>
      ) : (
        jobsToRender.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            t={t}
            isSaved={savedIds.has(job.id)}
            isApplied={appliedIds.has(job.id)}
            onSave={() => toggleSave(job.id)}
            onApply={() => applyToJob(job.id)}
            status={job.applicationStatus?.toLowerCase()}
            showMap={['accepted', 'approved'].includes(job.applicationStatus?.toLowerCase() || '')}
            onChat={['accepted', 'approved'].includes(job.applicationStatus?.toLowerCase() || '') ? () => navigation.navigate('Chat', { jobId: job.id, contractorId: job.raw?.contractorId?._id || job.raw?.contractorId || job.contractorName, projectName: job.title }) : undefined}
          />
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  hero: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 26,
    paddingHorizontal: 20,
    paddingTop: 70,
  },
  heroRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 15,
    fontWeight: '600',
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 8,
  },
  notificationBubble: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 18,
    padding: 12,
  },
  notificationCount: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -4,
    top: -4,
    width: 20,
  },
  notificationCountLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: -18,
    paddingHorizontal: 20,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 18,
    paddingHorizontal: 20,
  },
  quickCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    padding: 16,
  },
  quickLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  noticePanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
  },
  noticeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  clearText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  noticeCard: {
    backgroundColor: '#F8F6F0',
    borderRadius: 18,
    marginTop: 12,
    padding: 14,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  noticeTime: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 6,
  },
  findJobsCta: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 18,
    paddingVertical: 16,
  },
  findJobsLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 22,
  },
  tabChip: {
    backgroundColor: '#E7E0D4',
    borderRadius: 999,
    flex: 1,
    paddingVertical: 12,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
  },
  tabChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  emptyLabel: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 18,
    textAlign: 'center',
  },
});
