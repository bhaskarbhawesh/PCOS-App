import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Button, Card, Chip, Divider, Heading, Screen, Small, TimeField, ToggleRow, type IconName } from '../../components/ui';
import { ALL_WEEKDAYS, timeToMinutes, WEEKDAY_LETTER, WEEKDAY_SHORT } from '../../lib/dates';
import { createHabit, HABIT_ICONS, HABIT_LIBRARY, type HabitTemplate } from '../../lib/habits';
import type { Habit, HabitType, Weekday } from '../../lib/types';
import { getPermission, requestPermission } from '../../services/notifications';
import { useStore } from '../../state/store';
import { radius, space, TAP, useTheme } from '../../theme';

const TYPES: { value: HabitType; label: string }[] = [
  { value: 'general', label: 'Habit' },
  { value: 'medication', label: 'Medication' },
  { value: 'supplement', label: 'Supplement' },
];

type Draft = Pick<Habit, 'name' | 'icon' | 'type' | 'reminderTimes' | 'daysOfWeek' | 'muted' | 'isActive'>;

const blank: Draft = { name: '', icon: 'leaf-outline', type: 'general', reminderTimes: [], daysOfWeek: [...ALL_WEEKDAYS], muted: false, isActive: true };

export default function HabitScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, dispatch } = useStore();
  const existing = data.habits.find((h) => h.id === id);
  const isNew = !existing;
  const [draft, setDraft] = useState<Draft>(existing ?? blank);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const applyTemplate = (tpl: HabitTemplate) => set({ name: tpl.type === 'general' ? tpl.name : '', icon: tpl.icon, type: tpl.type, reminderTimes: tpl.reminderTimes });

  const toggleDay = (wd: Weekday) =>
    set({ daysOfWeek: draft.daysOfWeek.includes(wd) ? draft.daysOfWeek.filter((d) => d !== wd) : [...draft.daysOfWeek, wd].sort() });

  const addTime = async () => {
    const last = draft.reminderTimes.at(-1);
    const next = last ? `${String(Math.min(23, Number(last.slice(0, 2)) + 1)).padStart(2, '0')}:${last.slice(3)}` : '09:00';
    set({ reminderTimes: [...draft.reminderTimes, next] });
    // Ask for permission at the moment it becomes useful, after the person chose to add a reminder.
    if ((await getPermission()) === 'undetermined') await requestPermission();
  };

  const canSave = draft.name.trim().length > 0 && draft.daysOfWeek.length > 0;

  const save = () => {
    const clean: Draft = {
      ...draft,
      name: draft.name.trim(),
      reminderTimes: [...new Set(draft.reminderTimes)].sort((a, b) => timeToMinutes(a) - timeToMinutes(b)),
    };
    if (existing) dispatch({ type: 'updateHabit', id: existing.id, patch: clean });
    else dispatch({ type: 'addHabits', habits: [createHabit(clean, 0)] });
    router.back();
  };

  const remove = () =>
    Alert.alert('Delete this habit?', 'Its reminders and history will be removed. This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          dispatch({ type: 'deleteHabit', id: existing!.id });
          router.back();
        },
      },
    ]);

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: isNew ? 'New habit' : 'Edit habit',
          headerLeft: () => (
            <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.headerBtn}>
              <Text style={{ color: t.primary, fontSize: 17 }}>Cancel</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canSave }} disabled={!canSave} onPress={save} style={styles.headerBtn}>
              <Text style={{ color: canSave ? t.primary : t.textMuted, fontSize: 17, fontWeight: '600' }}>Save</Text>
            </Pressable>
          ),
        }}
      />

      {isNew && (
        <View style={{ gap: space.s }}>
          <Small>Quick start: tap one, then adjust anything</Small>
          <View style={styles.wrap}>
            {HABIT_LIBRARY.map((tpl) => (
              <Chip key={tpl.name} label={tpl.name} icon={tpl.icon as IconName} selected={false} onPress={() => applyTemplate(tpl)} />
            ))}
          </View>
        </View>
      )}

      <Card>
        <Heading>Name</Heading>
        <TextInput
          accessibilityLabel="Habit name"
          value={draft.name}
          onChangeText={(name) => set({ name })}
          placeholder={draft.type === 'general' ? 'e.g. 10-minute walk' : 'Type the name exactly as prescribed'}
          placeholderTextColor={t.textMuted}
          maxLength={60}
          returnKeyType="done"
          style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.bg }]}
        />
        <View style={styles.wrap}>
          {TYPES.map((ty) => (
            <Chip key={ty.value} label={ty.label} selected={draft.type === ty.value} onPress={() => set({ type: ty.value })} />
          ))}
        </View>
        {draft.type !== 'general' && (
          <Small>
            Type the name and time exactly as your doctor or pharmacist told you. This app only reminds you; it does not suggest medications or doses.
          </Small>
        )}
      </Card>

      <Card>
        <Heading>Icon</Heading>
        <View style={styles.wrap}>
          {HABIT_ICONS.map((name) => {
            const selected = draft.icon === name;
            return (
              <Pressable
                key={name}
                accessibilityRole="button"
                accessibilityLabel={`Icon ${name.replace(/-outline$/, '').replace(/-/g, ' ')}`}
                accessibilityState={{ selected }}
                onPress={() => set({ icon: name })}
                style={[styles.icon, { backgroundColor: selected ? t.primary : t.cardAlt }]}
              >
                <Ionicons name={name} size={22} color={selected ? t.onPrimary : t.text} />
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Heading>Days</Heading>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {ALL_WEEKDAYS.map((wd) => {
            const on = draft.daysOfWeek.includes(wd);
            return (
              <Pressable
                key={wd}
                accessibilityRole="checkbox"
                accessibilityLabel={WEEKDAY_SHORT[wd]}
                accessibilityState={{ checked: on }}
                onPress={() => toggleDay(wd)}
                style={[styles.day, { backgroundColor: on ? t.primary : t.cardAlt }]}
              >
                <Text style={{ color: on ? t.onPrimary : t.text, fontWeight: '600' }}>{WEEKDAY_LETTER[wd]}</Text>
              </Pressable>
            );
          })}
        </View>
        {draft.daysOfWeek.length === 0 && <Small>Pick at least one day.</Small>}
      </Card>

      <Card>
        <Heading>Reminders</Heading>
        {draft.reminderTimes.length === 0 && <Body muted>No reminder. You can still tick it off on the Today screen.</Body>}
        {draft.reminderTimes.map((time, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <TimeField
                label={`Reminder ${i + 1}`}
                value={time}
                onChange={(v) => set({ reminderTimes: draft.reminderTimes.map((x, j) => (j === i ? v : x)) })}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove reminder ${i + 1}`}
              onPress={() => set({ reminderTimes: draft.reminderTimes.filter((_, j) => j !== i) })}
              style={styles.headerBtn}
            >
              <Ionicons name="close-circle-outline" size={24} color={t.textMuted} />
            </Pressable>
          </View>
        ))}
        {draft.reminderTimes.length < 6 && <Button kind="secondary" icon="alarm-outline" title="Add reminder time" onPress={addTime} />}
        <Divider />
        <ToggleRow label="Mute this habit's reminders" value={draft.muted} onChange={(muted) => set({ muted })} />
        <ToggleRow
          label="Paused"
          hint="Hide it from Today without deleting its history."
          value={!draft.isActive}
          onChange={(paused) => set({ isActive: !paused })}
        />
      </Card>

      <Button title={isNew ? 'Add habit' : 'Save changes'} onPress={save} disabled={!canSave} />
      {!isNew && <Button kind="danger" title="Delete habit" icon="trash-outline" onPress={remove} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  input: { minHeight: TAP + 4, borderWidth: 1, borderRadius: radius.control, paddingHorizontal: space.m, fontSize: 17 },
  icon: { width: TAP + 4, height: TAP + 4, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  day: { width: TAP, height: TAP, borderRadius: TAP / 2, alignItems: 'center', justifyContent: 'center' },
  headerBtn: { minWidth: TAP, minHeight: TAP, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xs },
});
