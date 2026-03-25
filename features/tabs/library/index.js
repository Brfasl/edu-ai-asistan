import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';

import CustomBottomTabs from '@/components/CustomBottomTabs';
import { styles } from './style';

export default function LibraryTabScreen() {
  const documents = [
    {
      id: '1',
      name: 'Algoritma_Final_Ozet.pdf',
      details: 'Bugun • 2.4 MB',
      type: 'pdf',
      status: 'done',
    },
    {
      id: '2',
      name: 'Veritabani_Temelleri.jpg',
      details: 'Dun • 1.1 MB',
      type: 'image',
      status: 'pending',
    },
    {
      id: '3',
      name: 'Yapay_Zeka_Notlari.pdf',
      details: '12 Eki • 5.8 MB',
      type: 'pdf',
      status: 'done',
    },
  ];

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

        <View style={styles.uploadBox}>
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
        </View>

        <View style={styles.filters}>
          <View style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>Tum Notlar</Text>
            <View style={styles.activeIndicator} />
          </View>
          <Text style={styles.inactiveFilterText}>Analiz Edilenler</Text>
          <Text style={styles.inactiveFilterText}>Bekleyenler</Text>
        </View>

        <Text style={styles.sectionTitle}>BELGE LISTESI</Text>

        {documents.map((doc) => (
          <View key={doc.id} style={styles.card}>
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
              <Text style={styles.fileDetails}>{doc.details}</Text>
            </View>

            {doc.status === 'done' ? (
              <Ionicons name="checkmark-circle" size={20} color="#2BE26E" />
            ) : (
              <MaterialCommunityIcons name="clock-time-four" size={20} color="#F2D33D" />
            )}
          </View>
        ))}
      </ScrollView>

      <CustomBottomTabs activeRoute="Library" />
    </View>
  );
}
