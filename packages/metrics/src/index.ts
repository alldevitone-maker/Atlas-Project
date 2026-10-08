import type { MetricExpression } from '../../contracts/src/index.js';

export type MetricRow = Record<string, unknown>;

function numeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
}

export function evaluateExpression(expr: MetricExpression, row: MetricRow): number | null {
  switch (expr.op) {
    case 'field':
      return numeric(row[expr.field]);
    case 'literal':
      return expr.value;
    case 'ratio': {
      const n = evaluateExpression(expr.numerator, row);
      const d = evaluateExpression(expr.denominator, row);
      if (n == null || d == null || d === 0) return null;
      return n / d;
    }
    case 'difference': {
      const left = evaluateExpression(expr.left, row);
      const right = evaluateExpression(expr.right, row);
      return left == null || right == null ? null : left - right;
    }
    case 'sum': {
      const values = expr.items.map(item => evaluateExpression(item, row));
      return values.some(value => value == null) ? null : values.reduce((a, b) => a! + b!, 0);
    }
    case 'coalesce': {
      for (const item of expr.items) {
        const value = evaluateExpression(item, row);
        if (value != null) return value;
      }
      return null;
    }
  }
}
