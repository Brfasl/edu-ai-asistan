import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/features/common/auth/auth-context';

const styles = {
  screen: { flex: 1, backgroundColor: '#06080D', padding: 20, paddingTop: 60 },
  title: { color: '#E8EDF6', fontSize: 28, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#8A93A2', fontSize: 14, marginBottom: 24 },
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
  button: {
    marginTop: 4,
    backgroundColor: '#2BE26E',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#06110A', fontWeight: '800', fontSize: 16 },
  error: { color: '#F4A07A', marginTop: 10 },
  success: { color: '#2BE26E', marginTop: 10, lineHeight: 20 },
  close: { marginTop: 14, alignItems: 'center' },
  closeText: { color: '#8A93A2', fontWeight: '700' },
  link: { alignItems: 'center', marginTop: 20 },
  hint: { color: '#8A93A2', marginTop: 12, fontSize: 13, lineHeight: 20 },
} as const;

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSend() {
    if (!email.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Şifremi Unuttum</Text>
      <Text style={styles.subtitle}>
        E-posta adresinizi girin, size 6 haneli bir sıfırlama kodu gönderelim.
      </Text>

      {!sent ? (
        <>
          <TextInput
            placeholder="E-posta"
            placeholderTextColor="#6F7788"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoFocus
          />

          <Pressable
            style={[styles.button, (!email.trim() || submitting) && { opacity: 0.6 }]}
            onPress={onSend}
            disabled={!email.trim() || submitting}>
            <Text style={styles.buttonText}>{submitting ? '...' : 'Kod Gönder'}</Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </>
      ) : (
        <>
          <Text style={styles.success}>
            Eğer bu e-posta adresiyle kayıtlı bir hesap varsa, kısa süre içinde bir sıfırlama kodu gönderilecektir.
          </Text>
          <Text style={styles.hint}>
            Geliştirme ortamında e-posta gönderilmez. Kod backend terminalinde `[DEV] Şifre sıfırlama kodu...` satırında görünür.
          </Text>

          <Pressable
            style={[styles.button, { marginTop: 20 }]}
            onPress={() =>
              router.replace({
                pathname: '/reset-password',
                params: { email: email.trim() },
              })
            }>
            <Text style={styles.buttonText}>Kodu Gir</Text>
          </Pressable>
        </>
      )}

      <Pressable style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeText}>Geri Dön</Text>
      </Pressable>
    </View>
  );
}
