import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import CustomBottomTabs from '@/components/CustomBottomTabs';
import { useAuth } from '@/features/common/auth/auth-context';
import { getApiBaseUrl } from '@/features/common/api/api-client';
import { analyzeDocument, getDocumentAnalysis } from '@/features/common/documents/documents-api';
import { styles } from './style';

const SUMMARY_TABS = [
  { id: 'summary', label: 'Ozet', icon: 'document-text-outline', active: true },
  { id: 'program', label: 'Program', icon: 'calendar-outline' },
  { id: 'test', label: 'Test Coz', icon: 'checkbox-outline' },
  { id: 'info', label: 'Bilgi', icon: 'information-circle-outline' },
];

export default function LibraryDocumentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const fileName = typeof params.name === 'string' ? params.name : 'Belge';
  const documentId = typeof params.id === 'string' ? params.id : null;
  const { token } = useAuth();

  const [analysis, setAnalysis] = useState(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Mevcut analizi yükle
  useEffect(() => {
    if (!documentId || !token) {
      setFetchLoading(false);
      return;
    }
    let mounted = true;
    async function fetchExisting() {
      try {
        const existing = await getDocumentAnalysis({ token, documentId });
        if (mounted) setAnalysis(existing);
      } catch {
        // Analiz yoksa null kalır
      } finally {
        if (mounted) setFetchLoading(false);
      }
    }
    fetchExisting();
    return () => { mounted = false; };
  }, [documentId, token]);

  const onAnalyze = useCallback(async () => {
    if (!documentId || !token) return;
    setAnalyzeLoading(true);
    setAnalyzeError(null);
    try {
      const result = await analyzeDocument({ token, documentId });
      setAnalysis(result?.analysis || null);
    } catch (e) {
      setAnalyzeError(e?.message || 'Analiz başarısız oldu.');
    } finally {
      setAnalyzeLoading(false);
    }
  }, [documentId, token]);

  async function onOpenDocument() {
    if (!documentId || !token) return;
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/v1/documents/${encodeURIComponent(documentId)}/file?token=${encodeURIComponent(token)}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(url);
  }

  const result = analysis?.resultJson ?? null;
  const insights = result?.insights ?? [];
  const keyTerms = result?.keyTerms ?? [];
  const studyPlan = result?.studyPlan ?? [];
  const summary = result?.summary ?? analysis?.summary ?? null;

  function renderAnalysisContent() {
    if (fetchLoading) {
      return (
        <View style={localStyles.centered}>
          <ActivityIndicator color="#2BE26E" />
          <Text style={localStyles.stateText}>Yükleniyor...</Text>
        </View>
      );
    }

    if (analyzeLoading) {
      return (
        <View style={localStyles.centered}>
          <ActivityIndicator color="#2BE26E" size="large" />
          <Text style={localStyles.stateText}>Gemini analiz ediyor...</Text>
          <Text style={localStyles.stateSubtext}>Bu işlem 10–30 saniye sürebilir</Text>
        </View>
      );
    }

    if (!analysis) {
      return (
        <View style={localStyles.emptyWrap}>
          {analyzeError ? (
            <Text style={localStyles.errorText}>{analyzeError}</Text>
          ) : null}
          <View style={localStyles.emptyCard}>
            <View style={localStyles.emptyIconWrap}>
              <MaterialCommunityIcons name="robot-outline" size={32} color="#2BE26E" />
            </View>
            <Text style={localStyles.emptyTitle}>Henüz analiz yapılmadı</Text>
            <Text style={localStyles.emptyBody}>
              Yapay zeka bu belgeyi analiz edip özet, anahtar terimler ve çalışma planı oluşturacak.
            </Text>
            <Pressable style={localStyles.analyzeButton} onPress={onAnalyze}>
              <MaterialCommunityIcons name="robot-outline" size={18} color="#0E331C" />
              <Text style={localStyles.analyzeButtonText}>Analiz Et</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <>
        {/* Özet */}
        {summary ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ozet</Text>
              <Pressable onPress={onAnalyze} style={localStyles.reanalyzeBtn}>
                <Text style={localStyles.reanalyzeBtnText}>Yenile</Text>
              </Pressable>
            </View>
            <View style={localStyles.summaryCard}>
              <Text style={localStyles.summaryText}>{summary}</Text>
            </View>
          </>
        ) : null}

        {/* Hap Bilgiler */}
        {insights.length > 0 ? (
          <>
            <View style={[styles.sectionHeader, { marginTop: 16 }]}>
              <Text style={styles.sectionTitle}>Hap Bilgiler</Text>
              <Text style={styles.sectionLink}>AI ONERILERI</Text>
            </View>
            {insights.map((item, i) => (
              <View key={i} style={styles.insightCard}>
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
          </>
        ) : null}

        {/* Anahtar Terimler */}
        {keyTerms.length > 0 ? (
          <>
            <Text style={[styles.toolsTitle, { marginTop: 16 }]}>Anahtar Terimler</Text>
            <View style={localStyles.termsWrap}>
              {keyTerms.map((term, i) => (
                <View key={i} style={localStyles.termChip}>
                  <Text style={localStyles.termText}>{term}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Çalışma Planı */}
        {studyPlan.length > 0 ? (
          <>
            <Text style={[styles.toolsTitle, { marginTop: 16 }]}>Calisma Plani</Text>
            {studyPlan.map((step, i) => (
              <View key={i} style={localStyles.planRow}>
                <View style={localStyles.planDot} />
                <Text style={localStyles.planText}>{step}</Text>
              </View>
            ))}
          </>
        ) : null}
      </>
    );
  }

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
          {documentId && token ? (
            <Pressable onPress={onOpenDocument} style={{ marginLeft: 10 }}>
              <Text style={{ color: '#2BE26E', fontWeight: '800' }}>Aç</Text>
            </Pressable>
          ) : null}
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

        {renderAnalysisContent()}

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

const localStyles = {
  centered: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  stateText: {
    color: '#D9E1EF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  stateSubtext: {
    color: '#778091',
    fontSize: 13,
    marginTop: 4,
  },
  emptyWrap: {
    marginTop: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: '#151A23',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(43, 226, 110, 0.2)',
    padding: 24,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(43, 226, 110, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(43, 226, 110, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#EEF3FF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyBody: {
    color: '#778091',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2BE26E',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
  },
  analyzeButtonText: {
    color: '#0E331C',
    fontSize: 16,
    fontWeight: '800',
  },
  reanalyzeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(43, 226, 110, 0.4)',
  },
  reanalyzeBtnText: {
    color: '#2BE26E',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#151A23',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#202838',
    padding: 16,
    marginBottom: 4,
  },
  summaryText: {
    color: '#D0D8EA',
    fontSize: 15,
    lineHeight: 22,
  },
  termsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  termChip: {
    backgroundColor: 'rgba(163, 135, 255, 0.15)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(163, 135, 255, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  termText: {
    color: '#B683FF',
    fontSize: 13,
    fontWeight: '600',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  planDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2BE26E',
    marginTop: 6,
  },
  planText: {
    color: '#D0D8EA',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
};
