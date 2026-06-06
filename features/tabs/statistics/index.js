import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import CustomBottomTabs from '@/components/CustomBottomTabs';
import { useAuth } from '@/features/common/auth/auth-context';
import {
  getCoursePerformance,
  getDailyActivity,
  getProfileStats,
  getWeeklySummary,
} from '@/features/common/stats/stats-api';
import { listDocuments } from '@/features/common/documents/documents-api';

import { styles } from './style';

const BAR_MAX_HEIGHT = 80;

// ── Seviye sistemi ──────────────────────────────────────────────
const LEVELS = [
  { level: 1,  name: 'Çaylak',     min: 0,    max: 99,   color: '#9AA3B5' },
  { level: 2,  name: 'Stajyer',    min: 100,  max: 299,  color: '#4FC3F7' },
  { level: 3,  name: 'Öğrenci',    min: 300,  max: 599,  color: '#2BE26E' },
  { level: 4,  name: 'Azimli',     min: 600,  max: 999,  color: '#2BE26E' },
  { level: 5,  name: 'Kararlı',    min: 1000, max: 1499, color: '#A387FF' },
  { level: 6,  name: 'Uzman',      min: 1500, max: 2099, color: '#A387FF' },
  { level: 7,  name: 'Bilge',      min: 2100, max: 2799, color: '#F2D33D' },
  { level: 8,  name: 'Usta',       min: 2800, max: 3599, color: '#F2D33D' },
  { level: 9,  name: 'Efsane',     min: 3600, max: 4499, color: '#FF8A3D' },
  { level: 10, name: 'Efsanevi',   min: 4500, max: Infinity, color: '#FF6B6B' },
];

function getLevel(xp) {
  for (const l of LEVELS) {
    if (xp >= l.min && xp <= l.max) {
      const range = l.max === Infinity ? 500 : l.max - l.min + 1;
      const pct = Math.min(100, Math.round(((xp - l.min) / range) * 100));
      const nextXp = l.max === Infinity ? null : l.max + 1;
      return { ...l, pct, nextXp, currentXp: xp };
    }
  }
  return { ...LEVELS[LEVELS.length - 1], pct: 100, nextXp: null, currentXp: xp };
}

// ── Rozetler ────────────────────────────────────────────────────
function getBadges(totalTests, totalXp, streak, docCount) {
  return [
    { id: 'first_quiz', icon: 'trophy-outline',    label: 'İlk Quiz',     earned: totalTests >= 1,  color: '#F2D33D' },
    { id: 'quiz_10',    icon: 'star-outline',       label: '10 Soru',      earned: totalTests >= 10, color: '#F2D33D' },
    { id: 'quiz_50',    icon: 'medal-outline',      label: '50 Soru',      earned: totalTests >= 50, color: '#FF8A3D' },
    { id: 'first_doc',  icon: 'document-outline',   label: '1. Belge',     earned: docCount >= 1,    color: '#4FC3F7' },
    { id: 'doc_5',      icon: 'library-outline',    label: '5 Belge',      earned: docCount >= 5,    color: '#4FC3F7' },
    { id: 'xp_100',     icon: 'flash-outline',      label: '100 XP',       earned: totalXp >= 100,   color: '#A387FF' },
    { id: 'xp_500',     icon: 'flash-outline',      label: '500 XP',       earned: totalXp >= 500,   color: '#A387FF' },
    { id: 'streak_3',   icon: 'flame-outline',      label: '3 Gün',        earned: streak >= 3,      color: '#FF6B6B' },
    { id: 'streak_7',   icon: 'bonfire-outline',    label: '7 Gün Seri',   earned: streak >= 7,      color: '#FF6B6B' },
  ];
}

