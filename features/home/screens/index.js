import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/features/home/components/action-button';
import { DailyGoalCard } from '@/features/home/components/daily-goal-card';
import { HomeHeader } from '@/features/home/components/home-header';
import { StreakCard } from '@/features/home/components/streak-card';
import { SwipeHint } from '@/features/home/components/swipe-hint';
import { HOME_SCREEN_DATA } from '@/features/home/data/home-screen-data';
import { styles } from '@/features/home/screens/style';

export function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        overScrollMode="never">
        <HomeHeader profile={HOME_SCREEN_DATA.profile} />
        <View style={styles.sectionGap} />
        <StreakCard streak={HOME_SCREEN_DATA.streak} />
        <DailyGoalCard goal={HOME_SCREEN_DATA.dailyGoal} />

        <View style={styles.actions}>
          {HOME_SCREEN_DATA.actions.map((action) => (
            <ActionButton key={action.title} action={action} />
          ))}
        </View>

        <SwipeHint text={HOME_SCREEN_DATA.swipeHint} />
      </ScrollView>
    </SafeAreaView>
  );
}
