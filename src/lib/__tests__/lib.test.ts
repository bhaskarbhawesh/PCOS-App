import { buildCsv, csvCell } from '../csv';
import { addDays, dayRange, formatTimeShort, monthGrid, weekdayOf } from '../dates';
import { createHabit, overallStreak, streakFor } from '../habits';
import { completionCaption, habitStatsByDay, metricAverages } from '../insights';
import { migrate, reducer } from '../reducer';
import { isInQuietHours, MAX_PENDING, planReminders } from '../reminders';
import { buildReportHtml, escapeHtml, summarize } from '../report';
import { DEFAULT_SETTINGS, emptyData, type AppData, type Habit, type Settings, type Weekday } from '../types';

const settings = (patch: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, onboardingDone: true, ...patch });
const habit = (patch: Partial<Habit> & { name: string }, order = 0) =>
  createHabit({ createdAt: '2026-01-01', ...patch }, order);

describe('dates', () => {
  it('adds days across month, year and DST boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09'); // US DST start
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
    expect(dayRange('2026-02-27', '2026-03-02')).toHaveLength(4);
  });

  it('knows weekdays and builds month grids', () => {
    expect(weekdayOf('2026-10-12')).toBe(1); // Monday
    const grid = monthGrid(2026, 1); // Feb 2026 starts on Sunday
    expect(grid[0][0]).toBe('2026-02-01');
    expect(grid.flat().filter(Boolean)).toHaveLength(28);
    expect(grid.every((w) => w.length === 7)).toBe(true);
  });

  it('formats short times', () => {
    expect(formatTimeShort('15:00')).toBe('3pm');
    expect(formatTimeShort('00:30')).toBe('12:30am');
    expect(formatTimeShort('12:00')).toBe('12pm');
  });
});

describe('streaks', () => {
  const h = habit({ name: 'Walk' });
  const logs = (days: string[]) => Object.fromEntries(days.map((d) => [d, { [h.id]: 'x' }]));

  it('counts consecutive done days and ignores an unfinished today', () => {
    const l = logs(['2026-03-01', '2026-03-02', '2026-03-03']);
    expect(streakFor(h, l, '2026-03-03')).toBe(3);
    expect(streakFor(h, l, '2026-03-04')).toBe(3); // today not done yet: streak kept
    expect(streakFor(h, l, '2026-03-05')).toBe(0); // missed a whole day
  });

  it('skips days the habit is not scheduled', () => {
    // Mon/Wed/Fri only; 2026-03-02 is a Monday.
    const mwf = { ...h, daysOfWeek: [1, 3, 5] as Weekday[] };
    const l = logs(['2026-03-02', '2026-03-04', '2026-03-06']);
    expect(streakFor(mwf, l, '2026-03-08')).toBe(3); // Sunday
  });

  it('computes an overall streak across habits', () => {
    const a = habit({ name: 'A' });
    const b = habit({ name: 'B' }, 1);
    const l = { '2026-03-01': { [a.id]: 'x', [b.id]: 'x' }, '2026-03-02': { [a.id]: 'x', [b.id]: 'x' }, '2026-03-03': { [a.id]: 'x' } };
    expect(overallStreak([a, b], l, '2026-03-03')).toBe(2);
    expect(overallStreak([], l, '2026-03-03')).toBe(0);
  });
});

describe('reminder planning', () => {
  it('uses one daily trigger for every-day reminders and weekly triggers otherwise', () => {
    const daily = habit({ name: 'Drink water', reminderTimes: ['11:00'] });
    const weekly = habit({ name: 'Strength session', reminderTimes: ['18:00'], daysOfWeek: [1, 4] }, 1);
    const plan = planReminders([daily, weekly], settings());
    expect(plan.reminders.filter((r) => r.weekday === null)).toHaveLength(1);
    expect(plan.reminders.filter((r) => r.habitId === weekly.id).map((r) => r.weekday)).toEqual([1, 4]);
    expect(plan.reminders[0].body).toBe('Time for your 11am drink water');
  });

  it('respects quiet hours across midnight, daily max, mute and the global switch', () => {
    const s = settings({ quietHoursEnabled: true, quietHoursStart: '22:00', quietHoursEnd: '07:00' });
    expect(isInQuietHours('23:30', s)).toBe(true);
    expect(isInQuietHours('06:59', s)).toBe(true);
    expect(isInQuietHours('07:00', s)).toBe(false);

    const habits = ['06:00', '08:00', '09:00', '10:00', '12:00', '23:00'].map((t, i) =>
      habit({ name: `H${i}`, reminderTimes: [t] }, i),
    );
    const plan = planReminders(habits, { ...s, maxRemindersPerDay: 3 });
    expect(plan.reminders.map((r) => r.time)).toEqual(['08:00', '09:00', '10:00']);
    expect(plan.droppedByQuietHours).toBe(2);
    expect(plan.droppedByDailyMax).toBe(7); // 1 extra per day x 7 days

    expect(planReminders([{ ...habits[1], muted: true }], s).reminders).toHaveLength(0);
    expect(planReminders(habits, settings({ notificationsEnabled: false })).reminders).toHaveLength(0);
  });

  it('never exceeds the iOS pending-notification limit', () => {
    const habits = Array.from({ length: 10 }, (_, i) =>
      habit({ name: `H${i}`, reminderTimes: [`0${i}:15`], daysOfWeek: [0, 1, 2, 3, 4, 5] }, i),
    );
    const plan = planReminders(habits, settings({ maxRemindersPerDay: 10 }));
    expect(plan.reminders.length).toBe(MAX_PENDING);
    expect(plan.droppedByLimit).toBe(0 + 10 * 6 - MAX_PENDING);
  });

  it('can hide habit names on the lock screen', () => {
    const plan = planReminders([habit({ name: 'Metformin', type: 'medication', reminderTimes: ['09:00'] })], settings({ discreetNotifications: true }));
    expect(plan.reminders[0].body).toBe('Time for your 9am routine');
  });
});

