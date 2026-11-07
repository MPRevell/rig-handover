import type { DigestRow } from './types.js';

// Shared by the page and the JSON route: by job name, plain code-unit order, stable.
export const sortRows = (rows: DigestRow[]): DigestRow[] =>
  [...rows].sort((a, b) => (a.job < b.job ? -1 : a.job > b.job ? 1 : 0));
