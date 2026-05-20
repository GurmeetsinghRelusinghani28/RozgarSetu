import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/theme';
import { API_BASE_URL } from '../constants/config';

// Assuming the route route params pass jobId and contractorId:
// { route: { params: { jobId: string, contractorId: string, projectName: string } } }

export const ChatScreen = ({ route, navigation }: any) => {
  const { jobId, contractorId, projectName } = route.params || {};
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!jobId) return;

    // Fetch message history
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/chat/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error("Failed to load history", err);
      }
    };
    fetchHistory();

    // Setup Socket.io
    // Extract base host from API_BASE_URL
    const host = API_BASE_URL.replace('/api', '');
    const socket = io(host);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', { jobId });
    });

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      // Auto scroll to bottom
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => {
      socket.disconnect();
    };
  }, [jobId, token]);

  const sendMessage = () => {
    if (!inputText.trim() || !socketRef.current) return;
    
    // We assume the worker's user info is in AuthContext
    const newMsg = {
      senderId: user?.id || user?._id, // depending on how auth context stores it
      receiverId: contractorId,
      jobId,
      message: inputText.trim(),
    };

    socketRef.current.emit('send_message', newMsg);
    setInputText('');
  };

  const renderItem = ({ item }: { item: any }) => {
    const isMe = item.senderId === user?.id || item.senderId === user?._id;
    return (
      <View style={[styles.msgContainer, isMe ? styles.msgMe : styles.msgThem]}>
        <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextThem]}>
          {item.message}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{projectName || 'Chat'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item._id || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: 20 }]}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={[styles.inputWrap, { paddingBottom: Math.max(insets.bottom, 12), paddingTop: 12 }]}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={colors.muted}
          multiline
        />
        <Pressable style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  listContent: { padding: 16, gap: 10 },
  msgContainer: { maxWidth: '80%', padding: 12, borderRadius: 16, marginVertical: 4 },
  msgMe: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  msgThem: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15 },
  msgTextMe: { color: '#fff' },
  msgTextThem: { color: colors.text },
  inputWrap: {
    flexDirection: 'row', 
    paddingHorizontal: 12, 
    backgroundColor: colors.surface,
    borderTopWidth: 1, 
    borderTopColor: colors.border, 
    alignItems: 'flex-end',
  },
  input: {
    flex: 1, 
    backgroundColor: colors.background, 
    minHeight: 46, 
    maxHeight: 120,
    borderRadius: 24,
    paddingHorizontal: 18, 
    paddingTop: 12,
    paddingBottom: 12,
    marginRight: 10, 
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    backgroundColor: colors.primary, 
    width: 48, 
    height: 48, 
    borderRadius: 24,
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 2,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  }
});
