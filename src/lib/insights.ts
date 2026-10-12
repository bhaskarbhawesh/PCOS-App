import { habitsForDay, isDone } from './habits';
import { CHECK_IN_METRICS, type AppData, type CheckInMetric, type DayKey } from './types';

export interface DayHabitStats {
  day: DayKey;
  scheduled: number;
  completed: number;
}

export function habitStatsByDay(data: AppData, days: DayKey[]): DayHabitStats[] {
  return days.map((day) => {
    const due = habitsForDay(data.habits, day);
    return {
      day,
      scheduled: due.length,
      completed: due.filter((h) => isDone(data.habitLogs, h.id, day)).length,
    };
  });
}

export function totals(stats: DayHabitStats[]) {
  return stats.reduce(
    (acc, s) => ({ scheduled: acc.scheduled + s.scheduled, completed: acc.completed + s.completed }),
    { scheduled: 0, completed: 0 },
  );
}

/** One value per day (null where nothing was logged for that metric). */
export function metricSeries(data: AppData, metric: CheckInMetric, days: DayKey[]): (number | null)[] {
  return days.map((day) => data.checkIns[day]?.[metric] ?? null);
}

export function average(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v != null);
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export function metricAverages(data: AppData, days: DayKey[]): Record<CheckInMetric, number | null> {
  const out = {} as Record<CheckInMetric, number | null>;
  for (const m of CHECK_IN_METRICS) out[m] = average(metricSeries(data, m, days));
  return out;
}

export interface HabitSummary {
  habitId: string;
  name: string;
  scheduled: number;
  completed: number;
}

export function perHabitSummary(data: AppData, days: DayKey[]): HabitSummary[] {
  const map = new Map<string, HabitSummary>();
  for (const day of days) {
    for (const h of habitsForDay(data.habits, day)) {
      const row = map.get(h.id) ?? { habitId: h.id, name: h.name, scheduled: 0, completed: 0 };
      row.scheduled++;
      if (isDone(data.habitLogs, h.id, day)) row.completed++;
      map.set(h.id, row);
    }
  }
  return [...map.values()];
}

/** Plain, judgement-free caption, e.g. "You completed 12 of 21 habits this week." */
export function completionCaption(stats: DayHabitStats[], periodLabel: string): string {
  const t = totals(stats);
  if (t.scheduled === 0) return `No habits were scheduled ${periodLabel}.`;
  return `You completed ${t.completed} of ${t.scheduled} habit${t.scheduled === 1 ? '' : 's'} ${periodLabel}.`;
}

export function hasAnyData(data: AppData, days: DayKey[]): boolean {
  return days.some(
    (d) => data.checkIns[d] || data.cycleEntries[d] || Object.keys(data.habitLogs[d] ?? {}).length,
  );
}
