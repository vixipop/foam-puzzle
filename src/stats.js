// Private visit and solve counts, via GoatCounter (free, no cookies). Visitors
// see nothing; the numbers are on your dashboard at https://CODE.goatcounter.com.
//
// Set CODE to the name you picked when signing up at goatcounter.com. Until
// then nothing is sent.
const CODE = 'jahnavi';

let ready = null;
function load() {
  if (!CODE || ready) return ready;
  ready = new Promise((resolve) => {
    window.goatcounter = { no_onload: true };
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.dataset.goatcounter = `https://${CODE}.goatcounter.com/count`;
    s.onload = () => resolve(window.goatcounter);
    s.onerror = () => resolve(null);
    document.head.append(s);
  });
  return ready;
}

// One page visit.
export function countVisit() {
  load()?.then((gc) => gc?.count?.({ path: 'visit', title: 'Page visit' }));
}

// One solve of a puzzle. Uploads are counted together, never by file name.
export function countSolve(name) {
  load()?.then((gc) => gc?.count?.({ path: `solved/${name}`, title: `Solved ${name}`, event: true }));
}
