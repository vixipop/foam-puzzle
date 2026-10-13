// The share card: a crop of the finished puzzle (sparkles and all) with the
// time it took, as a PNG. Shares to X, copies to the clipboard or saves.
const HANDLE = '@vixenpspsps';

export function formatTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// shot: a canvas holding the frame; rect: the part of it to keep.
export function buildCard({ shot, rect, name, time, bg, ink }) {
  const W = 1080;
  const scale = W / rect.w;
  const bodyH = Math.round(rect.h * scale);
  const foot = 96;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = bodyH + foot;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(shot, rect.x, rect.y, rect.w, rect.h, 0, 0, W, bodyH);
  ctx.fillStyle = ink;
  ctx.textBaseline = 'middle';
  ctx.font = '600 30px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${name} · finished in ${formatTime(time)}`, 40, bodyH + foot / 2);
  ctx.globalAlpha = 0.6;
  ctx.font = '500 26px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(HANDLE, W - 40, bodyH + foot / 2);
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

// X can't take an image through a link, so: on phones the share sheet carries
// the picture; elsewhere the picture goes on the clipboard and X opens with the
// caption ready, for you to paste. Returns what happened, for the hint.
export async function shareToX(cv, name, time) {
  const text = `finished the ${name} jigglesaw in ${formatTime(time)} 🧩 ${HANDLE}`;
  const url = location.origin + location.pathname;
  if (matchMedia('(hover: none)').matches && navigator.canShare) {
    const file = new File([await toBlob(cv)], 'jigglesaw.png', { type: 'image/png' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: `${text} ${url}` });
        return 'shared';
      } catch {
        return 'cancelled';
      }
    }
  }
  const win = window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener');
  const copied = await copyImage(cv);
  if (!win) return 'blocked';
  return copied ? 'pasted' : 'opened';
}
