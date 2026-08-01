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

/**
 * Whether a string is a safe 5-field cron expression.
 *
 * Automation and task schedules reach the crontab from MCP tools and stored
 * JSON, neither of which constrains the value. A newline would append arbitrary
 * extra crontab lines, and a malformed expression makes `crontab -` reject the
 * whole file, so both are rejected before anything is written.
 */
export function isValidCronExpression(expr: string): boolean {
  if (typeof expr !== 'string') return false;
  // % has a special meaning to cron (it terminates the command and feeds the
  // rest to stdin); \n and \r would inject whole lines.
  if (/[\n\r%]/.test(expr)) return false;

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) return false;

  const ranges: Array<[number, number]> = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]];
  return fields.every((field, i) => {
    const [min, max] = ranges[i];
    return field.split(',').every(part => {
      const [range, step] = part.split('/');
      if (step !== undefined && !/^[1-9]\d*$/.test(step)) return false;
      if (range === '*') return true;
      const bounds = range.split('-');
      if (bounds.length > 2) return false;
      return bounds.every(bound => {
        if (!/^\d+$/.test(bound)) return false;
        const value = parseInt(bound, 10);
        return value >= min && value <= max;
      });
    });
  });
}
