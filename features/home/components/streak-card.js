import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { homeColors } from '@/features/home/styles';

export function StreakCard({ streak }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.badge}>
            <Ionicons name="flame" size={16} color="#FF8A3D" />
          </View>
          <View>
            <Text style={styles.title}>{streak.title}</Text>
            <Text style={styles.subtitle}>{streak.subtitle}</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressMeta}>
        <Text style={styles.progressLabel}>{streak.xpLabel}</Text>
        <Text style={styles.progressValue}>{streak.xpValue} XP</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(1, streak.xpProgress)) * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: homeColors.panel,
    borderRadius: 20,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: homeColors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#0D1115',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: homeColors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: homeColors.textMuted,
    marginTop: 2,
    fontSize: 16,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: homeColors.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  progressValue: {
    color: homeColors.text,
    fontSize: 26,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    backgroundColor: '#0E1317',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: homeColors.primary,
  },
});
