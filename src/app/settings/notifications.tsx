import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { Body, Button, Card, Divider, Heading, Screen, Small, Stepper, TimeField, ToggleRow } from '../../components/ui';
import { formatTimeShort } from '../../lib/dates';
import { sortHabits } from '../../lib/habits';
import { planReminders } from '../../lib/reminders';
import { getPermission, openSystemSettings, requestPermission, sendTestNotification, type PermissionState } from '../../services/notifications';
import { useStore } from '../../state/store';

export default function NotificationSettings() {
  const { data, dispatch } = useStore();
  const s = data.settings;
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const update = (patch: Partial<typeof s>) => dispatch({ type: 'updateSettings', patch });

  useFocusEffect(
    useCallback(() => {
      getPermission().then(setPermission);
    }, []),
  );

  const plan = planReminders(data.habits, s);
  const withReminders = sortHabits(data.habits).filter((h) => h.reminderTimes.length);

  return (
    <Screen>
      {permission === 'denied' && (
        <Card alt>
          <Heading>Notifications are off for Compite</Heading>
          <Body>That’s completely fine. If you’d like reminders, you can turn them on in your iPhone’s Settings.</Body>
          <Button title="Open Settings" icon="open-outline" onPress={openSystemSettings} />
        </Card>
      )}
      {permission === 'undetermined' && (
        <Card alt>
          <Heading>Allow reminders?</Heading>
          <Body>We’ll only send the reminders you choose, at the times you set.</Body>
          <Button title="Allow notifications" onPress={async () => setPermission(await requestPermission())} />
        </Card>
      )}

      <Card>
        <ToggleRow label="Reminders" hint="Turn all habit reminders on or off." value={s.notificationsEnabled} onChange={(v) => update({ notificationsEnabled: v })} />
        <Divider />
        <Stepper
          label="Max reminders per day"
          value={s.maxRemindersPerDay}
          min={1}
          max={10}
          onChange={(v) => update({ maxRemindersPerDay: v })}
        />
        <Small>If more are scheduled, the earliest ones in the day are sent.</Small>
        <Divider />
        <ToggleRow
          label="Hide habit names on lock screen"
          hint={'Shows “Time for your 3pm routine” instead.'}
          value={s.discreetNotifications}
          onChange={(v) => update({ discreetNotifications: v })}
        />
      </Card>

      <Card>
        <ToggleRow label="Quiet hours" hint="No reminders during this window." value={s.quietHoursEnabled} onChange={(v) => update({ quietHoursEnabled: v })} />
        {s.quietHoursEnabled && (
          <>
            <TimeField label="From" value={s.quietHoursStart} onChange={(v) => update({ quietHoursStart: v })} />
            <TimeField label="Until" value={s.quietHoursEnd} onChange={(v) => update({ quietHoursEnd: v })} />
          </>
        )}
      </Card>

      {withReminders.length > 0 && (
        <Card>
          <Heading>Per habit</Heading>
          {withReminders.map((h) => (
            <ToggleRow
              key={h.id}
              label={h.name}
              hint={h.reminderTimes.map(formatTimeShort).join(', ')}
              value={!h.muted}
              onChange={(on) => dispatch({ type: 'updateHabit', id: h.id, patch: { muted: !on } })}
            />
          ))}
        </Card>
      )}

      {s.notificationsEnabled && (plan.droppedByDailyMax > 0 || plan.droppedByQuietHours > 0 || plan.droppedByLimit > 0) && (
        <Small>
          {[
            plan.droppedByQuietHours > 0 && `${plan.droppedByQuietHours} reminder time${plan.droppedByQuietHours === 1 ? ' falls' : 's fall'} in quiet hours.`,
            plan.droppedByDailyMax > 0 && 'Some days have more reminders than your daily maximum; the later ones are skipped.',
            plan.droppedByLimit > 0 && 'iPhone limits how many reminders an app can schedule, so a few of the latest ones are skipped.',
          ]
            .filter(Boolean)
            .join(' ')}
        </Small>
      )}

      <Button
        kind="secondary"
        icon="paper-plane-outline"
        title="Send test notification"
        disabled={permission !== 'granted'}
        onPress={async () => {
          await sendTestNotification();
          Alert.alert('Test scheduled', 'Lock your phone or leave the app; it arrives in about 5 seconds.');
        }}
      />
      <Small>
        iPhone Focus modes and Scheduled Summary can delay or group notifications. If a reminder seems late, check Settings › Focus.
      </Small>
    </Screen>
  );
}
