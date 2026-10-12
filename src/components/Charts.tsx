import { useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { fromDayKey, WEEKDAY_LETTER } from '../lib/dates';
import type { DayHabitStats } from '../lib/insights';
import type { DayKey } from '../lib/types';
import { space, useTheme } from '../theme';

const dayLabel = (day: DayKey, index: number, count: number) => {
  const d = fromDayKey(day);
  if (count <= 7) return WEEKDAY_LETTER[d.getDay()];
  // Month view: label roughly every 5th day to stay readable.
  return index % 5 === 0 || index === count - 1 ? String(d.getDate()) : '';
};

/** Completed vs scheduled habits per day. */
export function HabitBars({ stats, height = 140 }: { stats: DayHabitStats[]; height?: number }) {
  const t = useTheme();
  const max = Math.max(1, ...stats.map((s) => s.scheduled));
  const gap = stats.length > 7 ? 2 : 8;
  return (
    <View>
      <View
        style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap }}
        accessible
        accessibilityLabel={`Bar chart of habits completed per day. ${stats
          .map((s) => `${fromDayKey(s.day).toDateString()}: ${s.completed} of ${s.scheduled}`)
          .join('. ')}`}
      >
        {stats.map((s) => (
          <View key={s.day} style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
            <View
              style={{
                height: `${(s.scheduled / max) * 100}%`,
                backgroundColor: t.cardAlt,
                borderRadius: 6,
                justifyContent: 'flex-end',
                overflow: 'hidden',
                minHeight: s.scheduled ? 4 : 0,
              }}
            >
              <View style={{ height: s.scheduled ? `${(s.completed / s.scheduled) * 100}%` : 0, backgroundColor: t.primary }} />
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 16, marginTop: space.xs }} importantForAccessibility="no-hide-descendants">
        {stats.map((s, i) => {
          const label = dayLabel(s.day, i, stats.length);
          if (!label) return null;
          // Centre each label under its bar without clipping it to the bar's width.
          const centre = ((i + 0.5) / stats.length) * 100;
          return (
            <View key={s.day} style={{ position: 'absolute', top: 0, left: `${centre}%`, width: 40, marginLeft: -20, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: t.textMuted }}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** A 1–5 line with gaps where nothing was logged. */
export function RatingLine({
  days,
  values,
  label,
  color,
  height = 90,
}: {
  days: DayKey[];
  values: (number | null)[];
  label: string;
  color: string;
  height?: number;
}) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const pad = 8;
  const x = (i: number) => pad + (days.length === 1 ? 0 : (i / (days.length - 1)) * (width - pad * 2));
  const y = (v: number) => pad + ((5 - v) / 4) * (height - pad * 2);

  // Split into runs of consecutive logged days.
  const runs: { i: number; v: number }[][] = [];
  let current: { i: number; v: number }[] = [];
  values.forEach((v, i) => {
    if (v == null) {
      if (current.length) runs.push(current);
      current = [];
    } else current.push({ i, v });
  });
  if (current.length) runs.push(current);

  const logged = values.filter((v) => v != null).length;
  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={`${label}: ${logged} day${logged === 1 ? '' : 's'} logged. ${values
        .map((v, i) => (v == null ? null : `${fromDayKey(days[i]).toDateString()}: ${v}`))
        .filter(Boolean)
        .join('. ')}`}
    >
      {width > 0 && (
        <Svg width={width} height={height}>
          {[1, 3, 5].map((g) => (
            <Line key={g} x1={pad} x2={width - pad} y1={y(g)} y2={y(g)} stroke={t.border} strokeWidth={1} />
          ))}
          {runs.map((run, k) =>
            run.length > 1 ? (
              <Polyline
                key={`l${k}`}
                points={run.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null,
          )}
          {runs.flat().map((p) => (
            <Circle key={`c${p.i}`} cx={x(p.i)} cy={y(p.v)} r={days.length > 7 ? 2.5 : 4} fill={color} />
          ))}
        </Svg>
      )}
    </View>
  );
}
