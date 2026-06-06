import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import CustomBottomTabs from '@/components/CustomBottomTabs';
import { useAuth } from '@/features/common/auth/auth-context';
import { logActivity } from '@/features/common/stats/stats-api';

const DEFAULT_SETTINGS = {
  workMins:       25,
  shortBreakMins: 5,
  longBreakMins:  15,
  sessionsPerLong: 4,
};

const MODE_META = {
  work:       { label: 'Çalışma',    color: '#2BE26E', dimColor: 'rgba(43,226,110,0.15)',  icon: 'brain',          xpPerMin: 1 },
  shortBreak: { label: 'Kısa Mola', color: '#4FC3F7', dimColor: 'rgba(79,195,247,0.15)',   icon: 'coffee-outline', xpPerMin: 0 },
  longBreak:  { label: 'Uzun Mola', color: '#B683FF', dimColor: 'rgba(182,131,255,0.15)',  icon: 'sleep',          xpPerMin: 0 },
};

function fmt(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function ProgressRing({ progress, color, size = 240, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));

  if (Platform.OS === 'web') {
    return (
      // @ts-ignore
      <svg width={size} height={size} style={{ position: 'absolute' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E2633" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
        />
      </svg>
    );
  }
  return (
    <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: stroke, borderColor: color, opacity: 0.5 }} />
  );
}

function Stepper({ label, value, min, max, unit = 'dk', onChange }) {
  return (
    <View style={s.stepperRow}>
      <Text style={s.stepperLabel}>{label}</Text>
      <View style={s.stepperControls}>
        <Pressable
          style={[s.stepperBtn, value <= min && s.stepperBtnDisabled]}
          disabled={value <= min}
          onPress={() => onChange(value - 1)}>
          <Ionicons name="remove" size={18} color={value <= min ? '#3A4152' : '#D9E1EF'} />
        </Pressable>
        <Text style={s.stepperValue}>{value} <Text style={s.stepperUnit}>{unit}</Text></Text>
        <Pressable
          style={[s.stepperBtn, value >= max && s.stepperBtnDisabled]}
          disabled={value >= max}
          onPress={() => onChange(value + 1)}>
          <Ionicons name="add" size={18} color={value >= max ? '#3A4152' : '#D9E1EF'} />
        </Pressable>
      </View>
    </View>
  );
}

