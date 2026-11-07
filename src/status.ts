import { readdirSync } from 'node:fs';
import type { RigConfig } from './config.js';
import { readNight } from './digest/read.js';
import { lastBeat, type Beat } from './heartbeat.js';

export type Status = {
  adapter: string;
  installed: string;
  lastBeat: Beat | null;
  nights: NightCounts[];
};

// Counts are rows (jobs) by lastStatus, not log lines: the same unit the digest shows.
export type NightCounts = { night: string; ok: number; retry: number; fail: number };

export function countNight(runsDir: string, night: string): NightCounts {
  const counts = { night, ok: 0, retry: 0, fail: 0 };
  const n = readNight(runsDir, night);
  if (n.kind === 'found') for (const r of n.rows) counts[r.lastStatus]++;
  return counts;
}

// Nights on disk = runs/<YYYY-MM-DD>.jsonl, newest first.
export function nightsOnDisk(runsDir: string): string[] {
  try {
    return readdirSync(runsDir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
      .map((f) => f.slice(0, 10))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export function readStatus(config: RigConfig): Status {
  return {
    adapter: config.adapter,
    installed: config.installed,
    lastBeat: lastBeat(),
    nights: nightsOnDisk(config.runsDir).map((n) => countNight(config.runsDir, n)),
  };
}
