import { addDays, ALL_WEEKDAYS, today, weekdayOf } from './dates';
import type { DayKey, Habit, HabitLogs, HabitType, TimeOfDay, Weekday } from './types';

export interface HabitTemplate {
  name: string;
  icon: string;
  type: HabitType;
  reminderTimes: TimeOfDay[];
}

/** Generic wellness habits only. Users edit or replace every one of them. */
export const HABIT_LIBRARY: HabitTemplate[] = [
  { name: '10-minute walk', icon: 'walk-outline', type: 'general', reminderTimes: ['15:00'] },
  { name: 'Strength session', icon: 'barbell-outline', type: 'general', reminderTimes: ['18:00'] },
  { name: 'Drink water', icon: 'water-outline', type: 'general', reminderTimes: ['11:00'] },
  { name: 'Bedtime routine', icon: 'moon-outline', type: 'general', reminderTimes: ['22:00'] },
  { name: 'Stretch', icon: 'body-outline', type: 'general', reminderTimes: ['08:00'] },
  { name: 'Regular meals', icon: 'restaurant-outline', type: 'general', reminderTimes: [] },
  { name: 'Mood check-in', icon: 'happy-outline', type: 'general', reminderTimes: ['20:00'] },
  { name: 'Medication / supplement', icon: 'alarm-outline', type: 'medication', reminderTimes: ['09:00'] },
];

export const HABIT_ICONS = [
  'walk-outline', 'barbell-outline', 'bicycle-outline', 'water-outline', 'moon-outline',
  'bed-outline', 'body-outline', 'restaurant-outline', 'nutrition-outline', 'cafe-outline',
  'happy-outline', 'leaf-outline', 'book-outline', 'musical-notes-outline', 'sunny-outline',
  'alarm-outline', 'medkit-outline', 'heart-outline', 'flower-outline', 'sparkles-outline',
] as const;

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createHabit(
  partial: Partial<Habit> & Pick<Habit, 'name'>,
  sortOrder: number,
): Habit {
  return {
    id: newId(),
    icon: 'leaf-outline',
    type: 'general',
    reminderTimes: [],
    daysOfWeek: [...ALL_WEEKDAYS],
    isActive: true,
    muted: false,
    createdAt: today(),
    ...partial,
    sortOrder,
  };
}

export function sortHabits(habits: Habit[]): Habit[] {
  return [...habits].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function scheduledDays(habit: Habit): Weekday[] {
  return habit.daysOfWeek.length ? habit.daysOfWeek : ALL_WEEKDAYS;
}

export function isScheduledOn(habit: Habit, day: DayKey): boolean {
  return habit.isActive && day >= habit.createdAt && scheduledDays(habit).includes(weekdayOf(day));
}

export function habitsForDay(habits: Habit[], day: DayKey): Habit[] {
  return sortHabits(habits).filter((h) => isScheduledOn(h, day));
}

export function isDone(logs: HabitLogs, habitId: string, day: DayKey): boolean {
  return Boolean(logs[day]?.[habitId]);
}

/**
 * Consecutive scheduled days completed, counting back from `asOf`.
 * Unscheduled days are skipped. If `asOf` itself isn't done yet it doesn't
 * break the streak (the day isn't over), it just doesn't count.
 */
export function streakFor(habit: Habit, logs: HabitLogs, asOf: DayKey = today()): number {
  let streak = 0;
  let day = asOf;
  if (isScheduledOn(habit, day) && !isDone(logs, habit.id, day)) day = addDays(day, -1);
  // Bounded walk back; a habit can't have a streak older than its creation day.
  for (let i = 0; i < 3660 && day >= habit.createdAt; i++, day = addDays(day, -1)) {
    if (!scheduledDays(habit).includes(weekdayOf(day))) continue;
    if (!isDone(logs, habit.id, day)) break;
    streak++;
  }
  return streak;
}

/** Days in a row with every scheduled habit done (days with nothing scheduled are skipped). */
export function overallStreak(habits: Habit[], logs: HabitLogs, asOf: DayKey = today()): number {
  if (!habits.some((h) => h.isActive)) return 0;
  const allDone = (day: DayKey) => habitsForDay(habits, day).every((h) => isDone(logs, h.id, day));
  let streak = 0;
  let day = asOf;
  if (!allDone(day)) day = addDays(day, -1);
  const earliest = habits.reduce((min, h) => (h.createdAt < min ? h.createdAt : min), asOf);
  for (let i = 0; i < 3660 && day >= earliest; i++, day = addDays(day, -1)) {
    const due = habitsForDay(habits, day);
    if (!due.length) continue;
    if (!due.every((h) => isDone(logs, h.id, day))) break;
    streak++;
  }
  return streak;
}
