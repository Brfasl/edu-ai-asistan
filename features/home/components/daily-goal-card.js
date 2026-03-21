import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { homeColors } from '@/features/home/styles';

export function DailyGoalCard({ goal }) {
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name="sparkles" size={16} color="#C8B6FF" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{goal.title}</Text>
        <Text style={styles.description}>{goal.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: homeColors.panel,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: homeColors.border,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#1D2230',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#A9B9FF',
    fontSize: 14,
    letterSpacing: 0.4,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    color: homeColors.textSecondary,
    fontSize: 18,
    lineHeight: 24,
  },
});
