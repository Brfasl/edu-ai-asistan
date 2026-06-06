import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/features/common/auth/auth-context';

const styles = {
  screen: { flex: 1, backgroundColor: '#06080D', padding: 20, paddingTop: 60 },
  title: { color: '#E8EDF6', fontSize: 28, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#8A93A2', fontSize: 14, marginBottom: 24 },
  label: { color: '#8A93A2', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 4 },
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
  codeInput: {
    borderWidth: 1,
    borderColor: '#1B2230',
    backgroundColor: '#0E1219',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    color: '#2BE26E',
    marginBottom: 12,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 12,
    textAlign: 'center',
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
  success: { color: '#2BE26E', marginTop: 10, lineHeight: 20, fontSize: 15 },
  close: { marginTop: 14, alignItems: 'center' },
  closeText: { color: '#8A93A2', fontWeight: '700' },
} as const;

export default function ResetPasswordScreen() {
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState(paramEmail ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit =
    !!email.trim() &&
    code.trim().length === 6 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  async function onSubmit() {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      setError(null);
      await resetPassword(email.trim(), code.trim(), newPassword);
      setDone(true);
    } catch (e: any) {
      setError(e?.message || 'Bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Şifre Değiştirildi</Text>
        <Text style={styles.success}>
          Şifreniz başarıyla güncellendi. Şimdi yeni şifrenizle giriş yapabilirsiniz.
        </Text>
        <Pressable
          style={[styles.button, { marginTop: 24 }]}
          onPress={() => router.replace('/login')}>
          <Text style={styles.buttonText}>Giriş Yap</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Şifre Sıfırla</Text>
      <Text style={styles.subtitle}>
        E-postanıza gönderilen 6 haneli kodu ve yeni şifrenizi girin.
      </Text>

      {!paramEmail ? (
        <>
          <Text style={styles.label}>E-posta</Text>
          <TextInput
            placeholder="E-posta"
            placeholderTextColor="#6F7788"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </>
      ) : null}

      <Text style={styles.label}>Doğrulama Kodu</Text>
      <TextInput
        placeholder="000000"
        placeholderTextColor="#263042"
        style={styles.codeInput}
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus={!!paramEmail}
      />

      <Text style={styles.label}>Yeni Şifre</Text>
      <TextInput
        placeholder="En az 8 karakter"
        placeholderTextColor="#6F7788"
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />

      <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
      <TextInput
        placeholder="Şifreyi tekrar girin"
        placeholderTextColor="#6F7788"
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {confirmPassword.length > 0 && newPassword !== confirmPassword ? (
        <Text style={styles.error}>Şifreler eşleşmiyor.</Text>
      ) : null}

      <Pressable
        style={[styles.button, (!canSubmit || submitting) && { opacity: 0.6 }]}
        onPress={onSubmit}
        disabled={!canSubmit || submitting}>
        <Text style={styles.buttonText}>{submitting ? '...' : 'Şifreyi Güncelle'}</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeText}>Geri Dön</Text>
      </Pressable>
    </View>
  );
}
