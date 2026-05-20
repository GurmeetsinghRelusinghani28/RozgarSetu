import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { languages } from '../i18n/translations';
import { useLanguage } from '../contexts/LanguageContext';
import { colors } from '../constants/theme';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSelection'>;

export const LanguageSelectionScreen = ({ navigation }: Props) => {
  const { language, setLanguage, t } = useLanguage();

  const handleSelect = async (code: (typeof languages)[number]['code']) => {
    console.log(`🌍 Selecting language: ${code}`);
    await setLanguage(code);
    console.log(`✅ Language set to: ${code}, navigating to Login`);
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="language-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.title}>{t('selectLanguage')}</Text>
        <Text style={styles.subtitle}>{t('tagline')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.grid}>
          {languages.map((item) => {
            const selected = item.code === language;
            return (
              <Pressable
                key={item.code}
                onPress={() => handleSelect(item.code)}
                style={[styles.card, selected && styles.cardSelected]}
              >
                <Text style={styles.nativeName}>{item.nativeName}</Text>
                <Text style={styles.name}>{item.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.chip,
    borderRadius: 24,
    height: 64,
    justifyContent: 'center',
    marginBottom: 18,
    width: 64,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  list: {
    padding: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 92,
    padding: 18,
    width: '47.5%',
  },
  cardSelected: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  nativeName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  name: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});
