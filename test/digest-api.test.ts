import { expect, test } from 'vitest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

test('api digest: sorted rows, 404 for missing', async () => {
  const app = createApp(loadConfig());
  const ok = await app.request('/api/digest/2026-10-28');
  const body = (await ok.json()) as { rows: { job: string }[] };
  const jobs = body.rows.map((r) => r.job);
  expect(jobs).toEqual([...jobs].sort());
  const miss = await app.request('/api/digest/2000-01-01');
  expect(miss.status).toBe(404);
  expect(await miss.json()).toEqual({ error: 'no such night', night: '2000-01-01' });
});
