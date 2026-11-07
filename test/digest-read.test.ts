import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

function tempRuns(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
}

describe('readNight', () => {
  it('reads 2026-10-28: 5 jobs, 1 bad line', () => {
    const night = readNight('runs', '2026-10-28');
    if (night.kind !== 'found') throw new Error('expected found');
    expect(night.badLines).toBe(1);
    expect(night.rows.map((r) => r.job)).toEqual([
      'rig/rotate-logs',
      'lane/sync',
      'fixtures/refresh',
      'notes/backup',
      'digest/render',
    ]);
    const byJob = Object.fromEntries(night.rows.map((r) => [r.job, r]));
    expect(byJob['fixtures/refresh']).toEqual({
      job: 'fixtures/refresh',
      owner: 'rook',
      runs: 4,
      retries: 3,
      lastStatus: 'ok',
      lastError: 'upstream 503',
      firstAt: '2026-10-29T01:30:00+01:00',
      lastAt: '2026-10-29T01:37:00+01:00',
    });
    expect(byJob['lane/sync']).toMatchObject({ runs: 8, retries: 1, lastStatus: 'ok', lastError: 'lock held' });
    expect(byJob['notes/backup']).toMatchObject({ runs: 1, lastStatus: 'fail', lastError: 'quota exceeded' });
    expect(byJob['digest/render']).toMatchObject({ owner: null, lastError: null });
  });

  it('a missing file is missing, an empty file is found with no rows', () => {
    const dir = tempRuns({ '2026-01-02.jsonl': '' });
    expect(readNight(dir, '2026-01-01')).toEqual({ kind: 'missing', night: '2026-01-01' });
    expect(readNight(dir, '2026-01-02')).toEqual({ kind: 'found', night: '2026-01-02', rows: [], badLines: 0 });
    expect(readNight(dir, '../etc/passwd').kind).toBe('missing');
  });

  it('counts invalid records as bad lines, skips blank lines', () => {
    const dir = tempRuns({
      '2026-01-03.jsonl': [
        '{"at":"t1","job":"a","status":"ok","owner":"x"}',
        '',
        '{"at":"t2","job":"a","status":"weird","owner":"x"}',
        '{"at":"t3","status":"ok","owner":"x"}',
        '[]',
        'null',
        'not json',
      ].join('\n'),
    });
    const night = readNight(dir, '2026-01-03');
    expect(night).toMatchObject({ kind: 'found', badLines: 5, rows: [{ job: 'a', runs: 1 }] });
  });
});