export default function PomodoroScreen() {
  const { token } = useAuth();

  // Ayarlar
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  // Geçici ayarlar (kaydetmeden önce)
  const [draft, setDraft] = useState(DEFAULT_SETTINGS);

  // Timer
  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(settings.workMins * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [lastCompleted, setLastCompleted] = useState(false);

  const intervalRef = useRef(null);
  const meta = MODE_META[mode];
  const totalSecs = mode === 'work'
    ? settings.workMins * 60
    : mode === 'shortBreak'
      ? settings.shortBreakMins * 60
      : settings.longBreakMins * 60;

  const progress = 1 - timeLeft / totalSecs;
  const isUrgent = mode === 'work' && timeLeft <= 5 * 60 && timeLeft > 0;
  const ringColor = isUrgent ? '#F2D33D' : meta.color;
  const RING_SIZE = 240;

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            handleSessionComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode, settings]);

  async function handleSessionComplete() {
    setIsRunning(false);
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (mode === 'work') {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      const xp = settings.workMins;
      setLastCompleted(true);
      if (token) {
        await Promise.all([
          logActivity({ token, type: 'study', minutes: settings.workMins }),
          logActivity({ token, type: 'xp', xp }),
        ]);
      }
      setTotalXpEarned((x) => x + xp);
      const nextMode = newSessions % settings.sessionsPerLong === 0 ? 'longBreak' : 'shortBreak';
      applyMode(nextMode, false);
    } else {
      applyMode('work', false);
    }
  }

  function applyMode(newMode, resetCompleted = true) {
    if (resetCompleted) setLastCompleted(false);
    setMode(newMode);
    const secs = newMode === 'work'
      ? settings.workMins * 60
      : newMode === 'shortBreak'
        ? settings.shortBreakMins * 60
        : settings.longBreakMins * 60;
    setTimeLeft(secs);
    setIsRunning(false);
  }

  function handleStartPause() {
    if (timeLeft === 0) { setTimeLeft(totalSecs); setIsRunning(true); return; }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning((r) => !r);
  }

  function handleReset() {
    setIsRunning(false);
    setTimeLeft(totalSecs);
    setLastCompleted(false);
  }

  function saveSettings() {
    const wasRunning = isRunning;
    setIsRunning(false);
    setSettings(draft);
    // mevcut modu yeni süreyle resetle
    const secs = mode === 'work'
      ? draft.workMins * 60
      : mode === 'shortBreak'
        ? draft.shortBreakMins * 60
        : draft.longBreakMins * 60;
    setTimeLeft(secs);
    setShowSettings(false);
    setLastCompleted(false);
  }

  function openSettings() {
    setDraft(settings); // draft'ı mevcut ayarlarla başlat
    setShowSettings(true);
  }

  const dotsFilled = sessions % settings.sessionsPerLong;

  return (
    <View style={s.screen}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <MaterialCommunityIcons name="timer-outline" size={24} color="#2BE26E" />
          <Text style={s.headerTitle}>Pomodoro</Text>
          <View style={s.headerRight}>
            {totalXpEarned > 0 && (
              <View style={s.xpBadge}>
                <Ionicons name="flash" size={13} color="#F2D33D" />
                <Text style={s.xpBadgeText}>{totalXpEarned} XP</Text>
              </View>
            )}
            <Pressable style={s.settingsIconBtn} onPress={openSettings}>
              <Ionicons name="settings-outline" size={20} color={showSettings ? '#2BE26E' : '#778091'} />
            </Pressable>
          </View>
        </View>

        {/* ── AYARLAR PANELİ ── */}
        {showSettings && (
          <View style={s.settingsPanel}>
            <View style={s.settingsPanelHeader}>
              <Text style={s.settingsPanelTitle}>Zamanlayıcı Ayarları</Text>
              <Pressable onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={20} color="#778091" />
              </Pressable>
            </View>

            <Stepper
              label="Çalışma Süresi"
              value={draft.workMins}
              min={5} max={90}
              onChange={(v) => setDraft((d) => ({ ...d, workMins: v }))}
            />
            <Stepper
              label="Kısa Mola"
              value={draft.shortBreakMins}
              min={1} max={30}
              onChange={(v) => setDraft((d) => ({ ...d, shortBreakMins: v }))}
            />
            <Stepper
              label="Uzun Mola"
              value={draft.longBreakMins}
              min={5} max={60}
              onChange={(v) => setDraft((d) => ({ ...d, longBreakMins: v }))}
            />
            <Stepper
              label="Uzun Molaya Kadar Seans"
              value={draft.sessionsPerLong}
              min={2} max={8}
              unit="seans"
              onChange={(v) => setDraft((d) => ({ ...d, sessionsPerLong: v }))}
            />

            <View style={s.settingsBtns}>
              <Pressable style={s.settingsCancelBtn} onPress={() => setShowSettings(false)}>
                <Text style={s.settingsCancelText}>Vazgeç</Text>
              </Pressable>
              <Pressable style={s.settingsSaveBtn} onPress={saveSettings}>
                <Ionicons name="checkmark" size={16} color="#0A1A10" />
                <Text style={s.settingsSaveText}>Kaydet</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Mod seçici */}
        {!showSettings && (
          <View style={s.modeRow}>
            {Object.entries(MODE_META).map(([key, cfg]) => (
              <Pressable
                key={key}
                style={[s.modeBtn, mode === key && { backgroundColor: cfg.dimColor, borderColor: cfg.color }]}
                onPress={() => applyMode(key)}>
                <Text style={[s.modeBtnText, mode === key && { color: cfg.color, fontWeight: '700' }]}>
                  {cfg.label}
                </Text>
                <Text style={[s.modeBtnSub, mode === key && { color: cfg.color + 'BB' }]}>
                  {key === 'work'
                    ? `${settings.workMins} dk`
                    : key === 'shortBreak'
                      ? `${settings.shortBreakMins} dk`
                      : `${settings.longBreakMins} dk`}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Timer circle */}
        {!showSettings && (
          <>
            <View style={s.ringWrap}>
              <View style={[s.ringGlow, { backgroundColor: meta.dimColor, shadowColor: ringColor }]} />
              <ProgressRing progress={progress} color={ringColor} size={RING_SIZE} />
              <View style={[s.ringInner, { width: RING_SIZE, height: RING_SIZE }]}>
                <Text style={[s.modeLabel, { color: meta.color }]}>{meta.label.toUpperCase()}</Text>
                <Text style={[s.timeText, isUrgent && s.timeTextUrgent]}>{fmt(timeLeft)}</Text>
                <View style={s.sessionDots}>
                  {Array.from({ length: settings.sessionsPerLong }).map((_, i) => (
                    <View key={i} style={[s.dot, i < dotsFilled && { backgroundColor: '#2BE26E', width: 10, height: 10 }]} />
                  ))}
                </View>
              </View>
            </View>

            {/* Tamamlandı bildirimi */}
            {lastCompleted && (
              <View style={s.completedBanner}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#2BE26E" />
                <Text style={s.completedText}>Seans tamamlandı! +{settings.workMins} XP kazandın 🎉</Text>
              </View>
            )}

            {/* Kontrol butonları */}
            <View style={s.controls}>
              <Pressable style={s.resetBtn} onPress={handleReset}>
                <Ionicons name="refresh" size={20} color="#778091" />
              </Pressable>
              <Pressable
                style={[s.startBtn, { backgroundColor: meta.color }, isUrgent && s.startBtnUrgent]}
                onPress={handleStartPause}>
                <Ionicons name={isRunning ? 'pause' : 'play'} size={28} color="#0A1A10" />
                <Text style={s.startBtnText}>
                  {isRunning ? 'Duraklat' : timeLeft === 0 ? 'Yeniden Başlat' : 'Başlat'}
                </Text>
              </Pressable>
              <Pressable style={s.skipBtn} onPress={handleSessionComplete}>
                <Ionicons name="play-skip-forward" size={20} color="#778091" />
              </Pressable>
            </View>

            {/* Seans özeti */}
            <View style={s.sessionInfo}>
              <View style={s.sessionItem}>
                <Text style={s.sessionNum}>{sessions}</Text>
                <Text style={s.sessionItemLabel}>Tamamlanan{'\n'}Seans</Text>
              </View>
              <View style={s.sessionDivider} />
              <View style={s.sessionItem}>
                <Text style={s.sessionNum}>{sessions * settings.workMins}</Text>
                <Text style={s.sessionItemLabel}>Dakika{'\n'}Çalışıldı</Text>
              </View>
              <View style={s.sessionDivider} />
              <View style={s.sessionItem}>
                <Text style={[s.sessionNum, { color: '#F2D33D' }]}>{totalXpEarned}</Text>
                <Text style={s.sessionItemLabel}>Kazanılan{'\n'}XP</Text>
              </View>
            </View>

            {/* Mevcut ayar özeti */}
            <View style={s.currentSettingsRow}>
              <View style={s.currentSettingChip}>
                <Ionicons name="time-outline" size={13} color="#2BE26E" />
                <Text style={s.currentSettingText}>{settings.workMins} dk çalışma</Text>
              </View>
              <View style={s.currentSettingChip}>
                <Ionicons name="cafe-outline" size={13} color="#4FC3F7" />
                <Text style={s.currentSettingText}>{settings.shortBreakMins} dk kısa mola</Text>
              </View>
              <View style={s.currentSettingChip}>
                <Ionicons name="moon-outline" size={13} color="#B683FF" />
                <Text style={s.currentSettingText}>{settings.longBreakMins} dk uzun mola</Text>
              </View>
            </View>
          </>
        )}

      </ScrollView>
      <CustomBottomTabs activeRoute="Pomodoro" />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#06080D' },
  scroll: { flex: 1 },
  content: { paddingTop: 62, paddingHorizontal: 20, paddingBottom: 140, alignItems: 'center' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', marginBottom: 20 },
  headerTitle: { flex: 1, color: '#EEF3FF', fontSize: 28, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(242,211,61,0.12)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(242,211,61,0.3)' },
  xpBadgeText: { color: '#F2D33D', fontSize: 13, fontWeight: '700' },
  settingsIconBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#141922', borderWidth: 1, borderColor: '#202838', alignItems: 'center', justifyContent: 'center' },

  // Ayarlar paneli
  settingsPanel: { alignSelf: 'stretch', backgroundColor: '#141922', borderRadius: 20, borderWidth: 1, borderColor: '#202838', padding: 20, marginBottom: 16, gap: 4 },
  settingsPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  settingsPanelTitle: { color: '#EEF3FF', fontSize: 17, fontWeight: '800' },

  // Stepper
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1A2130' },
  stepperLabel: { color: '#D0D8EA', fontSize: 14, fontWeight: '600' },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#1D2432', borderWidth: 1, borderColor: '#2A3344', alignItems: 'center', justifyContent: 'center' },
  stepperBtnDisabled: { opacity: 0.4 },
  stepperValue: { color: '#EEF3FF', fontSize: 18, fontWeight: '800', minWidth: 60, textAlign: 'center' },
  stepperUnit: { color: '#778091', fontSize: 13, fontWeight: '500' },

  // Ayar butonları
  settingsBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  settingsCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2A3040', alignItems: 'center' },
  settingsCancelText: { color: '#778091', fontSize: 14, fontWeight: '600' },
  settingsSaveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#2BE26E' },
  settingsSaveText: { color: '#0A1A10', fontSize: 14, fontWeight: '800' },

  // Mod seçici
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 28, alignSelf: 'stretch' },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#202838', alignItems: 'center', gap: 2 },
  modeBtnText: { color: '#778091', fontSize: 12, fontWeight: '600' },
  modeBtnSub: { color: '#3A4860', fontSize: 10, fontWeight: '600' },

  // Ring
  ringWrap: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  ringGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 40, elevation: 10 },
  ringInner: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  modeLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  timeText: { color: '#EEF3FF', fontSize: 52, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timeTextUrgent: { color: '#F2D33D' },
  sessionDots: { flexDirection: 'row', gap: 6, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2A3040' },

  // Tamamlandı
  completedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(43,226,110,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(43,226,110,0.3)', paddingHorizontal: 16, paddingVertical: 10, marginBottom: 16, alignSelf: 'stretch' },
  completedText: { color: '#2BE26E', fontSize: 14, fontWeight: '600', flex: 1 },

  // Kontroller
  controls: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  resetBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#141922', borderWidth: 1, borderColor: '#202838', alignItems: 'center', justifyContent: 'center' },
  skipBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#141922', borderWidth: 1, borderColor: '#202838', alignItems: 'center', justifyContent: 'center' },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 999 },
  startBtnUrgent: { backgroundColor: '#F2D33D' },
  startBtnText: { color: '#0A1A10', fontSize: 17, fontWeight: '900' },

  // Seans özeti
  sessionInfo: { flexDirection: 'row', alignSelf: 'stretch', backgroundColor: '#141922', borderRadius: 18, borderWidth: 1, borderColor: '#202838', paddingVertical: 18, marginBottom: 16 },
  sessionItem: { flex: 1, alignItems: 'center', gap: 4 },
  sessionNum: { color: '#2BE26E', fontSize: 28, fontWeight: '900' },
  sessionItemLabel: { color: '#778091', fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 16 },
  sessionDivider: { width: 1, backgroundColor: '#202838', marginVertical: 4 },

  // Mevcut ayar özeti
  currentSettingsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'stretch', justifyContent: 'center' },
  currentSettingChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#141922', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#202838' },
  currentSettingText: { color: '#9AA3B5', fontSize: 12, fontWeight: '600' },
});
