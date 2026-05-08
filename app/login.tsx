import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/features/common/auth/auth-context';
import { formatDisplayName } from '@/features/common/utils/name';

const styles = {
  screen: { flex: 1, backgroundColor: '#06080D', padding: 20, paddingTop: 60 },
  title: { color: '#E8EDF6', fontSize: 28, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#8A93A2', fontSize: 14, marginBottom: 18 },
  input: {
    borderWidth: 1,
    borderColor: '#1B2230',
    backgroundColor: '#0E1219',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F2F6FF',
    marginBottom: 12,
  },
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  toggle: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#263042',
  },
  toggleActive: { backgroundColor: 'rgba(43, 226, 110, 0.15)', borderColor: 'rgba(43, 226, 110, 0.35)' },
  toggleText: { color: '#D2D8E3', fontWeight: '700' },
  button: {
    marginTop: 4,
    backgroundColor: '#2BE26E',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#06110A', fontWeight: '800', fontSize: 16 },
  error: { color: '#F4A07A', marginTop: 10 },
  close: { marginTop: 14, alignItems: 'center' },
  closeText: { color: '#8A93A2', fontWeight: '700' },
};

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!email || !password) return false;
    if (mode === 'register' && !name) return false;
    return true;
  }, [email, password, name, mode]);

  async function onSubmit() {
    try {
      setSubmitting(true);
      setError(null);
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, formatDisplayName(name));
      }
      router.back();
    } catch (e: any) {
      setError(e?.message || 'Bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
      <Text style={styles.subtitle}>Hesabınla devam et.</Text>

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggle, mode === 'login' && styles.toggleActive]}
          onPress={() => setMode('login')}>
          <Text style={styles.toggleText}>Giriş</Text>
        </Pressable>
        <Pressable
          style={[styles.toggle, mode === 'register' && styles.toggleActive]}
          onPress={() => setMode('register')}>
          <Text style={styles.toggleText}>Kayıt</Text>
        </Pressable>
      </View>

      {mode === 'register' ? (
        <TextInput
          placeholder="Ad"
          placeholderTextColor="#6F7788"
          style={styles.input}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      ) : null}

      <TextInput
        placeholder="E-posta"
        placeholderTextColor="#6F7788"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Şifre"
        placeholderTextColor="#6F7788"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable
        style={[styles.button, (!canSubmit || submitting) && { opacity: 0.6 }]}
        onPress={onSubmit}
        disabled={!canSubmit || submitting}>
        <Text style={styles.buttonText}>{submitting ? '...' : mode === 'login' ? 'Giriş' : 'Kayıt Ol'}</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeText}>Kapat</Text>
      </Pressable>
    </View>
  );
}