function getMentorMessage(summary, courseCards, userName, streak, totalTests) {
  const name = userName || 'Öğrenci';

  if (!summary || (!summary.studyMinutes && !summary.testsSolved && !summary.xp)) {
    return `${name}, henüz istatistik yok. Bir belge yükle, analiz et ve quiz çöz — burası dolmaya başlayacak!`;
  }

  if (courseCards.length === 0) {
    const tests = totalTests || 0;
    if (streak >= 3) return `${name}, ${streak} günlük serinle harika gidiyorsun! Bu hafta ${tests} soru çözdün.`;
    return `${name}, bu hafta ${summary.testsSolved || 0} soru çözdün. Günlük alışkanlık için her gün çalış!`;
  }

  const best = courseCards[0];
  const worst = courseCards[courseCards.length - 1];
  let msg = `${name}, `;

  if (streak >= 7) msg += `7 günlük seri — inanılmaz! `;
  else if (streak >= 3) msg += `${streak} günlük serinle istikrarlısın. `;

  if (best.scorePercent >= 80) {
    msg += `"${best.title}" konusunda mükemmel gidiyorsun!`;
  } else if (best.scorePercent >= 50) {
    msg += `"${best.title}" konusunda iyi ilerliyorsun!`;
  } else {
    msg += 'Tüm konularda daha fazla pratik yapman önerilir.';
  }

  if (worst && worst.title !== best.title && worst.scorePercent < 60) {
    msg += ` "${worst.title}" konusuna daha fazla zaman ayır.`;
  }

  return msg;
}

