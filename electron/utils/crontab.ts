import { spawn } from 'child_process';

/**
 * Shared crontab plumbing for the scheduler and for automations.
 *
 * Both features register jobs in the same user crontab, so the read/modify/write
 * cycle and the marker convention live here — a fix applied in one place then
 * covers both, rather than having to be repeated per caller.
 *
 * Every line owned by Dorothy ends in `# <marker>`, and lines are matched by
 * that exact suffix. Matching on a substring would let one id that is a prefix
 * of another delete the wrong entry.
 */

/**
 * Read the current crontab.
 *
 * A user with no crontab is not an error — `crontab -l` exits non-zero and says
 * so on stderr, and that reads as an empty crontab. Any *other* failure is
 * reported, because treating it as empty would make the next write replace the
 * user's real crontab with just our line.
 */
export function readCrontab(): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('crontab', ['-l']);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else if (/no crontab/i.test(stderr)) {
        resolve('');
      } else {
        reject(new Error(`crontab -l failed with code ${code}: ${stderr.trim() || 'no output'}`));
      }
    });
    proc.on('error', (err) => reject(new Error(`could not run crontab: ${err.message}`)));
  });
}

export function writeCrontab(content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('crontab', ['-']);
    let stderr = '';

    proc.stderr.on('data', (data) => { stderr += data; });
    proc.stdin.write(content);
    proc.stdin.end();

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`crontab failed with code ${code}: ${stderr.trim() || 'no output'}`));
    });
    proc.on('error', (err) => reject(new Error(`could not run crontab: ${err.message}`)));
  });
}

/** Drop the lines Dorothy owns for `marker`, matching the exact `# <marker>` suffix. */
export function withoutMarkedLines(crontab: string, marker: string): string[] {
  const suffix = `# ${marker}`;
  const lines = crontab.split('\n').filter(line => !line.trimEnd().endsWith(suffix));
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }
  return lines;
}

export function hasMarkedLine(crontab: string, marker: string): boolean {
  const suffix = `# ${marker}`;
  return crontab.split('\n').some(line => line.trimEnd().endsWith(suffix));
}

/** Serialize crontab lines back to the text `crontab -` expects. */
export function joinLines(lines: string[]): string {
  return lines.length > 0 ? lines.join('\n') + '\n' : '';
}

/**
 * Replace (or add) the single line Dorothy owns for `marker`.
 *
 * `schedule` must already have been checked with isValidCronExpression, and
 * `command` must be free of newlines — this function assembles the line but
 * cannot vet its parts.
 */
export function markedLine(schedule: string, command: string, marker: string): string {
  return `${schedule} ${command} # ${marker}`;
}
