import { formatDayLong, formatDayShort, lastDays } from './dates';
import { metricAverages, perHabitSummary } from './insights';
import { CHECK_IN_METRICS, type AppData, type CheckInMetric, type DayKey, type FlowLevel } from './types';

export const DISCLAIMER =
  'This app is for tracking and reminders only. It does not provide medical advice, diagnosis or treatment. ' +
  'Always follow the guidance of your doctor or healthcare provider. If you have concerns about your health, ' +
  'contact a medical professional.';

export const METRIC_LABELS: Record<CheckInMetric, string> = {
  mood: 'Mood',
  energy: 'Energy',
  pain: 'Pain / cramps',
  skin: 'Skin',
  sleep: 'Sleep',
};

export const FLOW_LABELS: Record<FlowLevel, string> = {
  none: 'None',
  spotting: 'Spotting',
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
};

export const PAIN_LABELS = ['None', 'A little', 'Some', 'A lot', 'Very much'] as const;

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export interface ReportSummary {
  start: DayKey;
  end: DayKey;
  days: DayKey[];
  habits: ReturnType<typeof perHabitSummary>;
  averages: Record<CheckInMetric, number | null>;
  checkInCount: number;
  cycleCount: number;
}

export function summarize(data: AppData, end: DayKey, rangeDays: number): ReportSummary {
  const days = lastDays(end, rangeDays);
  return {
    start: days[0],
    end,
    days,
    habits: perHabitSummary(data, days),
    averages: metricAverages(data, days),
    checkInCount: days.filter((d) => data.checkIns[d]).length,
    cycleCount: days.filter((d) => data.cycleEntries[d]).length,
  };
}

const fmt = (v: number | null | undefined) => (v == null ? '–' : String(v));

/** Self-contained, paginated HTML for expo-print. */
export function buildReportHtml(data: AppData, summary: ReportSummary): string {
  const { days } = summary;
  const newestFirst = [...days].reverse();

  const habitRows = summary.habits.length
    ? summary.habits
        .map(
          (h) =>
            `<tr><td>${escapeHtml(h.name)}</td><td class="n">${h.completed} / ${h.scheduled}</td><td class="n">${
              h.scheduled ? Math.round((h.completed / h.scheduled) * 100) : 0
            }%</td></tr>`,
        )
        .join('')
    : '<tr><td colspan="3" class="muted">No habits scheduled in this period.</td></tr>';

  const avgRow = CHECK_IN_METRICS.map((m) => `<td class="n">${fmt(summary.averages[m])}</td>`).join('');

  const checkInRows = newestFirst
    .filter((d) => data.checkIns[d])
    .map((d) => {
      const c = data.checkIns[d];
      return `<tr><td>${formatDayShort(d)}</td>${CHECK_IN_METRICS.map((m) => `<td class="n">${fmt(c[m])}</td>`).join(
        '',
      )}<td>${escapeHtml(c.note)}</td></tr>`;
    })
    .join('');

  const cycleRows = newestFirst
    .filter((d) => data.cycleEntries[d])
    .map((d) => {
      const e = data.cycleEntries[d];
      return `<tr><td>${formatDayShort(d)}</td><td>${FLOW_LABELS[e.flow]}</td><td>${PAIN_LABELS[e.pain]}</td><td>${escapeHtml(
        e.note,
      )}</td></tr>`;
    })
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8" />
<style>
  @page { margin: 18mm 14mm; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #2B2433; font-size: 11pt; }
  h1 { color: #6C4F8F; font-size: 20pt; margin: 0 0 4px; }
  h2 { color: #6C4F8F; font-size: 13pt; margin: 22px 0 6px; border-bottom: 1px solid #E8DDF0; padding-bottom: 4px; }
  .sub { color: #6B6276; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { text-align: left; padding: 5px 6px; border-bottom: 1px solid #EFE8F3; vertical-align: top; word-wrap: break-word; overflow-wrap: anywhere; }
  th { background: #F6E6EE; font-size: 9.5pt; }
  tr { page-break-inside: avoid; }
  thead { display: table-header-group; }
  .n { text-align: center; width: 12%; }
  .muted { color: #8A8194; }
  .legend { color: #6B6276; font-size: 9pt; margin-top: 4px; }
  footer { margin-top: 28px; font-size: 9pt; color: #6B6276; border-top: 1px solid #E8DDF0; padding-top: 8px; }
</style></head><body>
<h1>Personal summary</h1>
<p class="sub">${formatDayLong(summary.start)} – ${formatDayLong(summary.end)} (${days.length} days)</p>

<h2>Habits</h2>
<table><thead><tr><th>Habit</th><th class="n">Done</th><th class="n">Rate</th></tr></thead><tbody>${habitRows}</tbody></table>

<h2>Daily check-ins</h2>
<p class="sub">${summary.checkInCount} check-in${summary.checkInCount === 1 ? '' : 's'} recorded.</p>
<table><thead><tr><th></th>${CHECK_IN_METRICS.map((m) => `<th class="n">${METRIC_LABELS[m]}</th>`).join('')}</tr></thead>
<tbody><tr><td>Average</td>${avgRow}</tr></tbody></table>
<p class="legend">Ratings are self-reported on a 1–5 scale. For pain / cramps, 1 = none and 5 = a lot.</p>
${
  checkInRows
    ? `<table><thead><tr><th>Date</th>${CHECK_IN_METRICS.map((m) => `<th class="n">${METRIC_LABELS[m]}</th>`).join(
        '',
      )}<th>Note</th></tr></thead><tbody>${checkInRows}</tbody></table>`
    : '<p class="muted">No check-ins in this period.</p>'
}

<h2>Cycle log</h2>
${
  cycleRows
    ? `<table><thead><tr><th>Date</th><th>Flow</th><th>Pain</th><th>Note</th></tr></thead><tbody>${cycleRows}</tbody></table>`
    : '<p class="muted">No cycle entries in this period.</p>'
}

<footer>Generated by Compite. For personal tracking only; not medical advice.</footer>
</body></html>`;
}
