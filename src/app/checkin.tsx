import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput } from 'react-native';

import { RatingRow } from '../components/RatingRow';
import { Button, Card, Heading, Screen, Small } from '../components/ui';
import { formatDayShort, today } from '../lib/dates';
import type { CheckIn } from '../lib/types';
import { useStore } from '../state/store';
import { radius, space, useTheme } from '../theme';

const ROWS = [
  { key: 'mood', label: 'Mood', low: 'low', high: 'great', faces: ['😞', '🙁', '😐', '🙂', '😄'] },
  { key: 'energy', label: 'Energy', low: 'drained', high: 'energetic', faces: ['🪫', '😴', '😐', '🙂', '⚡️'] },
  { key: 'pain', label: 'Pain / cramps', low: 'none', high: 'a lot', faces: ['😌', '🙂', '😐', '😣', '😖'] },
  { key: 'skin', label: 'Skin', low: 'rough', high: 'calm', faces: ['😖', '🙁', '😐', '🙂', '✨'] },
  { key: 'sleep', label: 'Sleep', low: 'poor', high: 'great', faces: ['😫', '🥱', '😐', '🙂', '😴'] },
] as const;

export default function CheckInScreen() {
  const t = useTheme();
  const { data, dispatch } = useStore();
  const day = today();
  const existing = data.checkIns[day];
  const [draft, setDraft] = useState<CheckIn>(
    existing ?? { date: day, mood: null, energy: null, pain: null, skin: null, sleep: null, note: '' },
  );

  const hasAnything = ROWS.some((r) => draft[r.key] != null) || draft.note.trim().length > 0;

  const save = () => {
    dispatch({ type: 'saveCheckIn', checkIn: { ...draft, note: draft.note.trim() } });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <Screen>
      <Small>
        {formatDayShort(day)}
        {existing ? ' · editing today’s check-in' : ''}. Tap what fits; skip anything you like.
      </Small>
      <Card>
        {ROWS.map((r) => (
          <RatingRow
            key={r.key}
            label={r.label}
            low={r.low}
            high={r.high}
            faces={r.faces}
            value={draft[r.key]}
            onChange={(v) => setDraft((d) => ({ ...d, [r.key]: v }))}
          />
        ))}
      </Card>
      <Card>
        <Heading>Note (optional)</Heading>
        <TextInput
          accessibilityLabel="Note"
          value={draft.note}
          onChangeText={(note) => setDraft((d) => ({ ...d, note }))}
          placeholder="Anything you want to remember"
          placeholderTextColor={t.textMuted}
          multiline
          maxLength={1000}
          style={{
            minHeight: 88,
            color: t.text,
            fontSize: 16,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: radius.control,
            padding: space.m,
            textAlignVertical: 'top',
            backgroundColor: t.bg,
          }}
        />
      </Card>
      <Button title="Save check-in" icon="checkmark" onPress={save} disabled={!hasAnything} />
      {existing && (
        <Button
          kind="ghost"
          title="Clear today’s check-in"
          onPress={() => {
            dispatch({ type: 'deleteCheckIn', day });
            router.back();
          }}
        />
      )}
    </Screen>
  );
}
