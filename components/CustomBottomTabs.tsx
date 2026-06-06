import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type TabRoute = 'Home' | 'Library' | 'Pomodoro' | 'Statistics' | 'Profile';

type CustomBottomTabsProps = {
  activeRoute: TabRoute;
};

const TAB_ITEMS: {
  key: TabRoute;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  path: string;
  isCenter?: boolean;
}[] = [
  { key: 'Home',       label: 'Ana Sayfa',  icon: 'home-outline',      path: 'home' },
  { key: 'Library',    label: 'Kutuphane',  icon: 'book-outline',      path: 'library' },
  { key: 'Pomodoro',   label: 'Pomodoro',   icon: 'timer-outline',     path: 'pomodoro', isCenter: true },
  { key: 'Statistics', label: 'İstatistik', icon: 'bar-chart-outline', path: 'statistics' },
  { key: 'Profile',    label: 'Profil',     icon: 'person-outline',    path: 'profile' },
];

export default function CustomBottomTabs({ activeRoute }: CustomBottomTabsProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {TAB_ITEMS.map((item) => {
          const isActive = item.key === activeRoute;

          if (item.isCenter) {
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  if (!isActive) router.replace(`/(tabs)/${item.path}`);
                }}
                style={styles.centerButton}>
                <View style={[styles.centerInner, isActive && styles.centerInnerActive]}>
                  <Ionicons size={24} name={item.icon} color={isActive ? '#0A1A10' : '#2BE26E'} />
                </View>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={item.key}
              onPress={() => {
                if (!isActive) router.replace(`/(tabs)/${item.path}`);
              }}
              style={styles.tabButton}>
              {isActive ? <View style={styles.activeGlow} /> : null}
              <Ionicons
                size={20}
                name={item.icon}
                color={isActive ? '#2BE26E' : '#6F7782'}
                style={styles.icon}
              />
              <Text style={[styles.label, isActive ? styles.activeLabel : styles.inactiveLabel]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111319',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#191D25',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeGlow: {
    position: 'absolute',
    top: -10,
    width: 50,
    height: 22,
    borderRadius: 18,
    backgroundColor: 'rgba(43, 226, 110, 0.18)',
    shadowColor: '#2BE26E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 8,
  },
  // Orta Pomodoro butonu
  centerButton: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  centerInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(43,226,110,0.15)',
    borderWidth: 2,
    borderColor: '#2BE26E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2BE26E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  centerInnerActive: {
    backgroundColor: '#2BE26E',
  },
  icon: {
    marginBottom: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
  },
  activeLabel: {
    color: '#2BE26E',
  },
  inactiveLabel: {
    color: '#747D88',
  },
});
