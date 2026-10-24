export const remaining = (state, now = Date.now()) => state.running ? Math.max(0, state.endAt - now) : state.remaining;
export function sectorPath(fraction) {
  const f = Math.max(0, Math.min(1, fraction));
  if (f <= 0) return '';
  if (f >= 1) return 'M 200 52 A 148 148 0 1 1 200 348 A 148 148 0 1 1 200 52 Z';
  const angle = f * 2 * Math.PI;
  return `M 200 200 L 200 52 A 148 148 0 ${f > .5 ? 1 : 0} 1 ${200 + 148 * Math.sin(angle)} ${200 - 148 * Math.cos(angle)} Z`;
}
export function restore(raw) {
  try {
    const s = JSON.parse(raw);
    if (!s || ![30,60,90,120].includes(s.scale) || !['focus','break'].includes(s.mode) || !Number.isInteger(s.minutes) || s.minutes < 1 || s.minutes > s.scale || !Number.isFinite(s.remaining) || s.remaining < 0 || s.remaining > s.minutes * 60000 || typeof s.running !== 'boolean' || (s.running && (!Number.isFinite(s.endAt) || s.endAt > Date.now() + s.minutes * 60000 + 1000))) return null;
    return s;
  } catch { return null; }
}
