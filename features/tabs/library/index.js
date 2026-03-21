import { View } from 'react-native';

import { PlaceholderScreen } from '@/features/common/components/placeholder-screen';

import { styles } from './style';

export default function LibraryTabScreen() {
  return (
    <View style={styles.screen}>
      <PlaceholderScreen
        title="Kutuphane"
        subtitle="Kaynaklarin, notlarin ve yukledigin belgeler burada toplanacak."
        iconName="library-outline"
      />
    </View>
  );
}
