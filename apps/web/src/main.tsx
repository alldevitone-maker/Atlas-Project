import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const GenericModuleDemo = lazy(()=>import('./components/GenericModuleDemo'));
const synthetic = new URLSearchParams(location.search).get('module') === 'module-synthetic';
createRoot(document.getElementById('root')!).render(<StrictMode><Suspense fallback={<p>Carregando módulo…</p>}>{synthetic ? <GenericModuleDemo /> : <App />}</Suspense></StrictMode>);
