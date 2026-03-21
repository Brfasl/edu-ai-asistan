import { StyleSheet, Text, View } from 'react-native';

import { homeColors } from '@/features/home/styles';

export function SwipeHint({ text }) {
  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    gap: 10,
  },
  handle: {
    width: 2,
    height: 32,
    borderRadius: 999,
    backgroundColor: homeColors.primary,
  },
  text: {
    color: '#3A424D',
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '700',
  },
});
