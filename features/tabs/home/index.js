import { View } from 'react-native';

import { HomeScreen } from '@/features/home';

import { styles } from './style';

export default function HomeTabScreen() {
  return (
    <View style={styles.container}>
      <HomeScreen />
    </View>
  );
}
