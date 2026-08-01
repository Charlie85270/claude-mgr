import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

// A crontab that can be made to fail, so the paths the happy-path mock never
// reaches — read errors, write errors, a missing binary — are actually covered.

interface FakeSpawn {
  code: number;
  stdout?: string;
  stderr?: string;
  spawnError?: string;
}

let behaviour: { read: FakeSpawn; write: FakeSpawn };

vi.mock('child_process', () => ({
  spawn: vi.fn((cmd: string, args: string[] = []) => {
    const plan = args[0] === '-l' ? behaviour.read : behaviour.write;
    const proc = new EventEmitter() as EventEmitter & Record<string, unknown>;
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.stdin = { write: vi.fn(), end: vi.fn() };

    process.nextTick(() => {
      if (plan.spawnError) {
        proc.emit('error', new Error(plan.spawnError));
        return;
      }
      if (plan.stdout) (proc.stdout as EventEmitter).emit('data', plan.stdout);
      if (plan.stderr) (proc.stderr as EventEmitter).emit('data', plan.stderr);
      proc.emit('close', plan.code);
    });

    return proc;
  }),
}));

beforeEach(() => {
  vi.resetModules();
  behaviour = { read: { code: 0, stdout: '' }, write: { code: 0 } };
});

afterEach(() => vi.restoreAllMocks());

async function utils() {
  return import('../../../electron/utils/crontab');
}

describe('readCrontab', () => {
  it('treats "no crontab for user" as an empty crontab', async () => {
    // given
    behaviour.read = { code: 1, stderr: 'no crontab for andriy\n' };
    const { readCrontab } = await utils();

    // when
    const content = await readCrontab();

    // then
    expect(content).toBe('');
  });

  it('reports any other read failure rather than pretending the crontab is empty', async () => {
    // given — treating this as empty would make the next write wipe the crontab
    behaviour.read = { code: 1, stderr: 'crontab: permission denied\n' };
    const { readCrontab } = await utils();

    // when -> then
    await expect(readCrontab()).rejects.toThrow(/permission denied/);
  });

  it('reports a missing crontab binary', async () => {
    // given
    behaviour.read = { code: 0, spawnError: 'spawn crontab ENOENT' };
    const { readCrontab } = await utils();

    // when -> then
    await expect(readCrontab()).rejects.toThrow(/could not run crontab/);
  });
});

describe('writeCrontab', () => {
  it('reports a non-zero exit with the message cron printed', async () => {
    // given
    behaviour.write = { code: 1, stderr: 'errors in crontab file, cannot install\n' };
    const { writeCrontab } = await utils();

    // when -> then
    await expect(writeCrontab('* * * * * /bin/true\n')).rejects.toThrow(/cannot install/);
  });

  it('reports a missing crontab binary', async () => {
    // given
    behaviour.write = { code: 0, spawnError: 'spawn crontab ENOENT' };
    const { writeCrontab } = await utils();

    // when -> then
    await expect(writeCrontab('')).rejects.toThrow(/could not run crontab/);
  });

  it('resolves when cron accepts the file', async () => {
    // given
    behaviour.write = { code: 0 };
    const { writeCrontab } = await utils();

    // when -> then
    await expect(writeCrontab('* * * * * /bin/true\n')).resolves.toBeUndefined();
  });
});
