import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import type { ReminderPlan } from '../lib/reminders';

export const REMINDER_KIND = 'habit-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function getPermission(): Promise<PermissionState> {
  if (Platform.OS === 'web') return 'denied';
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionState;
}

export async function requestPermission(): Promise<PermissionState> {
  if (Platform.OS === 'web') return 'denied';
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return status as PermissionState;
}

export function openSystemSettings() {
  Linking.openSettings();
}

/** Cancels everything and schedules the plan from scratch. Safe to call often. */
export async function applyReminderPlan(plan: ReminderPlan): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!plan.reminders.length || (await getPermission()) !== 'granted') return;

  for (const r of plan.reminders) {
    const content: Notifications.NotificationContentInput = {
      title: r.title,
      body: r.body,
      data: { kind: REMINDER_KIND, habitId: r.habitId },
    };
    const trigger: Notifications.NotificationTriggerInput =
      r.weekday === null
        ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: r.hour, minute: r.minute }
        : {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: r.weekday + 1, // expo: 1 = Sunday
            hour: r.hour,
            minute: r.minute,
          };
    await Notifications.scheduleNotificationAsync({ content, trigger });
  }
}

export async function cancelAllReminders() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Compite', body: 'This is how your reminders will look.', data: { kind: REMINDER_KIND } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
  });
}
