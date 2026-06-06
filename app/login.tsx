import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/features/common/auth/auth-context';
import { formatDisplayName } from '@/features/common/utils/name';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';

const GOOGLE_REDIRECT_URI = makeRedirectUri();
const APPLE_SERVICE_ID = process.env.EXPO_PUBLIC_APPLE_SERVICE_ID ?? '';
const APPLE_REDIRECT_URI = makeRedirectUri();

const APPLE_DISCOVERY = {
  authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
  tokenEndpoint: 'https://appleid.apple.com/auth/token',
};

function isGoogleConfigured() {
  if (Platform.OS === 'web') return !!GOOGLE_WEB_CLIENT_ID;
  if (Platform.OS === 'ios') return !!(GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID);
  if (Platform.OS === 'android') return !!(GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID);
  return false;
}

function isAppleWebConfigured() {
  return !!APPLE_SERVICE_ID;
}

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
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1B2230' },
  dividerText: { color: '#8A93A2', fontSize: 12 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#263042',
    backgroundColor: '#0E1219',
    marginBottom: 10,
    gap: 10,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    gap: 10,
  },
  googleButtonText: { color: '#E8EDF6', fontWeight: '600', fontSize: 15 },
  appleButtonText: { color: '#000000', fontWeight: '600', fontSize: 15 },
  forgotRow: { alignItems: 'flex-end', marginTop: -4, marginBottom: 12 },
  forgotText: { color: '#2BE26E', fontSize: 13, fontWeight: '600' },
  setupBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#263042',
    backgroundColor: '#0E1219',
    gap: 6,
  },
  setupTitle: { color: '#8A93A2', fontSize: 12, fontWeight: '700' },
  setupText: { color: '#6F7788', fontSize: 12, lineHeight: 18 },
  setupLink: { color: '#2BE26E', fontSize: 12, fontWeight: '600', marginTop: 4 },
} as const;

type GoogleSignInButtonProps = {
  disabled: boolean;
  onError: (message: string) => void;
  onSubmittingChange: (submitting: boolean) => void;
  onSuccess: () => void;
};

