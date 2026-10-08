import { describe, expect, it } from 'vitest';
import oldData from '../../public/data/presidential-2022-r1.json';
import newData from '../../public/data/presidential-2026-r1.json';
import oldDescriptor from '../../public/data/presidential-2022-r1.dataset.json';
import newDescriptor from '../../public/data/presidential-2026-r1.dataset.json';
import policies from '../../public/comparison-policies.json';
import { assessMunicipalComparison, type MunicipalComparisonPolicy } from './comparison';
import type { DatasetDescriptor, ElectionDataset } from '../types';

describe('comparação dos artefatos publicados', () => {
  it('compara totais municipais normalizando os campos de cada revisão', () => {
    const policy = policies.find(item => item.id === 'municipality-aggregate-v1');
    expect(policy).toBeDefined();
    const result = assessMunicipalComparison(
      oldDescriptor as DatasetDescriptor, newDescriptor as DatasetDescriptor,
      oldData as unknown as ElectionDataset, newData as unknown as ElectionDataset,
      policy as MunicipalComparisonPolicy
    );
    expect(result.compatible).toBe(true);
    expect(result.validVotesDelta).toBe(6065);
    expect(result.left?.validVotes).toBe(102563);
    expect(result.right?.validVotes).toBe(108628);
  });
  it('não equipara granularidade local a malha oficial de bairro', () => {
    expect(oldDescriptor.analysisUnit).toBe('polling-place-neighborhood-label');
    expect(newDescriptor.territoryVintage).not.toBe(oldDescriptor.territoryVintage);
    expect(oldDescriptor.crosswalkId).toBeNull();
    expect(newDescriptor.crosswalkId).toBeNull();
  });
});
