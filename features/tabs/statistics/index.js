import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import CustomBottomTabs from '@/components/CustomBottomTabs';
import { apiRequest } from '@/features/common/api/api-client';
import { useAuth } from '@/features/common/auth/auth-context';

import { styles } from './style';

export default function StatisticsTabScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        setLoading(true);
        setError(null);
        if (!token) {
          if (!mounted) return;
          setSummary(null);
          setPerformance([]);
          return;
        }
        const [s, p] = await Promise.all([
          apiRequest('/api/v1/stats/weekly-summary?days=7', { token }),
          apiRequest('/api/v1/stats/course-performance?days=7', { token }),
        ]);
        if (!mounted) return;
        setSummary(s?.summary || null);
        setPerformance(p?.performance?.items || []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Bir hata oluştu.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [token]);

  const weeklyCards = useMemo(() => {
    const studyHours = summary ? Math.round((summary.studyMinutes || 0) / 60) : 0;
    return [
      {
        id: 'study',
        icon: 'time-outline',
        iconColor: '#2BE26E',
        label: 'AKTIF CALISMA',
        value: `${studyHours} Saat`,
      },
      {
        id: 'tests',
        icon: 'checkbox-outline',
        iconColor: '#B683FF',
        label: 'COZULEN TESTLER',
        value: `${summary?.testsSolved || 0} Adet`,
      },
      {
        id: 'xp',
        icon: 'flash-outline',
        iconColor: '#F2D33D',
        label: 'KAZANILAN XP',
        value: `${summary?.xp || 0}`,
      },
    ];
  }, [summary]);

  const courseCards = useMemo(() => {
    // UI colors/icons are placeholders for now.
    const palette = ['#2BE26E', '#B683FF', '#F2D33D'];
    const icons = ['server-outline', 'git-branch-outline', 'bulb-outline'];
    return performance.map((c, idx) => ({
      id: `${c.course}-${idx}`,
      title: c.course,
      score: `%${c.scorePercent}`,
      width: `${c.scorePercent}%`,
      color: palette[idx % palette.length],
      icon: icons[idx % icons.length],
    }));
  }, [performance]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={14} color="#1B132E" />
            </View>
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.title}>Istatistikler</Text>
          <View style={styles.headerActions}>
            <Ionicons name="notifications-outline" size={18} color="#DDE5F3" />
            <Ionicons name="settings-outline" size={18} color="#DDE5F3" />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Haftalik Ozet</Text>
          <View style={styles.sectionLine} />
        </View>

        {!token ? (
          <Text style={styles.sectionHint}>İstatistikleri görmek için giriş yap.</Text>
        ) : loading ? (
          <Text style={styles.sectionHint}>Yukleniyor...</Text>
        ) : error ? (
          <Text style={styles.sectionHint}>{error}</Text>
        ) : null}

        <View style={styles.summaryRow}>
          {weeklyCards.map((item) => (
            <View key={item.id} style={styles.summaryCard}>
              <Ionicons name={item.icon} size={17} color={item.iconColor} />
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Aylik Gelisim Grafigi</Text>
            <View style={styles.chartBadge}>
              <Text style={styles.chartBadgeText}>+12% ARTIS</Text>
            </View>
          </View>
          <View style={styles.chartArea}>
            <View style={[styles.chartBar, styles.barOne]} />
            <View style={[styles.chartBar, styles.barTwo]} />
            <View style={[styles.chartBar, styles.barThree]} />
            <View style={[styles.chartBar, styles.barFour]} />
            <View style={[styles.chartBar, styles.barFive]} />
            <View style={styles.chartCurve} />
            <View style={styles.chartGlow} />
          </View>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>01</Text>
            <Text style={styles.chartLabel}>08</Text>
            <Text style={styles.chartLabel}>15</Text>
            <Text style={styles.chartLabelActive}>22</Text>
            <Text style={styles.chartLabel}>29</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.bigSectionTitle}>Ders Performansi</Text>
          <Text style={styles.sectionHint}>AI DESTEKLI ANALIZ</Text>
        </View>

        {courseCards.length === 0 ? (
          <Text style={styles.sectionHint}>Henuz ders verisi yok.</Text>
        ) : (
          courseCards.map((course) => (
          <View key={course.id} style={styles.performanceCard}>
            <View style={styles.performanceTop}>
              <View style={styles.performanceLeft}>
                <View style={styles.performanceIcon}>
                  <Ionicons name={course.icon} size={16} color={course.color} />
                </View>
                <Text style={styles.performanceTitle}>{course.title}</Text>
              </View>
              <View style={styles.performanceRight}>
                <Text style={[styles.performanceScore, { color: course.color }]}>{course.score}</Text>
                <MaterialCommunityIcons name="robot-outline" size={14} color="#31E56F" />
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: course.width, backgroundColor: course.color }]} />
            </View>
          </View>
          ))
        )}

        <View style={styles.mentorCard}>
          <View style={styles.mentorBadge}>
            <MaterialCommunityIcons name="robot-outline" size={18} color="#EFE6FF" />
          </View>
          <View style={styles.mentorBody}>
            <Text style={styles.mentorHeader}>AI MENTOR ONERISI</Text>
            <View style={styles.mentorMessage}>
              <Text style={styles.mentorText}>
                Berfin, <Text style={styles.mentorHighlight}>Veritabani</Text> konusunda harika bir cikarisin.
                Ancak <Text style={styles.mentorHighlight}>Algoritma</Text> konularina bu hafta biraz daha zaman
                ayirman iyi olur.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <CustomBottomTabs activeRoute="Statistics" />
    </View>
  );
}
