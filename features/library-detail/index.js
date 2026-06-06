import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import CustomBottomTabs from '@/components/CustomBottomTabs';
import { useAuth } from '@/features/common/auth/auth-context';
import { getApiBaseUrl } from '@/features/common/api/api-client';
import {
  analyzeDocument,
  generateTargetedQuiz,
  getDocumentAnalysis,
} from '@/features/common/documents/documents-api';
import { logActivity } from '@/features/common/stats/stats-api';
import { styles } from './style';

const TABS = [
  { id: 'summary', label: 'Ozet', icon: 'document-text-outline' },
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

  const [activeTab, setActiveTab] = useState('summary');
  const [analysis, setAnalysis] = useState(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Quiz state
  const [activeQuizQuestions, setActiveQuizQuestions] = useState(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizRound, setQuizRound] = useState(1);
  const [targetedLoading, setTargetedLoading] = useState(false);
  const [targetedError, setTargetedError] = useState(null);

  // Flashcard state
  const [cardIndex, setCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  useEffect(() => {
    if (!documentId || !token) { setFetchLoading(false); return; }
    let mounted = true;
    async function fetchExisting() {
      try {
        const existing = await getDocumentAnalysis({ token, documentId });
        if (mounted) setAnalysis(existing);
      } catch { /* analiz yoksa null */ }
      finally { if (mounted) setFetchLoading(false); }
    }
    fetchExisting();
    return () => { mounted = false; };
  }, [documentId, token]);

  const onAnalyze = useCallback(async () => {
    if (!documentId || !token) return;
    setAnalyzeLoading(true);
    setAnalyzeError(null);
    resetQuiz();
    try {
      const result = await analyzeDocument({ token, documentId });
      setAnalysis(result?.analysis || null);
      setActiveQuizQuestions(null);
    } catch (e) {
      setAnalyzeError(e?.message || 'Analiz başarısız oldu.');
    } finally {
      setAnalyzeLoading(false);
    }
  }, [documentId, token]);

  function resetQuiz(newQuestions) {
    setQuizIndex(0);
    setSelectedAnswers({});
    setQuizFinished(false);
    setTargetedError(null);
    if (newQuestions !== undefined) setActiveQuizQuestions(newQuestions);
  }

  async function onGenerateTargetedQuiz(wrongItems) {
    if (!documentId || !token || wrongItems.length === 0) return;
    setTargetedLoading(true);
    setTargetedError(null);
    try {
      const wrongQuestions = wrongItems.map((item) => ({
        question: item.question,
        correctAnswer: item.options[item.correctIndex]?.replace(/^[A-D]\)\s*/, '') ?? '',
      }));
      const newQuestions = await generateTargetedQuiz({ token, documentId, wrongQuestions });
      setQuizRound((r) => r + 1);
      resetQuiz(newQuestions);
    } catch (e) {
      setTargetedError(e?.message || 'Sorular oluşturulamadı.');
    } finally {
      setTargetedLoading(false);
    }
  }

  async function onOpenDocument() {
    if (!documentId || !token) return;
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/v1/documents/${encodeURIComponent(documentId)}/file?token=${encodeURIComponent(token)}`;
    if (Platform.OS === 'web') {
      // window.open popup engellenebilir; anchor click daha güvenilir
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    await Linking.openURL(url);
  }

  const result = analysis?.resultJson ?? null;
  const insights = result?.insights ?? [];
  const keyTerms = result?.keyTerms ?? [];
  const studyPlan = result?.studyPlan ?? [];
  const summary = result?.summary ?? analysis?.summary ?? null;
  const quizQuestions = activeQuizQuestions ?? result?.quizQuestions ?? [];
  const flashcards = result?.flashcards ?? [];

  // ─── TAB: ÖZET ────────────────────────────────────────────────
  function renderSummaryTab() {
    return (
      <>
        {summary ? (
          <>
            <View style={s.sectionRow}>
              <Text style={styles.sectionTitle}>Genel Ozet</Text>
              <Pressable onPress={onAnalyze} style={s.reanalyzeBtn}>
                <Text style={s.reanalyzeBtnText}>Yenile</Text>
              </Pressable>
            </View>
            <View style={s.summaryCard}>
              <Text style={s.summaryText}>{summary}</Text>
            </View>
          </>
        ) : null}
        {insights.length > 0 ? (
          <>
            <View style={[s.sectionRow, { marginTop: 18 }]}>
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
        {keyTerms.length > 0 ? (
          <>
            <Text style={[styles.toolsTitle, { marginTop: 18 }]}>Anahtar Terimler</Text>
            <View style={s.termsWrap}>
              {keyTerms.map((term, i) => (
                <View key={i} style={s.termChip}>
                  <Text style={s.termText}>{term}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </>
    );
  }

  // ─── TAB: PROGRAM ─────────────────────────────────────────────
  function renderProgramTab() {
    if (studyPlan.length === 0) return <Text style={s.emptyTabText}>Program oluşturulmadı. Belgeyi analiz et.</Text>;
    return (
      <>
        <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Calisma Plani</Text>
        {studyPlan.map((step, i) => (
          <View key={i} style={s.planCard}>
            <View style={s.planBadge}>
              <Text style={s.planBadgeText}>{i + 1}</Text>
            </View>
            <Text style={s.planCardText}>{step}</Text>
          </View>
        ))}
      </>
    );
  }

  // ─── TAB: TEST ÇÖZ ────────────────────────────────────────────
  function renderTestTab() {
    if (quizQuestions.length === 0) return <Text style={s.emptyTabText}>Quiz soruları bulunamadı. Belgeyi analiz et.</Text>;

    if (quizFinished) {
      const wrongItems = quizQuestions.filter((q, i) => selectedAnswers[i] !== q.correctIndex);
      const correctCount = quizQuestions.length - wrongItems.length;
      const pct = Math.round((correctCount / quizQuestions.length) * 100);
      const isTargeted = quizRound > 1;

      return (
        <View>
          <View style={s.quizResultHeader}>
            <View style={[
              s.quizScoreCircle,
              pct >= 80 ? s.quizScoreCircleGood : pct >= 50 ? s.quizScoreCircleMid : s.quizScoreCircleBad,
            ]}>
              <Text style={s.quizScoreNum}>{pct}%</Text>
              <Text style={s.quizScoreLabel}>Başarı</Text>
            </View>
            <View style={s.quizResultMeta}>
              <Text style={s.quizResultTitle}>
                {isTargeted ? `Hedefli Tekrar — Tur ${quizRound - 1}` : 'Quiz Tamamlandı'}
              </Text>
              <Text style={s.quizResultSub}>{correctCount} doğru · {wrongItems.length} yanlış · {quizQuestions.length} soru</Text>
              {pct === 100 && <Text style={s.quizPerfect}>Mükemmel! Tüm sorular doğru.</Text>}
            </View>
          </View>

          {wrongItems.length > 0 ? (
            <>
              <View style={[s.sectionRow, { marginTop: 20 }]}>
                <Text style={s.wrongTitle}>Yanlış Cevaplar</Text>
                <View style={s.wrongBadge}>
                  <Text style={s.wrongBadgeText}>{wrongItems.length} konu eksik</Text>
                </View>
              </View>
              {wrongItems.map((q, idx) => {
                const qIdx = quizQuestions.indexOf(q);
                const userAnswerIdx = selectedAnswers[qIdx];
                return (
                  <View key={idx} style={s.wrongCard}>
                    <Text style={s.wrongQuestion}>{q.question}</Text>
                    <View style={s.wrongAnswerRow}>
                      <View style={s.wrongAnswerItem}>
                        <View style={s.wrongDot} />
                        <Text style={s.wrongAnswerLabel}>Senin cevabın: </Text>
                        <Text style={s.wrongAnswerBad}>
                          {userAnswerIdx !== undefined
                            ? q.options[userAnswerIdx]?.replace(/^[A-D]\)\s*/, '') ?? '-'
                            : 'Boş'}
                        </Text>
                      </View>
                      <View style={s.wrongAnswerItem}>
                        <View style={s.correctDot} />
                        <Text style={s.wrongAnswerLabel}>Doğru cevap: </Text>
                        <Text style={s.wrongAnswerGood}>
                          {q.options[q.correctIndex]?.replace(/^[A-D]\)\s*/, '') ?? '-'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              <View style={s.targetedSection}>
                <MaterialCommunityIcons name="target" size={20} color="#F2D33D" />
                <Text style={s.targetedSectionTitle}>{wrongItems.length} konuda eksiğin var</Text>
                <Text style={s.targetedSectionBody}>Gemini bu konulara özel yeni sorular üretecek</Text>
                {targetedError ? <Text style={s.errorText}>{targetedError}</Text> : null}
                <Pressable
                  style={[s.targetedBtn, targetedLoading && s.targetedBtnLoading]}
                  disabled={targetedLoading}
                  onPress={() => onGenerateTargetedQuiz(wrongItems)}>
                  {targetedLoading ? (
                    <>
                      <ActivityIndicator color="#0E331C" size="small" />
                      <Text style={s.targetedBtnText}>Sorular Hazırlanıyor...</Text>
                    </>
                  ) : (
                    <>
                      <MaterialCommunityIcons name="robot-outline" size={18} color="#0E331C" />
                      <Text style={s.targetedBtnText}>Eksik Konulara Göre Yeni Sorular Üret</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </>
          ) : null}

          <Pressable
            style={s.quizRestartBtn}
            onPress={() => { resetQuiz(null); setQuizRound(1); }}>
            <Ionicons name="refresh" size={16} color="#A7AFBD" />
            <Text style={s.quizRestartBtnText}>Baştan Başla</Text>
          </Pressable>
        </View>
      );
    }

    const q = quizQuestions[quizIndex];
    const selected = selectedAnswers[quizIndex];
    const answered = selected !== undefined;

    return (
      <>
        <View style={s.quizProgress}>
          <View style={s.quizProgressHeader}>
            <Text style={s.quizProgressText}>
              {quizRound > 1 ? `Hedefli Tur ${quizRound - 1} — ` : ''}Soru {quizIndex + 1} / {quizQuestions.length}
            </Text>
            {quizRound > 1 && (
              <View style={s.targetedPill}>
                <MaterialCommunityIcons name="target" size={12} color="#F2D33D" />
                <Text style={s.targetedPillText}>Hedefli</Text>
              </View>
            )}
          </View>
          <View style={s.quizProgressBar}>
            <View style={[s.quizProgressFill, { width: `${((quizIndex + (answered ? 1 : 0)) / quizQuestions.length) * 100}%` }]} />
          </View>
        </View>

        <View style={s.quizCard}>
          <MaterialCommunityIcons name="help-circle-outline" size={22} color="#A387FF" style={{ marginBottom: 10 }} />
          <Text style={s.quizQuestion}>{q.question}</Text>
        </View>

        {q.options.map((opt, oi) => {
          let optStyle = s.quizOption;
          let optTextStyle = s.quizOptionText;
          if (answered) {
            if (oi === q.correctIndex) { optStyle = s.quizOptionCorrect; optTextStyle = s.quizOptionTextCorrect; }
            else if (oi === selected) { optStyle = s.quizOptionWrong; optTextStyle = s.quizOptionTextWrong; }
          } else if (oi === selected) {
            optStyle = s.quizOptionSelected;
          }
          return (
            <Pressable
              key={oi}
              style={optStyle}
              disabled={answered}
              onPress={() => setSelectedAnswers(prev => ({ ...prev, [quizIndex]: oi }))}>
              <Text style={s.quizOptionLabel}>{String.fromCharCode(65 + oi)}</Text>
              <Text style={[optTextStyle, { flex: 1 }]}>{opt.replace(/^[A-D]\)\s*/, '')}</Text>
              {answered && oi === q.correctIndex && <Ionicons name="checkmark-circle" size={18} color="#2BE26E" />}
              {answered && oi === selected && oi !== q.correctIndex && <Ionicons name="close-circle" size={18} color="#FF6B6B" />}
            </Pressable>
          );
        })}

        {answered ? (
          <Pressable
            style={s.quizNextBtn}
            onPress={async () => {
              if (quizIndex < quizQuestions.length - 1) {
                setQuizIndex(i => i + 1);
              } else {
                setQuizFinished(true);
                // selectedAnswers zaten son cevabı da içeriyor (seçeneke basıldığında set edildi)
                const correctCount = quizQuestions.filter(
                  (q, i) => selectedAnswers[i] === q.correctIndex
                ).length;
                await Promise.all([
                  logActivity({ token, type: 'test', count: correctCount, course: fileName }),
                  correctCount > 0
                    ? logActivity({ token, type: 'xp', xp: correctCount * 10, course: fileName })
                    : null,
                ].filter(Boolean));
              }
            }}>
            <Text style={s.quizNextBtnText}>
              {quizIndex < quizQuestions.length - 1 ? 'Sonraki Soru' : 'Sonucu Göster'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#0E331C" />
          </Pressable>
        ) : null}
      </>
    );
  }

  // ─── TAB: BİLGİ (Flashcards) ──────────────────────────────────
  function renderInfoTab() {
    if (flashcards.length === 0) return <Text style={s.emptyTabText}>Flashcard bulunamadı. Belgeyi analiz et.</Text>;
    const card = flashcards[cardIndex];
    return (
      <>
        <Text style={[styles.sectionTitle, { marginBottom: 6 }]}>Sozu Kartlari</Text>
        <Text style={s.cardCountText}>{cardIndex + 1} / {flashcards.length}</Text>
        <Pressable
          style={[s.flashcard, cardFlipped && s.flashcardFlipped]}
          onPress={() => setCardFlipped(f => !f)}>
          {!cardFlipped ? (
            <>
              <MaterialCommunityIcons name="cards-outline" size={28} color="#A387FF" style={{ marginBottom: 14 }} />
              <Text style={s.flashcardTerm}>{card.term}</Text>
              <Text style={s.flashcardHint}>Cevabı görmek için dokun</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="lightbulb-outline" size={28} color="#2BE26E" style={{ marginBottom: 14 }} />
              <Text style={s.flashcardTermSmall}>{card.term}</Text>
              <Text style={s.flashcardDefinition}>{card.definition}</Text>
            </>
          )}
        </Pressable>
        <View style={s.cardNav}>
          <Pressable
            style={[s.cardNavBtn, cardIndex === 0 && s.cardNavBtnDisabled]}
            disabled={cardIndex === 0}
            onPress={() => { setCardIndex(i => i - 1); setCardFlipped(false); }}>
            <Ionicons name="arrow-back" size={20} color={cardIndex === 0 ? '#3A4152' : '#D9E1EF'} />
            <Text style={[s.cardNavText, cardIndex === 0 && s.cardNavTextDisabled]}>Önceki</Text>
          </Pressable>
          <View style={s.cardDots}>
            {flashcards.map((_, i) => (
              <View key={i} style={[s.dot, i === cardIndex && s.dotActive]} />
            ))}
          </View>
          <Pressable
            style={[s.cardNavBtn, cardIndex === flashcards.length - 1 && s.cardNavBtnDisabled]}
            disabled={cardIndex === flashcards.length - 1}
            onPress={() => { setCardIndex(i => i + 1); setCardFlipped(false); }}>
            <Text style={[s.cardNavText, cardIndex === flashcards.length - 1 && s.cardNavTextDisabled]}>Sonraki</Text>
            <Ionicons name="arrow-forward" size={20} color={cardIndex === flashcards.length - 1 ? '#3A4152' : '#D9E1EF'} />
          </Pressable>
        </View>
      </>
    );
  }

  // ─── ANA İÇERİK ───────────────────────────────────────────────
  function renderContent() {
    if (fetchLoading) {
      return (
        <View style={s.centered}>
          <ActivityIndicator color="#2BE26E" />
          <Text style={s.stateText}>Yükleniyor...</Text>
        </View>
      );
    }
    if (analyzeLoading) {
      return (
        <View style={s.centered}>
          <ActivityIndicator color="#2BE26E" size="large" />
          <Text style={s.stateText}>Gemini analiz ediyor...</Text>
          <Text style={s.stateSubtext}>Bu işlem 10–30 saniye sürebilir</Text>
        </View>
      );
    }
    if (!analysis) {
      return (
        <View style={s.emptyWrap}>
          {analyzeError ? <Text style={s.errorText}>{analyzeError}</Text> : null}
          <View style={s.emptyCard}>
            <View style={s.emptyIconWrap}>
              <MaterialCommunityIcons name="robot-outline" size={32} color="#2BE26E" />
            </View>
            <Text style={s.emptyTitle}>Henüz analiz yapılmadı</Text>
            <Text style={s.emptyBody}>
              Yapay zeka bu belgeyi analiz edip özet, quiz soruları ve flashcard'lar oluşturacak.
            </Text>
            <Pressable style={s.analyzeButton} onPress={onAnalyze}>
              <MaterialCommunityIcons name="robot-outline" size={18} color="#0E331C" />
              <Text style={s.analyzeButtonText}>Analiz Et</Text>
            </Pressable>
          </View>
        </View>
      );
    }
    switch (activeTab) {
      case 'summary': return renderSummaryTab();
      case 'program': return renderProgramTab();
      case 'test': return renderTestTab();
      case 'info': return renderInfoTab();
      default: return null;
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          <Text style={styles.fileTagText} numberOfLines={1}>Belge: {fileName}</Text>
          {documentId && token ? (
            <Pressable onPress={onOpenDocument} style={{ marginLeft: 10 }}>
              <Text style={{ color: '#2BE26E', fontWeight: '800' }}>Aç</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={styles.tabItem}
                onPress={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'info') setCardFlipped(false);
                }}>
                <Ionicons name={tab.icon} size={14} color={isActive ? '#2BE26E' : '#7E8592'} style={styles.tabIcon} />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
                {isActive ? <View style={styles.tabIndicator} /> : null}
              </Pressable>
            );
          })}
        </View>

        {renderContent()}

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

const s = StyleSheet.create({
  // Genel
  centered: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  stateText: { color: '#D9E1EF', fontSize: 16, fontWeight: '600', marginTop: 12 },
  stateSubtext: { color: '#778091', fontSize: 13, marginTop: 4 },
  emptyTabText: { color: '#778091', fontSize: 14, textAlign: 'center', marginTop: 40 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  errorText: { color: '#FF6B6B', fontSize: 14, marginBottom: 8, textAlign: 'center' },

  // Boş durum
  emptyWrap: { marginTop: 8 },
  emptyCard: { backgroundColor: '#151A23', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(43,226,110,0.2)', padding: 24, alignItems: 'center' },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(43,226,110,0.1)', borderWidth: 1, borderColor: 'rgba(43,226,110,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { color: '#EEF3FF', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyBody: { color: '#778091', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  analyzeButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2BE26E', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999 },
  analyzeButtonText: { color: '#0E331C', fontSize: 16, fontWeight: '800' },

  // Özet sekmesi
  reanalyzeBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(43,226,110,0.4)' },
  reanalyzeBtnText: { color: '#2BE26E', fontSize: 12, fontWeight: '700' },
  summaryCard: { backgroundColor: '#151A23', borderRadius: 14, borderWidth: 1, borderColor: '#202838', padding: 16, marginBottom: 4 },
  summaryText: { color: '#D0D8EA', fontSize: 15, lineHeight: 22 },
  termsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  termChip: { backgroundColor: 'rgba(163,135,255,0.15)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(163,135,255,0.35)', paddingHorizontal: 14, paddingVertical: 6 },
  termText: { color: '#B683FF', fontSize: 13, fontWeight: '600' },

  // Program sekmesi
  planCard: { backgroundColor: '#151A23', borderRadius: 14, borderWidth: 1, borderColor: '#202838', padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  planBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(43,226,110,0.15)', borderWidth: 1, borderColor: 'rgba(43,226,110,0.4)', alignItems: 'center', justifyContent: 'center' },
  planBadgeText: { color: '#2BE26E', fontSize: 13, fontWeight: '800' },
  planCardText: { color: '#D0D8EA', fontSize: 14, lineHeight: 20, flex: 1 },

  // Quiz — aktif soru
  quizProgress: { marginBottom: 16 },
  quizProgressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  quizProgressText: { color: '#778091', fontSize: 13, fontWeight: '600' },
  quizProgressBar: { height: 4, borderRadius: 2, backgroundColor: '#1E2633' },
  quizProgressFill: { height: 4, borderRadius: 2, backgroundColor: '#2BE26E' },
  quizCard: { backgroundColor: '#151A23', borderRadius: 16, borderWidth: 1, borderColor: '#202838', padding: 20, marginBottom: 14, alignItems: 'center' },
  quizQuestion: { color: '#EEF3FF', fontSize: 17, fontWeight: '700', textAlign: 'center', lineHeight: 24 },
  quizOption: { backgroundColor: '#1A1F2B', borderRadius: 12, borderWidth: 1, borderColor: '#262F3E', padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  quizOptionSelected: { backgroundColor: '#1A1F2B', borderRadius: 12, borderWidth: 1.5, borderColor: '#A387FF', padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  quizOptionCorrect: { backgroundColor: 'rgba(43,226,110,0.12)', borderRadius: 12, borderWidth: 1.5, borderColor: '#2BE26E', padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  quizOptionWrong: { backgroundColor: 'rgba(255,107,107,0.1)', borderRadius: 12, borderWidth: 1.5, borderColor: '#FF6B6B', padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  quizOptionLabel: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#2A3040', color: '#A7AFBD', fontSize: 13, fontWeight: '800', textAlign: 'center', lineHeight: 24 },
  quizOptionText: { color: '#D0D8EA', fontSize: 14 },
  quizOptionTextCorrect: { color: '#2BE26E', fontSize: 14, fontWeight: '700' },
  quizOptionTextWrong: { color: '#FF6B6B', fontSize: 14 },
  quizNextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2BE26E', borderRadius: 999, paddingVertical: 14, marginTop: 4 },
  quizNextBtnText: { color: '#0E331C', fontSize: 15, fontWeight: '800' },

  // Quiz — sonuç ekranı
  quizResultHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 4 },
  quizResultMeta: { flex: 1 },
  quizResultTitle: { color: '#EEF3FF', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  quizResultSub: { color: '#778091', fontSize: 13 },
  quizPerfect: { color: '#2BE26E', fontSize: 13, fontWeight: '700', marginTop: 4 },
  quizScoreCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  quizScoreCircleGood: { backgroundColor: 'rgba(43,226,110,0.12)', borderColor: '#2BE26E' },
  quizScoreCircleMid: { backgroundColor: 'rgba(242,211,61,0.12)', borderColor: '#F2D33D' },
  quizScoreCircleBad: { backgroundColor: 'rgba(255,107,107,0.12)', borderColor: '#FF6B6B' },
  quizScoreNum: { color: '#EEF3FF', fontSize: 22, fontWeight: '900' },
  quizScoreLabel: { color: '#778091', fontSize: 11 },
  quizRestartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#2A3040', borderRadius: 999, paddingVertical: 12, marginTop: 16 },
  quizRestartBtnText: { color: '#778091', fontSize: 14, fontWeight: '600' },

  // Yanlış analiz
  wrongTitle: { color: '#EEF3FF', fontSize: 18, fontWeight: '800' },
  wrongBadge: { backgroundColor: 'rgba(255,107,107,0.15)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,107,107,0.35)' },
  wrongBadgeText: { color: '#FF6B6B', fontSize: 12, fontWeight: '700' },
  wrongCard: { backgroundColor: '#16111E', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,107,107,0.2)', padding: 14, marginBottom: 10 },
  wrongQuestion: { color: '#D0D8EA', fontSize: 14, fontWeight: '600', marginBottom: 10, lineHeight: 20 },
  wrongAnswerRow: { gap: 6 },
  wrongAnswerItem: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  wrongDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B6B' },
  correctDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2BE26E' },
  wrongAnswerLabel: { color: '#778091', fontSize: 13 },
  wrongAnswerBad: { color: '#FF6B6B', fontSize: 13, fontWeight: '700' },
  wrongAnswerGood: { color: '#2BE26E', fontSize: 13, fontWeight: '700' },

  // Hedefli quiz
  targetedSection: { backgroundColor: 'rgba(242,211,61,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(242,211,61,0.25)', padding: 20, alignItems: 'center', marginTop: 20, gap: 8 },
  targetedSectionTitle: { color: '#F2D33D', fontSize: 16, fontWeight: '800' },
  targetedSectionBody: { color: '#9AA3B5', fontSize: 13, textAlign: 'center' },
  targetedBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2BE26E', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 999, marginTop: 4 },
  targetedBtnLoading: { opacity: 0.7 },
  targetedBtnText: { color: '#0E331C', fontSize: 14, fontWeight: '800' },
  targetedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(242,211,61,0.15)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(242,211,61,0.3)' },
  targetedPillText: { color: '#F2D33D', fontSize: 11, fontWeight: '700' },

  // Flashcard
  cardCountText: { color: '#778091', fontSize: 13, marginBottom: 14 },
  flashcard: { backgroundColor: '#151A23', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(163,135,255,0.3)', minHeight: 200, padding: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  flashcardFlipped: { backgroundColor: '#101A14', borderColor: 'rgba(43,226,110,0.4)' },
  flashcardTerm: { color: '#EEF3FF', fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  flashcardHint: { color: '#3A4860', fontSize: 13 },
  flashcardTermSmall: { color: '#778091', fontSize: 14, fontWeight: '600', marginBottom: 10 },
  flashcardDefinition: { color: '#D0D8EA', fontSize: 17, fontWeight: '500', textAlign: 'center', lineHeight: 26 },
  cardNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardNavBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10 },
  cardNavBtnDisabled: { opacity: 0.3 },
  cardNavText: { color: '#D9E1EF', fontSize: 14, fontWeight: '600' },
  cardNavTextDisabled: { color: '#3A4152' },
  cardDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2A3040' },
  dotActive: { backgroundColor: '#2BE26E', width: 16, borderRadius: 3 },
});
