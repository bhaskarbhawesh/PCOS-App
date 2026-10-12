import { Ionicons } from '@expo/vector-icons';
import Tabs from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';

import type { IconName } from '../../components/ui';
import { useTheme } from '../../theme';

const icon =
  (name: IconName, focusedName: IconName) =>
  ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={focused ? focusedName : name} color={color} size={size} />
  );

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textMuted,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border },
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('sunny-outline', 'sunny') }} />
      <Tabs.Screen name="cycle" options={{ title: 'Cycle', tabBarIcon: icon('calendar-outline', 'calendar') }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: icon('stats-chart-outline', 'stats-chart') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('settings-outline', 'settings') }} />
    </Tabs>
  );
}
