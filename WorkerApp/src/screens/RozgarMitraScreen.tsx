import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/theme';
import { getErrorMessage, normalizeProjects } from '../utils/workerData';
import { JobCard } from '../components/JobCard';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  jobs?: any[];
};

export const RozgarMitraScreen = () => {
  const { token } = useAuth();
  const { t } = useLanguage();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'नमस्ते, मैं Rozgar Mitra हूं। आप शहर, काम और सुविधा बताइए, मैं सही नौकरी ढूंढ दूंगा।',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isApplying, setIsApplying] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
  }, [messages, loading]);

  const appendMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const sendQuery = async (text: string) => {
    if (!text.trim() || !token) return;

    appendMessage({ id: `${Date.now()}-user`, role: 'user', text });
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/ai/rozgar-mitra', { text });
      appendMessage({
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        text: response.data.reply || 'माफ कीजिए, जवाब नहीं मिल पाया।',
        jobs: normalizeProjects(response.data.jobs || []),
      });
    } catch (error: any) {
      appendMessage({
        id: `${Date.now()}-error`,
        role: 'assistant',
        text: getErrorMessage(error, 'Rozgar Mitra could not find jobs right now.'),
      });
    } finally {
      setLoading(false);
    }
  };

  const sendAudio = async (uri: string) => {
    if (!token) return;

    setLoading(true);
    try {
      const filename = uri.split('/').pop() || 'rozgar-mitra.m4a';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `audio/${match[1]}` : 'audio/m4a';
      const formData = new FormData();

      formData.append('audio', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await api.post('/ai/rozgar-mitra', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      appendMessage({
        id: `${Date.now()}-user-audio`,
        role: 'user',
        text: response.data.query || 'Voice query',
      });
      appendMessage({
        id: `${Date.now()}-assistant-audio`,
        role: 'assistant',
        text: response.data.reply || 'माफ कीजिए, जवाब नहीं मिल पाया।',
        jobs: normalizeProjects(response.data.jobs || []),
      });
    } catch (error: any) {
      Alert.alert(t('error'), getErrorMessage(error, 'Failed to process voice query.'));
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('error'), 'Microphone permission is required.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const result = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(result.recording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert(t('error'), 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setRecording(null);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      if (uri) await sendAudio(uri);
    } catch (error) {
      Alert.alert(t('error'), 'Failed to save recording.');
    }
  };

  const applyToJob = async (projectId: string) => {
    if (!token) return;
    setIsApplying(projectId);
    try {
      await api.post(`/projects/${projectId}/apply`, {});
      Alert.alert(t('appName'), t('applied'));
    } catch (error: any) {
      Alert.alert(t('error'), getErrorMessage(error, t('failedToLoad')));
    } finally {
      setIsApplying(null);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageWrap, isUser ? styles.userWrap : styles.assistantWrap]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {!isUser ? (
            <View style={styles.assistantHeader}>
              <View style={styles.avatar}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
              </View>
              <Text style={styles.assistantName}>Rozgar Mitra</Text>
            </View>
          ) : null}
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {item.text}
          </Text>
        </View>

        {item.jobs?.length ? (
          <View style={styles.jobsWrap}>
            {item.jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                t={t}
                isApplying={isApplying === job.id}
                onApply={() => applyToJob(job.id)}
              />
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="chatbubbles" size={22} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.title}>Rozgar Mitra</Text>
          <Text style={styles.subtitle}>AI job assistant</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContent}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Rozgar Mitra सोच रहा है...</Text>
            </View>
          ) : null
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="जैसे: गाजियाबाद में पेंटर काम + भोजन"
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
        />
        <Pressable
          style={[styles.iconButton, isRecording && styles.recordingButton]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={loading}
        >
          <Ionicons name={isRecording ? 'stop' : 'mic'} size={22} color="#fff" />
        </Pressable>
        <Pressable
          style={[styles.iconButton, !input.trim() && styles.disabledButton]}
          onPress={() => sendQuery(input)}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: colors.chipAccent,
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageWrap: {
    marginBottom: 14,
  },
  userWrap: {
    alignItems: 'flex-end',
  },
  assistantWrap: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    maxWidth: '88%',
    padding: 14,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderColor: colors.border,
    borderWidth: 1,
  },
  assistantHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.chipAccent,
    borderRadius: 10,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  assistantName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: colors.text,
  },
  jobsWrap: {
    marginTop: 10,
    width: '100%',
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  inputBar: {
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 15,
    maxHeight: 110,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  recordingButton: {
    backgroundColor: colors.danger,
  },
  disabledButton: {
    opacity: 0.45,
  },
});
