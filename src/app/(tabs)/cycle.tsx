import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FlowMarker } from '../../components/FlowMarker';
import { Body, Card, Heading, Screen, Small, Title } from '../../components/ui';
import { formatDayShort, fromDayKey, monthGrid, monthLabel, today, WEEKDAY_LETTER } from '../../lib/dates';
import { FLOW_LABELS, PAIN_LABELS } from '../../lib/report';
import type { CycleEntry, FlowLevel } from '../../lib/types';
import { useStore } from '../../state/store';
import { space, TAP, useTheme } from '../../theme';

const LEGEND: FlowLevel[] = ['spotting', 'light', 'medium', 'heavy'];

export default function CycleScreen() {
  const t = useTheme();
  const { data } = useStore();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const todayKey = today();

  const shift = (delta: number) =>
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const weeks = monthGrid(cursor.year, cursor.month);
  const monthEntries = weeks
    .flat()
    .filter((d): d is string => !!d && !!data.cycleEntries[d])
    .map((d) => data.cycleEntries[d])
    .reverse();
  const isCurrentMonth = cursor.year === now.getFullYear() && cursor.month === now.getMonth();

  const describe = (e?: CycleEntry) => (e ? `${FLOW_LABELS[e.flow]} flow${e.pain ? `, pain ${PAIN_LABELS[e.pain].toLowerCase()}` : ''}${e.note ? ', has note' : ''}` : 'nothing logged');

  return (
    <Screen padTop>
      <Title>Cycle</Title>
      <Card>
        <View style={styles.monthHeader}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => shift(-1)} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={24} color={t.primary} />
          </Pressable>
          <Text accessibilityRole="header" style={{ color: t.text, fontSize: 18, fontWeight: '600' }}>
            {monthLabel(cursor.year, cursor.month)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={() => shift(1)}
            disabled={isCurrentMonth}
            style={[styles.navBtn, { opacity: isCurrentMonth ? 0.3 : 1 }]}
          >
            <Ionicons name="chevron-forward" size={24} color={t.primary} />
          </Pressable>
        </View>

        <View style={styles.week} importantForAccessibility="no-hide-descendants">
          {WEEKDAY_LETTER.map((l, i) => (
            <Text key={i} style={[styles.cell, { color: t.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'center' }]}>
              {l}
            </Text>
          ))}
        </View>

        {weeks.map((week, wi) => (
          <View key={wi} style={styles.week}>
            {week.map((day, di) => {
              if (!day) return <View key={di} style={styles.cell} />;
              const entry = data.cycleEntries[day];
              const future = day > todayKey;
              const isToday = day === todayKey;
              const hasFlow = entry && entry.flow !== 'none';
              return (
                <Pressable
                  key={day}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatDayShort(day)}${isToday ? ', today' : ''}: ${describe(entry)}`}
                  disabled={future}
                  onPress={() => router.push({ pathname: '/cycle-day/[date]', params: { date: day } })}
                  style={({ pressed }) => [
                    styles.cell,
                    styles.day,
                    {
                      backgroundColor: hasFlow ? (t.dark ? '#4A2A3B' : '#FBE3EC') : 'transparent',
                      borderColor: isToday ? t.primary : 'transparent',
                      opacity: future ? 0.35 : pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: t.text, fontSize: 15, fontWeight: isToday ? '700' : '400' }}>{fromDayKey(day).getDate()}</Text>
                  {entry ? <FlowMarker entry={entry} size={5} /> : <View style={{ height: 7 }} />}
                </Pressable>
              );
            })}
          </View>
        ))}

        <View style={styles.legend} accessible accessibilityLabel="Legend: spotting is a ring; light, medium and heavy flow show one, two or three dots.">
          {LEGEND.map((flow) => (
            <View key={flow} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <FlowMarker entry={{ date: '', flow, pain: 0, note: '' }} size={6} />
              <Small>{FLOW_LABELS[flow]}</Small>
            </View>
          ))}
        </View>
      </Card>

      <Body muted>Tap any day to log. There’s no limit on how long a period lasts.</Body>

      {monthEntries.length > 0 && (
        <Card>
          <Heading>Logged this month</Heading>
          {monthEntries.map((e) => (
            <Pressable
              key={e.date}
              accessibilityRole="button"
              accessibilityLabel={`${formatDayShort(e.date)}: ${describe(e)}. Edit`}
              onPress={() => router.push({ pathname: '/cycle-day/[date]', params: { date: e.date } })}
              style={styles.entry}
            >
              <Text style={{ color: t.text, fontSize: 15, width: 96 }}>{formatDayShort(e.date)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 15 }}>
                  {FLOW_LABELS[e.flow]}
                  {e.pain ? ` · pain: ${PAIN_LABELS[e.pain].toLowerCase()}` : ''}
                </Text>
                {e.note ? <Small>{e.note}</Small> : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
            </Pressable>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: TAP, height: TAP, alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row' },
  cell: { flex: 1, margin: 2 },
  day: { minHeight: TAP + 4, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.m, justifyContent: 'center', marginTop: space.s },
  entry: { minHeight: TAP, flexDirection: 'row', alignItems: 'center', gap: space.s, paddingVertical: space.xs },
});
