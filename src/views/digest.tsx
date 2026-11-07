import { sortRows } from '../digest/sort.js';
import type { Night } from '../digest/types.js';

export function DigestPage({ night }: { night: Night }) {
  if (night.kind === 'missing') {
    return (
      <>
        <h1>digest {night.night}</h1>
        <p class="warn">no log for this night</p>
      </>
    );
  }
  return (
    <>
      <h1>digest {night.night}</h1>
      {night.badLines > 0 && <p class="mute">{night.badLines} bad line(s) skipped</p>}
      {night.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr><th>job</th><th>owner</th><th>runs</th><th>retries</th><th>last</th><th>last error</th><th>first</th><th>last at</th><th></th></tr>
          </thead>
          <tbody>
            {sortRows(night.rows).map((r) => {
              const fail = r.lastStatus === 'fail';
              const retry = r.retries >= 3;
              return (
                <tr class={fail || retry ? 'warn flagged' : undefined}>
                  <td>{r.job}</td>
                  <td>{r.owner ?? '—'}</td>
                  <td>{r.runs}</td>
                  <td>{r.retries}</td>
                  <td>{r.lastStatus}</td>
                  <td>{r.lastError ?? '—'}</td>
                  <td>{r.firstAt}</td>
                  <td>{r.lastAt}</td>
                  <td>{[fail && '[FAIL]', retry && '[RETRIES]'].filter(Boolean).join(' ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
