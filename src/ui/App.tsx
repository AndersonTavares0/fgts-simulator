import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { simulate } from '../application/Simulation';
import type { SimulationSnapshot } from '../application/Simulation';
import {
  clearSimulations,
  deleteSimulation,
  listSimulations,
  saveSimulation,
} from '../adapters/history/HistoryAdapter';
import { TipoRescisao } from '../core/types';
import { usePwa } from '../pwa/usePwa';
import { useTheme } from './useTheme';
import { Button } from './components/ui/button';
import { SimulationForm } from './SimulationForm';
import { ResultPanel } from './ResultPanel';
import { HistoryPanel } from './HistoryPanel';
import { HelpPage } from './HelpPage';
import { EvolutionChart } from './EvolutionChart';
import { draftFromInput, emptyDraft, exampleDraft, toInput } from './form';
import type { Draft, FieldErrors } from './form';

type Area = 'simulate' | 'history' | 'help';
type View = 'input' | 'result';

function areaFromHash(): Area {
  const hash = window.location.hash;
  if (hash === '#historico') return 'history';
  if (hash === '#metodologia' || hash === '#privacidade' || hash === '#ajuda') return 'help';
  return 'simulate';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.';
}

export function App() {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [consentProcessing, setConsentProcessing] = useState(false);
  const [consentStorage, setConsentStorage] = useState(false);
  const [current, setCurrent] = useState<SimulationSnapshot | null>(null);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState<'save' | 'pdf' | null>(null);
  const [status, setStatus] = useState('');
  const [history, setHistory] = useState<SimulationSnapshot[]>([]);
  const [historyStatus, setHistoryStatus] = useState('Carregando histórico…');
  const [selected, setSelected] = useState<string[]>([]);
  const [area, setArea] = useState<Area>(areaFromHash);
  const [view, setView] = useState<View>('input');
  const formColumn = useRef<HTMLDivElement>(null);
  const resultColumn = useRef<HTMLDivElement>(null);
  const firstView = useRef(true);
  const { theme, toggle: toggleTheme } = useTheme();
  const pwa = usePwa();
  const saved = Boolean(current && history.some((item) => item.id === current.id));

  useEffect(() => {
    // On small screens only one column is visible; bring the active one into view
    // so the result shows up without the user having to scroll.
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    if (window.matchMedia('(min-width: 1024px)').matches) return;
    (view === 'result' ? resultColumn : formColumn).current?.scrollIntoView({ block: 'start' });
  }, [view]);

  useEffect(() => {
    const sync = (): void => setArea(areaFromHash());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const refreshHistory = useCallback(async (): Promise<void> => {
    try {
      const { snapshots, skipped } = await listSimulations();
      setHistory(snapshots);
      setSelected((ids) => ids.filter((id) => snapshots.some((snapshot) => snapshot.id === id)));
      setHistoryStatus(
        `${snapshots.length ? `${snapshots.length} ${snapshots.length === 1 ? 'simulação salva' : 'simulações salvas'}.` : 'Nenhuma simulação salva. Calcule e use “Salvar” para guardar uma estimativa.'}${
          skipped
            ? ` ${skipped} ${skipped === 1 ? 'registro incompatível foi mantido' : 'registros incompatíveis foram mantidos'} no navegador sem exibição. Atualize o aplicativo; use a exclusão do histórico apenas se desejar remover esses dados locais.`
            : ''
        }`,
      );
    } catch (error) {
      setHistoryStatus(`${errorMessage(error)} O cálculo e o PDF continuam disponíveis.`);
    }
  }, []);

  useEffect(() => {
    // Reads the external IndexedDB store once on mount; state lives outside React.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshHistory();
  }, [refreshHistory]);

  const setDraftPatch = useMemo(
    () => (patch: Partial<Draft>) => {
      setDraft((value) => ({ ...value, ...patch }));
      setErrors({});
      if (current) {
        setStale(true);
        setStatus('Os dados mudaram. Calcule de novo para guardar ou salvar o PDF.');
      }
    },
    [current],
  );

  function calculate(next: Draft = draft, consent = consentProcessing): void {
    const result = toInput(next, consent);
    if ('errors' in result) {
      setErrors(result.errors);
      return;
    }
    try {
      const snapshot = simulate(result.input);
      setCurrent(snapshot);
      setStale(false);
      setConsentStorage(false);
      setStatus('Confira o resultado e escolha guardar ou salvar o PDF.');
      setView('result');
    } catch (error) {
      setErrors({ form: errorMessage(error) });
    }
  }

  function useExample(): void {
    setDraft(exampleDraft);
    setErrors({});
    setConsentProcessing(false);
    setConsentStorage(false);
    calculate(exampleDraft, false);
  }

  async function exportPdf(): Promise<void> {
    if (!current || stale) return;
    setBusy('pdf');
    setStatus('Preparando o relatório…');
    try {
      const { createReport } = await import('../adapters/reports/PdfAdapter');
      const blob = await createReport(current);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `simulacao-fgts-${current.input.endDate}-${current.id.slice(0, 8)}.pdf`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus('PDF salvo. Confira a pasta de downloads.');
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  async function save(): Promise<void> {
    if (!current || stale || saved) return;
    setBusy('save');
    setStatus('Salvando neste navegador…');
    try {
      await saveSimulation(
        current,
        current.input.terminationType === TipoRescisao.DOENCA_GRAVE && consentStorage,
      );
      setStatus('Resultado guardado neste navegador.');
      await refreshHistory();
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  function reload(snapshot: SimulationSnapshot): void {
    setDraft(draftFromInput(snapshot.input));
    setErrors({});
    setConsentProcessing(false);
    setConsentStorage(false);
    setCurrent(snapshot);
    setStale(false);
    setStatus('Resultado guardado reaberto. Calcule de novo se quiser atualizar.');
    window.location.hash = '#simular';
    setArea('simulate');
    setView('result');
  }

  async function remove(snapshot: SimulationSnapshot): Promise<void> {
    if (
      !window.confirm(
        'Excluir esta simulação do histórico deste navegador? Esta ação não pode ser desfeita.',
      )
    )
      return;
    try {
      await deleteSimulation(snapshot.id);
      await refreshHistory();
    } catch (error) {
      setHistoryStatus(errorMessage(error));
    }
  }

  async function clear(): Promise<void> {
    if (
      !window.confirm(
        'Excluir todas as simulações deste navegador? Não há backup. PDFs baixados não serão excluídos.',
      )
    )
      return;
    try {
      await clearSimulations();
      setSelected([]);
      await refreshHistory();
    } catch (error) {
      setHistoryStatus(errorMessage(error));
    }
  }

  function toggleSelected(id: string): void {
    setSelected((ids) => {
      if (ids.includes(id)) return ids.filter((value) => value !== id);
      return ids.length === 2 ? ids : [...ids, id];
    });
  }

  const offlineStatus = !pwa.online
    ? pwa.offlineReady
      ? 'Sem internet · o app continua funcionando'
      : 'Sem internet · abra uma vez com internet para usar depois'
    : pwa.offlineReady
      ? 'Pode usar sem internet'
      : pwa.registerError
        ? 'Sem modo offline · abra por HTTPS'
        : 'Preparando o modo offline…';

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="bg-card border-border sr-only rounded-lg border px-3 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-20"
      >
        Ir para o conteúdo
      </a>

      <header className="border-border border-b">
        <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center px-5 md:gap-6 md:px-8">
          <a href="#simular" className="text-primary flex items-baseline gap-2 no-underline">
            <span className="text-[15px] font-semibold tracking-[-0.01em]">FGTS</span>
            <span className="text-muted-foreground hidden text-[12.5px] sm:inline">Simulador</span>
          </a>
          <nav aria-label="Navegação principal" className="ml-auto flex items-center md:gap-1">
            {(
              [
                ['#simular', 'Calcular', 'simulate'],
                ['#historico', 'Resultados', 'history'],
                ['#metodologia', 'Ajuda', 'help'],
              ] as const
            ).map(([href, label, target]) => (
              <a
                key={href}
                href={href}
                aria-current={area === target ? 'page' : undefined}
                className={`flex h-9 items-center rounded-md px-2 text-[13.5px] no-underline transition-colors md:px-3 ${
                  area === target
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary -mr-2 shrink-0"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            aria-pressed={theme === 'dark'}
          >
            {theme === 'dark' ? (
              <SunIcon className="size-[17px]" aria-hidden="true" />
            ) : (
              <MoonIcon className="size-[17px]" aria-hidden="true" />
            )}
          </Button>
        </div>
      </header>

      <main id="conteudo" className="mx-auto w-full max-w-[1200px] flex-1 px-5 md:px-8">
        {area === 'simulate' && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-6 pt-10 md:pt-14">
              <div>
                <h1 className="text-[32px] leading-[1.05] font-semibold tracking-[-0.03em] text-balance md:text-[44px]">
                  Simule seu FGTS e sua rescisão
                </h1>
                <p className="text-muted-foreground mt-4 max-w-[60ch] text-[15px] leading-relaxed">
                  Saldo estimado do FGTS e verbas da saída: multa, 13º e férias. Cálculo no seu
                  aparelho, sem cadastro.
                </p>
              </div>
              <a
                href="#metodologia"
                className="text-muted-foreground hover:text-foreground hidden pb-1 text-[13px] no-underline md:block"
              >
                Como o cálculo funciona
              </a>
            </div>

            <div className="border-border mt-8 flex gap-6 border-b lg:hidden">
              {(
                [
                  ['input', 'Dados'],
                  ['result', 'Resultado'],
                ] as const
              ).map(([target, label]) => (
                <button
                  key={target}
                  type="button"
                  aria-pressed={view === target}
                  className={`-mb-px border-b-2 pb-2.5 text-[14px] transition-colors ${
                    view === target
                      ? 'border-foreground text-foreground font-medium'
                      : 'text-muted-foreground border-transparent'
                  }`}
                  onClick={() => setView(target)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-8 grid items-start gap-10 md:mt-14 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:gap-12 xl:gap-14">
              <div ref={formColumn} className={view === 'result' ? 'hidden lg:block' : undefined}>
                <SimulationForm
                  draft={draft}
                  errors={errors}
                  consentProcessing={consentProcessing}
                  onDraft={setDraftPatch}
                  onConsent={setConsentProcessing}
                  onSubmit={() => calculate()}
                />
              </div>
              <div
                ref={resultColumn}
                className={`lg:border-border lg:border-l lg:pl-12 xl:pl-14 ${
                  view === 'input' ? 'hidden lg:block' : ''
                }`}
              >
                <ResultPanel
                  snapshot={current}
                  stale={stale}
                  saved={saved}
                  busy={busy}
                  consentStorage={consentStorage}
                  status={status}
                  onConsentStorage={setConsentStorage}
                  onSave={() => void save()}
                  onExportPdf={() => void exportPdf()}
                  onExample={useExample}
                />
              </div>
            </div>

            <div className={view === 'input' ? 'hidden lg:block' : undefined}>
              {current && <EvolutionChart snapshot={current} />}
            </div>
          </>
        )}

        {area === 'history' && (
          <div className="pt-10 md:pt-14">
            <HistoryPanel
              history={history}
              selected={selected}
              status={historyStatus}
              onToggle={toggleSelected}
              onReload={reload}
              onDelete={(snapshot) => void remove(snapshot)}
              onClear={() => void clear()}
              onRefresh={() => void refreshHistory()}
            />
          </div>
        )}

        {area === 'help' && (
          <div className="pt-10 md:pt-14">
            <HelpPage />
          </div>
        )}

        <footer className="border-border text-muted-foreground mt-16 flex flex-col items-start gap-3 border-t py-6 text-[12px] md:mt-20 lg:flex-row lg:items-center lg:justify-between">
          <span role="status" className="flex items-center gap-1.5">
            <span
              className={`size-1.5 rounded-full ${pwa.online ? 'bg-primary' : 'bg-warn-ink'}`}
              aria-hidden="true"
            />
            {offlineStatus}
          </span>
          {pwa.canInstall && (
            <button
              type="button"
              className="text-foreground underline underline-offset-2"
              onClick={() => void pwa.install()}
            >
              Instalar aplicativo
            </button>
          )}
          {pwa.installFailed && (
            <span className="text-warn-ink">Use o menu do navegador para instalar.</span>
          )}
          {pwa.updateReady && (
            <span className="text-warn-ink" role="status">
              Nova versão disponível.{' '}
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={pwa.update}
              >
                Atualizar agora
              </button>
            </span>
          )}
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a href="#metodologia" className="hover:text-foreground no-underline">
              Como calculamos
            </a>
            <a href="#privacidade" className="hover:text-foreground no-underline">
              Privacidade
            </a>
            <a
              href="https://github.com/AndersonTavares0/fgts-simulator"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground no-underline"
            >
              Código
            </a>
          </span>
        </footer>
      </main>

      <noscript>
        <p className="px-5 py-4">
          Ative o JavaScript para calcular estimativas e acessar o histórico local.
        </p>
      </noscript>
    </div>
  );
}
