import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, View } from 'react-native';

import { LockScreen } from '../components/LockScreen';
import { planReminders } from '../lib/reminders';
import { applyReminderPlan, REMINDER_KIND } from '../services/notifications';
import { StoreProvider, useStore } from '../state/store';
import { useTheme } from '../theme';

export default function RootLayout() {
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}

function App() {
  const t = useTheme();
  const { data, loaded } = useStore();
  const { settings } = data;

  useReminderSync();
  useOpenTodayFromNotification(loaded);
  const locked = useAppLock(loaded, settings.lockEnabled);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: t.bg }} />;

  const modal = { presentation: 'modal' as const, headerShown: true };
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.primary,
          headerTitleStyle: { color: t.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.bg },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Protected guard={!settings.onboardingDone}>
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={settings.onboardingDone}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="habit/[id]" options={{ ...modal, title: 'Habit' }} />
          <Stack.Screen name="checkin" options={{ ...modal, title: 'Daily check-in' }} />
          <Stack.Screen name="cycle-day/[date]" options={{ ...modal, title: 'Cycle log' }} />
          <Stack.Screen name="settings/notifications" options={{ title: 'Notifications' }} />
          <Stack.Screen name="settings/report" options={{ title: 'Doctor summary' }} />
          <Stack.Screen name="settings/privacy" options={{ title: 'Privacy & data' }} />
          <Stack.Screen name="settings/about" options={{ title: 'About' }} />
        </Stack.Protected>
      </Stack>
      {locked && <LockScreen onUnlocked={locked.unlock} />}
    </View>
  );
}

/** Rebuilds the whole local-notification schedule whenever habits or notification settings change. */
function useReminderSync() {
  const { data, loaded } = useStore();
  const { habits, settings } = data;
  const key = JSON.stringify([
    habits.map((h) => [h.id, h.name, h.reminderTimes, h.daysOfWeek, h.isActive, h.muted, h.sortOrder]),
    settings.notificationsEnabled,
    settings.quietHoursEnabled,
    settings.quietHoursStart,
    settings.quietHoursEnd,
    settings.maxRemindersPerDay,
    settings.discreetNotifications,
  ]);

  useEffect(() => {
    if (!loaded || Platform.OS === 'web') return;
    const timer = setTimeout(() => {
      applyReminderPlan(planReminders(habits, settings)).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, loaded]);

  // Permission may have been granted in iOS Settings while we were away.
  useEffect(() => {
    if (!loaded || Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') applyReminderPlan(planReminders(habits, settings)).catch(() => {});
    });
    return () => sub.remove();
  }, [key, loaded, habits, settings]);
}

function useOpenTodayFromNotification(ready: boolean) {
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;
    const handle = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const id = response.notification.request.identifier;
      if (handled.current === id) return;
      handled.current = id;
      if (
        response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER &&
        response.notification.request.content.data?.kind === REMINDER_KIND
      ) {
        router.navigate('/');
      }
    };
    // Cold start from a tapped notification, then any taps while running.
    Notifications.getLastNotificationResponseAsync().then(handle).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, [ready]);
}

/** Locks on launch and whenever the app returns from the background. */
function useAppLock(loaded: boolean, enabled: boolean) {
  const [locked, setLocked] = useState(false);
  const initialised = useRef(false);

  useEffect(() => {
    if (!loaded) return;
    if (!initialised.current) {
      initialised.current = true;
      setLocked(enabled); // cold launch
    } else if (!enabled) {
      setLocked(false);
    }
    // Turning the lock on from Settings doesn't lock the person out right away.
  }, [loaded, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') setLocked(true);
    });
    return () => sub.remove();
  }, [enabled]);

  return enabled && locked ? { unlock: () => setLocked(false) } : null;
}
