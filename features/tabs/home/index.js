import { View } from 'react-native';

import CustomBottomTabs from '@/components/CustomBottomTabs';
import { HomeScreen } from '@/features/home';

import { styles } from './style';

export default function HomeTabScreen() {
  return (
    <View style={styles.container}>
      <HomeScreen />
      <CustomBottomTabs activeRoute="Home" />
    </View>
  );
}
