import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';

import { HabitCard } from '../../components/HabitCard';
import { Body, Button, Card, EmptyState, Heading, Screen, Small, Title } from '../../components/ui';
import { formatDayShort, formatTimeShort, today } from '../../lib/dates';
import { habitsForDay, isDone, overallStreak, sortHabits, streakFor } from '../../lib/habits';
import { useStore } from '../../state/store';
import { radius, space, TAP, useTheme } from '../../theme';

/** Today's date, refreshed when the app comes back to the foreground on a new day. */
function useToday() {
  const [day, setDay] = useState(today());
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setDay(today()));
    const timer = setInterval(() => setDay(today()), 60_000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);
  return day;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function TodayScreen() {
  const t = useTheme();
  const { data, dispatch } = useStore();
  const day = useToday();
  const [reorder, setReorder] = useState(false);

  const due = habitsForDay(data.habits, day);
  const otherDays = sortHabits(data.habits).filter((h) => !due.includes(h));
  const doneCount = due.filter((h) => isDone(data.habitLogs, h.id, day)).length;
  const streak = overallStreak(data.habits, data.habitLogs, day);
  const checkIn = data.checkIns[day];

  return (
    <Screen
      padTop
      footer={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={checkIn ? "Edit today's check-in" : 'Daily check-in'}
          onPress={() => router.push('/checkin')}
          style={({ pressed }) => [styles.fab, { backgroundColor: t.primary, opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name={checkIn ? 'create-outline' : 'happy-outline'} size={22} color={t.onPrimary} />
          <Text style={{ color: t.onPrimary, fontWeight: '600', fontSize: 16 }}>Check-in</Text>
        </Pressable>
      }
    >
      <View style={{ gap: space.xs }}>
        <Small>{formatDayShort(day)}</Small>
        <Title>{greeting()}</Title>
        {due.length > 0 && (
          <Body muted>
            {doneCount} of {due.length} done today{streak > 0 ? ` · ${streak}-day streak` : ''}
          </Body>
        )}
      </View>

      {!checkIn && (
        <Card alt>
          <Heading>How are you today?</Heading>
          <Body muted>A quick check-in takes about 10 seconds.</Body>
          <Button title="Start check-in" icon="happy-outline" onPress={() => router.push('/checkin')} />
        </Card>
      )}

      {data.habits.length === 0 ? (
        <EmptyState
          icon="leaf-outline"
          title="Nothing here yet."
          body="Add a habit to start your routine."
          action={<Button title="Add a habit" icon="add" onPress={() => router.push('/habit/new')} />}
        />
      ) : (
        <View style={{ gap: space.m }}>
          <View style={styles.sectionHeader}>
            <Heading>Today</Heading>
            <View style={{ flexDirection: 'row' }}>
              {data.habits.length > 1 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={reorder ? 'Done reordering' : 'Reorder habits'}
                  onPress={() => setReorder(!reorder)}
                  style={styles.iconBtn}
                >
                  <Ionicons name={reorder ? 'checkmark' : 'swap-vertical'} size={22} color={t.primary} />
                </Pressable>
              )}
              <Pressable accessibilityRole="button" accessibilityLabel="Add habit" onPress={() => router.push('/habit/new')} style={styles.iconBtn}>
                <Ionicons name="add-circle-outline" size={26} color={t.primary} />
              </Pressable>
            </View>
          </View>

          {due.length === 0 && <Body muted>No habits scheduled today. Enjoy the rest.</Body>}
          {(reorder ? sortHabits(data.habits) : due).map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              done={isDone(data.habitLogs, h.id, day)}
              streak={streakFor(h, data.habitLogs, day)}
              onToggle={() => dispatch({ type: 'toggleHabit', id: h.id, day, at: new Date().toISOString() })}
              onOpen={() => router.push({ pathname: '/habit/[id]', params: { id: h.id } })}
              reorder={reorder}
              onMove={(delta) => dispatch({ type: 'moveHabit', id: h.id, delta })}
            />
          ))}

          {!reorder && otherDays.length > 0 && (
            <View style={{ gap: space.s, marginTop: space.s }}>
              <Small>On other days</Small>
              {otherDays.map((h) => (
                <Pressable
                  key={h.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${h.name}${h.isActive ? '' : ', paused'}`}
                  onPress={() => router.push({ pathname: '/habit/[id]', params: { id: h.id } })}
                  style={[styles.otherRow, { borderColor: t.border }]}
                >
                  <Text style={{ color: t.text, fontSize: 15, flex: 1 }}>{h.name}</Text>
                  <Small>{h.isActive ? h.reminderTimes.map(formatTimeShort).join(', ') : 'Paused'}</Small>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { width: TAP, height: TAP, alignItems: 'center', justifyContent: 'center' },
  otherRow: {
    minHeight: TAP,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: space.m,
  },
  fab: {
    position: 'absolute',
    right: space.l,
    bottom: space.l,
    minHeight: TAP + 8,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
