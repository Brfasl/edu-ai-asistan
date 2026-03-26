import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import CustomBottomTabs from '@/components/CustomBottomTabs';
import { styles } from './style';

const QUICK_INSIGHTS = [
  {
    id: 'sorting',
    title: 'Siralama Algoritmalari',
    body: 'QuickSort ve MergeSort karsilastirmasi. Ortalama O(n log n) performansi.',
  },
  {
    id: 'structures',
    title: 'Veri Yapilari',
    body: 'Heap ve agac yapilarinin temel ozellikleri. Hangi senaryoda ne secilmeli?',
  },
  {
    id: 'analysis',
    title: 'Karmasiklik Analizi',
    body: 'Big O notasyonuna giris. Zaman ve alan karmasikligini ayri degerlendir.',
  },
];

const TOOL_CARDS = [
  {
    id: 'plan',
    title: '7 Gunluk Calisma Plani',
    subtitle: 'GOZ AT',
    icon: 'calendar-outline',
    iconColor: '#B683FF',
  },
  {
    id: 'quiz',
    title: 'Coktan Secmeli Sorular',
    subtitle: 'XP +10',
    icon: 'help-circle-outline',
    iconColor: '#2BE26E',
  },
  {
    id: 'terms',
    title: 'Onemli Terimler',
    subtitle: 'Flashcards',
    icon: 'book-outline',
    iconColor: '#A387FF',
  },
];

const SUMMARY_TABS = [
  { id: 'summary', label: 'Ozet', icon: 'document-text-outline', active: true },
  { id: 'program', label: 'Program', icon: 'calendar-outline' },
  { id: 'test', label: 'Test Coz', icon: 'checkbox-outline' },
  { id: 'info', label: 'Bilgi', icon: 'information-circle-outline' },
];

export default function LibraryDocumentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const fileName = typeof params.name === 'string' ? params.name : 'Algoritma_Final_Ozet.pdf';

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={18} color="#D7DEEA" />
          </Pressable>
          <Text style={styles.title}>Akilli Calisma Odasi</Text>
          <View style={styles.headerActions}>
            <Ionicons name="notifications-outline" size={18} color="#2BE26E" />
            <Ionicons name="settings-outline" size={18} color="#2BE26E" />
          </View>
        </View>

        <View style={styles.fileTag}>
          <Ionicons name="document-text-outline" size={18} color="#2BE26E" />
          <Text style={styles.fileTagText} numberOfLines={1}>
            Belge: {fileName}
          </Text>
        </View>

        <View style={styles.tabsRow}>
          {SUMMARY_TABS.map((tab) => {
            const isActive = Boolean(tab.active);
            return (
              <Pressable key={tab.id} style={styles.tabItem}>
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={isActive ? '#2BE26E' : '#7E8592'}
                  style={styles.tabIcon}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
                {isActive ? <View style={styles.tabIndicator} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hap Bilgiler</Text>
          <Text style={styles.sectionLink}>AI ONERILERI</Text>
        </View>

        {QUICK_INSIGHTS.map((item) => (
          <View key={item.id} style={styles.insightCard}>
            <View style={styles.insightAccent} />
            <View style={styles.insightContent}>
              <View style={styles.insightIconWrap}>
                <MaterialCommunityIcons name="robot-outline" size={16} color="#2BE26E" />
              </View>
              <View style={styles.insightTextWrap}>
                <Text style={styles.insightTitle}>{item.title}</Text>
                <Text style={styles.insightBody}>{item.body}</Text>
              </View>
            </View>
          </View>
        ))}

        <Text style={styles.toolsTitle}>Etkilesimli Araclar</Text>

        {TOOL_CARDS.map((item) => (
          <Pressable key={item.id} style={styles.toolCard}>
            <View style={styles.toolCardLeft}>
              <View style={[styles.toolIconWrap, { backgroundColor: `${item.iconColor}1A` }]}>
                <Ionicons name={item.icon} size={18} color={item.iconColor} />
              </View>
              <View>
                <Text style={styles.toolTitle}>{item.title}</Text>
                <Text style={styles.toolSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7E8592" />
          </Pressable>
        ))}

        <View style={styles.chatFloating}>
          <Text style={styles.chatBubble}>Merhaba! Sorun var mi?</Text>
          <Pressable style={styles.chatButton}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#1A112B" />
          </Pressable>
        </View>
      </ScrollView>

      <CustomBottomTabs activeRoute="Library" />
    </View>
  );
}
