import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import CustomBottomTabs from '@/components/CustomBottomTabs';
import { useAuth } from '@/features/common/auth/auth-context';
import { getProfileStats, chatWithAI } from '@/features/common/stats/stats-api';

// ── Storage (web: localStorage, native: in-memory) ────────────
const storage = {
  get(key) {
    try {
      if (typeof localStorage !== 'undefined') {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : null;
      }
    } catch { }
    return null;
  },
  set(key, value) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch { }
  },
};

const GOALS_KEY = 'edu_goals_v1';
const CHAT_KEY  = 'edu_chat_v1';

const GOAL_COLORS = ['#2BE26E', '#4FC3F7', '#B683FF', '#F2D33D', '#FF8A3D', '#FF6B6B'];
const GOAL_EMOJIS = ['📚', '✍️', '🧪', '🔢', '🌍', '💻', '🎨', '🏋️'];

const QUICK_PROMPTS = [
  'Sınavıma nasıl hazırlanmalıyım?',
  'Bana günlük çalışma programı hazırla',
  'Motive olmam için ne yapmalıyım?',
  'Pomodoro tekniğini nasıl kullanmalıyım?',
  'Bu hafta hangi konulara odaklanmalıyım?',
];

function daysLeftCalc(examDate) {
  const diff = new Date(examDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function hoursLeftCalc(examDate) {
  const diff = new Date(examDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function greetingText(name) {
  const h = new Date().getHours();
  const prefix = h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar';
  return `${prefix}, ${name}!`;
}

function formatDate() {
  return new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatExamDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
}

let _msgId = 0;
function newId() { return `m${++_msgId}`; }

// ── Web date picker bileşeni ───────────────────────────────────
function DatePicker({ value, onChange }) {
  if (Platform.OS === 'web') {
    return (
      <View style={dp.wrap}>
        {/* @ts-ignore */}
        <input
          type="date"
          value={value}
          min={todayStr()}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#0F1319',
            color: value ? '#EEF3FF' : '#3A4860',
            border: '1px solid #2A3344',
            borderRadius: 10,
            fontSize: 15,
            padding: '12px 14px',
            outline: 'none',
            colorScheme: 'dark',
            fontFamily: 'inherit',
          }}
        />
      </View>
    );
  }
  // native fallback
  return (
    <TextInput
      style={dp.input}
      placeholder="YYYY-MM-DD"
      placeholderTextColor="#3A4860"
      value={value}
      onChangeText={onChange}
      keyboardType="numeric"
    />
  );
}

const dp = StyleSheet.create({
  wrap: { width: '100%' },
  input: { backgroundColor: '#0F1319', borderRadius: 10, borderWidth: 1, borderColor: '#2A3344', color: '#EEF3FF', fontSize: 15, paddingHorizontal: 14, paddingVertical: 12 },
});

// ── Hedef Detay Modal ──────────────────────────────────────────
function GoalDetailModal({ goal, onClose, onDelete, onAskAI }) {
  if (!goal) return null;
  const dl = daysLeftCalc(goal.examDate);
  const hl = hoursLeftCalc(goal.examDate);
  const isToday = dl === 0;
  const isUrgent = dl <= 3 && dl > 0;

  // İlerleme hesabı: hedef eklendiğinden bu yana geçen yüzde
  const addedAt = goal.addedAt ? new Date(goal.addedAt) : new Date(Date.now() - 7 * 86400000);
  const total = Math.max(1, new Date(goal.examDate) - addedAt);
  const passed = Math.max(0, Date.now() - addedAt);
  const pct = Math.min(100, Math.round((passed / total) * 100));

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={md.overlay} onPress={onClose} />
      <View style={md.sheet}>
        {/* Handle */}
        <View style={md.handle} />

        {/* Üst kısım */}
        <View style={md.topRow}>
          <Text style={{ fontSize: 36 }}>{goal.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={md.title}>{goal.title}</Text>
            <Text style={md.dateText}>{formatExamDate(goal.examDate)}</Text>
          </View>
          <Pressable onPress={onClose} style={md.closeBtn}>
            <Ionicons name="close" size={20} color="#778091" />
          </Pressable>
        </View>

        {/* Geri sayım */}
        <View style={[md.countdownBox, { borderColor: goal.color + '40', backgroundColor: goal.color + '0D' }]}>
          {isToday ? (
            <>
              <Text style={[md.countdownMain, { color: '#FF6B6B', fontSize: 28 }]}>🚨 BUGÜN!</Text>
              <Text style={md.countdownSub}>Sınav bugün, başarılar!</Text>
            </>
          ) : dl <= 1 ? (
            <>
              <Text style={[md.countdownMain, { color: '#FF6B6B' }]}>{hl}</Text>
              <Text style={md.countdownSub}>saat kaldı</Text>
            </>
          ) : (
            <>
              <Text style={[md.countdownMain, { color: goal.color }]}>{dl}</Text>
              <Text style={md.countdownSub}>gün kaldı</Text>
            </>
          )}
          {isUrgent && !isToday && (
            <View style={md.urgentTag}>
              <Ionicons name="warning" size={12} color="#FF6B6B" />
              <Text style={md.urgentTagText}>Acil!</Text>
            </View>
          )}
        </View>

        {/* İlerleme çubuğu */}
        <View style={md.progressSection}>
          <View style={md.progressLabelRow}>
            <Text style={md.progressLabel}>Hedefe Kalan Süre</Text>
            <Text style={[md.progressPct, { color: goal.color }]}>%{100 - pct} kaldı</Text>
          </View>
          <View style={md.progressTrack}>
            <View style={[md.progressFill, { width: `${pct}%`, backgroundColor: goal.color }]} />
          </View>
          <View style={md.progressLabelRow}>
            <Text style={md.progressSub}>Başlangıçtan bu yana</Text>
            <Text style={md.progressSub}>{dl === 0 ? 'Tamamlandı' : `${dl} gün`}</Text>
          </View>
        </View>

        {/* AI Sor butonu */}
        <Pressable
          style={[md.aiBtn, { backgroundColor: goal.color + '18', borderColor: goal.color + '50' }]}
          onPress={() => { onAskAI(goal); onClose(); }}>
          <MaterialCommunityIcons name="robot-outline" size={18} color={goal.color} />
          <Text style={[md.aiBtnText, { color: goal.color }]}>
            "{goal.title}" için AI'ya sor
          </Text>
          <Ionicons name="arrow-forward" size={15} color={goal.color} />
        </Pressable>

        {/* Sil */}
        <Pressable style={md.deleteBtn} onPress={() => { onDelete(goal.id); onClose(); }}>
          <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
          <Text style={md.deleteBtnText}>Hedefi Sil</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const md = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#111827', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#2A3344', alignSelf: 'center', marginBottom: 20 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1A2130', alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  title: { color: '#EEF3FF', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  dateText: { color: '#778091', fontSize: 13 },
  countdownBox: { borderRadius: 18, borderWidth: 1, padding: 20, alignItems: 'center', marginBottom: 20, gap: 4 },
  countdownMain: { fontSize: 56, fontWeight: '900', lineHeight: 60 },
  countdownSub: { color: '#9AA3B5', fontSize: 15, fontWeight: '600' },
  urgentTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,107,107,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
  urgentTagText: { color: '#FF6B6B', fontSize: 12, fontWeight: '700' },
  progressSection: { marginBottom: 20, gap: 6 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: '#D0D8EA', fontSize: 13, fontWeight: '600' },
  progressPct: { fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#1E2633', overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  progressSub: { color: '#778091', fontSize: 11 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  aiBtnText: { flex: 1, fontSize: 14, fontWeight: '700' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,107,107,0.2)' },
  deleteBtnText: { color: '#FF6B6B', fontSize: 14, fontWeight: '600' },
});

// ── Ana bileşen ────────────────────────────────────────────────
export default function HomeTabScreen() {
  const { token, user } = useAuth();
  const scrollRef = useRef(null);
  const chatInputRef = useRef(null);

  const userName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Öğrenci';

  const [goals, setGoals] = useState([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [newGoalColor, setNewGoalColor] = useState(GOAL_COLORS[0]);
  const [newGoalEmoji, setNewGoalEmoji] = useState(GOAL_EMOJIS[0]);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [profileStats, setProfileStats] = useState(null);

  useEffect(() => {
    const savedGoals = storage.get(GOALS_KEY);
    if (Array.isArray(savedGoals)) setGoals(savedGoals);

    const savedChat = storage.get(CHAT_KEY);
    if (Array.isArray(savedChat) && savedChat.length > 0) {
      setMessages(savedChat);
    } else {
      setMessages([{
        id: newId(),
        role: 'model',
        content: `Merhaba ${userName}! 👋 Ben EduAI. Sınavlarına hazırlanmana, çalışma planı oluşturmana ve motive kalmana yardımcı olabilirim. Ne sormak istersin?`,
      }]);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    getProfileStats({ token }).then(setProfileStats).catch(() => {});
  }, [token]);

  function saveGoals(newGoals) {
    setGoals(newGoals);
    storage.set(GOALS_KEY, newGoals);
  }

  function saveMessages(newMsgs) {
    const trimmed = newMsgs.slice(-30);
    setMessages(trimmed);
    storage.set(CHAT_KEY, trimmed);
  }

  function addGoal() {
    if (!newGoalTitle.trim() || !newGoalDate) return;
    const goal = {
      id: Date.now().toString(),
      title: newGoalTitle.trim(),
      examDate: newGoalDate,
      color: newGoalColor,
      emoji: newGoalEmoji,
      addedAt: new Date().toISOString(),
    };
    saveGoals([...goals, goal]);
    setNewGoalTitle('');
    setNewGoalDate('');
    setNewGoalColor(GOAL_COLORS[0]);
    setNewGoalEmoji(GOAL_EMOJIS[0]);
    setShowAddGoal(false);
  }

  function handleAskAIAboutGoal(goal) {
    const dl = daysLeftCalc(goal.examDate);
    const prompt = `${goal.emoji} ${goal.title} sınavım var ve ${dl} gün kaldı. Bana özel bir çalışma planı hazırlar mısın?`;
    setInputText(prompt);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  }

  const sendMessage = useCallback(async (text) => {
    const content = (text || inputText).trim();
    if (!content || aiLoading) return;
    setInputText('');

    const userMsg = { id: newId(), role: 'user', content };
    const nextMsgs = [...messages, userMsg];
    saveMessages(nextMsgs);
    setAiLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const goalContext = goals.map((g) => ({
        title: g.title,
        daysLeft: daysLeftCalc(g.examDate),
      }));
      const apiMsgs = nextMsgs.map((m) => ({ role: m.role, content: m.content }));
      const reply = await chatWithAI({ token, messages: apiMsgs, goals: goalContext });
      const aiMsg = { id: newId(), role: 'model', content: reply };
      saveMessages([...nextMsgs, aiMsg]);
    } catch (e) {
      const is503 = e?.message?.includes('503') || e?.message?.includes('high demand');
      saveMessages([...nextMsgs, {
        id: newId(),
        role: 'model',
        content: is503
          ? 'Gemini şu an çok yoğun 😅 Birkaç saniye bekleyip tekrar dene.'
          : 'Üzgünüm, bir hata oluştu. Lütfen tekrar dene.',
      }]);
    } finally {
      setAiLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [inputText, messages, goals, token, aiLoading]);

  const urgentGoals = goals
    .map((g) => ({ ...g, dl: daysLeftCalc(g.examDate) }))
    .filter((g) => g.dl <= 7)
    .sort((a, b) => a.dl - b.dl);

  return (
    <View style={s.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={s.header}>
            <View style={s.avatarWrap}>
              <Text style={s.avatarText}>{userName[0]?.toUpperCase() || '👤'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.greeting}>{greetingText(userName)}</Text>
              <Text style={s.date}>{formatDate()}</Text>
            </View>
            <View style={s.headerStats}>
              {profileStats && (
                <>
                  <View style={s.statChip}>
                    <Ionicons name="flash" size={12} color="#F2D33D" />
                    <Text style={s.statChipText}>{profileStats.totalXp} XP</Text>
                  </View>
                  {profileStats.streak > 0 && (
                    <View style={[s.statChip, { borderColor: 'rgba(255,138,61,0.3)', backgroundColor: 'rgba(255,138,61,0.08)' }]}>
                      <Text style={{ fontSize: 12 }}>🔥</Text>
                      <Text style={[s.statChipText, { color: '#FF8A3D' }]}>{profileStats.streak}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Acil banner */}
          {urgentGoals.length > 0 && (
            <Pressable style={s.urgentBanner} onPress={() => setSelectedGoal(urgentGoals[0])}>
              <Ionicons name="warning-outline" size={16} color="#F2D33D" />
              <Text style={s.urgentText}>
                <Text style={{ fontWeight: '800' }}>{urgentGoals[0].emoji} {urgentGoals[0].title}</Text>
                {urgentGoals[0].dl === 0 ? ' — Bugün!' : ` — ${urgentGoals[0].dl} gün kaldı`}
                {urgentGoals.length > 1 && ` (+${urgentGoals.length - 1} daha)`}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#F2D33D" />
            </Pressable>
          )}

          {/* Hedefler başlık */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Hedeflerim</Text>
            <Pressable style={s.addBtn} onPress={() => setShowAddGoal((v) => !v)}>
              <Ionicons name={showAddGoal ? 'close' : 'add'} size={16} color="#2BE26E" />
              <Text style={s.addBtnText}>{showAddGoal ? 'Kapat' : 'Ekle'}</Text>
            </Pressable>
          </View>

          {/* Hedef ekleme formu */}
          {showAddGoal && (
            <View style={s.addGoalForm}>
              <Text style={s.formLabel}>Hedef Adı</Text>
              <TextInput
                style={s.formInput}
                placeholder="ör. Matematik Sınavı"
                placeholderTextColor="#3A4860"
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
              />

              <Text style={[s.formLabel, { marginTop: 12 }]}>Sınav Tarihi</Text>
              <DatePicker value={newGoalDate} onChange={setNewGoalDate} />

              <Text style={[s.formLabel, { marginTop: 12 }]}>Renk</Text>
              <View style={s.colorRow}>
                {GOAL_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    style={[s.colorDot, { backgroundColor: c }, newGoalColor === c && s.colorDotActive]}
                    onPress={() => setNewGoalColor(c)}
                  />
                ))}
              </View>

              <Text style={[s.formLabel, { marginTop: 12 }]}>Emoji</Text>
              <View style={s.emojiRow}>
                {GOAL_EMOJIS.map((e) => (
                  <Pressable
                    key={e}
                    style={[s.emojiBtn, newGoalEmoji === e && s.emojiBtnActive]}
                    onPress={() => setNewGoalEmoji(e)}>
                    <Text style={{ fontSize: 20 }}>{e}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[s.saveGoalBtn, (!newGoalTitle.trim() || !newGoalDate) && s.saveGoalBtnDisabled]}
                disabled={!newGoalTitle.trim() || !newGoalDate}
                onPress={addGoal}>
                <Ionicons name="checkmark" size={16} color="#0A1A10" />
                <Text style={s.saveGoalBtnText}>Hedef Ekle</Text>
              </Pressable>
            </View>
          )}

          {/* Hedef listesi */}
          {goals.length === 0 && !showAddGoal ? (
            <View style={s.emptyGoals}>
              <Text style={{ fontSize: 28 }}>🎯</Text>
              <Text style={s.emptyGoalsText}>Henüz hedef yok.{'\n'}Sınavını veya ödevini ekle!</Text>
            </View>
          ) : (
            <View style={s.goalsGrid}>
              {goals.map((g) => {
                const dl = daysLeftCalc(g.examDate);
                const isUrgent = dl <= 3;
                return (
                  <Pressable
                    key={g.id}
                    style={[s.goalCard, { borderColor: g.color + '40' }]}
                    onPress={() => setSelectedGoal(g)}>
                    <View style={[s.goalAccent, { backgroundColor: g.color }]} />
                    <View style={s.goalCardInner}>
                      <View style={s.goalCardTop}>
                        <Text style={{ fontSize: 22 }}>{g.emoji}</Text>
                        <Ionicons name="chevron-forward" size={14} color={g.color + '80'} />
                      </View>
                      <Text style={s.goalTitle} numberOfLines={2}>{g.title}</Text>
                      <View style={[s.goalDaysWrap, { backgroundColor: g.color + '18' }]}>
                        <Text style={[s.goalDaysNum, { color: isUrgent ? '#FF6B6B' : g.color }]}>
                          {dl === 0 ? 'BUGÜN' : `${dl}`}
                        </Text>
                        {dl > 0 && <Text style={[s.goalDaysLabel, { color: g.color + 'CC' }]}>gün kaldı</Text>}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* AI Sohbet */}
          <View style={s.chatSection}>
            <View style={s.sectionHeader}>
              <View style={s.chatTitleRow}>
                <View style={s.aiBadge}>
                  <MaterialCommunityIcons name="robot-outline" size={14} color="#EFE6FF" />
                </View>
                <Text style={s.sectionTitle}>EduAI Asistan</Text>
              </View>
              <Pressable onPress={() => {
                const welcome = [{
                  id: newId(), role: 'model',
                  content: `Merhaba ${userName}! 👋 Ben EduAI. Sınavlarına hazırlanmana, çalışma planı oluşturmana ve motive kalmana yardımcı olabilirim. Ne sormak istersin?`,
                }];
                saveMessages(welcome);
              }}>
                <Text style={s.clearChat}>Temizle</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={s.quickRow}>
                {QUICK_PROMPTS.map((p) => (
                  <Pressable key={p} style={s.quickChip} onPress={() => sendMessage(p)}>
                    <Text style={s.quickChipText}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={s.messagesWrap}>
              {messages.map((msg) => (
                <View key={msg.id} style={[s.bubble, msg.role === 'user' ? s.bubbleUser : s.bubbleAI]}>
                  {msg.role === 'model' && (
                    <View style={s.aiBubbleIcon}>
                      <MaterialCommunityIcons name="robot-outline" size={12} color="#B683FF" />
                    </View>
                  )}
                  <Text style={[s.bubbleText, msg.role === 'user' && s.bubbleTextUser]}>
                    {msg.content}
                  </Text>
                </View>
              ))}
              {aiLoading && (
                <View style={[s.bubble, s.bubbleAI]}>
                  <View style={s.aiBubbleIcon}>
                    <MaterialCommunityIcons name="robot-outline" size={12} color="#B683FF" />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <View style={s.typingDot} />
                    <View style={[s.typingDot, { opacity: 0.6 }]} />
                    <View style={[s.typingDot, { opacity: 0.3 }]} />
                  </View>
                </View>
              )}
            </View>

            <View style={s.inputRow}>
              <TextInput
                ref={chatInputRef}
                style={s.chatInput}
                placeholder="Bir şey sor..."
                placeholderTextColor="#3A4860"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                onSubmitEditing={() => sendMessage()}
                returnKeyType="send"
              />
              <Pressable
                style={[s.sendBtn, (!inputText.trim() || aiLoading) && s.sendBtnDisabled]}
                disabled={!inputText.trim() || aiLoading}
                onPress={() => sendMessage()}>
                <Ionicons name="send" size={18} color="#0A1A10" />
              </Pressable>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Hedef detay modal */}
      <GoalDetailModal
        goal={selectedGoal}
        onClose={() => setSelectedGoal(null)}
        onDelete={(id) => saveGoals(goals.filter((g) => g.id !== id))}
        onAskAI={handleAskAIAboutGoal}
      />

      <CustomBottomTabs activeRoute="Home" />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#06080D' },
  scroll: { flex: 1 },
  content: { paddingTop: 62, paddingHorizontal: 20, paddingBottom: 140 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatarWrap: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1B2536', borderWidth: 2, borderColor: '#2BE26E', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#2BE26E', fontSize: 18, fontWeight: '800' },
  greeting: { color: '#EEF3FF', fontSize: 22, fontWeight: '800' },
  date: { color: '#778091', fontSize: 13, marginTop: 2 },
  headerStats: { flexDirection: 'row', gap: 6 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(242,211,61,0.08)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(242,211,61,0.3)' },
  statChipText: { color: '#F2D33D', fontSize: 12, fontWeight: '700' },

  urgentBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(242,211,61,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(242,211,61,0.25)', paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 },
  urgentText: { color: '#D4BC50', fontSize: 13, flex: 1 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#EEF3FF', fontSize: 19, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(43,226,110,0.4)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  addBtnText: { color: '#2BE26E', fontSize: 13, fontWeight: '700' },

  addGoalForm: { backgroundColor: '#141922', borderRadius: 18, borderWidth: 1, borderColor: '#202838', padding: 18, marginBottom: 14 },
  formLabel: { color: '#9AA3B5', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  formInput: { backgroundColor: '#0F1319', borderRadius: 10, borderWidth: 1, borderColor: '#2A3344', color: '#EEF3FF', fontSize: 15, paddingHorizontal: 14, paddingVertical: 12 },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { borderWidth: 3, borderColor: '#EEF3FF' },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, borderColor: '#2A3344', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F1319' },
  emojiBtnActive: { backgroundColor: 'rgba(43,226,110,0.15)', borderColor: '#2BE26E' },
  saveGoalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#2BE26E', borderRadius: 12, paddingVertical: 12, marginTop: 16 },
  saveGoalBtnDisabled: { opacity: 0.4 },
  saveGoalBtnText: { color: '#0A1A10', fontSize: 15, fontWeight: '800' },

  emptyGoals: { alignItems: 'center', paddingVertical: 24, gap: 8, backgroundColor: '#141922', borderRadius: 16, borderWidth: 1, borderColor: '#202838', marginBottom: 20 },
  emptyGoalsText: { color: '#778091', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  goalCard: { width: '47%', backgroundColor: '#141922', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  goalAccent: { height: 4 },
  goalCardInner: { padding: 14 },
  goalCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  goalTitle: { color: '#EEF3FF', fontSize: 14, fontWeight: '700', marginBottom: 10, lineHeight: 20 },
  goalDaysWrap: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, alignItems: 'center' },
  goalDaysNum: { fontSize: 22, fontWeight: '900' },
  goalDaysLabel: { fontSize: 11, fontWeight: '600' },

  chatSection: { marginBottom: 16 },
  chatTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiBadge: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#5A26FF', alignItems: 'center', justifyContent: 'center' },
  clearChat: { color: '#3A4860', fontSize: 12, fontWeight: '600' },
  quickRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  quickChip: { backgroundColor: '#141922', borderRadius: 999, borderWidth: 1, borderColor: '#202838', paddingHorizontal: 14, paddingVertical: 8 },
  quickChipText: { color: '#9AA3B5', fontSize: 13 },

  messagesWrap: { gap: 8, marginBottom: 12 },
  bubble: { maxWidth: '85%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleAI: { alignSelf: 'flex-start', backgroundColor: '#141922', borderWidth: 1, borderColor: '#202838', borderBottomLeftRadius: 4 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: '#1B3A2A', borderWidth: 1, borderColor: 'rgba(43,226,110,0.3)', borderBottomRightRadius: 4 },
  bubbleText: { color: '#D0D8EA', fontSize: 14, lineHeight: 21 },
  bubbleTextUser: { color: '#C5EDD5' },
  aiBubbleIcon: { marginBottom: 4 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#B683FF' },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  chatInput: { flex: 1, backgroundColor: '#141922', borderRadius: 16, borderWidth: 1, borderColor: '#202838', color: '#EEF3FF', fontSize: 14, paddingHorizontal: 16, paddingVertical: 12, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2BE26E', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#1A2B1F', opacity: 0.5 },
});
