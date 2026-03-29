import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';

import CustomBottomTabs from '@/components/CustomBottomTabs';

import { styles } from './style';

const WEEKLY_SUMMARY = [
  { id: 'study', icon: 'time-outline', iconColor: '#2BE26E', label: 'AKTIF CALISMA', value: '12 Saat' },
  {
    id: 'tests',
    icon: 'checkbox-outline',
    iconColor: '#B683FF',
    label: 'COZULEN TESTLER',
    value: '24 Adet',
  },
  {
    id: 'xp',
    icon: 'flash-outline',
    iconColor: '#F2D33D',
    label: 'KAZANILAN XP',
    value: '1500',
  },
];

const COURSE_PERFORMANCE = [
  { id: 'db', title: 'Veritabani', score: '%85', width: '85%', color: '#2BE26E', icon: 'server-outline' },
  {
    id: 'algo',
    title: 'Algoritma',
    score: '%72',
    width: '72%',
    color: '#B683FF',
    icon: 'git-branch-outline',
  },
  {
    id: 'ai',
    title: 'Yapay Zeka',
    score: '%90',
    width: '90%',
    color: '#2BE26E',
    icon: 'bulb-outline',
  },
];

export default function StatisticsTabScreen() {
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

        <View style={styles.summaryRow}>
          {WEEKLY_SUMMARY.map((item) => (
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

        {COURSE_PERFORMANCE.map((course) => (
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
        ))}

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
