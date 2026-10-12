import { ALL_WEEKDAYS, formatTimeShort, timeToMinutes } from './dates';
import { scheduledDays, sortHabits } from './habits';
import type { Habit, Settings, TimeOfDay, Weekday } from './types';

/** iOS keeps at most 64 pending local notifications per app; leave headroom for the test notification. */
export const MAX_PENDING = 60;

export interface PlannedReminder {
  habitId: string;
  time: TimeOfDay;
  hour: number;
  minute: number;
  /** null = every day (one repeating daily trigger), otherwise one weekly trigger per listed weekday. */
  weekday: Weekday | null;
  title: string;
  body: string;
}

export interface ReminderPlan {
  reminders: PlannedReminder[];
  /** Reminders left out because of the daily maximum, per weekday. */
  droppedByDailyMax: number;
  /** Reminders left out because they fall in quiet hours (counted once per habit/time). */
  droppedByQuietHours: number;
  /** Reminders left out because of the iOS pending limit. */
  droppedByLimit: number;
}

export function isInQuietHours(time: TimeOfDay, settings: Settings): boolean {
  if (!settings.quietHoursEnabled) return false;
  const t = timeToMinutes(time);
  const start = timeToMinutes(settings.quietHoursStart);
  const end = timeToMinutes(settings.quietHoursEnd);
  if (start === end) return false;
  return start < end ? t >= start && t < end : t >= start || t < end;
}

export function reminderBody(habit: Habit, time: TimeOfDay, discreet: boolean): string {
  const when = formatTimeShort(time);
  if (discreet) return `Time for your ${when} routine`;
  return `Time for your ${when} ${softenCapital(habit.name.trim())}`;
}

/** "Bedtime routine" -> "bedtime routine", but single words and names like "Metformin" or "B12" stay as typed. */
function softenCapital(name: string): string {
  return /^[A-Z][a-z]+ /.test(name) ? name[0].toLowerCase() + name.slice(1) : name;
}

/**
 * Turns habits + notification settings into the exact set of repeating triggers to schedule.
 * Uses calendar triggers (hour/minute[/weekday]) so reminders stay at the same local time across
 * time zones and daylight saving, and never schedules one-off notifications per date.
 */
export function planReminders(habits: Habit[], settings: Settings): ReminderPlan {
  const plan: ReminderPlan = { reminders: [], droppedByDailyMax: 0, droppedByQuietHours: 0, droppedByLimit: 0 };
  if (!settings.notificationsEnabled) return plan;

  const eligible = sortHabits(habits).filter((h) => h.isActive && !h.muted && h.reminderTimes.length);
  const quietKeys = new Set<string>();

  // Pick, per weekday, the earliest reminders up to the daily max.
  const chosen = new Map<string, Set<Weekday>>(); // key: habitId|time
  for (const wd of ALL_WEEKDAYS) {
    const candidates: { habit: Habit; time: TimeOfDay }[] = [];
    for (const habit of eligible) {
      if (!scheduledDays(habit).includes(wd)) continue;
      for (const time of new Set(habit.reminderTimes)) {
        if (isInQuietHours(time, settings)) {
          quietKeys.add(`${habit.id}|${time}`);
          continue;
        }
        candidates.push({ habit, time });
      }
    }
    candidates.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    const max = Math.max(1, settings.maxRemindersPerDay);
    plan.droppedByDailyMax += Math.max(0, candidates.length - max);
    for (const { habit, time } of candidates.slice(0, max)) {
      const key = `${habit.id}|${time}`;
      if (!chosen.has(key)) chosen.set(key, new Set());
      chosen.get(key)!.add(wd);
    }
  }
  plan.droppedByQuietHours = quietKeys.size;

  const byId = new Map(eligible.map((h) => [h.id, h]));
  const all: PlannedReminder[] = [];
  for (const [key, days] of chosen) {
    const [habitId, time] = key.split('|');
    const habit = byId.get(habitId)!;
    const [hour, minute] = time.split(':').map(Number);
    const base = { habitId, time, hour, minute, title: 'Compite', body: reminderBody(habit, time, settings.discreetNotifications) };
    if (days.size === 7) all.push({ ...base, weekday: null });
    else for (const wd of [...days].sort()) all.push({ ...base, weekday: wd });
  }
  all.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time) || (a.weekday ?? -1) - (b.weekday ?? -1));

  plan.reminders = all.slice(0, MAX_PENDING);
  plan.droppedByLimit = all.length - plan.reminders.length;
  return plan;
}
