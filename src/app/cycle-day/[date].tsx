import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, Chip, Heading, Screen, Small, Stepper } from '../../components/ui';
import { addDays, formatDayLong, formatDayShort, today } from '../../lib/dates';
import { FLOW_LABELS, PAIN_LABELS } from '../../lib/report';
import { FLOW_LEVELS, type CycleEntry } from '../../lib/types';
import { useStore } from '../../state/store';
import { radius, space, useTheme } from '../../theme';

export default function CycleDayScreen() {
  const t = useTheme();
  const { date } = useLocalSearchParams<{ date: string }>();
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date ?? '') ? date! : today();
  const { data, dispatch } = useStore();
  const existing = data.cycleEntries[day];
  const [draft, setDraft] = useState<CycleEntry>(existing ?? { date: day, flow: 'medium', pain: 0, note: '' });
  const [alsoBefore, setAlsoBefore] = useState(0);

  const save = () => {
    const entry = { ...draft, note: draft.note.trim() };
    const extra: CycleEntry[] = [];
    // Fill the preceding days with the same flow & pain, keeping any notes already on them.
    for (let i = 1; i <= alsoBefore; i++) {
      const d = addDays(day, -i);
      extra.push({ date: d, flow: entry.flow, pain: entry.pain, note: data.cycleEntries[d]?.note ?? '' });
    }
    dispatch({ type: 'saveCycleEntries', entries: [entry, ...extra] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: formatDayShort(day) }} />

      <Card>
        <Heading>Flow</Heading>
        <View style={styles.wrap}>
          {FLOW_LEVELS.map((f) => (
            <Chip key={f} label={FLOW_LABELS[f]} selected={draft.flow === f} onPress={() => setDraft({ ...draft, flow: f })} />
          ))}
        </View>
      </Card>

      <Card>
        <Heading>Pain / cramps</Heading>
        <View style={styles.wrap}>
          {PAIN_LABELS.map((label, i) => (
            <Chip
              key={label}
              label={label}
              selected={draft.pain === i}
              onPress={() => setDraft({ ...draft, pain: i as CycleEntry['pain'] })}
            />
          ))}
        </View>
      </Card>

      <Card>
        <Heading>Note (optional)</Heading>
        <TextInput
          accessibilityLabel="Note"
          value={draft.note}
          onChangeText={(note) => setDraft({ ...draft, note })}
          placeholder="Anything you want to remember"
          placeholderTextColor={t.textMuted}
          multiline
          maxLength={1000}
          style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.bg }]}
        />
      </Card>

      <Card>
        <Stepper
          label="Also log the days before"
          value={alsoBefore}
          min={0}
          max={120}
          onChange={setAlsoBefore}
        />
        <Small>
          {alsoBefore > 0
            ? `Saves the same flow and pain for ${formatDayLong(addDays(day, -alsoBefore))} to ${formatDayLong(addDays(day, -1))} too.`
            : 'Handy for catching up on a longer stretch in one go.'}
        </Small>
      </Card>

      <Button title="Save" icon="checkmark" onPress={save} />
      {existing && (
        <Button
          kind="danger"
          title="Delete this day’s entry"
          icon="trash-outline"
          onPress={() => {
            dispatch({ type: 'deleteCycleEntry', day });
            router.back();
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  input: { minHeight: 88, fontSize: 16, borderWidth: 1, borderRadius: radius.control, padding: space.m, textAlignVertical: 'top' },
});
