import { View } from 'react-native';

import { PlaceholderScreen } from '@/features/common/components/placeholder-screen';

import { styles } from './style';

export default function ProfileTabScreen() {
  return (
    <View style={styles.screen}>
      <PlaceholderScreen
        title="Profil"
        subtitle="Hedeflerin, ayarlarin ve hesap detaylarin bu sekmede olacak."
        iconName="person-circle-outline"
      />
    </View>
  );
}
