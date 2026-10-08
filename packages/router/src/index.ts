export type UrlState = Record<string, string | undefined>;

const ALLOWED_KEYS = [
  'territory', 'module', 'domain', 'period', 'round', 'dataset', 'revision', 'compare',
  'metric', 'candidate', 'layers', 'feature', 'basemap', 'panel', 'theme', 'locale'
] as const;

export function parseUrlState(search: string): UrlState {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const result: UrlState = {};
  for (const key of ALLOWED_KEYS) {
    const value = params.get(key);
    if (value != null && value !== '') result[key] = value;
  }
  return result;
}

export function serializeUrlState(state: UrlState): string {
  const params = new URLSearchParams();
  for (const key of ALLOWED_KEYS) {
    const value = state[key];
    if (value != null && value !== '') params.set(key, value);
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
}
