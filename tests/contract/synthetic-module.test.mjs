import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Registry } from '../../dist/packages/registry/src/index.js';
import { evaluateExpression } from '../../dist/packages/metrics/src/index.js';
import { parseUrlState, serializeUrlState } from '../../dist/packages/router/src/index.js';

const fixture = JSON.parse(fs.readFileSync(new URL('../fixtures/synthetic-module/registry.json', import.meta.url), 'utf8'));
const rows = JSON.parse(fs.readFileSync(new URL('../fixtures/synthetic-module/data.json', import.meta.url), 'utf8'));

test('non-election synthetic module runs through registry, metric and URL without core changes', () => {
  const registry = new Registry(fixture);
  assert.equal(registry.activeModules().length, 1);
  const dataset = registry.resolveLatestDataset({ moduleId: 'module-synthetic', periodId: 'period-a' });
  assert.ok(dataset);
  const metric = registry.getMetric('metric-synthetic-value');
  assert.ok(metric);
  assert.deepEqual(rows.map(row => evaluateExpression(metric.expression, row)), [10,20,30]);

  const url = serializeUrlState({ module: dataset.moduleId, dataset: dataset.id, metric: metric.id, feature: 'b' });
  assert.deepEqual(parseUrlState(url), {
    module: 'module-synthetic', dataset: 'dataset-synthetic', metric: 'metric-synthetic-value', feature: 'b'
  });
});
