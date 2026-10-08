import type { FeatureCollection } from 'geojson';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AtlasMap } from './components/AtlasMap';
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
  const [registry, setRegistry] = useState<WebRegistry | null>(null);
  const [catalog, setCatalog] = useState<Catalog>({});
  const [geometry, setGeometry] = useState<FeatureCollection | null>(null);
  const [dataset, setDataset] = useState<ElectionDataset | null>(null);
  const [descriptor, setDescriptor] = useState<DatasetDescriptor | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [selection, setSelection] = useState<{label:string; value:number|null} | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const nextRegistry = await json<WebRegistry>('./registry.json');
        const nextCatalog = await json<Catalog>(`./locales/${nextRegistry.app.locale}.json`);
        const nextGeometry = await json<FeatureCollection>(nextRegistry.territory.geometryUri);
        setRegistry(nextRegistry); setCatalog(nextCatalog); setGeometry(nextGeometry);
        setSelectedDatasetId(readSelection(nextRegistry.defaultDatasetId));
      } catch (cause) { setError(String(cause)); }
    })();
  }, []);

  const activeRef = useMemo(() => registry?.datasets.find(item => item.id === selectedDatasetId) ?? null, [registry, selectedDatasetId]);

  useEffect(() => {
    if (!activeRef) return;
    setSelection(null); setDataset(null); setDescriptor(null); setCandidates([]); setError(null);
    void (async () => {
      try {
        const [nextDescriptor, nextDataset] = await Promise.all([
          json<DatasetDescriptor>(activeRef.descriptorUri),
          json<ElectionDataset>(activeRef.dataUri)
        ]);
        const nextCandidates = activeRef.candidateCatalogUri ? await json<Candidate[]>(activeRef.candidateCatalogUri) : [];
        setDescriptor(nextDescriptor); setDataset(nextDataset); setCandidates(nextCandidates);
        writeSelection(activeRef.id, nextDescriptor.revision);
      } catch (cause) { setError(String(cause)); }
    })();
  }, [activeRef]);

  const t = useMemo(() => translator(catalog), [catalog]);
  const handleSelect = useCallback((next:{label:string;value:number|null}) => setSelection(next), []);

  const candidateRows = useMemo(() => {
    if (!dataset || !candidates.length) return [];
    const votes = dataset.summary.candidateVotes as Record<string, number> | undefined;
    const valid = Number(dataset.summary.valid ?? 0);
    if (!votes) return [];
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
      <button className="icon-button" onClick={() => setSidebarOpen(value => !value)} aria-label={t('nav.toggle')}>☰</button>
      <div className="brand"><strong>{t(registry.app.titleKey)}</strong><span>{t(registry.app.subtitleKey)}</span></div>
      <div className="topbar-spacer" />
      {descriptor && <div className={`data-status status-${descriptor.status}`}><span>{t(`status.${descriptor.status}`)}</span><small>{new Date(descriptor.asOf).toLocaleString('pt-BR')}</small></div>}
    </header>

    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-section">
        <span className="eyebrow">{t('nav.module')}</span>
        <h2>{t(registry.module.labelKey)}</h2>
      </div>
      <nav className="period-list" aria-label={t('nav.periods')}>
        {registry.datasets.map(item => <button key={item.id} className={item.id === selectedDatasetId ? 'active' : ''} onClick={() => setSelectedDatasetId(item.id)}>
          <span>{t(item.labelKey)}</span><small>{item.roundId ? t('period.round',{round:item.roundId}) : ''}</small>
        </button>)}
      </nav>
      {descriptor && <section className="provenance">
        <span className="eyebrow">{t('data.provenance')}</span>
        <strong>{descriptor.provenance.sourceId}</strong>
        <span>{t('data.revision',{revision:descriptor.revision})}</span>
        <span>{t('data.coverage',{coverage:descriptor.quality.coveragePct})}</span>
      </section>}
    </aside>

    <section className="map-stage">
      {dataset && <AtlasMap geometry={geometry} geometryLabelField={registry.territory.geometryLabelField} dataset={dataset} datasetField={registry.join.datasetField} metricField={registry.metric.rowField} metricLabel={t(registry.metric.labelKey)} onSelect={handleSelect} />}
      {registry.join.prototype && <div className="method-badge">{t('method.prototype')}</div>}
    </section>

    <section className={`bottom-sheet ${sheetExpanded ? 'expanded' : ''}`}>
      <button className="sheet-handle" onClick={() => setSheetExpanded(value => !value)} aria-label={t('sheet.toggle')}><span /></button>
      <div className="summary-grid">
        <article><span>{t(registry.metric.labelKey)}</span><strong>{dataset ? number.format(Number(dataset.summary.valid ?? 0)) : '—'}</strong></article>
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
