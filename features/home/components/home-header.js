import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { homeColors } from '@/features/home/styles';

export function HomeHeader({ profile }) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.title}>Merhaba {profile.name}!</Text>
          <Text style={styles.subtitle}>{profile.greeting}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Ionicons name="notifications-outline" size={20} color={homeColors.primary} />
        <Ionicons name="settings-outline" size={20} color={homeColors.textSecondary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3D7C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#3A2C25',
    fontWeight: '700',
    fontSize: 16,
  },
  title: {
    color: homeColors.text,
    fontSize: 31,
    fontWeight: '800',
  },
  subtitle: {
    color: homeColors.textSecondary,
    fontSize: 18,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
});
