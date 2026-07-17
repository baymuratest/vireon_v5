// Watch history persisted in localStorage.
const KEY = 'vireon_watch_history_v1';
const MAX = 50;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); } catch {}
  try { window.dispatchEvent(new Event('vireon:history')); } catch {}
}

export function getHistory() {
  return read().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function upsertHistory(entry) {
  if (!entry?.id) return;
  const list = read();
  const idx = list.findIndex(x => x.id === entry.id);
  const merged = {
    ...(idx >= 0 ? list[idx] : {}),
    ...entry,
    updatedAt: Date.now(),
  };
  if (idx >= 0) list.splice(idx, 1);
  list.unshift(merged);
  write(list);
}

export function removeHistory(id) {
  write(read().filter(x => x.id !== id));
}

export function clearHistory() { write([]); }
