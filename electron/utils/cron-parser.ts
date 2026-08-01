/**
 * Cron parsing utilities for Dorothy scheduler.
 * Handles conversion between cron expressions and launchd StartCalendarInterval entries.
 */

export interface CalendarEntry {
  Minute?: number;
  Hour?: number;
  Day?: number;
  Weekday?: number;
}

export interface ParsedCron {
  preset: 'hourly' | 'daily' | 'weekdays' | 'specific_days' | 'every_n_days' | 'monthly' | 'custom';
  time: string;           // HH:MM for single-time presets
  intervalDays: number;   // for every_n_days
  selectedDays: string[]; // for specific_days
  customCron: string;     // for custom preset
}

/**
 * Expand a cron field into an array of concrete values.
 * Handles wildcard, step expressions (e.g. every-3-hours), comma lists, and single values.
 */
export function expandField(field: string, max: number): (number | undefined)[] {
  if (field === '*') return [undefined];

  // Step expression: */n
  if (field.startsWith('*/')) {
    const step = parseInt(field.slice(2), 10);
    if (!isNaN(step) && step > 0) {
      return Array.from({ length: Math.ceil(max / step) }, (_, i) => i * step);
    }
  }

  // Comma-separated values
  const values = field.split(',').map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
  return values.length > 0 ? values : [undefined];
}

/**
 * Detect if an array of values forms a regular step pattern.
 * e.g. [0,3,6,9,12,15,18,21] produces "every 3 hours" step notation
 */
export function detectStep(vals: number[], max: number): string | null {
  if (vals.length < 2) return null;
  const sorted = [...vals].sort((a, b) => a - b);
  if (sorted[0] !== 0) return null;
  const step = sorted[1] - sorted[0];
  if (step <= 0) return null;
  const expected = Array.from({ length: Math.ceil(max / step) }, (_, i) => i * step);
  return JSON.stringify(sorted) === JSON.stringify(expected) ? `*/${step}` : null;
}

/**
 * Convert a cron expression to launchd StartCalendarInterval entries.
 * Supports: exact values, comma-separated lists, and step expressions (every N hours/minutes)
 */
export function cronToCalendarEntries(cron: string): CalendarEntry[] {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(`Invalid cron: expected 5 fields, got ${parts.length}`);

  const [minute, hour, dayOfMonth, , dayOfWeek] = parts;

  const minutes = expandField(minute, 60);
  const hours = expandField(hour, 24);
  const day = dayOfMonth !== '*' && !dayOfMonth.includes('/') && !dayOfMonth.includes(',')
    ? parseInt(dayOfMonth, 10) : undefined;
  const weekday = dayOfWeek !== '*' && !dayOfWeek.includes('-') && !dayOfWeek.includes(',')
    ? parseInt(dayOfWeek, 10) : undefined;

  const entries: CalendarEntry[] = [];
  for (const h of hours) {
    for (const m of minutes) {
      const entry: CalendarEntry = {};
      if (m !== undefined) entry.Minute = m;
      if (h !== undefined) entry.Hour = h;
      if (day !== undefined) entry.Day = day;
      if (weekday !== undefined) entry.Weekday = weekday;
      entries.push(entry);
    }
  }
  return entries;
}

/**
 * Reconstruct a cron string from launchd calendar entries.
 * Reverses cronToCalendarEntries, detecting step patterns where possible.
 */
export function calendarEntriesToCron(entries: CalendarEntry[]): string {
  if (entries.length === 0) return '* * * * *';

  const hours = [...new Set(entries.map(e => e.Hour).filter((h): h is number => h !== undefined))].sort((a, b) => a - b);
  const minutes = [...new Set(entries.map(e => e.Minute).filter((m): m is number => m !== undefined))].sort((a, b) => a - b);
  const day = entries[0].Day;
  const weekday = entries[0].Weekday;

  let hourStr = '*';
  if (hours.length > 0) {
    const step = detectStep(hours, 24);
    hourStr = step ?? (hours.length === 1 ? String(hours[0]) : hours.join(','));
  }

  let minuteStr = '*';
  if (minutes.length > 0) {
    const step = detectStep(minutes, 60);
    minuteStr = step ?? (minutes.length === 1 ? String(minutes[0]) : minutes.join(','));
  }

  const dayStr = day !== undefined ? String(day) : '*';
  const weekStr = weekday !== undefined ? String(weekday) : '*';

  return `${minuteStr} ${hourStr} ${dayStr} * ${weekStr}`;
}

