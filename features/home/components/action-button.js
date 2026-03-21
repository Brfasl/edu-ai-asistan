import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { homeColors } from '@/features/home/styles';

export function ActionButton({ action }) {
  const isPrimary = action.variant === 'primary';

  return (
    <Pressable style={[styles.button, isPrimary ? styles.primaryButton : styles.secondaryButton]}>
      <View style={styles.left}>
        <View style={[styles.iconWrap, isPrimary ? styles.primaryIconWrap : styles.secondaryIconWrap]}>
          <Ionicons name={action.iconName} size={18} color={isPrimary ? '#0F4424' : '#C7CCFF'} />
        </View>
        <View>
          <Text style={[styles.title, isPrimary ? styles.primaryTitle : styles.secondaryTitle]}>
            {action.title}
          </Text>
          {!!action.subtitle && <Text style={styles.subtitle}>{action.subtitle}</Text>}
        </View>
      </View>
      <Ionicons
        name="arrow-forward"
        size={18}
        color={isPrimary ? '#0C3F21' : homeColors.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: homeColors.primary,
    borderColor: homeColors.primaryDark,
  },
  secondaryButton: {
    backgroundColor: '#1B2027',
    borderColor: '#262D38',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryIconWrap: {
    backgroundColor: '#6AF29A',
  },
  secondaryIconWrap: {
    backgroundColor: '#272F3D',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  primaryTitle: {
    color: '#0E331C',
  },
  secondaryTitle: {
    color: homeColors.text,
  },
  subtitle: {
    marginTop: 2,
    color: homeColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
