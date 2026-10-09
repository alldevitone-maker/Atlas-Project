import type { FeatureCollection } from 'geojson';
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
const AtlasMap = lazy(() => import('./components/AtlasMap').then(module => ({ default: module.AtlasMap })));
import { ComparisonPanel } from './components/ComparisonPanel';
import type { MunicipalComparisonPolicy } from './lib/comparison';
import { translator, type Catalog } from './lib/i18n';
import { readSelection, writeSelection } from './lib/url';
import type { Candidate, DatasetDescriptor, ElectionDataset, WebRegistry } from './types';
import { evaluateExpression } from '../../../packages/metrics/src/index';
import './styles.css';
import { PanelHandle } from './components/PanelHandle';
import { loadElection, descriptorSchema, electionSchema, webRegistrySchema, candidateCatalogSchema } from './lib/validated-data';
import { extractMunicipalMeasure } from './lib/comparison';
import { AtlasRuntime } from '../../../packages/runtime/src/index';
import { Registry } from '../../../packages/registry/src/index';
import { municipalCandidates,sourceUnitCandidates,legacyPairPresentation,resolveElectionSourceLabel } from '../../../packages/domain-elections/src/index';

const number = new Intl.NumberFormat('pt-BR');
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 2 });

async function json<T>(uri: string): Promise<T> {
  const response = await fetch(uri, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`http:${response.status}:${uri}`);
  return response.json() as Promise<T>;
}

