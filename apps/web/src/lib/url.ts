export function readSelection(defaultDatasetId: string): string {
  const params = new URLSearchParams(location.search);
  return params.get('dataset') || defaultDatasetId;
}

export function writeSelection(datasetId: string, revision?: string, compareWith?: string): void {
  const params = new URLSearchParams(location.search);
  params.set('dataset', datasetId);
  if (revision) params.set('revision', revision); else params.delete('revision');
  if (compareWith) params.set('compare', compareWith); else params.delete('compare');
  history.replaceState(null, '', `${location.pathname}?${params.toString()}${location.hash}`);
}
