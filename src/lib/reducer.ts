import { sortHabits } from './habits';
import { emptyData, DEFAULT_SETTINGS, type AppData, type CheckIn, type CycleEntry, type DayKey, type Habit, type Settings } from './types';

export type Action =
  | { type: 'hydrate'; data: AppData }
  | { type: 'addHabits'; habits: Habit[] }
  | { type: 'updateHabit'; id: string; patch: Partial<Omit<Habit, 'id'>> }
  | { type: 'deleteHabit'; id: string }
  | { type: 'moveHabit'; id: string; delta: -1 | 1 }
  | { type: 'toggleHabit'; id: string; day: DayKey; at: string }
  | { type: 'saveCheckIn'; checkIn: CheckIn }
  | { type: 'deleteCheckIn'; day: DayKey }
  | { type: 'saveCycleEntries'; entries: CycleEntry[] }
  | { type: 'deleteCycleEntry'; day: DayKey }
  | { type: 'updateSettings'; patch: Partial<Settings> }
  | { type: 'reset' };

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'hydrate':
      return action.data;

    case 'addHabits': {
      const start = state.habits.reduce((max, h) => Math.max(max, h.sortOrder), -1) + 1;
      const added = action.habits.map((h, i) => ({ ...h, sortOrder: start + i }));
      return { ...state, habits: [...state.habits, ...added] };
    }

    case 'updateHabit':
      return {
        ...state,
        habits: state.habits.map((h) => (h.id === action.id ? { ...h, ...action.patch, id: h.id } : h)),
      };

    case 'deleteHabit': {
      // Remove the habit and its completion history so nothing orphaned lingers.
      const habitLogs: AppData['habitLogs'] = {};
      for (const [day, entries] of Object.entries(state.habitLogs)) {
        const { [action.id]: _removed, ...rest } = entries;
        if (Object.keys(rest).length) habitLogs[day] = rest;
      }
      return { ...state, habits: state.habits.filter((h) => h.id !== action.id), habitLogs };
    }

    case 'moveHabit': {
      const sorted = sortHabits(state.habits);
      const i = sorted.findIndex((h) => h.id === action.id);
      const j = i + action.delta;
      if (i < 0 || j < 0 || j >= sorted.length) return state;
      [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      return { ...state, habits: sorted.map((h, idx) => ({ ...h, sortOrder: idx })) };
    }

    case 'toggleHabit': {
      const dayLogs = { ...(state.habitLogs[action.day] ?? {}) };
      if (dayLogs[action.id]) delete dayLogs[action.id];
      else dayLogs[action.id] = action.at;
      const habitLogs = { ...state.habitLogs };
      if (Object.keys(dayLogs).length) habitLogs[action.day] = dayLogs;
      else delete habitLogs[action.day];
      return { ...state, habitLogs };
    }

    case 'saveCheckIn':
      return { ...state, checkIns: { ...state.checkIns, [action.checkIn.date]: action.checkIn } };

    case 'deleteCheckIn': {
      const { [action.day]: _removed, ...checkIns } = state.checkIns;
      return { ...state, checkIns };
    }

    case 'saveCycleEntries': {
      const cycleEntries = { ...state.cycleEntries };
      for (const e of action.entries) cycleEntries[e.date] = e;
      return { ...state, cycleEntries };
    }

    case 'deleteCycleEntry': {
      const { [action.day]: _removed, ...cycleEntries } = state.cycleEntries;
      return { ...state, cycleEntries };
    }

    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'reset':
      return emptyData();
  }
}

/** Accepts whatever was on disk and returns well-formed data (never throws). */
export function migrate(raw: unknown): AppData {
  const base = emptyData();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppData>;
  return {
    version: 1,
    habits: Array.isArray(r.habits) ? r.habits.map((h) => ({ ...h, muted: Boolean(h.muted) })) : base.habits,
    habitLogs: isRecord(r.habitLogs) ? r.habitLogs : base.habitLogs,
    checkIns: isRecord(r.checkIns) ? r.checkIns : base.checkIns,
    cycleEntries: isRecord(r.cycleEntries) ? r.cycleEntries : base.cycleEntries,
    settings: { ...DEFAULT_SETTINGS, ...(isRecord(r.settings) ? r.settings : {}) },
  };
}

function isRecord(v: unknown): v is Record<string, any> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}