function GoogleSignInButton({
  disabled,
  onError,
  onSubmittingChange,
  onSuccess,
}: GoogleSignInButtonProps) {
  const { socialLogin } = useAuth();

  const [, , promptGoogleAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    redirectUri: GOOGLE_REDIRECT_URI,
    scopes: ['openid', 'profile', 'email'],
  });

  async function onPress() {
    try {
      onError('');
      const result = await promptGoogleAsync();
      if (result?.type !== 'success') return;

      const idToken =
        result.authentication?.idToken ?? (result.params as { id_token?: string })?.id_token;
      const accessToken = result.authentication?.accessToken;

      if (!idToken && !accessToken) {
        onError('Google girişi başarısız: token alınamadı.');
        return;
      }

      onSubmittingChange(true);
      await socialLogin('google', idToken || accessToken!);
      onSuccess();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Google girişi başarısız.';
      onError(message);
    } finally {
      onSubmittingChange(false);
    }
  }

  return (
    <Pressable
      style={[styles.googleButton, disabled && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={disabled}>
      <Ionicons name="logo-google" size={20} color="#EA4335" />
      <Text style={styles.googleButtonText}>Google ile Devam Et</Text>
    </Pressable>
  );
}

function GoogleSignInPlaceholder({ disabled }: { disabled: boolean }) {
  return (
    <Pressable style={[styles.googleButton, disabled && { opacity: 0.6 }]} disabled={disabled}>
      <Ionicons name="logo-google" size={20} color="#EA4335" />
      <Text style={styles.googleButtonText}>Google ile Devam Et</Text>
    </Pressable>
  );
}

function GoogleSetupHint() {
  return (
    <View style={styles.setupBox}>
      <Text style={styles.setupTitle}>Google girişi için yapılandırma gerekli</Text>
      <Text style={styles.setupText}>
        1. Google Cloud Console&apos;da Web OAuth Client ID oluştur{'\n'}
        2. Proje kökünde .env dosyasına ekle:{'\n'}
        EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...{'\n'}
        3. Redirect URI: {GOOGLE_REDIRECT_URI}{'\n'}
        4. npm start ile Expo&apos;yu yeniden başlat
      </Text>
      <Pressable onPress={() => Linking.openURL('https://console.cloud.google.com/apis/credentials')}>
        <Text style={styles.setupLink}>Google Cloud Console&apos;u aç →</Text>
      </Pressable>
    </View>
  );
}

function AppleWebSignInButton({
  disabled,
  onError,
  onSubmittingChange,
  onSuccess,
}: {
  disabled: boolean;
  onError: (message: string) => void;
  onSubmittingChange: (submitting: boolean) => void;
  onSuccess: () => void;
}) {
  const { socialLogin } = useAuth();

  const [, , promptAppleAsync] = useAuthRequest(
    {
      clientId: APPLE_SERVICE_ID,
      redirectUri: APPLE_REDIRECT_URI,
      scopes: ['name', 'email'],
      responseType: ResponseType.Code,
      usePKCE: false,
    },
    APPLE_DISCOVERY
  );

  async function onPress() {
    try {
      onError('');
      const result = await promptAppleAsync();
      if (result?.type !== 'success') return;

      const code = result.params?.code;
      if (!code) {
        onError('Apple girişi başarısız: kod alınamadı.');
        return;
      }

      onSubmittingChange(true);
      await socialLogin('apple', undefined, undefined, {
        code,
        redirectUri: APPLE_REDIRECT_URI,
      });
      onSuccess();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Apple girişi başarısız.';
      onError(message);
    } finally {
      onSubmittingChange(false);
    }
  }

  return (
    <Pressable
      style={[styles.appleButton, disabled && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={disabled}>
      <Ionicons name="logo-apple" size={20} color="#000000" />
      <Text style={styles.appleButtonText}>Apple ile Devam Et</Text>
    </Pressable>
  );
}

function AppleSetupHint() {
  return (
    <View style={styles.setupBox}>
      <Text style={styles.setupTitle}>Apple girişi için yapılandırma gerekli</Text>
      <Text style={styles.setupText}>
        1. Apple Developer → Identifiers → Services ID oluştur{'\n'}
        2. Sign in with Apple etkinleştir{'\n'}
        3. Return URL: {APPLE_REDIRECT_URI}{'\n'}
        4. .env dosyalarına APPLE_SERVICE_ID ve backend Apple anahtarlarını ekle{'\n'}
        5. Not: Apple web girişi HTTPS domain gerektirir (localhost sınırlı olabilir)
      </Text>
      <Pressable onPress={() => Linking.openURL('https://developer.apple.com/account/resources/identifiers/list/serviceId')}>
        <Text style={styles.setupLink}>Apple Developer Console&apos;u aç →</Text>
      </Pressable>
    </View>
  );
}

function AppleNativeSignInButton({
  disabled,
  onError,
  onSubmittingChange,
  onSuccess,
}: {
  disabled: boolean;
  onError: (message: string) => void;
  onSubmittingChange: (submitting: boolean) => void;
  onSuccess: () => void;
}) {
  const { socialLogin } = useAuth();

  async function onPress() {
    try {
      onError('');
      onSubmittingChange(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        onError('Apple girişi başarısız: token alınamadı.');
        return;
      }

      const appleFullName =
        credential.fullName?.givenName && credential.fullName?.familyName
          ? `${credential.fullName.givenName} ${credential.fullName.familyName}`.trim()
          : credential.fullName?.givenName ?? undefined;

      await socialLogin('apple', credential.identityToken, appleFullName);
      onSuccess();
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code !== 'ERR_REQUEST_CANCELED') {
        onError(err?.message || 'Apple girişi başarısız.');
      }
    } finally {
      onSubmittingChange(false);
    }
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
      cornerRadius={14}
      style={{ height: 50, marginBottom: 10, opacity: disabled ? 0.6 : 1 }}
      onPress={onPress}
    />
  );
}

function AppleSignInButton({
  disabled,
  onError,
  onSubmittingChange,
  onSuccess,
}: {
  disabled: boolean;
  onError: (message: string) => void;
  onSubmittingChange: (submitting: boolean) => void;
  onSuccess: () => void;
}) {
  const [nativeAvailable, setNativeAvailable] = useState<boolean | null>(
    Platform.OS === 'ios' ? null : false
  );

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync()
      .then(setNativeAvailable)
      .catch(() => setNativeAvailable(false));
  }, []);

  if (Platform.OS === 'ios' && nativeAvailable) {
    return (
      <AppleNativeSignInButton
        disabled={disabled}
        onError={onError}
        onSubmittingChange={onSubmittingChange}
        onSuccess={onSuccess}
      />
    );
  }

  if (isAppleWebConfigured()) {
    return (
      <AppleWebSignInButton
        disabled={disabled}
        onError={onError}
        onSubmittingChange={onSubmittingChange}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <>
      <Pressable style={[styles.appleButton, disabled && { opacity: 0.6 }]} disabled={disabled}>
        <Ionicons name="logo-apple" size={20} color="#000000" />
        <Text style={styles.appleButtonText}>Apple ile Devam Et</Text>
      </Pressable>
      <AppleSetupHint />
    </>
  );
}

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleConfigured = isGoogleConfigured();

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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Bir hata oluştu.';
      setError(message);
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

      {mode === 'login' ? (
        <Pressable style={styles.forgotRow} onPress={() => router.push('/forgot-password')}>
          <Text style={styles.forgotText}>Şifremi Unuttum</Text>
        </Pressable>
      ) : null}

      <Pressable
        style={[styles.button, (!canSubmit || submitting) && { opacity: 0.6 }]}
        onPress={onSubmit}
        disabled={!canSubmit || submitting}>
        <Text style={styles.buttonText}>{submitting ? '...' : mode === 'login' ? 'Giriş' : 'Kayıt Ol'}</Text>
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>veya</Text>
        <View style={styles.dividerLine} />
      </View>

      {googleConfigured ? (
        <GoogleSignInButton
          disabled={submitting}
          onError={(message) => setError(message || null)}
          onSubmittingChange={setSubmitting}
          onSuccess={() => router.back()}
        />
      ) : (
        <>
          <GoogleSignInPlaceholder disabled={submitting} />
          <GoogleSetupHint />
        </>
      )}

      <AppleSignInButton
        disabled={submitting}
        onError={(message) => setError(message || null)}
        onSubmittingChange={setSubmitting}
        onSuccess={() => router.back()}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeText}>Kapat</Text>
      </Pressable>
    </View>
  );
}
