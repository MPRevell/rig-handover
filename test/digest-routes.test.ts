import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const line = (job: string, status: string, at = '2026-10-30T01:00:00+01:00') =>
  JSON.stringify({ at, job, status, owner: null, error: null });

const dir = mkdtempSync(join(tmpdir(), 'rig-routes-'));
writeFileSync(join(dir, '2026-11-01.jsonl'), [line('zeta-job', 'ok'), line('alpha-job', 'ok'), line('mid-job', 'fail')].join('\n') + '\n');
writeFileSync(join(dir, '2026-11-02.jsonl'), '');
writeFileSync(join(dir, '2026-11-03.jsonl'), [line('zeta-job', 'ok'), 'not json {', line('alpha-job', 'ok')].join('\n') + '\n');

const app = createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: dir });
const sorted = ['alpha-job', 'mid-job', 'zeta-job'];

// Jobs in the order they first appear in the page.
const pageJobs = (html: string, jobs: string[]) =>
  jobs.filter((j) => html.includes(j)).sort((a, b) => html.indexOf(a) - html.indexOf(b));

describe('GET /digest/:night', () => {
  it('renders one table sorted by job', async () => {
    const res = await app.request('/digest/2026-11-01');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html.match(/<table/g)).toHaveLength(1);
    expect(pageJobs(html, sorted)).toEqual(sorted);
  });

  it('404s for a night with no file', async () => {
    expect((await app.request('/digest/2026-11-09')).status).toBe(404);
  });

  it('says "nothing ran" for an empty night', async () => {
    const res = await app.request('/digest/2026-11-02');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('still renders the valid jobs when a line is bad', async () => {
    const res = await app.request('/digest/2026-11-03');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('alpha-job');
    expect(html).toContain('zeta-job');
  });
});

describe('GET /api/digest/:night', () => {
  it('returns { night, rows, badLines } with rows sorted by job', async () => {
    const res = await app.request('/api/digest/2026-11-01');
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.night).toBe('2026-11-01');
    expect(body.badLines).toBe(0);
    expect(body.rows.map((r: { job: string }) => r.job)).toEqual(sorted);
  });

  it('404s for a night with no file', async () => {
    expect((await app.request('/api/digest/2026-11-09')).status).toBe(404);
  });

  it('returns no rows for an empty night', async () => {
    const res = await app.request('/api/digest/2026-11-02');
    expect(res.status).toBe(200);
    expect((await res.json()).rows).toEqual([]);
  });

  it('counts the bad line and keeps the valid rows', async () => {
    const res = await app.request('/api/digest/2026-11-03');
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.badLines).toBe(1);
    expect(body.rows.map((r: { job: string }) => r.job)).toEqual(['alpha-job', 'zeta-job']);
  });
});

describe('page and JSON agree', () => {
  it.each(['2026-11-01', '2026-11-03'])('same jobs, same order for %s', async (night) => {
    const html = await (await app.request(`/digest/${night}`)).text();
    const { rows } = await (await app.request(`/api/digest/${night}`)).json();
    const jobs = rows.map((r: { job: string }) => r.job);
    expect(pageJobs(html, [...sorted])).toEqual(jobs);
  });
});
