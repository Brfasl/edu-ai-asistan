import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CustomBottomTabs from '@/components/CustomBottomTabs';
import { useAuth } from '@/features/common/auth/auth-context';
import { getProfileStats } from '@/features/common/stats/stats-api';
import { formatDisplayName, getInitial } from '@/features/common/utils/name';

import { styles } from './style';

const BADGES = [
  { id: 'night', title: 'Gece Kuzu', subtitle: 'Gece calisan', icon: 'moon-waning-crescent', color: '#8C5CFF' },
  { id: 'test', title: 'Test Canavari', subtitle: 'Kusursuz testler', icon: 'magic-staff', color: '#2BE26E' },
  { id: 'notes', title: 'Not Ustasi', subtitle: 'Yaratici notlar', icon: 'lightbulb-outline', color: '#F2D33D' },
  { id: 'speed', title: 'Hizli Okuyucu', subtitle: 'Hiz rekoru', icon: 'lightning-bolt', color: '#2BE26E' },
];

const SETTINGS = [
  { id: 'password', title: 'Sifre Degistir', icon: 'lock-closed-outline' },
  { id: 'notifications', title: 'Bildirim Ayarlari', icon: 'notifications-outline' },
  { id: 'reminders', title: 'Hatirlaticilar', icon: 'alarm-outline' },
];

export default function ProfileTabScreen() {
  const { user, token, logout } = useAuth();
  const [profileStats, setProfileStats] = useState(null);
  const displayName = formatDisplayName(user?.name) || user?.email || 'Misafir';
  const initial = getInitial(displayName) || 'B';

  useEffect(() => {
    if (!token) {
      setProfileStats(null);
      return;
    }
    getProfileStats({ token }).then(setProfileStats).catch(() => {});
  }, [token]);

  const totalXp = profileStats?.totalXp ?? 0;
  const streak = profileStats?.streak ?? 0;
  const level = Math.max(1, Math.floor(totalXp / 100) + 1);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="chevron-back" size={18} color="#D5D9E3" />
              <Text style={styles.headerTitle}>Profil</Text>
            </View>
            <View style={styles.headerActions}>
              <Ionicons name="notifications-outline" size={18} color="#D5D9E3" />
              <Ionicons name="settings-outline" size={18} color="#D5D9E3" />
            </View>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarGlow} />
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>{initial}</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>LVL {level}</Text>
              </View>
            </View>
            <Text style={styles.name}>{displayName}</Text>
            {user?.email ? <Text style={styles.school}>{user.email}</Text> : null}

            <View style={styles.statsRow}>
              {streak > 0 ? (
                <View style={styles.pill}>
                  <Ionicons name="flame" size={15} color="#FF8A3D" />
                  <Text style={styles.pillText}>{streak} Gunluk Seri</Text>
                </View>
              ) : null}
              {totalXp > 0 ? (
                <View style={styles.pill}>
                  <Ionicons name="leaf-outline" size={15} color="#2BE26E" />
                  <Text style={styles.pillText}>{totalXp} XP</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rozet Vitrini</Text>
            <View style={styles.xpBadge}>
              <Text style={styles.xpBadgeText}>Toplam XP: {totalXp}</Text>
            </View>
          </View>

          <View style={styles.badgeGrid}>
            {BADGES.map((badge) => (
              <View key={badge.id} style={styles.badgeCard}>
                <View style={[styles.badgeIconWrap, { backgroundColor: `${badge.color}20` }]}>
                  <MaterialCommunityIcons name={badge.icon} size={20} color={badge.color} />
                </View>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeSubtitle}>{badge.subtitle}</Text>
              </View>
            ))}
          </View>

          <View style={styles.settingsCard}>
            {SETTINGS.map((item, index) => (
              <Pressable
                key={item.id}
                style={[styles.settingsRow, index < SETTINGS.length - 1 ? styles.settingsRowDivider : null]}
                onPress={() => {
                  if (item.id === 'password') router.push('/forgot-password');
                }}>
                <View style={styles.settingsLeft}>
                  <View style={styles.settingsIconWrap}>
                    <Ionicons name={item.icon} size={18} color="#A7AFBD" />
                  </View>
                  <Text style={styles.settingsText}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6F7788" />
              </Pressable>
            ))}
          </View>

          {!token ? (
            <View style={styles.logoutButton}>
              <Ionicons name="log-in-outline" size={18} color="#161127" />
              <Text style={styles.logoutText} onPress={() => router.push('/login')}>
                Giriş Yap
              </Text>
            </View>
          ) : (
            <View style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={18} color="#161127" />
            <Text style={styles.logoutText} onPress={logout}>
              Çıkış Yap
            </Text>
          </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <CustomBottomTabs activeRoute="Profile" />
    </View>
  );
}
