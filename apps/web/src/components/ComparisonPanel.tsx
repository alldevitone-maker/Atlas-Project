import { assessMunicipalComparison, type MunicipalComparisonPolicy } from '../lib/comparison';
import type { DatasetDescriptor, ElectionDataset } from '../types';

interface Sample { descriptor: DatasetDescriptor; data: ElectionDataset; label: string }
interface Props { current: Sample; baseline: Sample; policy: MunicipalComparisonPolicy | null }
const integer = new Intl.NumberFormat('pt-BR');
const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function signed(value: number, unit = ''): string {
  return (value > 0 ? '+' : '') + decimal.format(value) + unit;
}
export function ComparisonPanel({ current, baseline, policy }: Props) {
  const result = assessMunicipalComparison(baseline.descriptor, current.descriptor, baseline.data, current.data, policy);
  return <section className="comparison-panel" aria-label="Comparação dos resultados municipais" aria-live="polite">
    <div className="comparison-heading">
      <h3>Comparação municipal</h3>
      <span className={result.compatible ? 'comparison-ok' : 'comparison-blocked'}>{result.compatible ? 'Comparável' : 'Comparação limitada'}</span>
    </div>
    <p className="comparison-disclaimer">
      Apenas totais de Jaraguá do Sul. As cores do mapa representam dados experimentais de locais de votação, não residência dos eleitores.
    </p>
    <div className="comparison-columns">
      {[baseline, current].map((item, index) => {
        const metrics = index === 0 ? result.left : result.right;
        return <article key={item.descriptor.id} className="comparison-column">
          <div className="comparison-period">{item.label}</div>
          <small>{item.descriptor.status === 'official' ? 'Fonte identificada como oficial' : 'Totalizado, aguardando validação independente'}</small>
          <strong>{metrics ? integer.format(metrics.validVotes) : '—'}</strong>
          <span>votos válidos no município</span>
          <strong className="comparison-rate">{metrics ? decimal.format(metrics.turnoutRate) + '%' : '—'}</strong>
          <span>comparecimento do eleitorado apto</span>
          <small>Revisão {item.descriptor.revision}</small>
          <a href={item.descriptor.provenance.sourceUrl} target="_blank" rel="noopener noreferrer">Consultar origem</a>
        </article>;
      })}
    </div>
    {result.compatible ? <div className="comparison-deltas">
      <span>Variação em votos válidos: <strong>{result.validVotesDelta! >= 0 ? '+' : ''}{integer.format(result.validVotesDelta!)}</strong></span>
      <span>Comparecimento: <strong>{signed(result.turnoutRateDeltaPp!, ' p.p.')}</strong></span>
    </div> : <div className="comparison-blocked-message" role="status">
      Sem variações calculadas: {result.issues.join(' ')}
    </div>}
    <p className="comparison-disclaimer">
      Variação entre pleitos não é migração individual de votos. Candidaturas não são equiparadas apenas pelo número de urna. Fonte 2026 em estágio de totalização.
    </p>
  </section>;
}
