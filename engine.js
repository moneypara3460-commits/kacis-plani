// KAÇIŞ PLANI - oyun kuralları (ekrandan bağımsız)
// Kareler: # duvar, . zemin, S başlangıç, E çıkış, T gizli tuzak, K anahtar, D kilitli kapı
// Tuzaklar sadece boş zeminlerde olur (S, E, K, D karelerinde asla tuzak yok).

export const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // yukarı, sağ, aşağı, sol
export const START_LIVES = 3;

export function parseLevel(rows) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const cells = [];
  let start = -1, exit = -1, traps = 0, doors = 0, keys = 0;
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const ch = rows[r][c] || "#";
    cells.push(ch);
    const i = r * w + c;
    if (ch === "S") start = i;
    else if (ch === "E") exit = i;
    else if (ch === "T") traps++;
    else if (ch === "D") doors++;
    else if (ch === "K") keys++;
  }
  const lv = { w, h, cells, start, exit, traps, doors, keys };
  lv.nb = cells.map((_, i) => countNb(lv, i));
  return lv;
}

export function neighbors8(lv, i) {
  const c = i % lv.w, r = (i - c) / lv.w, out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const nc = c + dc, nr = r + dr;
    if (nc < 0 || nr < 0 || nc >= lv.w || nr >= lv.h) continue;
    out.push(nr * lv.w + nc);
  }
  return out;
}

export function neighbors4(lv, i) {
  const c = i % lv.w, r = (i - c) / lv.w, out = [];
  for (const [dx, dy] of DIRS) {
    const nc = c + dx, nr = r + dy;
    if (nc < 0 || nr < 0 || nc >= lv.w || nr >= lv.h) continue;
    out.push(nr * lv.w + nc);
  }
  return out;
}

function countNb(lv, i) {
  let n = 0;
  for (const j of neighbors8(lv, i)) if (lv.cells[j] === "T") n++;
  return n;
}

export function newState(lv) {
  const n = lv.cells.length;
  const visited = new Array(n).fill(0);
  visited[lv.start] = 1;
  return {
    pos: lv.start, lives: START_LIVES, keys: 0, moves: 0, lost: 0, status: "play",
    visited, flags: new Array(n).fill(0), revealed: new Array(n).fill(0),
    opened: new Array(n).fill(0), taken: new Array(n).fill(0)
  };
}

const copy = s => ({
  ...s, visited: s.visited.slice(), flags: s.flags.slice(), revealed: s.revealed.slice(),
  opened: s.opened.slice(), taken: s.taken.slice()
});

// Hamle: dir = 0..3. Sonuç: { s: yeni durum, ev: olay }
// olaylar: blocked, flag, locked, step, key, door, trap, win, lose
export function move(lv, s, dir) {
  if (s.status !== "play") return { s, ev: "blocked" };
  const [dx, dy] = DIRS[dir];
  const c = s.pos % lv.w, r = (s.pos - c) / lv.w;
  const nc = c + dx, nr = r + dy;
  if (nc < 0 || nr < 0 || nc >= lv.w || nr >= lv.h) return { s, ev: "blocked" };
  const t = nr * lv.w + nc, ch = lv.cells[t];
  if (ch === "#") return { s, ev: "blocked" };
  if (s.flags[t]) return { s, ev: "flag" };
  if (s.revealed[t]) return { s, ev: "blocked" };
  const n = copy(s);
  if (ch === "D" && !s.opened[t]) {
    if (s.keys < 1) return { s, ev: "locked" };
    n.keys--; n.opened[t] = 1; n.pos = t; n.visited[t] = 1; n.moves++;
    return { s: n, ev: "door" };
  }
  if (ch === "T") {
    n.lives--; n.lost++; n.moves++; n.revealed[t] = 1;
    if (n.lives <= 0) { n.status = "lost"; return { s: n, ev: "lose" }; }
    return { s: n, ev: "trap" };
  }
  n.pos = t; n.visited[t] = 1; n.moves++;
  if (ch === "K" && !n.taken[t]) { n.taken[t] = 1; n.keys++; return { s: n, ev: "key" }; }
  if (ch === "E") { n.status = "won"; return { s: n, ev: "win" }; }
  return { s: n, ev: "step" };
}

export function moveTo(lv, s, t) {
  const c = s.pos % lv.w, r = (s.pos - c) / lv.w, tc = t % lv.w, tr = (t - tc) / lv.w;
  const d = DIRS.findIndex(([dx, dy]) => c + dx === tc && r + dy === tr);
  return d < 0 ? { s, ev: "blocked" } : move(lv, s, d);
}

// Bayrak: ziyaret edilmemiş, açığa çıkmamış, duvar olmayan karelere konur
export function toggleFlag(lv, s, i) {
  if (s.status !== "play") return s;
  if (lv.cells[i] === "#" || s.visited[i] || s.revealed[i]) return s;
  const n = copy(s);
  n.flags[i] = n.flags[i] ? 0 : 1;
  return n;
}

// Ziyaret edilmiş kareler arasında hedefe giden yol (yön listesi). Yoksa null.
export function pathTo(lv, s, target) {
  if (!s.visited[target] || target === s.pos) return null;
  const prev = new Array(lv.cells.length).fill(-1);
  prev[s.pos] = s.pos;
  const q = [s.pos];
  while (q.length) {
    const u = q.shift();
    if (u === target) break;
    for (const v of neighbors4(lv, u)) {
      if (prev[v] >= 0 || !s.visited[v]) continue;
      prev[v] = u; q.push(v);
    }
  }
  if (prev[target] < 0) return null;
  const dirs = [];
  for (let v = target; v !== s.pos; v = prev[v]) {
    const u = prev[v], d = DIRS.findIndex(([dx, dy]) => (u % lv.w) + dx === v % lv.w && Math.floor(u / lv.w) + dy === Math.floor(v / lv.w));
    dirs.push(d);
  }
  return dirs.reverse();
}

// Sayısı 0 olan bir karenin çevresi kesin güvenlidir
export function zeroSafe(lv, s) {
  const out = new Array(lv.cells.length).fill(0);
  for (let i = 0; i < lv.cells.length; i++) {
    if (!s.visited[i] || lv.nb[i] !== 0) continue;
    for (const j of neighbors8(lv, i)) if (lv.cells[j] !== "#" && !s.visited[j]) out[j] = 1;
  }
  return out;
}

export function starsFor(lost) { return lost === 0 ? 3 : lost === 1 ? 2 : 1; }
