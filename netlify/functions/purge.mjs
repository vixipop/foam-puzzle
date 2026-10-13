// Once a day: delete shared cards older than a week, and old rate-limit counters.
import { getStore } from '@netlify/blobs';
import { KEEP_MS } from './share.mjs';

export const config = { schedule: '@daily' };

export async function purge(store, now = Date.now()) {
  let removed = 0;
  const { blobs } = await store.list({ prefix: 'img/' });
  for (const { key } of blobs) {
    const entry = await store.getWithMetadata(key, { type: 'arrayBuffer' });
    if (!entry || now - entry.metadata.at > KEEP_MS) {
      await store.delete(key);
      removed++;
    }
  }
  // Rate counters are named by the hour they count; anything over a day old is done with.
  const thisHour = Math.floor(now / 3600000);
  const rates = await store.list({ prefix: 'rate/' });
  for (const { key } of rates.blobs) {
    if (thisHour - Number(key.split('/')[1]) > 24) await store.delete(key);
  }
  return removed;
}

export default async () => {
  await purge(getStore('shares'));
};
