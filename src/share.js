// The share card: a crop of the finished puzzle (sparkles and all) with the
// time it took, as a PNG. Shares to X, copies to the clipboard or saves.
const HANDLE = '@vixenpspsps';

export function formatTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// shot: a canvas holding the frame; rect: the part of it to keep (it may run
// past the edges; the table colour fills in). The picture is kept between 4:3
// and 16:10 by adding table above and below, so it never looks cramped.
export function buildCard({ shot, rect, name, time, bg, ink }) {
  const W = 1200;
  const aspect = Math.min(1.6, Math.max(1.33, rect.w / rect.h));
  const hKeep = rect.w / aspect;
  const keep = { x: rect.x, y: rect.y - (hKeep - rect.h) / 2, w: rect.w, h: hKeep };
  const scale = W / keep.w;
  const bodyH = Math.round(keep.h * scale);
  const foot = 104;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = bodyH + foot;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cv.width, cv.height);
  // Copy just the part of the frame that exists.
  const sx = Math.max(0, keep.x);
  const sy = Math.max(0, keep.y);
  const sw = Math.min(shot.width, keep.x + keep.w) - sx;
  const sh = Math.min(shot.height, keep.y + keep.h) - sy;
  ctx.drawImage(shot, sx, sy, sw, sh, (sx - keep.x) * scale, (sy - keep.y) * scale, sw * scale, sh * scale);
  // The footer: a hairline, the name and time, the handle.
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.12;
  ctx.fillRect(0, bodyH, W, 2);
  ctx.globalAlpha = 1;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = '600 34px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillText(`${name} · finished in ${formatTime(time)}`, 48, bodyH + foot / 2 + 1);
  ctx.globalAlpha = 0.6;
  ctx.font = '500 28px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(HANDLE, W - 48, bodyH + foot / 2 + 1);
  return cv;
}

const toBlob = (cv) => new Promise((resolve) => cv.toBlob(resolve, 'image/png'));

export async function copyImage(cv) {
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': toBlob(cv) })]);
    return true;
  } catch {
    return false;
  }
}

export async function savePng(cv, name) {
  const a = document.createElement('a');
  a.download = `jigglesaw-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
  a.href = URL.createObjectURL(await toBlob(cv));
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// X can't take an image through a link, but it will show a preview card for
// one. So: save the card (the /api/share function, see netlify/functions),
// and open X with the caption and the card's own link. If saving fails
// (offline, or running locally), fall back to copying the image to paste.
// Returns what happened, for the hint.
export async function shareToX(cv, name, time) {
  const text = `finished the ${name} jigglesaw in ${formatTime(time)} 🧩 ${HANDLE}`;
  const intent = (link) => `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
  const home = location.origin + location.pathname;
  // Open the tab now, inside the click, so pop-up blockers allow it.
  const win = window.open('', '_blank');
  if (!win) return 'blocked';
  try {
    const jpeg = await new Promise((resolve) => cv.toBlob(resolve, 'image/jpeg', 0.9));
    const res = await fetch(`/api/share?name=${encodeURIComponent(name)}&time=${encodeURIComponent(formatTime(time))}`, {
      method: 'POST',
      headers: { 'content-type': 'image/jpeg' },
      body: jpeg,
    });
    if (!res.ok) throw new Error(String(res.status));
    const { url } = await res.json();
    win.location = intent(url);
    return 'linked';
  } catch {
    const copied = await copyImage(cv);
    win.location = intent(home);
    return copied ? 'pasted' : 'opened';
  }
}
