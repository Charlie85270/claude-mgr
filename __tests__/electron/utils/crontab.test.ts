import { describe, it, expect } from 'vitest';
import { withoutMarkedLines, hasMarkedLine, joinLines, markedLine } from '../../../electron/utils/crontab';

describe('crontab helpers', () => {
  it('removes only the line carrying the exact marker', () => {
    // given
    const crontab = [
      '0 3 * * * /usr/local/bin/backup.sh',
      '*/30 * * * * /home/me/a.sh # dorothy-automation-abc',
      '',
    ].join('\n');

    // when
    const lines = withoutMarkedLines(crontab, 'dorothy-automation-abc');

    // then
    expect(lines).toEqual(['0 3 * * * /usr/local/bin/backup.sh']);
  });

  it('does not remove a marker that merely has this one as a prefix', () => {
    // given — 'abc' is a prefix of 'abcd'; a substring match would take both
    const crontab = [
      '*/30 * * * * /home/me/a.sh # dorothy-automation-abc',
      '*/30 * * * * /home/me/b.sh # dorothy-automation-abcd',
    ].join('\n');

    // when
    const lines = withoutMarkedLines(crontab, 'dorothy-automation-abc');

    // then
    expect(lines).toEqual(['*/30 * * * * /home/me/b.sh # dorothy-automation-abcd']);
    expect(hasMarkedLine(joinLines(lines), 'dorothy-automation-abcd')).toBe(true);
  });

  it('does not confuse a scheduler marker with an automation marker', () => {
    // given — the scheduler writes '# dorothy-<id>', automations '# dorothy-automation-<id>'
    const crontab = [
      '0 9 * * * /home/me/task.sh # dorothy-xyz',
      '0 9 * * * /home/me/auto.sh # dorothy-automation-xyz',
    ].join('\n');

    // when
    const afterScheduler = withoutMarkedLines(crontab, 'dorothy-xyz');
    const afterAutomation = withoutMarkedLines(crontab, 'dorothy-automation-xyz');

    // then
    expect(afterScheduler).toEqual(['0 9 * * * /home/me/auto.sh # dorothy-automation-xyz']);
    expect(afterAutomation).toEqual(['0 9 * * * /home/me/task.sh # dorothy-xyz']);
  });

  it('round-trips an empty crontab without leaving stray blank lines', () => {
    // given
    const crontab = '*/30 * * * * /home/me/a.sh # dorothy-automation-only\n';

    // when
    const text = joinLines(withoutMarkedLines(crontab, 'dorothy-automation-only'));

    // then
    expect(text).toBe('');
  });

  it('builds a line the marker helpers can find again', () => {
    // given
    const line = markedLine('*/15 * * * *', '/home/me/a.sh', 'dorothy-automation-1');

    // when
    const found = hasMarkedLine(line, 'dorothy-automation-1');

    // then
    expect(line).toBe('*/15 * * * * /home/me/a.sh # dorothy-automation-1');
    expect(found).toBe(true);
  });
});