export default function StatisticsTabScreen() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [docCount, setDocCount] = useState(0);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [profileStats, setProfileStats] = useState(null);

  const fetchData = useCallback(async () => {
    if (!token) {
      setSummary(null); setPerformance([]); setDocCount(0);
      setDailyActivity([]); setProfileStats(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [s, p, docs, daily, profile] = await Promise.all([
        getWeeklySummary({ token }),
        getCoursePerformance({ token }),
        listDocuments({ token }),
        getDailyActivity({ token }),
        getProfileStats({ token }),
      ]);
      setSummary(s);
      setPerformance(p);
      setDocCount(docs.length);
      setDailyActivity(daily);
      setProfileStats(profile);
    } catch (e) {
      setError(e?.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const userName = user?.name ? user.name.split(' ')[0] : user?.email?.split('@')[0] || 'Öğrenci';

  const levelInfo = useMemo(() => getLevel(profileStats?.totalXp ?? 0), [profileStats]);

  const badges = useMemo(
    () => getBadges(profileStats?.totalTests ?? 0, profileStats?.totalXp ?? 0, profileStats?.streak ?? 0, docCount),
    [profileStats, docCount]
  );

  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);

  const weeklyCards = useMemo(() => {
    const studyHours = summary ? Math.round((summary.studyMinutes || 0) / 60) : 0;
    return [
      { id: 'study',  icon: 'time-outline',     iconColor: '#2BE26E', label: 'AKTIF CALISMA', value: `${studyHours}s` },
      { id: 'tests',  icon: 'checkbox-outline', iconColor: '#B683FF', label: 'COZULEN TEST',  value: `${summary?.testsSolved || 0}` },
      { id: 'xp',     icon: 'flash-outline',    iconColor: '#F2D33D', label: 'KAZANILAN XP',  value: `${summary?.xp || 0}` },
    ];
  }, [summary]);

  const courseCards = useMemo(() => {
    const palette = ['#2BE26E', '#B683FF', '#F2D33D', '#FF8A3D', '#4FC3F7'];
    const icons = ['server-outline', 'git-branch-outline', 'bulb-outline', 'book-outline', 'code-slash-outline'];
    return performance.map((c, idx) => ({
      id: `${c.course}-${idx}`,
      title: c.course,
      scorePercent: c.scorePercent,
      score: `%${c.scorePercent}`,
      width: `${c.scorePercent}%`,
      color: palette[idx % palette.length],
      icon: icons[idx % icons.length],
      testsSolved: c.testsSolved,
    }));
  }, [performance]);

  const mentorMessage = useMemo(
    () => getMentorMessage(summary, courseCards, userName, profileStats?.streak ?? 0, profileStats?.totalTests ?? 0),
    [summary, courseCards, userName, profileStats]
  );

  const chartBars = useMemo(() => {
    if (dailyActivity.length === 0) {
      return ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((label) => ({
        label, testCount: 0, height: 6, isToday: false,
      }));
    }
    const maxTests = Math.max(1, ...dailyActivity.map((d) => d.testCount));
    return dailyActivity.map((d) => ({
      label: d.label,
      testCount: d.testCount,
      height: Math.max(6, Math.round((d.testCount / maxTests) * BAR_MAX_HEIGHT)),
      isToday: d.isToday,
    }));
  }, [dailyActivity]);

  const totalTests = profileStats?.totalTests ?? 0;
  const streak = profileStats?.streak ?? 0;

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={14} color="#1B132E" />
            </View>
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.title}>İstatistik</Text>
          <View style={styles.headerActions}>
            <Pressable onPress={fetchData} style={{ padding: 4 }}>
              <Ionicons name="refresh-outline" size={18} color={loading ? '#3A4860' : '#2BE26E'} />
            </Pressable>
            <Ionicons name="notifications-outline" size={18} color="#DDE5F3" />
          </View>
        </View>

        {/* Durum */}
        {!token ? (
          <View style={ls.emptyState}>
            <Ionicons name="bar-chart-outline" size={36} color="#2A3040" />
            <Text style={ls.emptyTitle}>İstatistikleri görmek için giriş yap</Text>
          </View>
        ) : loading ? (
          <Text style={styles.sectionHint}>Yükleniyor...</Text>
        ) : error ? (
          <Text style={[styles.sectionHint, { color: '#FF6B6B' }]}>{error}</Text>
        ) : null}

        {/* ── SEVİYE KARTI ─────────────────────────────────────── */}
        {token && !loading && (
          <View style={[ls.levelCard, { borderColor: levelInfo.color + '40' }]}>
            <View style={ls.levelLeft}>
              <View style={[ls.levelBadge, { backgroundColor: levelInfo.color + '20', borderColor: levelInfo.color + '60' }]}>
                <Text style={[ls.levelNum, { color: levelInfo.color }]}>{levelInfo.level}</Text>
              </View>
              <View>
                <Text style={ls.levelName}>{levelInfo.name}</Text>
                <Text style={ls.levelXpText}>
                  {profileStats?.totalXp ?? 0} XP{levelInfo.nextXp ? ` / ${levelInfo.nextXp}` : ''}
                </Text>
              </View>
            </View>
            {/* Streak */}
            {streak > 0 && (
              <View style={ls.streakBadge}>
                <Text style={ls.streakFire}>🔥</Text>
                <Text style={ls.streakNum}>{streak}</Text>
                <Text style={ls.streakLabel}>gün seri</Text>
              </View>
            )}
          </View>
        )}

        {/* XP ilerleme çubuğu */}
        {token && !loading && (
          <View style={ls.xpBarWrap}>
            <View style={ls.xpBarTrack}>
              <View style={[ls.xpBarFill, { width: `${levelInfo.pct}%`, backgroundColor: levelInfo.color }]} />
            </View>
            <Text style={[ls.xpBarLabel, { color: levelInfo.color }]}>{levelInfo.pct}%</Text>
          </View>
        )}

        {/* ── ROZETLER ─────────────────────────────────────────── */}
        {token && !loading && earnedBadges.length > 0 && (
          <>
            <View style={ls.sectionRow}>
              <Text style={ls.sectionTitle}>Rozetler</Text>
              <Text style={ls.sectionCount}>{earnedBadges.length}/{badges.length}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              <View style={ls.badgesRow}>
                {earnedBadges.map((b) => (
                  <View key={b.id} style={[ls.badgeItem, { borderColor: b.color + '50', backgroundColor: b.color + '10' }]}>
                    <Ionicons name={b.icon} size={20} color={b.color} />
                    <Text style={[ls.badgeLabel, { color: b.color }]}>{b.label}</Text>
                  </View>
                ))}
                {lockedBadges.slice(0, 3).map((b) => (
                  <View key={b.id} style={ls.badgeItemLocked}>
                    <Ionicons name="lock-closed-outline" size={18} color="#3A4152" />
                    <Text style={ls.badgeLabelLocked}>{b.label}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        {/* Genel özet satırı */}
        {token && !loading && (
          <View style={ls.overviewRow}>
            <View style={ls.overviewItem}>
              <Ionicons name="document-text-outline" size={20} color="#2BE26E" />
              <Text style={ls.overviewNum}>{docCount}</Text>
              <Text style={ls.overviewLabel}>Belge</Text>
            </View>
            <View style={ls.overviewDivider} />
            <View style={ls.overviewItem}>
              <Ionicons name="checkbox-outline" size={20} color="#B683FF" />
              <Text style={ls.overviewNum}>{totalTests}</Text>
              <Text style={ls.overviewLabel}>Test Çözüldü</Text>
            </View>
            <View style={ls.overviewDivider} />
            <View style={ls.overviewItem}>
              <Ionicons name="flash-outline" size={20} color="#F2D33D" />
              <Text style={ls.overviewNum}>{profileStats?.totalXp ?? 0}</Text>
              <Text style={ls.overviewLabel}>Toplam XP</Text>
            </View>
          </View>
        )}

        {/* Haftalık özet */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bu Hafta</Text>
          <View style={styles.sectionLine} />
        </View>
        <View style={styles.summaryRow}>
          {weeklyCards.map((item) => (
            <View key={item.id} style={styles.summaryCard}>
              <Ionicons name={item.icon} size={17} color={item.iconColor} />
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Grafik — son 7 gün test */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Son 7 Gün — Çözülen Test</Text>
            {totalTests > 0 && (
              <View style={styles.chartBadge}>
                <Text style={styles.chartBadgeText}>+{totalTests} TOPLAM</Text>
              </View>
            )}
          </View>
          <View style={ls.dynamicChartArea}>
            {chartBars.map((bar, i) => (
              <View key={i} style={ls.barColumn}>
                <View style={ls.barTrack}>
                  <View style={[ls.barFill, { height: bar.height }, bar.isToday && ls.barFillToday, bar.testCount === 0 && ls.barFillEmpty]} />
                </View>
                {bar.testCount > 0 && <Text style={ls.barCount}>{bar.testCount}</Text>}
              </View>
            ))}
          </View>
          <View style={ls.chartLabelsRow}>
            {chartBars.map((bar, i) => (
              <Text key={i} style={[ls.chartLabel, bar.isToday && ls.chartLabelToday]}>{bar.label}</Text>
            ))}
          </View>
        </View>

        {/* Ders Performansı */}
        <View style={styles.sectionRow}>
          <Text style={styles.bigSectionTitle}>Ders Performansı</Text>
          <Text style={styles.sectionHint}>QUIZ BAZLI</Text>
        </View>

        {courseCards.length === 0 ? (
          <View style={ls.emptyPerf}>
            <MaterialCommunityIcons name="robot-outline" size={24} color="#2A3040" />
            <Text style={ls.emptyPerfText}>Henüz ders verisi yok.{'\n'}Bir belge analiz et ve quiz çöz!</Text>
          </View>
        ) : (
          courseCards.map((course) => (
            <View key={course.id} style={styles.performanceCard}>
              <View style={styles.performanceTop}>
                <View style={styles.performanceLeft}>
                  <View style={styles.performanceIcon}>
                    <Ionicons name={course.icon} size={16} color={course.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.performanceTitle} numberOfLines={1}>{course.title}</Text>
                    <Text style={ls.perfSub}>{course.testsSolved} soru çözüldü</Text>
                  </View>
                </View>
                <View style={styles.performanceRight}>
                  <Text style={[styles.performanceScore, { color: course.color }]}>{course.score}</Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: course.width, backgroundColor: course.color }]} />
              </View>
            </View>
          ))
        )}

        {/* AI Mentor */}
        <View style={styles.mentorCard}>
          <View style={styles.mentorBadge}>
            <MaterialCommunityIcons name="robot-outline" size={18} color="#EFE6FF" />
          </View>
          <View style={styles.mentorBody}>
            <Text style={styles.mentorHeader}>AI MENTOR ÖNERİSİ</Text>
            <View style={styles.mentorMessage}>
              <Text style={styles.mentorText}>{mentorMessage}</Text>
            </View>
          </View>
        </View>

      </ScrollView>
      <CustomBottomTabs activeRoute="Statistics" />
    </View>
  );
}

const ls = {
  // Seviye
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141922',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  levelLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  levelBadge: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  levelNum: { fontSize: 24, fontWeight: '900' },
  levelName: { color: '#EEF3FF', fontSize: 18, fontWeight: '800' },
  levelXpText: { color: '#778091', fontSize: 12, marginTop: 2 },
  streakBadge: { alignItems: 'center', gap: 2 },
  streakFire: { fontSize: 22 },
  streakNum: { color: '#FF8A3D', fontSize: 22, fontWeight: '900' },
  streakLabel: { color: '#778091', fontSize: 11, fontWeight: '600' },

  // XP bar
  xpBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  xpBarTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#1E2633', overflow: 'hidden' },
  xpBarFill: { height: 6, borderRadius: 3 },
  xpBarLabel: { fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'right' },

  // Rozetler
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: '#EEF3FF', fontSize: 17, fontWeight: '700' },
  sectionCount: { color: '#778091', fontSize: 12, fontWeight: '700' },
  badgesRow: { flexDirection: 'row', gap: 8, paddingVertical: 4, paddingHorizontal: 2, marginBottom: 8 },
  badgeItem: {
    alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1, minWidth: 70,
  },
  badgeLabel: { fontSize: 11, fontWeight: '700' },
  badgeItemLocked: {
    alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1, borderColor: '#1E2633', backgroundColor: '#0F1319', minWidth: 70, opacity: 0.5,
  },
  badgeLabelLocked: { color: '#3A4152', fontSize: 11, fontWeight: '700' },

  // Genel özet
  overviewRow: {
    flexDirection: 'row', backgroundColor: '#141922', borderRadius: 16,
    borderWidth: 1, borderColor: '#202838', paddingVertical: 16, marginBottom: 18,
  },
  overviewItem: { flex: 1, alignItems: 'center', gap: 4 },
  overviewNum: { color: '#EEF3FF', fontSize: 22, fontWeight: '800' },
  overviewLabel: { color: '#778091', fontSize: 11, fontWeight: '600' },
  overviewDivider: { width: 1, backgroundColor: '#202838', marginVertical: 4 },

  // Diğer
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyTitle: { color: '#778091', fontSize: 14, textAlign: 'center' },
  emptyPerf: {
    alignItems: 'center', paddingVertical: 28, gap: 10,
    backgroundColor: '#141922', borderRadius: 14, borderWidth: 1, borderColor: '#202838', marginBottom: 14,
  },
  emptyPerfText: { color: '#778091', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  perfSub: { color: '#778091', fontSize: 11, marginTop: 2 },

  // Bar chart
  dynamicChartArea: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    height: BAR_MAX_HEIGHT + 20, paddingHorizontal: 4, marginBottom: 8,
  },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barTrack: { width: '70%', height: BAR_MAX_HEIGHT, justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 4, backgroundColor: 'rgba(43,226,110,0.45)' },
  barFillToday: { backgroundColor: '#2BE26E' },
  barFillEmpty: { backgroundColor: '#1E2633' },
  barCount: { color: '#2BE26E', fontSize: 10, fontWeight: '700' },
  chartLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  chartLabel: { flex: 1, color: '#778091', fontSize: 11, textAlign: 'center' },
  chartLabelToday: { color: '#2BE26E', fontWeight: '700' },
};
