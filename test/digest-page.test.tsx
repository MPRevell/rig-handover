import { expect, test } from 'vitest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

const app = createApp(loadConfig());

test('digest page renders a night and 404s a missing one', async () => {
  const ok = await app.request('/digest/2026-10-28');
  expect(ok.status).toBe(200);
  expect(await ok.text()).toContain('<table');
  expect((await app.request('/digest/2026-01-01')).status).toBe(404);
});
