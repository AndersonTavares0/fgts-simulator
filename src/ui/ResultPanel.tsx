import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowDownTrayIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { simulate } from '../application/Simulation';
import type { SimulationSnapshot } from '../application/Simulation';
import { TipoRescisao } from '../core/types';
import { FormatAdapter } from '../adapters/FormatAdapter';
import { totalCaption } from './presentation';
import { emptyDraft, exampleDraft, toInput } from './form';
import { Button } from './components/ui/button';
import { Checkbox } from './components/ui/checkbox';
import { Label } from './components/ui/label';
import { Breakdown } from './Breakdown';

interface Props {
  snapshot: SimulationSnapshot | null;
  stale: boolean;
  saved: boolean;
  busy: 'save' | 'pdf' | null;
  consentStorage: boolean;
  status: string;
  onConsentStorage: (value: boolean) => void;
  onSave: () => void;
  onExportPdf: () => void;
  onExample: () => void;
  chart?: ReactNode;
}

function describe(snapshot: SimulationSnapshot): string {
  const { input } = snapshot;
  const tr = input.scenario === 'TR';
  const rate = FormatAdapter.rateToPercent(tr ? input.trMonthly : input.ipcaMonthly);
  // The default rates are illustrative (nov/2026), so say so instead of passing them as official.
  const isExample = rate === (tr ? emptyDraft.trMonthly : emptyDraft.ipcaMonthly);
  return `${FormatAdapter.civilDate(input.startDate)} a ${FormatAdapter.civilDate(
    input.endDate,
  )} · ${tr ? 'TR + 3% ao ano' : 'IPCA'} de ${rate}% ao mês${isExample ? ' (exemplo, ajuste em “Ajustar detalhes”)' : ''}`;
}

function Row({ label, cents }: { label: string; cents: string }) {
  return (
    <div className="border-border flex items-baseline justify-between gap-4 border-b py-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="num font-medium">{FormatAdapter.centsToBRL(cents)}</dd>
    </div>
  );
}

/** The result laid out as a payslip: total on the dark band, the two groups of lines below. */
function Slip({
  snapshot,
  caption,
  sample,
  badge,
}: {
  snapshot: SimulationSnapshot;
  caption: string;
  sample?: boolean;
  badge?: string;
}) {
  const { result } = snapshot;
  const [symbol, amount] = FormatAdapter.centsToBRL(result.totalCents).split(' ');
  return (
    <div className="border-border bg-card relative overflow-hidden rounded-3xl border">
      <div className="text-band-foreground relative bg-[linear-gradient(135deg,var(--band),var(--band-2))] px-6 pt-5 pb-6 md:px-7">
        <svg
          aria-hidden="true"
          viewBox="0 0 200 200"
          className="text-band-foreground pointer-events-none absolute -top-16 -right-14 size-64 opacity-[0.14]"
          fill="none"
          stroke="currentColor"
        >
          {[30, 54, 78, 102].map((r) => (
            <circle key={r} cx="100" cy="100" r={r} strokeWidth="1" />
          ))}
        </svg>
        <div className="relative flex items-start justify-between gap-3">
          <h2
            id="result-title"
            className="text-band-foreground/75 text-[13px] font-medium tracking-[0.01em]"
          >
            {sample ? 'Exemplo de resultado' : 'Total estimado'}
          </h2>
          {badge && (
            <span className="bg-highlight text-ink inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold">
              {badge}
            </span>
          )}
        </div>
        <p className="font-display relative mt-3 flex items-baseline gap-2">
          <span className="text-band-foreground/75 text-[clamp(20px,2.4vw,26px)]">{symbol}</span>
          <span className="num text-[clamp(44px,5vw,64px)] leading-[0.95] font-semibold tracking-[-0.025em]">
            {amount}
          </span>
        </p>
        <p className="text-band-foreground/90 relative mt-3 max-w-[46ch] text-[14px] leading-snug">
          {caption}
        </p>
      </div>
      <div className="grid gap-8 px-6 py-5 sm:grid-cols-2 sm:gap-10 md:px-7">
        <div>
          <h3 className="font-display text-[18px] font-semibold">No seu FGTS</h3>

          <dl className="mt-3 text-[14.5px]">
            <Row label="Saldo total" cents={result.saldoBaseCents} />
            <Row label="Disponível para saque" cents={result.saldoDisponivelCents} />
            <Row label="Retido" cents={result.saldoRetidoCents} />
          </dl>
        </div>
        <div>
          <h3 className="font-display text-[18px] font-semibold">Na saída do emprego</h3>

          <dl className="mt-3 text-[14.5px]">
            <Row label="Multa rescisória" cents={result.multaCents} />
            <Row label="13º proporcional" cents={result.decimoTerceiroCents} />
            <Row label="Férias + 1/3" cents={result.feriasCents} />
          </dl>
        </div>
      </div>
    </div>
  );
}

