import { useState } from 'react';
import { Text, View } from 'react-native';

import { HabitBars, RatingLine } from '../../components/Charts';
import { Body, Card, Chip, EmptyState, Heading, Screen, Small, Title } from '../../components/ui';
import { lastDays, today } from '../../lib/dates';
import { average, completionCaption, habitStatsByDay, hasAnyData, metricSeries } from '../../lib/insights';
import { METRIC_LABELS } from '../../lib/report';
import { CHECK_IN_METRICS, type CheckInMetric } from '../../lib/types';
import { useStore } from '../../state/store';
import { space, useTheme } from '../../theme';

type Range = 'week' | 'month';

export default function InsightsScreen() {
  const t = useTheme();
  const { data } = useStore();
  const [range, setRange] = useState<Range>('week');
  const days = lastDays(today(), range === 'week' ? 7 : 30);
  const stats = habitStatsByDay(data, days);
  const period = range === 'week' ? 'in the last 7 days' : 'in the last 30 days';

  const colors: Record<CheckInMetric, string> = {
    mood: t.primary,
    energy: t.accent,
    pain: t.flow,
    skin: t.dark ? '#E8C07A' : '#9A6B1F',
    sleep: t.dark ? '#8FC3E8' : '#2F6690',
  };

  return (
    <Screen padTop>
      <Title>Insights</Title>
      <View style={{ flexDirection: 'row', gap: space.s }} accessibilityRole="tablist">
        <Chip label="Week" selected={range === 'week'} onPress={() => setRange('week')} />
        <Chip label="Month" selected={range === 'month'} onPress={() => setRange('month')} />
      </View>

      {!hasAnyData(data, days) ? (
        <EmptyState icon="stats-chart-outline" title="Log a few days and your trends will appear here." />
      ) : (
        <>
          <Card>
            <Heading>Habits</Heading>
            <Body>{completionCaption(stats, period)}</Body>
            {stats.some((s) => s.scheduled > 0) && <HabitBars stats={stats} />}
            <Small>Filled part of each bar = done; full bar = scheduled that day.</Small>
          </Card>

          <Card>
            <Heading>How you’ve been feeling</Heading>
            <Small>Your 1–5 check-in ratings. For pain / cramps, higher means more.</Small>
            {CHECK_IN_METRICS.map((m) => {
              const values = metricSeries(data, m, days);
              const avg = average(values);
              return (
                <View key={m} style={{ gap: space.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>{METRIC_LABELS[m]}</Text>
                    <Small>{avg == null ? 'Not logged' : `Average ${avg}`}</Small>
                  </View>
                  {avg != null && <RatingLine days={days} values={values} label={METRIC_LABELS[m]} color={colors[m]} />}
                </View>
              );
            })}
          </Card>
        </>
      )}
    </Screen>
  );
}
