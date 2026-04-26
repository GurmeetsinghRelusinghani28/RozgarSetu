import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type DimensionValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { RootStackParamList } from '../navigation/RootNavigator';
import { getErrorMessage, normalizeProfile } from '../utils/workerData';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

const skills = [
  { key: 'mason', icon: 'apps-outline' as const },
  { key: 'carpenter', icon: 'hammer-outline' as const },
  { key: 'electrician', icon: 'flash-outline' as const },
  { key: 'painter', icon: 'color-fill-outline' as const },
  { key: 'helper', icon: 'hand-left-outline' as const },
  { key: 'plumber', icon: 'water-outline' as const },
  { key: 'welder', icon: 'flame-outline' as const },
  { key: 'driver', icon: 'car-outline' as const },
];

export const ProfileSetupScreen = ({ navigation }: Props) => {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState(1);
  const [city, setCity] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const response = await api.get('/worker/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success && response.data.profile) {
          const profile = normalizeProfile(response.data.profile);
          setName(profile.name || '');
          setSelectedSkills(profile.skills || []);
          setExperience(profile.experience > 0 ? profile.experience : 1);
          setCity(profile.city || '');
        }
      } catch {
        // Let the worker continue with a blank form if no profile exists yet.
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((item) => item !== skill) : [...prev, skill],
    );
  };

  const saveProfile = async () => {
    if (!token) return;

    try {
      setLoading(true);
      await api.post(
        '/worker/profile',
        { name: name.trim(), skills: selectedSkills, experience, city: city.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      Alert.alert(t('appName'), t('profileSaved'));
      navigation.replace('WorkerTabs');
    } catch (error: any) {
      Alert.alert(t('error'), getErrorMessage(error, t('failedToLoad')));
    } finally {
      setLoading(false);
    }
  };

  const canContinue =
    (step === 0 && !!name.trim()) ||
    (step === 1 && selectedSkills.length > 0) ||
    step === 2 ||
    (step === 3 && !!city.trim());

  const steps = [t('yourName'), t('selectSkills'), t('experience'), t('city')];
  const progress = `${Math.round(((step + 1) / steps.length) * 100)}%` as DimensionValue;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('createProfile')}</Text>
      <Text style={styles.stepText}>{steps[step]}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: progress }]} />
      </View>

      {step === 0 ? (
        <View style={styles.section}>
          <Text style={styles.label}>{t('yourName')}</Text>
          <TextInput
            placeholder={t('enterName')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.section}>
          <Text style={styles.label}>{t('selectSkills')}</Text>
          <View style={styles.skillGrid}>
            {skills.map((skill) => {
              const selected = selectedSkills.includes(skill.key);
              return (
                <Pressable
                  key={skill.key}
                  onPress={() => toggleSkill(skill.key)}
                  style={[styles.skillChip, selected && styles.skillChipSelected]}
                >
                  <Ionicons
                    color={selected ? '#FFFFFF' : colors.primary}
                    name={skill.icon}
                    size={24}
                    style={styles.skillIcon}
                  />
                  <Text style={[styles.skillChipText, selected && styles.skillChipTextSelected]}>
                    {t(skill.key)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.section}>
          <Text style={styles.label}>{t('experience')}</Text>
          <View style={styles.counterRow}>
            <Pressable onPress={() => setExperience((prev) => Math.max(1, prev - 1))} style={styles.counterButton}>
              <Text style={styles.counterText}>-</Text>
            </Pressable>
            <Text style={styles.experienceValue}>{experience}</Text>
            <Pressable onPress={() => setExperience((prev) => Math.min(30, prev + 1))} style={styles.counterButton}>
              <Text style={styles.counterText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.caption}>{t('years')}</Text>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.section}>
          <Text style={styles.label}>{t('city')}</Text>
          <TextInput
            placeholder={t('enterCity')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={city}
            onChangeText={setCity}
          />
        </View>
      ) : null}

      <View style={styles.footer}>
        {step > 0 ? <PrimaryButton title={t('back')} onPress={() => setStep((prev) => prev - 1)} variant="outline" /> : null}
        <PrimaryButton
          title={step === steps.length - 1 ? t('done') : t('next')}
          onPress={() => (step === steps.length - 1 ? saveProfile() : setStep((prev) => prev + 1))}
          disabled={!canContinue}
          loading={loading}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 72,
  },
  heading: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  stepText: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 8,
  },
  progressTrack: {
    backgroundColor: '#E5DED2',
    borderRadius: 999,
    height: 10,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: '100%',
  },
  section: {
    marginTop: 28,
  },
  label: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.text,
    fontSize: 17,
    height: 54,
    paddingHorizontal: 16,
  },
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 94,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '47.5%',
  },
  skillChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  skillIcon: {
    marginBottom: 8,
  },
  skillChipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  skillChipTextSelected: {
    color: '#FFFFFF',
  },
  counterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  counterButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderRadius: 22,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  counterText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  experienceValue: {
    color: colors.text,
    fontSize: 48,
    fontWeight: '900',
    marginHorizontal: 28,
  },
  caption: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    gap: 12,
    marginTop: 36,
  },
});