export function ResultPanel({
  snapshot,
  stale,
  saved,
  busy,
  consentStorage,
  status,
  onConsentStorage,
  onSave,
  onExportPdf,
  onExample,
  chart,
}: Props) {
  const [tab, setTab] = useState<'summary' | 'steps' | 'chart'>('summary');
  // The empty state shows a real, labelled preview: the same case the button loads.
  const demo = useMemo(() => {
    const parsed = toInput(exampleDraft, false);
    return 'errors' in parsed ? null : simulate(parsed.input);
  }, []);

  if (!snapshot) {
    return (
      <section aria-labelledby="result-title">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-[20px] leading-tight font-semibold">
              Seu resultado aparece aqui
            </p>
            <p className="help mt-1">Tudo fica no seu aparelho. Veja um exemplo enquanto isso.</p>
          </div>
          <Button variant="secondary" onClick={onExample} className="shrink-0">
            Ver exemplo
          </Button>
        </div>

        {demo && (
          <Slip
            snapshot={demo}
            sample
            badge="Exemplo"
            caption={`Salário de ${FormatAdapter.centsToBRL(demo.input.salaryCents)} por um ano de trabalho. O seu aparece ao calcular.`}
          />
        )}
      </section>
    );
  }

  const sensitive = snapshot.input.terminationType === TipoRescisao.DOENCA_GRAVE;
  const retained = snapshot.result.saldoRetidoCents !== '0';
  const hasTotal = BigInt(snapshot.result.totalCents) > 0n;
  const tabs: Array<['summary' | 'steps' | 'chart', string]> = [
    ['summary', 'Resumo'],
    ['steps', 'Passo a passo'],
    ...(chart ? ([['chart', 'Evolução']] as Array<['chart', string]>) : []),
  ];

  return (
    <section aria-label="Resultado" aria-busy={busy !== null}>
      {stale && (
        <p className="notice bg-warn-bg text-warn-ink mb-3" role="status">
          Os dados mudaram. Calcule de novo para guardar ou salvar o PDF.
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <div
          role="tablist"
          aria-label="Partes do resultado"
          className="bg-muted flex min-w-[15rem] flex-1 gap-1 rounded-full p-1"
        >
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`min-h-9 flex-1 cursor-pointer rounded-full px-3 text-[13.5px] font-medium whitespace-nowrap transition-colors ${tab === id ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            className="min-h-10"
            onClick={onSave}
            disabled={stale || busy !== null || saved || (sensitive && !consentStorage)}
          >
            <BookmarkIcon className="size-4" aria-hidden="true" />
            {busy === 'save' ? 'Guardando…' : saved ? 'Guardado' : 'Guardar'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-10"
            onClick={onExportPdf}
            disabled={stale || busy !== null}
          >
            <ArrowDownTrayIcon className="size-4" aria-hidden="true" />
            {busy === 'pdf' ? 'Preparando…' : 'PDF'}
          </Button>
        </div>
      </div>

      {sensitive && (
        <div className="notice bg-muted mb-3 print:hidden">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="consent-storage"
              className="mt-0.5"
              checked={consentStorage}
              onCheckedChange={(checked) => onConsentStorage(checked === true)}
            />
            <Label htmlFor="consent-storage" className="text-[13px] font-normal">
              Autorizo salvar neste navegador a simulação com doença grave. Posso excluí-la no
              histórico.
            </Label>
          </div>
          <a
            className="text-foreground mt-2 inline-block text-[13px] underline"
            href="#privacidade"
          >
            Privacidade e exclusão
          </a>
        </div>
      )}

      <div role="tabpanel" key={tab} className="settle">
        {tab === 'summary' && (
          <>
            <Slip
              snapshot={snapshot}
              badge={stale ? 'Dados mudaram' : saved ? 'Resultado guardado' : undefined}
              caption={
                hasTotal
                  ? totalCaption(snapshot.result)
                  : 'Nenhuma parcela a receber neste cenário.'
              }
            />
            <p className="text-muted-foreground mt-3 text-[13px]">
              {describe(snapshot)} · bruto, sem descontos.
              {retained &&
                ` ${FormatAdapter.centsToBRL(snapshot.result.saldoRetidoCents)} ficam retidos no FGTS e não entram no total.`}
            </p>
            <p className="help mt-1">
              Quer conferir com calma? Leve o PDF a um advogado trabalhista ou ao sindicato.
            </p>
          </>
        )}
        {tab === 'steps' && <Breakdown snapshot={snapshot} />}
        {tab === 'chart' && chart}
      </div>

      <p className="help mt-2 min-h-4 print:hidden" role="status" aria-live="polite">
        {stale ? '' : status}
      </p>
    </section>
  );
}
