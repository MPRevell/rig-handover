// Types for the run log reader (plan.md §1). Section 2 builds against these only.

export type RunStatus = 'ok' | 'retry' | 'fail';

// One row per job in a night's log. Rows come in order of each job's first line in the file;
// sorting is the view's job. "last" means the last line in file order (the log is append-only).
// Times are the log's own strings, offset kept (styleguide: never convert to UTC).
export type DigestRow = {
  job: string;
  // null when the log says null (or leaves it out). The reader keeps null; views render `—`.
  owner: string | null;
  // Number of valid lines for this job, whatever their status.
  runs: number;
  // Number of lines for this job with status `retry`.
  retries: number;
  lastStatus: RunStatus;
  // The `error` of the most recent line for this job that had one, even if a later line
  // recovered (e.g. retry, retry, ok keeps the retry's error). null when no line had one.
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

// The result of reading one night.
// - `missing`: no `runs/<night>.jsonl` on disk (routes answer 404).
// - `found`: the file exists. `rows` is empty when nothing ran (empty or blank-only file, or
//   only bad lines). `badLines` counts non-blank lines that aren't JSON or aren't a valid record;
//   they are skipped, never thrown.
export type Night =
  | { kind: 'missing'; night: string }
  | { kind: 'found'; night: string; rows: DigestRow[]; badLines: number };

// `night` is `YYYY-MM-DD`; anything else is treated as missing (no path tricks).
export type ReadNight = (runsDir: string, night: string) => Night;
