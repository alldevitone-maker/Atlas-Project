import { parseUrlState, serializeUrlState } from '../../../../packages/router/src/index';

export function readSelection(defaultDatasetId: string): string {
  return parseUrlState(location.search).dataset || defaultDatasetId;
}

export function writeSelection(datasetId: string, revision?: string, compareWith?: string, compareRevision?: string): void {
  const state = parseUrlState(location.search);
  state.dataset = datasetId;
  state.revision = revision;
  state.compare = compareWith;
  state.compareRevision = compareWith ? compareRevision : undefined;
  history.replaceState(null, '', `${location.pathname}${serializeUrlState(state)}${location.hash}`);
}
