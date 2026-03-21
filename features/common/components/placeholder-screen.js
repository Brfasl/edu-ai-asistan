import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { homeColors } from '@/features/home/styles';

export function PlaceholderScreen({ title, subtitle, iconName }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={28} color={homeColors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: homeColors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#26303D',
    backgroundColor: '#121821',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: homeColors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    color: homeColors.textSecondary,
    textAlign: 'center',
    fontSize: 15,
  },
});
