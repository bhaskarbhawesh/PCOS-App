/** A calendar day in local time, formatted YYYY-MM-DD. */
export type DayKey = string;

/** A local clock time, formatted HH:MM (24h). */
export type TimeOfDay = string;

/** 0 = Sunday ... 6 = Saturday (same as Date#getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type HabitType = 'general' | 'medication' | 'supplement';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  type: HabitType;
  reminderTimes: TimeOfDay[];
  daysOfWeek: Weekday[];
  isActive: boolean;
  /** Per-habit mute: keeps the habit, silences its reminders. */
  muted: boolean;
  sortOrder: number;
  createdAt: DayKey;
}

/** completedAt ISO timestamps, keyed by day then habit id. */
export type HabitLogs = Record<DayKey, Record<string, string>>;

export type Rating = 1 | 2 | 3 | 4 | 5;

export const CHECK_IN_METRICS = ['mood', 'energy', 'pain', 'skin', 'sleep'] as const;
export type CheckInMetric = (typeof CHECK_IN_METRICS)[number];

export interface CheckIn {
  date: DayKey;
  mood: Rating | null;
  energy: Rating | null;
  pain: Rating | null;
  skin: Rating | null;
  sleep: Rating | null;
  note: string;
}

export const FLOW_LEVELS = ['none', 'spotting', 'light', 'medium', 'heavy'] as const;
export type FlowLevel = (typeof FLOW_LEVELS)[number];

export interface CycleEntry {
  date: DayKey;
  flow: FlowLevel;
  /** 0 (none) to 4 (a lot). */
  pain: 0 | 1 | 2 | 3 | 4;
  note: string;
}

export interface Settings {
  onboardingDone: boolean;
  notificationsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: TimeOfDay;
  quietHoursEnd: TimeOfDay;
  maxRemindersPerDay: number;
  /** Lock-screen text says "your routine" instead of the habit name. */
  discreetNotifications: boolean;
  lockEnabled: boolean;
}

export interface AppData {
  version: 1;
  habits: Habit[];
  habitLogs: HabitLogs;
  checkIns: Record<DayKey, CheckIn>;
  cycleEntries: Record<DayKey, CycleEntry>;
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  onboardingDone: false,
  notificationsEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '21:00',
  quietHoursEnd: '07:00',
  maxRemindersPerDay: 5,
  discreetNotifications: false,
  lockEnabled: false,
};

export function emptyData(): AppData {
  return {
    version: 1,
    habits: [],
    habitLogs: {},
    checkIns: {},
    cycleEntries: {},
    settings: { ...DEFAULT_SETTINGS },
  };
}
