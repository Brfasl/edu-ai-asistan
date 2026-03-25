import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type TabRoute = 'Home' | 'Library' | 'Statistics' | 'Profile';

type CustomBottomTabsProps = {
  activeRoute: TabRoute;
};

const TAB_ITEMS: {
  key: TabRoute;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  path: string;
}[] = [
  { key: 'Home', label: 'Ana Sayfa', icon: 'home-outline', path: 'home' },
  { key: 'Library', label: 'Kutuphane', icon: 'book-outline', path: 'library' },
  { key: 'Statistics', label: 'Istatistikler', icon: 'bar-chart-outline', path: 'statistics' },
  { key: 'Profile', label: 'Profil', icon: 'person-outline', path: 'profile' },
];

export default function CustomBottomTabs({ activeRoute }: CustomBottomTabsProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {TAB_ITEMS.map((item) => {
          const isActive = item.key === activeRoute;

          return (
            <Pressable
              key={item.key}
              onPress={() => {
                if (!isActive) {
                  router.replace(`/(tabs)/${item.path}`);
                }
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#191D25',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeGlow: {
    position: 'absolute',
    top: -10,
    width: 60,
    height: 26,
    borderRadius: 18,
    backgroundColor: 'rgba(43, 226, 110, 0.18)',
    shadowColor: '#2BE26E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    marginBottom: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeLabel: {
    color: '#2BE26E',
  },
  inactiveLabel: {
    color: '#747D88',
  },
});