describe('reducer', () => {
  it('toggles habits, saves check-ins and cycle entries, and resets', () => {
    let s: AppData = emptyData();
    const h = habit({ name: 'Walk' });
    s = reducer(s, { type: 'addHabits', habits: [h] });
    s = reducer(s, { type: 'toggleHabit', id: h.id, day: '2026-03-01', at: 'now' });
    expect(s.habitLogs['2026-03-01'][h.id]).toBe('now');
    s = reducer(s, { type: 'toggleHabit', id: h.id, day: '2026-03-01', at: 'now' });
    expect(s.habitLogs['2026-03-01']).toBeUndefined();

    // A 120-day period is fine: no length limit.
    const entries = dayRange('2026-01-01', addDays('2026-01-01', 119)).map((date) => ({ date, flow: 'medium' as const, pain: 1 as const, note: '' }));
    s = reducer(s, { type: 'saveCycleEntries', entries });
    expect(Object.keys(s.cycleEntries)).toHaveLength(120);

    s = reducer(s, { type: 'saveCheckIn', checkIn: { date: '2026-03-01', mood: 3, energy: 4, pain: 1, skin: null, sleep: 5, note: 'ok' } });
    s = reducer(s, { type: 'saveCheckIn', checkIn: { date: '2026-03-01', mood: 4, energy: 4, pain: 1, skin: null, sleep: 5, note: 'edited' } });
    expect(Object.keys(s.checkIns)).toHaveLength(1);
    expect(s.checkIns['2026-03-01'].note).toBe('edited');

    s = reducer(s, { type: 'reset' });
    expect(s).toEqual(emptyData());
  });

  it('deletes a habit with its history and reorders', () => {
    const a = habit({ name: 'A' });
    const b = habit({ name: 'B' });
    let s = reducer(emptyData(), { type: 'addHabits', habits: [a, b] });
    s = reducer(s, { type: 'moveHabit', id: b.id, delta: -1 });
    expect([...s.habits].sort((x, y) => x.sortOrder - y.sortOrder).map((h) => h.name)).toEqual(['B', 'A']);
    s = reducer(s, { type: 'toggleHabit', id: a.id, day: '2026-03-01', at: 'x' });
    s = reducer(s, { type: 'deleteHabit', id: a.id });
    expect(s.habits.map((h) => h.name)).toEqual(['B']);
    expect(s.habitLogs).toEqual({});
  });

  it('migrates junk or partial data safely', () => {
    expect(migrate(null)).toEqual(emptyData());
    expect(migrate({ settings: { lockEnabled: true } }).settings).toEqual({ ...DEFAULT_SETTINGS, lockEnabled: true });
  });
});

describe('insights, report and CSV', () => {
  const h = habit({ name: 'Walk <fast>' });
  const data: AppData = {
    ...emptyData(),
    habits: [h],
    habitLogs: { '2026-03-02': { [h.id]: 'x' } },
    checkIns: {
      '2026-03-02': { date: '2026-03-02', mood: 4, energy: 2, pain: 1, skin: null, sleep: 3, note: 'Felt "fine", mostly' },
      '2026-03-03': { date: '2026-03-03', mood: 2, energy: 4, pain: 3, skin: null, sleep: 5, note: '' },
    },
    cycleEntries: { '2026-03-03': { date: '2026-03-03', flow: 'heavy', pain: 2, note: '' } },
  };
  const week = dayRange('2026-02-26', '2026-03-04');

  it('summarises habits and check-ins without judgement', () => {
    const stats = habitStatsByDay(data, week);
    expect(completionCaption(stats, 'this week')).toBe('You completed 1 of 7 habits this week.');
    expect(metricAverages(data, week)).toEqual({ mood: 3, energy: 3, pain: 2, skin: null, sleep: 4 });
  });

  it('builds an escaped HTML report', () => {
    const html = buildReportHtml(data, summarize(data, '2026-03-04', 30));
    expect(html).toContain('Walk &lt;fast&gt;');
    expect(html).toContain('Heavy');
    expect(html).toContain('not medical advice');
    expect(escapeHtml(`<a href="x">'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&lt;/a&gt;');
  });

  it('exports CSV with quoting', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    const csv = buildCsv(data);
    expect(csv.split('\r\n')[0]).toBe('record,date,habit,completed_at,mood,energy,pain,skin,sleep,flow,cycle_pain,note');
    expect(csv).toContain('"Felt ""fine"", mostly"');
    expect(csv).toContain('cycle,2026-03-03');
  });
});
