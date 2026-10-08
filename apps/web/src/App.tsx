import type { FeatureCollection } from 'geojson';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
const AtlasMap = lazy(() => import('./components/AtlasMap').then(module => ({ default: module.AtlasMap })));
import { ComparisonPanel } from './components/ComparisonPanel';
import type { MunicipalComparisonPolicy } from './lib/comparison';
import { translator, type Catalog } from './lib/i18n';
import { readSelection, writeSelection } from './lib/url';
import type { Candidate, DatasetDescriptor, ElectionDataset, WebRegistry } from './types';
import './styles.css';

const number = new Intl.NumberFormat('pt-BR');
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 2 });

async function json<T>(uri: string): Promise<T> {
  const response = await fetch(uri, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`http:${response.status}:${uri}`);
  return response.json() as Promise<T>;
}

export default function App() {
  // Pin checks apply to the incoming deep link, never to a subsequent user selection.
  const initialPin = useRef({
    dataset: new URLSearchParams(location.search).get('dataset'),
    revision: new URLSearchParams(location.search).get('revision')
  });
  const [registry, setRegistry] = useState<WebRegistry | null>(null);
  const [catalog, setCatalog] = useState<Catalog>({});
  const [geometry, setGeometry] = useState<FeatureCollection | null>(null);
  const [dataset, setDataset] = useState<ElectionDataset | null>(null);
  const [descriptor, setDescriptor] = useState<DatasetDescriptor | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [selection, setSelection] = useState<{label:string; value:number|null} | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.matchMedia('(min-width: 801px)').matches);
  const [comparisonEnabled, setComparisonEnabled] = useState(() => Boolean(new URLSearchParams(location.search).get('compare')));
  const [comparisonDatasetId, setComparisonDatasetId] = useState(() => new URLSearchParams(location.search).get('compare') || '');
  const [comparisonData, setComparisonData] = useState<ElectionDataset | null>(null);
  const [comparisonDescriptor, setComparisonDescriptor] = useState<DatasetDescriptor | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [comparisonPolicy, setComparisonPolicy] = useState<MunicipalComparisonPolicy | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revisionUnavailable, setRevisionUnavailable] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const nextRegistry = await json<WebRegistry>('./registry.json');
        const nextCatalog = await json<Catalog>(`./locales/${nextRegistry.app.locale}.json`);
        const nextGeometry = await json<FeatureCollection>(nextRegistry.territory.geometryUri);
        const policies = await json<MunicipalComparisonPolicy[]>('./comparison-policies.json');
        setComparisonPolicy(policies.find(item => item.id === nextRegistry.comparisonPolicyId) ?? null);
        setRegistry(nextRegistry); setCatalog(nextCatalog); setGeometry(nextGeometry);
        const requested = readSelection(nextRegistry.defaultDatasetId);
        setSelectedDatasetId(nextRegistry.datasets.some(item => item.id === requested) ? requested : nextRegistry.defaultDatasetId);
      } catch (cause) { setError(String(cause)); }
    })();
  }, []);

  const activeRef = useMemo(() => registry?.datasets.find(item => item.id === selectedDatasetId) ?? null, [registry, selectedDatasetId]);
  const comparisonOptions = useMemo(
    () => registry?.datasets.filter(item => item.id !== selectedDatasetId && item.roundId === activeRef?.roundId && item.periodId !== activeRef?.periodId) ?? [],
    [registry, activeRef, selectedDatasetId]
  );
  const resolvedComparisonId = comparisonOptions.some(item => item.id === comparisonDatasetId)
    ? comparisonDatasetId : comparisonOptions[0]?.id ?? '';
  const comparisonRef = registry?.datasets.find(item => item.id === resolvedComparisonId) ?? null;

  useEffect(() => {
    if (!activeRef) return;
    let live = true;
    setSelection(null); setDataset(null); setDescriptor(null); setCandidates([]); setError(null);
    void (async () => {
      try {
        const [nextDescriptor, nextDataset] = await Promise.all([
          json<DatasetDescriptor>(activeRef.descriptorUri),
          json<ElectionDataset>(activeRef.dataUri)
        ]);
        const nextCandidates = activeRef.candidateCatalogUri ? await json<Candidate[]>(activeRef.candidateCatalogUri) : [];
        if (!live) return;
        setDescriptor(nextDescriptor); setDataset(nextDataset); setCandidates(nextCandidates);
        const pin = initialPin.current;
        // Do not rewrite or silently replace an immutable revision specified by an incoming link.
        setRevisionUnavailable(Boolean(pin.revision && pin.dataset === activeRef.id &&
          pin.revision !== nextDescriptor.revision));
      } catch (cause) { if (live) setError(String(cause)); }
    })();
    return () => { live = false; };
  }, [activeRef]);

  useEffect(() => {
    if (!descriptor || !activeRef || revisionUnavailable) return;
    writeSelection(activeRef.id, descriptor.revision, comparisonEnabled ? resolvedComparisonId : undefined);
  }, [descriptor, activeRef, comparisonEnabled, resolvedComparisonId, revisionUnavailable]);

  useEffect(() => {
    let live = true;
    setComparisonData(null); setComparisonDescriptor(null); setComparisonError(null);
    if (!comparisonEnabled || !comparisonRef) return;
    void (async () => {
      try {
        const [desc, data] = await Promise.all([
          json<DatasetDescriptor>(comparisonRef.descriptorUri),
          json<ElectionDataset>(comparisonRef.dataUri)
        ]);
        if (live) { setComparisonDescriptor(desc); setComparisonData(data); }
      } catch (cause) { if (live) setComparisonError(String(cause)); }
    })();
    return () => { live = false; };
  }, [comparisonEnabled, comparisonRef?.id, comparisonRef?.descriptorUri, comparisonRef?.dataUri]);

  const t = useMemo(() => translator(catalog), [catalog]);
  const handleSelect = useCallback((next:{label:string;value:number|null}) => setSelection(next.label ? next : null), []);

  const candidateRows = useMemo(() => {
    if (!dataset || !candidates.length) return [];
    const votes = (dataset.summary.candidateVotes as Record<string, number> | undefined) ??
      dataset.rows.reduce<Record<string, number>>((out, row) => {
        for (const [key, votes] of Object.entries(row.candidateVotes)) out[key] = (out[key] ?? 0) + votes;
        return out;
      }, {});
    const valid = Number(dataset.summary.validVotes ?? dataset.summary.valid ?? 0);
    return candidates.map(candidate => ({
      ...candidate,
      votes: Number(votes[String(candidate.ballotNumber)] ?? 0),
      share: valid > 0 ? Number(votes[String(candidate.ballotNumber)] ?? 0) / valid : 0
    })).sort((a,b)=>b.votes-a.votes);
  }, [dataset, candidates]);

  if (error) return <main className="fatal"><h1>{t('error.title')}</h1><pre>{error}</pre></main>;
  if (!registry || !geometry) return <main className="loading">{t('app.loading')}</main>;

  return <main className="shell">
    <header className="topbar">
      <button className="icon-button" onClick={() => setSidebarOpen(value => !value)} aria-label={t('nav.toggle')} aria-expanded={sidebarOpen} aria-controls="atlas-sidebar">☰</button>
      <div className="brand"><strong>{t(registry.app.titleKey)}</strong><span>{t(registry.app.subtitleKey)}</span></div>
      <div className="topbar-spacer" />
      {descriptor && <div className={`data-status status-${descriptor.status}`}><span>{t(`status.${descriptor.status}`)}</span><small>{new Date(descriptor.asOf).toLocaleString('pt-BR')}</small></div>}
    </header>

    <aside id="atlas-sidebar" inert={!sidebarOpen} className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-section">
        <span className="eyebrow">{t('nav.module')}</span>
        <h2>{t(registry.module.labelKey)}</h2>
      </div>
      <nav className="period-list" aria-label={t('nav.periods')}>
        {registry.datasets.map(item => <button key={item.id} className={item.id === selectedDatasetId ? 'active' : ''} onClick={() => {
          initialPin.current = { dataset: null, revision: null };
          setRevisionUnavailable(false);
          setSelectedDatasetId(item.id);
          if (window.innerWidth <= 800) setSidebarOpen(false);
        }}>
          <span>{t(item.labelKey)}</span><small>{item.roundId ? t('period.round',{round:item.roundId}) : ''}</small>
        </button>)}
      </nav>
      <div className="comparison-controls">
        <label className="comparison-toggle">
          <input type="checkbox" checked={comparisonEnabled}
            onChange={event => { setComparisonEnabled(event.target.checked); if (event.target.checked) setSheetExpanded(true); }} />
          Comparar municípios
        </label>
        {comparisonEnabled && <div className="comparison-choose">
          <label htmlFor="atlas-compare-ref">Comparar com</label>
          <select id="atlas-compare-ref" value={resolvedComparisonId}
            onChange={event => { setComparisonDatasetId(event.target.value); setSheetExpanded(true); }}>
            {comparisonOptions.length ? comparisonOptions.map(item =>
              <option key={item.id} value={item.id}>{t(item.labelKey)} · {item.roundId}º turno</option>)
              : <option value="">Sem período do mesmo turno</option>}
          </select>
          <small>Somente totais da cidade. A malha exploratória não representa resultados oficiais por bairro.</small>
        </div>}
      </div>
      {descriptor && <section className="provenance">
        <span className="eyebrow">{t('data.provenance')}</span>
        <a href={descriptor.provenance.sourceUrl} target="_blank" rel="noreferrer">{descriptor.provenance.sourceId}</a>
        <span>Origem: {descriptor.sourceGrain}</span><span>Unidade: {descriptor.analysisUnit}</span>
        <span>Cobertura declarada da extração, não cobertura espacial auditada.</span>
        {descriptor.quality.notes.map(note => <span key={note}>{note}</span>)}
        <span>{t('data.revision',{revision:descriptor.revision})}</span>
        <span>{t('data.coverage',{coverage:descriptor.quality.coveragePct})}</span>
      </section>}
    </aside>

    <section className="map-stage">
      {dataset && <Suspense fallback={<p role="status">Carregando mapa…</p>}><AtlasMap geometry={geometry} geometryLabelField={registry.territory.geometryLabelField} dataset={dataset} datasetField={registry.join.datasetField} metricField={registry.metric.rowField} prototype={registry.join.prototype} metricLabel={t(registry.metric.labelKey)} onSelect={handleSelect} /></Suspense>}
      {registry.join.prototype && <div className="method-badge">{t('method.prototype')} Malha exploratória, sem coloração eleitoral: associação espacial não auditada.</div>}
    </section>

    <section tabIndex={0} aria-label="Resumo eleitoral municipal" className={`bottom-sheet ${sheetExpanded ? 'expanded' : ''}`}>
      <button className="sheet-handle" onClick={() => setSheetExpanded(value => !value)} aria-label={t('sheet.toggle')}><span /></button>
      {revisionUnavailable && <p className="comparison-blocked-message" role="alert">
        A revisão fixa solicitada não está disponível neste build. Exibimos apenas a revisão carregada.
        <button onClick={() => {
          initialPin.current = { dataset: null, revision: null };
          setRevisionUnavailable(false);
        }}>Usar revisão disponível</button>
      </p>}
      {comparisonEnabled && comparisonError && <p role="alert">Falha ao carregar comparação: {comparisonError}</p>}
      {comparisonEnabled && !comparisonRef && <p role="status" className="comparison-blocked-message">Não há outro período do mesmo turno disponível para a comparação.</p>}
      {comparisonEnabled && comparisonRef && !comparisonData && !comparisonError && <p>Carregando comparação…</p>}
      {comparisonEnabled && comparisonRef && !revisionUnavailable && comparisonData && comparisonDescriptor && dataset && descriptor && activeRef &&
        <ComparisonPanel policy={comparisonPolicy}
          baseline={{descriptor: comparisonDescriptor, data: comparisonData, label: t(comparisonRef!.labelKey) + ' · ' + comparisonRef!.roundId + 'º turno'}}
          current={{descriptor, data: dataset, label: t(activeRef.labelKey) + ' · ' + activeRef.roundId + 'º turno'}} />}
      <div className="summary-grid">
        <article><span>{t(registry.metric.labelKey)}</span><strong>{dataset ? number.format(Number(dataset.summary.validVotes ?? dataset.summary.valid ?? 0)) : '—'}</strong></article>
        <article><span>{t('metric.turnout')}</span><strong>{dataset ? percent.format(Number(dataset.summary.turnoutPct ?? 0) / 100) : '—'}</strong></article>
        <article><span>{t('metric.abstention')}</span><strong>{dataset ? percent.format(Number(dataset.summary.abstentionPct ?? 0) / 100) : '—'}</strong></article>
        <article><span>{t('selection.title')}</span><strong>{selection?.label ?? t('selection.none')}</strong><small>{selection?.value == null ? '' : number.format(selection.value)}</small></article>
      </div>
      {candidateRows.length > 0 && <div className="candidate-list">
        {candidateRows.map(candidate => <div className="candidate-row" key={candidate.id}>
          <div><strong>{candidate.officialName}</strong><span>{candidate.ballotNumber}</span></div>
          <div className="candidate-value"><strong>{number.format(candidate.votes)}</strong><span>{percent.format(candidate.share)}</span></div>
        </div>)}
      </div>}
      {dataset?.semantics && <p className="semantics">{dataset.semantics}</p>}
    </section>
  </main>;
}