/**
 * Parse a cron expression into UI preset + form values.
 * Used to pre-populate the edit dialog.
 */
export function parseCronToPreset(cron: string): ParsedCron {
  const result: ParsedCron = {
    preset: 'custom',
    time: '09:00',
    intervalDays: 2,
    selectedDays: ['1'],
    customCron: cron,
  };

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return result;

  const [min, hr, dom, , dow] = parts;

  // Any step or multi-value expression ->  always custom
  if (hr.includes('/') || min.includes('/') || hr.includes(',') || min.includes(',')) {
    result.preset = 'custom';
    result.customCron = cron;
    return result;
  }

  // Set time for single-value presets
  if (hr !== '*') {
    result.time = `${hr.padStart(2, '0')}:${min.padStart(2, '0')}`;
  }

  if (hr === '*' && dom === '*' && dow === '*') {
    result.preset = 'hourly';
  } else if (dom.startsWith('*/') && dow === '*') {
    result.preset = 'every_n_days';
    result.intervalDays = parseInt(dom.slice(2)) || 2;
  } else if (dom === '*' && dow === '1-5') {
    result.preset = 'weekdays';
  } else if (dom === '1' && dow === '*') {
    result.preset = 'monthly';
  } else if (dom === '*' && dow !== '*') {
    result.preset = 'specific_days';
    result.selectedDays = dow.split(',');
  } else if (dom === '*' && dow === '*') {
    result.preset = 'daily';
  } else {
    result.preset = 'custom';
  }

  return result;
}

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const CRON_MACROS = new Set([
  '@yearly', '@annually', '@monthly', '@weekly', '@daily', '@midnight', '@hourly', '@reboot',
]);

interface CronFieldSpec {
  min: number;
  max: number;
  names?: string[];
  nameBase?: number;
}

const CRON_FIELDS: CronFieldSpec[] = [
  { min: 0, max: 59 },
  { min: 0, max: 23 },
  { min: 1, max: 31 },
  { min: 1, max: 12, names: MONTH_NAMES, nameBase: 1 },
  { min: 0, max: 7, names: DAY_NAMES, nameBase: 0 },
];

function cronToken(token: string, spec: CronFieldSpec): number | null {
  if (spec.names) {
    const named = spec.names.indexOf(token.toLowerCase());
    if (named !== -1) return named + (spec.nameBase ?? 0);
  }
  if (!/^\d+$/.test(token)) return null;
  const value = Number(token);
  return value >= spec.min && value <= spec.max ? value : null;
}

function isValidCronField(field: string, spec: CronFieldSpec): boolean {
  if (field === '') return false;

  return field.split(',').every(part => {
    const [rangePart, ...steps] = part.split('/');

    // Every step must be a positive number, and a step only qualifies '*' or a
    // range — cron accepts "1-10/2" and "*/2" but rejects "5/10".
    if (steps.length > 0) {
      if (!steps.every(step => /^[1-9]\d*$/.test(step))) return false;
      if (rangePart !== '*' && !rangePart.includes('-')) return false;
    }

    if (rangePart === '*') return true;
    return rangePart.split('-').every(bound => cronToken(bound, spec) !== null);
  });
}

/**
 * Whether a string is a cron schedule that is safe to write to a crontab.
 *
 * Automation and task schedules reach the crontab from MCP tools and stored
 * JSON, neither of which constrains the value. A newline would append arbitrary
 * extra crontab lines and '%' terminates the command, so both are rejected —
 * and so is anything `crontab -` itself would refuse, since a rejected file
 * leaves the schedule saved with no job behind it.
 *
 * Named months and weekdays (JAN-DEC, SUN-SAT) and the @-macros are ordinary
 * cron syntax and are accepted.
 */
export function isValidCronExpression(expr: string): boolean {
  if (typeof expr !== 'string') return false;
  if (/[\n\r%]/.test(expr)) return false;

  const trimmed = expr.trim();
  if (CRON_MACROS.has(trimmed.toLowerCase())) return true;

  const fields = trimmed.split(/\s+/);
  if (fields.length !== CRON_FIELDS.length) return false;

  return fields.every((field, i) => isValidCronField(field, CRON_FIELDS[i]));
}
