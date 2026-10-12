import type { DayKey, TimeOfDay, Weekday } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day for a Date. Stored as a day (not a timestamp) so time-zone moves never shift entries. */
export function toDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // noon avoids DST edge cases
}

export function today(): DayKey {
  return toDayKey(new Date());
}

export function addDays(key: DayKey, n: number): DayKey {
  const d = fromDayKey(key);
  d.setDate(d.getDate() + n);
  return toDayKey(d);
}

export function weekdayOf(key: DayKey): Weekday {
  return fromDayKey(key).getDay() as Weekday;
}

/** Inclusive list of days, oldest first. */
export function dayRange(start: DayKey, end: DayKey): DayKey[] {
  const out: DayKey[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

/** The last `count` days ending at `end` (inclusive), oldest first. */
export function lastDays(end: DayKey, count: number): DayKey[] {
  return dayRange(addDays(end, -(count - 1)), end);
}

export function timeToMinutes(t: TimeOfDay): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): TimeOfDay {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function timeFromDate(date: Date): TimeOfDay {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function dateFromTime(t: TimeOfDay): Date {
  const d = new Date();
  const [h, m] = t.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

/** "3pm", "7:30am" – short, friendly, used in notification text. */
export function formatTimeShort(t: TimeOfDay): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${pad(m)}${suffix}`;
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const WEEKDAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
export const ALL_WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthLabel(year: number, month: number): string {
  return `${MONTHS[month]} ${year}`;
}

/** "Mon 12 Oct" */
export function formatDayShort(key: DayKey): string {
  const d = fromDayKey(key);
  return `${WEEKDAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** "12 Oct 2026" */
export function formatDayLong(key: DayKey): string {
  const d = fromDayKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

/**
 * Weeks of a month for a calendar grid, Sunday first.
 * Cells outside the month are null.
 */
export function monthGrid(year: number, month: number): (DayKey | null)[][] {
  const first = new Date(year, month, 1, 12);
  const daysInMonth = new Date(year, month + 1, 0, 12).getDate();
  const cells: (DayKey | null)[] = Array(first.getDay()).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toDayKey(new Date(year, month, d, 12)));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (DayKey | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
