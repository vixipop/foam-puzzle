// Saves a finished puzzle's card and hands back a link to it. Opening the link
// shows a preview card (the picture) when pasted into X, then lands on the
// puzzle. Cards are deleted after a week (see purge.mjs); an old link just
// goes to the homepage.
import { getStore } from '@netlify/blobs';

export const config = { path: ['/api/share', '/s/*', '/i/*'] };

const MAX_BYTES = 2_500_000;
export const KEEP_MS = 7 * 24 * 3600 * 1000;
const PER_HOUR = 20; // shares per visitor per hour

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const isJpeg = (b) => b[0] === 0xff && b[1] === 0xd8;
const isPng = (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

export async function handle(req, store, ip = 'unknown') {
  const url = new URL(req.url);
  const path = url.pathname;

  // Save a card.
  if (path === '/api/share' && req.method === 'POST') {
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_BYTES) return json({ error: 'bad size' }, 413);
    if (!isJpeg(bytes) && !isPng(bytes)) return json({ error: 'not an image' }, 415);

    const hour = Math.floor(Date.now() / 3600000);
    const rateKey = `rate/${hour}/${ip.replace(/[^a-zA-Z0-9:.]/g, '_')}`;
    const used = Number((await store.get(rateKey)) || 0);
    if (used >= PER_HOUR) return json({ error: 'slow down' }, 429);
    await store.set(rateKey, String(used + 1));

    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const name = (url.searchParams.get('name') || 'jigglesaw').slice(0, 60);
    const time = (url.searchParams.get('time') || '').slice(0, 10);
    await store.set(`img/${id}`, bytes, { metadata: { type: isPng(bytes) ? 'image/png' : 'image/jpeg', name, time, at: Date.now() } });
    return json({ url: `${url.origin}/s/${id}` });
  }

  const home = new Response(null, { status: 302, headers: { location: '/', 'cache-control': 'no-store' } });
  const id = path.split('/').pop().replace(/\.(jpg|png)$/, '');
  if (!/^[a-f0-9]{12}$/.test(id)) return path.startsWith('/s/') ? home : new Response('not found', { status: 404 });
  const entry = await store.getWithMetadata(`img/${id}`, { type: 'arrayBuffer' });
  const meta = entry?.metadata;
  if (!entry || Date.now() - meta.at > KEEP_MS) {
    if (entry) await store.delete(`img/${id}`);
    return path.startsWith('/s/') ? home : new Response('gone', { status: 404 });
  }

  // The card image itself.
  if (path.startsWith('/i/')) {
    return new Response(entry.data, { headers: { 'content-type': meta.type, 'cache-control': 'public, max-age=86400' } });
  }

  // The link people open: a preview for X, then on to the puzzle (by script, so crawlers stay on this page and read the card).
  if (path.startsWith('/s/')) {
    const title = `${meta.name}${meta.time ? ` · finished in ${meta.time}` : ''}`;
    const image = `${url.origin}/i/${id}.${meta.type === 'image/png' ? 'png' : 'jpg'}`;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(title)} · jigglesaw</title>
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="A foam jigsaw. Can you beat the time?">
<meta property="og:image" content="${esc(image)}"><meta property="og:url" content="${esc(url.href)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:image" content="${esc(image)}">
</head><body><p><a href="/">Play jigglesaw</a></p>
<script>location.replace("/")</script><noscript><meta http-equiv="refresh" content="0; url=/"></noscript></body></html>`;
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
  }
  return new Response('not found', { status: 404 });
}

export default async (req, context) => handle(req, getStore('shares'), context?.ip || 'unknown');
