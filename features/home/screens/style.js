import { StyleSheet } from 'react-native';

import { homeColors } from '@/features/home/styles';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: homeColors.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 24,
    gap: 14,
  },
  sectionGap: {
    height: 4,
  },
  actions: {
    marginTop: 4,
    gap: 12,
  },
});
