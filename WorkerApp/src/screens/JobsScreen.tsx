import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/theme';
import { JobCard } from '../components/JobCard';
import { getErrorMessage, getProjectId, normalizeProjects } from '../utils/workerData';

const skillFilters = ['allSkills', 'mason', 'carpenter', 'electrician', 'painter', 'helper', 'plumber'];

export const JobsScreen = () => {
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  const { t } = useLanguage();
  const [searchText, setSearchText] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('allSkills');
  const [jobs, setJobs] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isApplying, setIsApplying] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (searchText.trim()) params.search = searchText.trim();
      if (selectedSkill !== 'allSkills') params.skill = selectedSkill;

      const response = await api.get('/projects', { params });
      setJobs(normalizeProjects(response.data.projects || []));
    } catch (error: any) {
      Alert.alert(t('error'), getErrorMessage(error, t('failedToLoad')));
    } finally {
      setLoading(false);
    }
  }, [searchText, selectedSkill, t]);

  const fetchWorkerDashboard = useCallback(async () => {
    if (!token) return;

    try {
      const response = await api.get('/worker/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedJobs(normalizeProjects(response.data.savedJobs || []));
      setAppliedJobs(normalizeProjects(response.data.appliedJobs || []));
    } catch {
      // Keep the jobs screen usable even if dashboard lookup fails.
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchWorkerDashboard();
    }, [fetchWorkerDashboard]),
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const applyToJob = async (projectId: string) => {
    if (!token) {
      Alert.alert(t('error'), t('loginRequired'));
      return;
    }

    setIsApplying(projectId);

    try {
      await api.post(
        `/projects/${projectId}/apply`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // Re-fetch to update isApplied/isRejected visual state
      fetchWorkerDashboard();
      fetchJobs();
    } catch (error: any) {
      Alert.alert(t('error'), getErrorMessage(error, t('failedToLoad')));
    } finally {
      setIsApplying(null);
    }
  };

  const toggleSave = async (projectId: string) => {
    if (!token) return;

    try {
      await api.post(
        `/worker/dashboard/save/${projectId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchWorkerDashboard();
    } catch (error: any) {
      Alert.alert(t('error'), getErrorMessage(error, t('failedToLoad')));
    }
  };

  const appliedJobsMap = useMemo(() => {
    const map = new Map<string, any>();
    appliedJobs.forEach((job) => map.set(job.id, job));
    return map;
  }, [appliedJobs]);

  const savedIds = useMemo(() => new Set(savedJobs.map((job) => getProjectId(job))), [savedJobs]);
  const appliedIds = useMemo(() => new Set(appliedJobs.map((job) => getProjectId(job))), [appliedJobs]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.hero}>
        <Text style={styles.heroHeading}>{t('findJobs')}</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={20} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            placeholder={t('search')}
            placeholderTextColor={colors.muted}
            style={styles.search}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={fetchJobs}
          />
        </View>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroller}>
        {skillFilters.map((skill) => (
          <Pressable
            key={skill}
            onPress={() => setSelectedSkill(skill)}
            style={[styles.filterChip, selectedSkill === skill && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, selectedSkill === skill && styles.filterTextActive]}>{t(skill)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <Text style={styles.infoText}>{t('loading')}...</Text>
      ) : jobs.length === 0 ? (
        <Text style={styles.infoText}>{t('noJobsFound')}</Text>
      ) : (
        jobs.map((job) => {
          const appliedJob = appliedJobsMap.get(job.id);
          const status = appliedJob?.applicationStatus?.toLowerCase();
          const isAccepted = ['accepted', 'approved'].includes(status || '');

          return (
            <JobCard
              key={job.id}
              job={job}
              t={t}
              isSaved={savedIds.has(job.id)}
              isApplied={appliedIds.has(job.id)}
              isApplying={isApplying === job.id}
              onSave={() => toggleSave(job.id)}
              onApply={() => applyToJob(job.id)}
              status={status}
              showMap={isAccepted}
              onChat={isAccepted ? () => navigation.navigate('Chat', { 
                jobId: job.id, 
                contractorId: job.raw?.contractorId?._id || job.raw?.contractorId, 
                projectName: job.title 
              }) : undefined}
            />
          );
        })
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
  searchWrap: {
    justifyContent: 'center',
    marginTop: 18,
  },
  searchIcon: {
    left: 16,
    position: 'absolute',
    zIndex: 1,
  },
  search: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    color: colors.text,
    fontSize: 16,
    height: 52,
    paddingHorizontal: 46,
  },
  filterScroller: {
    marginBottom: 18,
    marginLeft: 20,
    marginTop: 16,
  },
  filterChip: {
    backgroundColor: '#E7E0D4',
    borderRadius: 999,
    marginRight: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  infoText: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 16,
    textAlign: 'center',
  },
});
