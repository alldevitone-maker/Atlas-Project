import { assessMunicipalComparison, type MunicipalComparisonPolicy } from '../lib/comparison';
import type { DatasetDescriptor, ElectionDataset } from '../types';

interface Sample { descriptor: DatasetDescriptor; data: ElectionDataset; label: string }
interface Props { current: Sample; baseline: Sample; policy: MunicipalComparisonPolicy | null; territoryLabel?:string }
const integer = new Intl.NumberFormat('pt-BR');
const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function signed(value: number, unit = ''): string {
  return (value > 0 ? '+' : '') + decimal.format(value) + unit;
}
export function ComparisonPanel({ current, baseline, policy, territoryLabel = 'município selecionado' }: Props) {
  // Order by source period, not by the currently selected map. Delta always means later minus earlier.
  const [older, newer] = [baseline, current].sort((a,b) =>
    a.descriptor.periodId.localeCompare(b.descriptor.periodId));
  const result = assessMunicipalComparison(older.descriptor, newer.descriptor, older.data, newer.data, policy);
  return <section className="comparison-panel" aria-label="Comparação dos resultados municipais" aria-live="polite">
    <div className="comparison-heading">
      <h3>Comparação municipal</h3>
      <span className={result.compatible ? 'comparison-ok' : 'comparison-blocked'}>{result.compatible ? 'Comparável' : 'Comparação limitada'}</span>
    </div>
    <p className="comparison-disclaimer">
      Apenas totais de {territoryLabel}. A malha exploratória não recebe contagens eleitorais e não representa residência dos eleitores.
    </p>
    <div className="comparison-columns">
      {[older, newer].map((item, index) => {
        const metrics = index === 0 ? result.left : result.right;
        return <article key={item.descriptor.id} className="comparison-column">
          <div className="comparison-period">{item.label}</div>
          <small>{item.descriptor.status === 'official' ? 'Resultado identificado como oficial' : item.descriptor.status === 'provisional' ? 'Extração provisória; homologação final não comprovada' : item.descriptor.status === 'totalized' ? 'Totalizado, aguardando validação independente' : 'Rascunho, não consolidado'}</small>
          <strong>{metrics ? integer.format(metrics.validVotes) : '—'}</strong>
          <span>{item.data.validVotesMeaning === 'nominal-bu' ? 'votos nominais nos boletins' : 'votos válidos no município'}</span>
          <strong className="comparison-rate">{metrics ? decimal.format(metrics.turnoutRate) + '%' : '—'}</strong>
          <span>comparecimento do eleitorado apto</span>
          <small>Revisão {item.descriptor.revision}</small>
          <a href={item.descriptor.provenance.sourceUrl} target="_blank" rel="noopener noreferrer">Consultar origem</a>
        </article>;
      })}
    </div>
    {result.compatible ? <div className="comparison-deltas">
      <span>Variação em {older.data.validVotesMeaning === 'nominal-bu' ? 'votos nominais nos boletins' : 'votos válidos'}: <strong>{result.validVotesDelta! >= 0 ? '+' : ''}{integer.format(result.validVotesDelta!)}</strong></span>
      <span>Comparecimento: <strong>{signed(result.turnoutRateDeltaPp!, ' p.p.')}</strong></span>
    </div> : <div className="comparison-blocked-message" role="status">
      Sem variações calculadas: {result.issues.join(' ')}
    </div>}
    <p className="comparison-disclaimer">
      Variação entre pleitos não é migração individual de votos. Candidaturas não são equiparadas apenas pelo número de urna. Cada extração preserva o estado declarado da fonte e da derivação.
    </p>
  </section>;
}
