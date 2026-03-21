import { View } from 'react-native';

import { PlaceholderScreen } from '@/features/common/components/placeholder-screen';

import { styles } from './style';

export default function StatisticsTabScreen() {
  return (
    <View style={styles.screen}>
      <PlaceholderScreen
        title="Istatistikler"
        subtitle="Haftalik ilerleme, XP dagilimi ve performans raporlarini burada goreceksin."
        iconName="bar-chart-outline"
      />
    </View>
  );
}
