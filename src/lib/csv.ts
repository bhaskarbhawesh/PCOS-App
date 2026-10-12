import { CHECK_IN_METRICS, type AppData } from './types';

export function csvCell(value: string | number | boolean | null | undefined): string {
  if (value == null) return '';
  const s = String(value);
  return /[",\r\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const HEADER = ['record', 'date', 'habit', 'completed_at', ...CHECK_IN_METRICS, 'flow', 'cycle_pain', 'note'];

/** Everything the user has entered, one row per record, in a single spreadsheet-friendly file. */
export function buildCsv(data: AppData): string {
  const rows: (string | number | null)[][] = [];
  const empty = (n: number) => Array<null>(n).fill(null);
  const names = new Map(data.habits.map((h) => [h.id, h.name]));

  for (const h of [...data.habits].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const schedule = `${h.type}; times ${h.reminderTimes.join(' ') || 'none'}; days ${h.daysOfWeek.join(' ')}${
      h.muted ? '; muted' : ''
    }${h.isActive ? '' : '; paused'}`;
    rows.push(['habit', h.createdAt, h.name, null, ...empty(CHECK_IN_METRICS.length), null, null, schedule]);
  }
  for (const day of Object.keys(data.habitLogs).sort()) {
    for (const [habitId, at] of Object.entries(data.habitLogs[day])) {
      rows.push(['habit_done', day, names.get(habitId) ?? '(deleted habit)', at, ...empty(CHECK_IN_METRICS.length), null, null, null]);
    }
  }
  for (const day of Object.keys(data.checkIns).sort()) {
    const c = data.checkIns[day];
    rows.push(['check_in', day, null, null, ...CHECK_IN_METRICS.map((m) => c[m]), null, null, c.note]);
  }
  for (const day of Object.keys(data.cycleEntries).sort()) {
    const e = data.cycleEntries[day];
    rows.push(['cycle', day, null, null, ...empty(CHECK_IN_METRICS.length), e.flow, e.pain, e.note]);
  }

  return [HEADER, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
