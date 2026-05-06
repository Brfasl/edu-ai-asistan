import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import CustomBottomTabs from '@/components/CustomBottomTabs';
import { apiRequest } from '@/features/common/api/api-client';
import { useAuth } from '@/features/common/auth/auth-context';
import { styles } from './style';

export default function LibraryTabScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);

  async function onPickDocument() {
    try {
      if (!token) {
        router.push('/login');
        return;
      }
      setError(null);
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: false,
      });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file) return;

      const name = file.name || 'Belge';
      const sizeBytes = typeof file.size === 'number' ? file.size : undefined;
      const lower = name.toLowerCase();
      const type = lower.endsWith('.pdf') ? 'pdf' : lower.match(/\.(png|jpg|jpeg|webp)$/) ? 'image' : 'other';

      await apiRequest('/api/v1/documents', {
        method: 'POST',
        token,
        body: { name, type, sizeBytes },
      });

      // Refresh list
      const res = await apiRequest('/api/v1/documents', { token });
      setDocuments(res?.documents || []);
    } catch (e) {
      setError(e?.message || 'Yükleme başarısız.');
    }
  }

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        setLoading(true);
        setError(null);
        if (!token) {
          if (!mounted) return;
          setDocuments([]);
          return;
        }
        const res = await apiRequest('/api/v1/documents', { token });
        if (!mounted) return;
        setDocuments(res?.documents || []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Bir hata oluştu.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [token]);

  const viewDocuments = useMemo(() => {
    return documents.map((doc) => {
      const sizeMb = doc.sizeBytes ? (doc.sizeBytes / 1024 / 1024).toFixed(1) : null;
      const details = sizeMb ? `${sizeMb} MB` : '';
      return { ...doc, details };
    });
  }, [documents]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={18} color="#A7B2C2" />
          </View>
          <Text style={styles.title}>Kutuphane</Text>
          <View style={styles.headerActions}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="notifications-outline" size={18} color="#E4E9F2" />
            </View>
            <View style={styles.headerIconWrap}>
              <Ionicons name="settings-outline" size={18} color="#E4E9F2" />
            </View>
          </View>
        </View>

        <Pressable style={styles.uploadBox} onPress={onPickDocument}>
          <View style={styles.uploadIconRow}>
            <View style={[styles.uploadIconCircle, styles.cameraCircle]}>
              <Ionicons name="camera-outline" size={20} color="#2BE26E" />
            </View>
            <View style={[styles.uploadIconCircle, styles.pdfCircle]}>
              <Ionicons name="document-text-outline" size={20} color="#A387FF" />
            </View>
          </View>
          <Text style={styles.uploadTitle}>Tiklayarak veya Surukleyerek{'\n'}Belge Sec</Text>
          <Text style={styles.uploadSubtitle}>Galeriden veya Dosyalardan</Text>
        </Pressable>

        <View style={styles.filters}>
          <View style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>Tum Notlar</Text>
            <View style={styles.activeIndicator} />
          </View>
          <Text style={styles.inactiveFilterText}>Analiz Edilenler</Text>
          <Text style={styles.inactiveFilterText}>Bekleyenler</Text>
        </View>

        <Text style={styles.sectionTitle}>BELGE LISTESI</Text>

        {loading ? (
          <Text style={styles.inactiveFilterText}>Yukleniyor...</Text>
        ) : !token ? (
          <Pressable onPress={() => router.push('/login')}>
            <Text style={styles.inactiveFilterText}>Giriş yapman gerekiyor. Tıkla.</Text>
          </Pressable>
        ) : error ? (
          <Text style={styles.inactiveFilterText}>{error}</Text>
        ) : viewDocuments.length === 0 ? (
          <Text style={styles.inactiveFilterText}>Henuz belge yok.</Text>
        ) : (
          viewDocuments.map((doc) => (
          <Pressable
            key={doc.id}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/library/[id]',
                params: {
                  id: doc.id,
                  name: doc.name,
                  type: doc.type,
                },
              })
            }>
            <View style={styles.fileIconWrap}>
              {doc.type === 'pdf' ? (
                <Ionicons name="document-text-outline" size={20} color="#F4A07A" />
              ) : (
                <Ionicons name="image-outline" size={20} color="#9FAAFD" />
              )}
            </View>

            <View style={styles.cardTextWrap}>
              <Text style={styles.fileName} numberOfLines={1}>
                {doc.name}
              </Text>
              {!!doc.details && <Text style={styles.fileDetails}>{doc.details}</Text>}
            </View>

            {doc.status === 'done' ? (
              <Ionicons name="checkmark-circle" size={20} color="#2BE26E" />
            ) : (
              <MaterialCommunityIcons name="clock-time-four" size={20} color="#F2D33D" />
            )}
          </Pressable>
          ))
        )}
      </ScrollView>

      <CustomBottomTabs activeRoute="Library" />
    </View>
  );
}
