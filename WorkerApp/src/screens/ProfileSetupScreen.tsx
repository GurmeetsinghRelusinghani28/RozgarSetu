import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type DimensionValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
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

  // AI Voice Assistant States
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiAssist, setShowAiAssist] = useState(false);
  const [testText, setTestText] = useState('');

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

  // Start recording audio using expo-av
  async function startRecording() {
    try {
      setAiError(null);
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setAiError('Microphone permission is required to use voice setup.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('🎙️ Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      setAiError('Failed to start voice recording.');
    }
  }

  // Stop recording and parse audio
  async function stopRecording() {
    if (!recording) return;

    console.log('🎙️ Stopping recording...');
    setIsRecording(false);
    setRecording(null);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      console.log('Audio file saved locally at:', uri);

      if (uri) {
        await uploadAudioForParsing(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setAiError('Failed to save audio file.');
    }
  }

  // Upload file to Backend /api/ai/parse-profile-audio
  async function uploadAudioForParsing(uri: string) {
    if (!token) return;

    try {
      setAiLoading(true);
      setAiError(null);

      const formData = new FormData();
      const filename = uri.split('/').pop() || 'recording.m4a';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `audio/${match[1]}` : `audio/m4a`;

      formData.append('audio', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await api.post('/ai/parse-profile-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.profile) {
        applyParsedProfile(response.data.profile);
      } else {
        setAiError(response.data.message || 'Failed to analyze speech.');
      }
    } catch (err: any) {
      console.error('Audio upload error:', err);
      setAiError(getErrorMessage(err, 'Failed to process voice details. Check backend console.'));
    } finally {
      setAiLoading(false);
    }
  }

  // Call Backend text parser endpoint
  async function handleTextAiParse() {
    if (!testText.trim() || !token) return;

    try {
      setAiLoading(true);
      setAiError(null);

      const response = await api.post(
        '/ai/parse-profile-text',
        { text: testText.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success && response.data.profile) {
        applyParsedProfile(response.data.profile);
        setTestText('');
      } else {
        setAiError(response.data.message || 'Failed to parse text description.');
      }
    } catch (err: any) {
      console.error('Text parsing error:', err);
      setAiError(getErrorMessage(err, 'Failed to parse description. Check backend console.'));
    } finally {
      setAiLoading(false);
    }
  }

  function applyParsedProfile(parsed: any) {
    if (parsed.name) setName(parsed.name);
    if (parsed.skills) setSelectedSkills(parsed.skills);
    if (parsed.experience) setExperience(parsed.experience);
    if (parsed.city) setCity(parsed.city);

    Alert.alert(
      t('appName'),
      'AI has auto-filled your profile! Please review the details across the steps.'
    );
    setShowAiAssist(false);
  }

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
          {/* AI Assistant Section */}
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiTitleRow}>
                <Ionicons name="sparkles" size={20} color={colors.primary} style={styles.aiSparkleIcon} />
                <Text style={styles.aiTitle}>AI Profile Assistant</Text>
              </View>
              <Pressable
                onPress={() => setShowAiAssist(!showAiAssist)}
                style={styles.aiToggleBtn}
              >
                <Text style={styles.aiToggleText}>{showAiAssist ? 'Hide' : 'Use Voice'}</Text>
              </Pressable>
            </View>

            {showAiAssist && (
              <View style={styles.aiBody}>
                <Text style={styles.aiDesc}>
                  Press and hold the mic to describe yourself in your language (e.g. "मेरा नाम हरीश है, मैं नोएडा में ४ साल से कारपेंटर हूँ"). AI will auto-fill your profile!
                </Text>

                <View style={styles.micContainer}>
                  <Pressable
                    onPressIn={startRecording}
                    onPressOut={stopRecording}
                    style={[
                      styles.micButton,
                      isRecording && styles.micButtonRecording,
                    ]}
                  >
                    <Ionicons
                      name={isRecording ? 'mic-off' : 'mic'}
                      size={24}
                      color="#FFFFFF"
                    />
                  </Pressable>
                  <Text style={styles.micStatus}>
                    {isRecording ? 'Listening... Release to stop' : 'Press & Hold to speak'}
                  </Text>
                </View>

                <Text style={styles.dividerText}>— OR TYPE DESCRIPTION FALLBACK —</Text>

                <TextInput
                  placeholder="Paste or type test description here..."
                  placeholderTextColor={colors.muted}
                  style={styles.aiTextInput}
                  value={testText}
                  onChangeText={setTestText}
                  multiline
                />

                {aiError && <Text style={styles.aiErrorText}>{aiError}</Text>}

                <Pressable
                  onPress={handleTextAiParse}
                  disabled={!testText.trim() || aiLoading}
                  style={[
                    styles.aiSubmitBtn,
                    (!testText.trim() || aiLoading) && styles.aiSubmitBtnDisabled,
                  ]}
                >
                  <Text style={styles.aiSubmitBtnText}>
                    {aiLoading ? 'AI is analyzing...' : 'Auto-fill Details'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

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
  aiCard: {
    backgroundColor: '#F3F0EA',
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiSparkleIcon: {
    marginRight: 2,
  },
  aiTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  aiToggleBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  aiToggleText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  aiBody: {
    marginTop: 12,
    gap: 12,
  },
  aiDesc: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  micContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 6,
  },
  micButton: {
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  micButtonRecording: {
    backgroundColor: colors.danger,
    transform: [{ scale: 1.1 }],
  },
  micStatus: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  dividerText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 4,
  },
  aiTextInput: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    height: 64,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  aiErrorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  aiSubmitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSubmitBtnDisabled: {
    backgroundColor: '#D1C9BC',
  },
  aiSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