export default function App() {
  // Pin checks apply to the incoming deep link, never to a subsequent user selection.
  const [pinEpoch,setPinEpoch] = useState(0);
  const initialPin = useRef({
    dataset: new URLSearchParams(location.search).get('dataset'),
    revision: new URLSearchParams(location.search).get('revision')
  });
  const [runtime,setRuntime] = useState<AtlasRuntime | null>(null);
  const [registry, setRegistry] = useState<WebRegistry | null>(null);
  const [catalog, setCatalog] = useState<Catalog>({});
  const [geometry, setGeometry] = useState<FeatureCollection | null>(null);
  const [dataset, setDataset] = useState<ElectionDataset | null>(null);
  const [descriptor, setDescriptor] = useState<DatasetDescriptor | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [inspectedRow,setInspectedRow] = useState<import('./types').ElectionRow | null>(null);
  const [selection, setSelection] = useState<{label:string; value:number|null} | null>(null);
  const [sidebarDrag, setSidebarDrag] = useState(0);
  const [sheetDrag, setSheetDrag] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.matchMedia('(min-width: 801px)').matches);
  const [comparisonEnabled, setComparisonEnabled] = useState(() => Boolean(new URLSearchParams(location.search).get('compare')));
  const [comparisonDatasetId, setComparisonDatasetId] = useState(() => new URLSearchParams(location.search).get('compare') || '');
  const [comparisonPin,setComparisonPin] = useState(() => ({dataset:new URLSearchParams(location.search).get('compare'),revision:new URLSearchParams(location.search).get('compareRevision')}));
  const [comparisonData, setComparisonData] = useState<ElectionDataset | null>(null);
  const [comparisonDescriptor, setComparisonDescriptor] = useState<DatasetDescriptor | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [comparisonPolicy, setComparisonPolicy] = useState<MunicipalComparisonPolicy | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(() => new URLSearchParams(location.search).get('panel') === 'expanded');
  const [selectedBasemap,setSelectedBasemap] = useState(()=>new URLSearchParams(location.search).get('basemap') || 'neutral-dark');
  const [showTerritory,setShowTerritory] = useState(()=>new URLSearchParams(location.search).get('layers') !== 'none');
  const [selectedMetric,setSelectedMetric] = useState(() => new URLSearchParams(location.search).get('metric') || 'valid-votes');
  const [candidateFilter,setCandidateFilter] = useState(() => new URLSearchParams(location.search).get('candidate') || '');
  const [theme, setTheme] = useState(() => new URLSearchParams(location.search).get('theme') === 'light' ? 'light' : 'dark');
  const [mapMode,setMapMode]=useState(()=>new URLSearchParams(location.search).get('mapMode')==='legacy-pair' ? 'legacy-pair' : 'neutral');
  const [mapA,setMapA]=useState(()=>new URLSearchParams(location.search).get('mapA') || '');
  const [mapB,setMapB]=useState(()=>new URLSearchParams(location.search).get('mapB') || '');
  const initialFeature = useRef(new URLSearchParams(location.search).get('feature'));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const params = new URLSearchParams(location.search); params.set('theme', theme); params.set('panel',sheetExpanded ? 'expanded' : 'collapsed'); params.set('metric',selectedMetric); params.set('basemap',selectedBasemap);params.set('layers',showTerritory ? 'territory' : 'none');
    if(candidateFilter)params.set('candidate',candidateFilter);else params.delete('candidate');
    history.replaceState(null,'',`${location.pathname}?${params}${location.hash}`);
  }, [theme, sheetExpanded, selectedMetric, candidateFilter, selectedBasemap, showTerritory]);
  const [error, setError] = useState<string | null>(null);
  const [revisionUnavailable, setRevisionUnavailable] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const nextRegistry = webRegistrySchema.parse(await json<unknown>('./registry.json'));
        const descriptors = await Promise.all([...nextRegistry.datasets,...(nextRegistry.revisions ?? [])].map(async ref => ({...descriptorSchema.parse(await json<unknown>(ref.descriptorUri)), uri:ref.dataUri})));
        const nextRuntime = new AtlasRuntime({registry:new Registry({datasets:descriptors})});
        nextRuntime.hydrateFromSearch(location.search);
        setRuntime(nextRuntime);
        const nextCatalog = await json<Catalog>(`./locales/${nextRegistry.app.locale}.json`);
        const nextGeometry = await json<FeatureCollection>(nextRegistry.territory.geometryUri);
        const policies = await json<MunicipalComparisonPolicy[]>('./comparison-policies.json');
        setComparisonPolicy(policies.find(item => item.id === nextRegistry.comparisonPolicyId) ?? null);
        setRegistry(nextRegistry); setCatalog(nextCatalog); setGeometry(nextGeometry);
        setSelectedMetric(value=>nextRegistry.metrics?.some(item=>item.id===value) ? value : nextRegistry.metric.id);
        setSelectedBasemap(value=>nextRegistry.basemaps?.some(item=>item.id===value) ? value : nextRegistry.basemaps?.[0]?.id ?? 'neutral-dark');
        const requested = readSelection(nextRegistry.defaultDatasetId);
        setSelectedDatasetId(nextRegistry.datasets.some(item => item.id === requested) ? requested : nextRegistry.defaultDatasetId);
      } catch (cause) { setError(String(cause)); }
    })();
  }, []);

  const activeRef = useMemo(() => {
    const pin=initialPin.current;
    return (pin.dataset === selectedDatasetId && pin.revision ? registry?.revisions?.find(item=>item.id===selectedDatasetId && item.revision===pin.revision) : null) ?? registry?.datasets.find(item=>item.id===selectedDatasetId) ?? null;
  }, [registry,selectedDatasetId,pinEpoch]);
  const comparisonOptions = useMemo(
    () => registry?.datasets.filter(item => item.id !== selectedDatasetId && item.roundId === activeRef?.roundId && item.periodId !== activeRef?.periodId) ?? [],
    [registry, activeRef, selectedDatasetId]
  );
  const resolvedComparisonId = comparisonPin.revision && comparisonPin.dataset === comparisonDatasetId || comparisonOptions.some(item => item.id === comparisonDatasetId)
    ? comparisonDatasetId : comparisonOptions.find(item=>item.measureKind === activeRef?.measureKind)?.id ?? comparisonOptions[0]?.id ?? '';
  const requestedComparisonRevision = comparisonPin.dataset === resolvedComparisonId ? comparisonPin.revision : null;
  const comparisonRef = (requestedComparisonRevision ? registry?.revisions?.find(item=>item.id===resolvedComparisonId && item.revision===requestedComparisonRevision) : null) ?? registry?.datasets.find(item => item.id === resolvedComparisonId) ?? null;
  const comparisonRevision = requestedComparisonRevision ?? (comparisonRef ? runtime?.registry.getDataset(comparisonRef.id,comparisonRef.revision)?.revision : undefined);

  useEffect(() => {
    if (!activeRef || !runtime) return;
    let live = true;
    setInspectedRow(null); setSelection(null); setDataset(null); setDescriptor(null); setCandidates([]); setError(null);
    void (async () => {
      try {
        const nextDescriptor = runtime.registry.getDataset(activeRef.id, activeRef.revision)!;
        runtime.store.set({dataset:nextDescriptor.id, revision:nextDescriptor.revision});
        const nextDataset = electionSchema.parse(await runtime.loadResolved());
        const nextCandidates = activeRef.candidateCatalogUri ? candidateCatalogSchema.parse(await runtime.loader.load({...nextDescriptor,uri:activeRef.candidateCatalogUri,checksum:activeRef.candidateCatalogChecksum!})) : [];
        if (!live) return;
        setDescriptor(nextDescriptor); setDataset(nextDataset); setCandidates(nextCandidates);
        if (initialFeature.current) {
          const label = initialFeature.current;
          if (geometry?.features.some(feature => feature.properties?.[registry!.territory.geometryLabelField] === label)) setSelection({label,value:null});
          initialFeature.current = null;
        }
        const pin = initialPin.current;
        // Do not rewrite or silently replace an immutable revision specified by an incoming link.
        setRevisionUnavailable(Boolean(pin.revision && pin.dataset === activeRef.id &&
          pin.revision !== nextDescriptor.revision));
      } catch (cause) { if (live) setError(String(cause)); }
    })();
    return () => { live = false; };
  }, [activeRef, runtime]);

  useEffect(() => {
    if (!descriptor || !activeRef || revisionUnavailable) return;
    writeSelection(activeRef.id, descriptor.revision, comparisonEnabled ? resolvedComparisonId : undefined, comparisonRevision ?? undefined);
  }, [descriptor, activeRef, comparisonEnabled, resolvedComparisonId, comparisonRevision, revisionUnavailable]);

  useEffect(() => {
    let live = true;
    setComparisonData(null); setComparisonDescriptor(null); setComparisonError(null);
    if (!comparisonEnabled) return;
    if (requestedComparisonRevision && !runtime?.registry.getDataset(resolvedComparisonId,requestedComparisonRevision)) {setComparisonError(`comparison-revision-unavailable:${requestedComparisonRevision}`);return;}
    if (!comparisonRef) return;
    void (async () => {
      try {
        const desc = runtime?.registry.getDataset(comparisonRef.id,comparisonRevision ?? undefined);
        if (!desc) throw new Error('comparison-dataset-unavailable');
        const data = await loadElection(desc, comparisonRef.dataUri);
        if (live) { setComparisonDescriptor(desc); setComparisonData(data); }
      } catch (cause) { if (live) setComparisonError(String(cause)); }
    })();
    return () => { live = false; };
  }, [comparisonEnabled, comparisonRef?.id, comparisonRef?.descriptorUri, comparisonRef?.dataUri,requestedComparisonRevision,runtime,resolvedComparisonId]);

  const t = useMemo(() => translator(catalog), [catalog]);
  const handleSelect = useCallback((next:{label:string;value:number|null}) => {
    setSelection(next.label ? next : null);
    const params = new URLSearchParams(location.search);
    if (next.label) params.set('feature',next.label); else params.delete('feature');
    history.replaceState(null,'',`${location.pathname}?${params}${location.hash}`);
  }, []);

  const candidateRows = useMemo(() => dataset ? municipalCandidates(dataset,candidates) : [], [dataset,candidates]);
  const sheetRef=useRef<HTMLElement|null>(null);
  const selectedLegacy=useMemo(()=>selection && dataset && descriptor?.sourceStatus==='unverified-legacy' && dataset.validVotesMeaning!=='nominal-bu' ? resolveElectionSourceLabel(dataset.rows,selection.label) : undefined,[selection?.label,dataset,descriptor]);
  const selectedCandidates=useMemo(()=>selectedLegacy?.row ? sourceUnitCandidates(selectedLegacy.row,candidates) : [],[selectedLegacy,candidates]);
  useEffect(()=>{if(selectedLegacy?.row)setSheetExpanded(true);},[selectedLegacy?.row]);
  useLayoutEffect(()=>{if(sheetRef.current)sheetRef.current.scrollTop=0;},[selectedLegacy?.row,sheetExpanded]);
  const mapConfig=registry?.candidateMapPresentation;
  const pairA=candidateRows.find(item=>item.id===(mapA || mapConfig?.defaultPair.a)) ?? candidateRows[0];
  const pairB=candidateRows.find(item=>item.id===(mapB || mapConfig?.defaultPair.b)) ?? candidateRows[1];
  const colorEligible=Boolean(activeRef && mapConfig?.eligibleDatasets.includes(activeRef.id) && descriptor?.sourceStatus==='unverified-legacy' && dataset?.validVotesMeaning!=='nominal-bu');
  const presentation=useMemo(()=>mapMode==='legacy-pair' && colorEligible && dataset && pairA && pairB && mapConfig ? {styles:legacyPairPresentation(dataset.rows,String(pairA.ballotNumber),String(pairB.ballotNumber),mapConfig.palette),neutral:mapConfig.palette.neutral} : undefined,[mapMode,colorEligible,dataset,pairA?.ballotNumber,pairB?.ballotNumber,mapConfig]);
  const selectedStyle=selection && presentation?.styles[selection.label.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase()];
  useEffect(()=>{if(!registry)return;const params=new URLSearchParams(location.search);params.set('mapMode',mapMode);if(pairA)params.set('mapA',pairA.id);if(pairB)params.set('mapB',pairB.id);history.replaceState(null,'',`${location.pathname}?${params}${location.hash}`);runtime?.store.set({mapMode,mapA:pairA?.id,mapB:pairB?.id});},[registry,runtime,mapMode,pairA?.id,pairB?.id]);
  const basemap=registry?.basemaps?.find(item=>item.id===selectedBasemap) ?? registry?.basemaps?.[0];
  const metric = registry?.metrics?.find(item=>item.id === selectedMetric) ?? registry?.metrics?.[0];
  const primary = dataset && metric ? evaluateExpression(metric.expression,{...dataset.summary,validVotes:dataset.summary.validVotes ?? dataset.summary.valid,blankVotes:dataset.summary.blankVotes ?? dataset.summary.blank,eligible:dataset.summary.eligible ?? dataset.summary.apt}) : null;
  useEffect(()=>{if(dataset && candidateFilter && !candidateRows.some(item=>item.id===candidateFilter))setCandidateFilter('');},[dataset,candidateRows,candidateFilter]);
  useEffect(()=>{if(runtime)runtime.store.set({theme,metric:selectedMetric,candidate:candidateFilter,feature:selection?.label ?? '',basemap:selectedBasemap,layers:showTerritory ? 'territory' : 'none',panel:sheetExpanded ? 'expanded' : 'collapsed',compare:comparisonEnabled ? resolvedComparisonId : '',compareRevision:comparisonEnabled ? comparisonRevision ?? '' : ''});},[runtime,theme,selectedMetric,candidateFilter,selection?.label,selectedBasemap,showTerritory,sheetExpanded,comparisonEnabled,resolvedComparisonId,comparisonRevision]);
  const measures = dataset ? extractMunicipalMeasure(dataset) : null;
  const summaryCount = (key: string) => typeof dataset?.summary[key] === 'number' ? number.format(dataset.summary[key] as number) : '—';

  if (error) return <main className="fatal"><h1>{t('error.title')}</h1><pre>{error}</pre></main>;
  if (!registry || !geometry) return <main className="loading">{t('app.loading')}</main>;

  return <main className="shell">
    <header className="topbar">
      <button className="icon-button" onClick={() => setSidebarOpen(value => !value)} aria-label={t('nav.toggle')} aria-expanded={sidebarOpen} aria-controls="atlas-sidebar">☰</button>
      <div className="brand"><strong>{t(registry.app.titleKey)}</strong><span>{t(registry.app.subtitleKey)}</span></div>
      <div className="topbar-spacer" />
      <button className="icon-button" aria-label="Alternar tema claro e escuro" aria-pressed={theme === 'light'} onClick={() => setTheme(value => value === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☀' : '☾'}</button>
      {descriptor && <div className={`data-status status-${descriptor.status}`}><span>{t(`status.${descriptor.status}`)}{descriptor.sourceStatus === 'unverified-legacy' ? ' · legado não verificado' : ''}</span><small>{new Date(descriptor.asOf).toLocaleString('pt-BR')}</small></div>}
    </header>

    <PanelHandle axis="horizontal" onDrag={setSidebarDrag} expanded={sidebarOpen} onChange={setSidebarOpen} controls="atlas-sidebar" label="Expandir ou recolher menu lateral" className={sidebarOpen ? 'sidebar-handle open' : 'sidebar-handle'} />
    <aside id="atlas-sidebar" style={{ translate: `${Math.max(-260, Math.min(260, sidebarDrag))}px 0`, visibility: sidebarDrag > 0 ? 'visible' : undefined }} inert={!sidebarOpen} className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-section">
        <span className="eyebrow">{t('nav.module')}</span>
        <h2>{t(registry.module.labelKey)}</h2>
      </div>
      <nav className="period-list" aria-label={t('nav.periods')}>
        {registry.datasets.map(item => <button key={item.id} className={item.id === selectedDatasetId ? 'active' : ''} onClick={() => {
          initialPin.current = { dataset: null, revision: null };
          setPinEpoch(value=>value+1);
          setRevisionUnavailable(false);
          setSelectedDatasetId(item.id);
          setComparisonPin({dataset:null,revision:null});
          setCandidateFilter('');
          setMapA('');setMapB('');
          const params = new URLSearchParams(location.search); params.delete('feature'); history.replaceState(null,'',`${location.pathname}?${params}${location.hash}`);
          if (window.innerWidth <= 800) setSidebarOpen(false);
        }}>
          <span>{t(item.labelKey)}</span><small>{item.roundId ? t('period.round',{round:item.roundId}) : ''}</small>
        </button>)}
      </nav>
      {mapConfig && <div className="analysis-controls"><label><input type="checkbox" checked={mapMode==='legacy-pair'} disabled={!colorEligible} onChange={event=>setMapMode(event.target.checked ? 'legacy-pair' : 'neutral')}/> {mapConfig.labels.toggle}</label>{!colorEligible && <small>Cores indisponíveis: sem associação territorial para esta fonte.</small>}{mapMode==='legacy-pair' && colorEligible && <><label htmlFor="map-candidate-a">{mapConfig.labels.a}</label><select id="map-candidate-a" value={pairA?.id ?? ''} onChange={event=>setMapA(event.target.value)}>{candidateRows.map(item=><option key={item.id} value={item.id} disabled={item.id===pairB?.id}>{item.officialName || `Número de urna ${item.ballotNumber}`}</option>)}</select><label htmlFor="map-candidate-b">{mapConfig.labels.b}</label><select id="map-candidate-b" value={pairB?.id ?? ''} onChange={event=>setMapB(event.target.value)}>{candidateRows.map(item=><option key={item.id} value={item.id} disabled={item.id===pairA?.id}>{item.officialName || `Número de urna ${item.ballotNumber}`}</option>)}</select><button onClick={()=>{setMapA(pairB?.id ?? '');setMapB(pairA?.id ?? '');}}>{mapConfig.labels.swap}</button></>}</div>}
      {descriptor && <div className="analysis-controls"><label htmlFor="dataset-revision">Revisão do dataset</label><select id="dataset-revision" value={initialPin.current.dataset===selectedDatasetId && initialPin.current.revision ? initialPin.current.revision : descriptor.revision} onChange={event=>{initialPin.current={dataset:selectedDatasetId,revision:event.target.value};setPinEpoch(value=>value+1);setRevisionUnavailable(false);}}>{revisionUnavailable && <option value={initialPin.current.revision ?? ''}>Revisão indisponível: {initialPin.current.revision}</option>}{runtime?.registry.listRevisions(selectedDatasetId).map(item=><option key={item.revision} value={item.revision}>{item.revision}</option>)}</select></div>}
      <div className="analysis-controls"><label htmlFor="basemap-choice">Fundo do mapa</label><select id="basemap-choice" value={basemap?.id ?? selectedBasemap} onChange={event=>setSelectedBasemap(event.target.value)}>{registry.basemaps?.map(item=><option key={item.id} value={item.id}>{t(item.labelKey)}</option>)}</select><label><input type="checkbox" checked={showTerritory} onChange={event=>setShowTerritory(event.target.checked)}/> Exibir malha exploratória</label><label htmlFor="metric-choice">Selecionar métrica municipal</label><select id="metric-choice" value={metric?.id ?? selectedMetric} onChange={event=>setSelectedMetric(event.target.value)}>{registry.metrics?.map(item=><option key={item.id} value={item.id}>{dataset?.validVotesMeaning === 'nominal-bu' && item.id === 'valid-votes' ? 'Votos nominais nos boletins' : t(item.labelKey)}</option>)}</select><label htmlFor="candidate-choice">Filtrar candidato</label><select id="candidate-choice" value={candidateFilter} onChange={event=>setCandidateFilter(event.target.value)}><option value="">Todos os candidatos</option>{candidateRows.map(candidate=><option key={candidate.id} value={candidate.id}>{candidate.officialName || `Número de urna ${candidate.ballotNumber} (nome não catalogado)`}</option>)}</select><button onClick={()=>{handleSelect({label:'',value:null});setCandidateFilter('');setSelectedMetric(registry.metric.id);}}>Limpar filtros e seleção</button></div>
      <div className="comparison-controls">
        <label className="comparison-toggle">
          <input type="checkbox" checked={comparisonEnabled}
            onChange={event => { setComparisonEnabled(event.target.checked); if (event.target.checked) setSheetExpanded(true); }} />
          Comparar municípios
        </label>
        {comparisonEnabled && <div className="comparison-choose">
          <label htmlFor="atlas-compare-ref">Comparar com</label>
          <select id="atlas-compare-ref" value={resolvedComparisonId}
            onChange={event => { setComparisonDatasetId(event.target.value); setComparisonPin({dataset:null,revision:null}); setSheetExpanded(true); }}>
            {comparisonOptions.length ? comparisonOptions.map(item =>
              <option key={item.id} value={item.id}>{t(item.labelKey)} · {item.roundId}º turno</option>)
              : <option value="">Sem período do mesmo turno</option>}
          </select>
          {comparisonRef && <><label htmlFor="atlas-compare-revision">Revisão da comparação</label><select id="atlas-compare-revision" value={comparisonRevision ?? ''} onChange={event=>setComparisonPin({dataset:resolvedComparisonId,revision:event.target.value})}>{requestedComparisonRevision && !runtime?.registry.getDataset(resolvedComparisonId,requestedComparisonRevision) && <option value={requestedComparisonRevision}>Revisão indisponível: {requestedComparisonRevision}</option>}{runtime?.registry.listRevisions(resolvedComparisonId).map(item=><option key={item.revision} value={item.revision}>{item.revision}</option>)}</select></>}
          <small>Somente totais da cidade. A malha exploratória não representa resultados oficiais por bairro.</small>
        </div>}
      </div>
      {descriptor && <section className="provenance">
        <span className="eyebrow">{t('data.provenance')}</span>
        <a href={descriptor.provenance.sourceUrl} target="_blank" rel="noreferrer">{descriptor.provenance.sourceId}</a>
        <span>Estado da fonte: {descriptor.sourceStatus ?? 'não declarado'} · derivação: {descriptor.derivedStatus ?? descriptor.status}</span><span>Licença: {descriptor.provenance.license ?? 'não informada na fonte capturada'}</span><a href={descriptor.provenance.methodDoc?.startsWith('https://') ? descriptor.provenance.methodDoc : 'https://github.com/alldevitone-maker/Atlas-Project/blob/main/docs/methodology.md'} target="_blank" rel="noreferrer">Metodologia</a>{activeRef?.candidateCatalogSourceUri && <a href={activeRef.candidateCatalogSourceUri} target="_blank" rel="noreferrer">Fonte independente do catálogo de candidatos</a>}<span>Origem: {descriptor.sourceGrain}</span><span>Unidade: {descriptor.analysisUnit}</span>
        <span>Cobertura declarada da extração, não cobertura espacial auditada.</span>
        {descriptor.quality.notes.map(note => <span key={note}>{note}</span>)}
        <span>{t('data.revision',{revision:descriptor.revision})}</span>
        <span>{t('data.coverage',{coverage:descriptor.quality.coveragePct})}</span>
      </section>}
    </aside>

    <section className="map-stage">
      {dataset && <Suspense fallback={<p role="status">Carregando mapa…</p>}><AtlasMap geometry={geometry} geometryLabelField={registry.territory.geometryLabelField} dataset={dataset} datasetField={registry.join.datasetField} metricField={registry.metric.rowField} prototype={registry.join.prototype} metricLabel={t(registry.metric.labelKey)} showTerritory={showTerritory} basemap={basemap} selectedLabel={selection?.label ?? ''} onSelect={handleSelect} presentation={presentation} /></Suspense>}
      {registry.join.prototype && <div className="method-badge">{t('method.prototype')} {presentation ? 'Cores de rótulos do legado: não são resultados oficiais por bairro nem residência dos eleitores.' : 'Malha exploratória, sem coloração eleitoral: associação espacial não auditada.'}{presentation && mapConfig && <div className="candidate-map-legend" aria-label="Legenda exploratória do par"><span><i style={{background:mapConfig.palette.a}}/>{mapConfig.labels.a}: {pairA?.officialName} · {mapConfig.labels.advantage}</span><span><i style={{background:mapConfig.palette.b}}/>{mapConfig.labels.b}: {pairB?.officialName} · {mapConfig.labels.advantage}</span><span><i style={{background:mapConfig.palette.neutral}}/>{mapConfig.labels.neutral}</span>{pairA?.id===pairB?.id && <strong>Selecione dois candidatos diferentes.</strong>}{selectedStyle && <span>Rótulo selecionado: {selectedStyle.category==='a' ? pairA?.officialName : selectedStyle.category==='b' ? pairB?.officialName : mapConfig.messages[selectedStyle.reason]}. Associação não auditada.</span>}<a href={mapConfig.sourceRef} target="_blank" rel="noreferrer">Paleta do mapa antigo</a></div>}</div>}
    </section>

    <section id="atlas-bottom-sheet" style={{ translate: `0 ${Math.max(-100, Math.min(100, sheetDrag))}px` }} ref={sheetRef} tabIndex={0} aria-label="Painel de dados eleitorais" className={`bottom-sheet ${sheetExpanded ? 'expanded' : ''}`}>
      <PanelHandle axis="vertical" onDrag={setSheetDrag} expanded={sheetExpanded} onChange={setSheetExpanded} controls="atlas-bottom-sheet" label={t('sheet.toggle')} className="sheet-handle" />
      {revisionUnavailable && <p className="comparison-blocked-message" role="alert">
        A revisão fixa solicitada não está disponível neste build. Exibimos apenas a revisão carregada.
        <button onClick={() => {
          initialPin.current = { dataset: null, revision: null };
          setPinEpoch(value=>value+1);
          setRevisionUnavailable(false);
        }}>Usar revisão disponível</button>
      </p>}
      {comparisonEnabled && comparisonError && <p role="alert">Falha ao carregar comparação: {comparisonError}</p>}
      {comparisonEnabled && !comparisonRef && <p role="status" className="comparison-blocked-message">Não há outro período do mesmo turno disponível para a comparação.</p>}
      {comparisonEnabled && comparisonRef && !comparisonData && !comparisonError && <p>Carregando comparação…</p>}
      {comparisonEnabled && comparisonRef && !revisionUnavailable && comparisonData && comparisonDescriptor && dataset && descriptor && activeRef &&
        <ComparisonPanel territoryLabel={t(registry.territory.labelKey)} policy={comparisonPolicy}
          baseline={{descriptor: comparisonDescriptor, data: comparisonData, label: t(comparisonRef!.labelKey) + ' · ' + comparisonRef!.roundId + 'º turno'}}
          current={{descriptor, data: dataset, label: t(activeRef.labelKey) + ' · ' + activeRef.roundId + 'º turno'}} />}
      {selection && <section className="selected-region" aria-label="Dados do rótulo selecionado" aria-live="polite">
        <h2>{selection.label} · rótulo selecionado</h2>
        <button onClick={()=>setSheetExpanded(value=>!value)}>{sheetExpanded ? 'Recolher dados selecionados' : 'Expandir dados selecionados'}</button>
        <p>Associação nominal não auditada. Dados por rótulo de origem, sem resultado oficial por bairro nem residência dos eleitores.</p>
        {selectedLegacy?.row ? <><p>Votos válidos no rótulo: <strong>{number.format(selectedLegacy.row.validVotes)}</strong> · Brancos: {selectedLegacy.row.blankVotes == null ? '—' : number.format(selectedLegacy.row.blankVotes)} · Nulos: {selectedLegacy.row.nullVotes == null ? '—' : number.format(selectedLegacy.row.nullVotes)}</p>
        <table><caption>Votos registrados no legado para o rótulo selecionado</caption><thead><tr><th>Candidato</th><th>Votos</th><th>% dos válidos do rótulo</th></tr></thead><tbody>{selectedCandidates.filter(candidate=>!candidateFilter || candidate.id===candidateFilter).map(candidate=><tr key={candidate.id}><th scope="row">{candidate.officialName || `Número de urna ${candidate.ballotNumber}`}</th><td>{number.format(candidate.votes)}</td><td>{candidate.share == null ? '—' : percent.format(candidate.share)}</td></tr>)}</tbody></table>
        <small>Fonte: {descriptor?.provenance.sourceId} · revisão {descriptor?.revision} · rótulo de origem {selectedLegacy.row.sourceUnitId}. Percentuais usam somente os votos válidos deste rótulo.</small></> : <p>{selectedLegacy?.status==='ambiguous' ? 'Rótulo ambíguo: não exibimos contagens.' : 'Não há dados associados de forma única a este rótulo. Os totais municipais abaixo não representam a área selecionada.'}</p>}
      </section>}
      {selection && <h2 className="scope-heading">Resumo municipal · {t(registry.territory.labelKey)}</h2>}
      <div className="summary-grid">
        <article><span>{dataset?.validVotesMeaning === 'nominal-bu' && metric?.id === 'valid-votes' ? 'Votos nominais nos boletins' : t(metric?.labelKey ?? registry.metric.labelKey)}</span><strong>{primary == null ? '—' : metric?.format === 'percent' ? percent.format(primary) : number.format(primary)}</strong></article>
        <article><span>{t('metric.turnout')}</span><strong>{measures ? percent.format(measures.turnoutRate / 100) : '—'}</strong></article>
        <article><span>{t('metric.abstention')}</span><strong>{measures ? percent.format(measures.abstentionRate / 100) : '—'}</strong></article>
        <article><span>{t('selection.title')}</span><strong>{selection?.label ?? t('selection.none')}</strong><small>{selection?.value == null ? '' : number.format(selection.value)}</small></article>
      </div>
      <p className="semantics">Brancos: {summaryCount('blankVotes')} · Nulos: {summaryCount('nullVotes')} · Aptos: {summaryCount('eligible')} · Comparecimento: {summaryCount('turnout')}. Percentuais dos candidatos usam {dataset?.validVotesMeaning === 'nominal-bu' ? 'votos nominais nos boletins' : 'votos válidos'} como denominador.</p>
      {candidateRows.length > 0 && <div className="candidate-list">
        {candidateRows.filter(candidate=>!candidateFilter || candidate.id===candidateFilter).map(candidate => <div className="candidate-row" key={candidate.id}>
          <div><strong>{candidate.officialName || `Número de urna ${candidate.ballotNumber} (nome não catalogado)`}</strong><span>{candidate.ballotNumber}</span></div>
          <div className="candidate-value"><strong>{number.format(candidate.votes)}</strong><span>{candidate.share == null ? '—' : percent.format(candidate.share)}</span></div>
        </div>)}
      </div>}
      {dataset?.validVotesMeaning === 'nominal-bu' && <details className="semantics"><summary>Inspecionar seções da fonte</summary><p>Identificadores de local de votação, sem coordenadas nem associação por bairro. Seções: {dataset.rows.length}.</p><label htmlFor="section-inspector">Seção eleitoral</label><select id="section-inspector" onChange={event => {const row=dataset.rows.find(item=>item.sourceUnitId===event.target.value);setInspectedRow(row ?? null);}}><option value="">Selecionar seção</option>{dataset.rows.map(row=><option key={row.sourceUnitId} value={row.sourceUnitId}>{row.label}</option>)}</select>{inspectedRow && <p>Local de votação: {String(inspectedRow.pollingPlaceId)} · Nominais: {number.format(inspectedRow.validVotes)} · Brancos: {String(inspectedRow.blankVotes)} · Nulos: {String(inspectedRow.nullVotes)}</p>}</details>}
      {dataset?.semantics && <p className="semantics">{dataset.semantics}</p>}
    </section>
  </main>;
}
