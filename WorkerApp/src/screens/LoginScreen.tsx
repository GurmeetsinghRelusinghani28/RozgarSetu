import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api/client';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../utils/workerData';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: Props) => {
  const { t } = useLanguage();
  const { setToken } = useAuth();
  const [step, setStep] = useState<'name' | 'phone' | 'otp'>('name');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!name.trim()) {
      Alert.alert(t('error'), t('enterName'));
      setStep('name');
      return;
    }

    if (phone.length !== 10) {
      Alert.alert(t('error'), t('invalidPhone'));
      return;
    }

    try {
      setLoading(true);
      console.log("Calling API:", process.env.EXPO_PUBLIC_API_BASE_URL);

    const response = await api.post('/auth/send-otp', { phone });

    console.log("RESPONSE:", response.data);
      // const response = await api.post('/auth/send-otp', { phone });

      if (response.data.success) {
        Alert.alert(
          t('appName'),
          response.data.message || t('otpSentToPhone'),
          response.data.otp && process.env.NODE_ENV === 'development'
            ? [
                {
                  text: `OTP: ${response.data.otp}`,
                  onPress: () => setOtp(response.data.otp),
                },
                { text: 'OK' },
              ]
            : [{ text: 'OK' }]
        );
        setStep('otp');
      } else {
        Alert.alert(t('error'), response.data.message || t('failedToLoad'));
      }
    } catch (error: any) {
      console.log("FULL ERROR:", error);
    console.log("REQUEST:", error.request);
    console.log("RESPONSE:", error.response);
    console.log("MESSAGE:", error.message);
      const errorMsg = error.response?.data?.message || error.message || t('failedToLoad');
      Alert.alert(t('error'), errorMsg);
      console.error('Send OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert(t('error'), t('invalidOtp'));
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/verify-otp', {
        name,
        phone,
        otp,
        role: 'worker',
      });

      if (response.data.success) {
        await setToken(response.data.token);
        navigation.replace('ProfileSetup');
      } else {
        Alert.alert(t('error'), response.data.message || t('failedToLoad'));
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || t('failedToLoad');
      Alert.alert(t('error'), errorMsg);
      console.error('Verify OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone');
      return;
    }

    if (step === 'phone') {
      setStep('name');
      return;
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={20} color={colors.primary} />
          <Text style={styles.backLabel}>{t('back')}</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.heroIcon}>
            <Ionicons
              name={step === 'name' ? 'person-outline' : 'call-outline'}
              size={34}
              color={colors.primary}
            />
          </View>
          <Text style={styles.heading}>{t('worker')}</Text>
          <Text style={styles.subheading}>{t('tagline')}</Text>
        </View>

        <View style={styles.card}>
          {step === 'name' ? (
            <>
              <Text style={styles.label}>{t('yourName')}</Text>
              <TextInput
                placeholder={t('enterName')}
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={name}
                onChangeText={setName}
              />
              <PrimaryButton title={t('next')} onPress={() => setStep('phone')} disabled={!name.trim()} />
            </>
          ) : null}

          {step === 'phone' ? (
            <>
              <Text style={styles.helperText}>
                {t('hello')}, {name.trim()}
              </Text>
              <Text style={styles.label}>{t('phoneNumber')}</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeLabel}>+91</Text>
                </View>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={10}
                  onChangeText={(value) => setPhone(value.replace(/\D/g, ''))}
                  placeholder={t('enterPhone')}
                  placeholderTextColor={colors.muted}
                  style={[styles.input, styles.phoneInput]}
                  value={phone}
                />
              </View>
              <PrimaryButton
                title={t('sendOtp')}
                onPress={handleSendOtp}
                disabled={phone.length !== 10}
                loading={loading}
              />
            </>
          ) : null}

          {step === 'otp' ? (
            <>
              <Text style={styles.label}>{t('enterOtp')}</Text>
              <Text style={styles.otpHelper}>{t('otpSentToPhone')}</Text>
              <TextInput
                keyboardType="number-pad"
                maxLength={6}
                onChangeText={(value) => setOtp(value.replace(/\D/g, ''))}
                placeholder="123456"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={otp}
              />
              <PrimaryButton
                title={t('verifyOtp')}
                onPress={handleVerifyOtp}
                disabled={otp.length !== 6}
                loading={loading}
              />
            </>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  flex: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  backLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    marginTop: 36,
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: colors.chip,
    borderRadius: 30,
    height: 72,
    justifyContent: 'center',
    marginBottom: 18,
    width: 72,
  },
  heading: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
  },
  subheading: {
    color: colors.muted,
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 30,
    borderWidth: 1,
    gap: 16,
    marginTop: 28,
    padding: 22,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  helperText: {
    color: colors.muted,
    fontSize: 15,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F8F6F0',
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.text,
    fontSize: 18,
    height: 54,
    paddingHorizontal: 16,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countryCode: {
    alignItems: 'center',
    backgroundColor: '#F8F6F0',
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  countryCodeLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  phoneInput: {
    flex: 1,
  },
  otpHelper: {
    color: colors.muted,
    fontSize: 14,
    marginTop: -4,
  },
});
