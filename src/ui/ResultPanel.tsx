import { ArrowDownTrayIcon, BookmarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import type { SimulationSnapshot } from '../application/Simulation';
import { TipoRescisao } from '../core/types';
import { FormatAdapter } from '../adapters/FormatAdapter';
import { inputRows, totalCaption } from './presentation';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Checkbox } from './components/ui/checkbox';
import { Label } from './components/ui/label';

// Plain names for the audience this tool serves; the technical labels stay in the PDF.
const PLAIN: Record<keyof SimulationSnapshot['result'], string> = {
  saldoBaseCents: 'Saldo total no FGTS (com correção)',
  depositosCents: 'Depósitos da empresa',
  rendimentoCents: 'Rendimento (juros)',
  saldoDisponivelCents: 'Disponível para saque',
  saldoRetidoCents: 'Retido no FGTS',
  multaCents: 'Multa rescisória',
  decimoTerceiroCents: '13º proporcional',
  feriasCents: 'Férias + 1/3',
  totalCents: 'Total estimado',
};

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
}

function describe(snapshot: SimulationSnapshot): string {
  return `${FormatAdapter.civilDate(snapshot.input.startDate)} a ${FormatAdapter.civilDate(
    snapshot.input.endDate,
  )} · ${snapshot.input.scenario === 'TR' ? 'TR + 3% ao ano' : 'IPCA comparativo'}`;
}

function Row({ label, cents }: { label: string; cents: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="num font-medium">{FormatAdapter.centsToBRL(cents)}</dd>
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
}: Props) {
  if (!snapshot) {
    return (
      <section aria-labelledby="result-title" className="border-border lg:pt-0">
        <h2
          id="result-title"
          className="text-muted-foreground text-[12px] font-medium tracking-[0.08em] uppercase"
        >
          Resultado
        </h2>
        <p className="mt-4 max-w-[34ch] text-[22px] leading-snug font-medium tracking-[-0.02em]">
          O saldo e as verbas aparecem aqui depois do cálculo.
        </p>
        <p className="text-muted-foreground mt-3 max-w-[42ch] text-[13.5px] leading-relaxed">
          Preencha os dados ao lado. Nada é enviado para a internet.
        </p>
        <Button variant="secondary" className="mt-6" onClick={onExample}>
          Ver exemplo
        </Button>
      </section>
    );
  }

  const sensitive = snapshot.input.terminationType === TipoRescisao.DOENCA_GRAVE;
  const retained = snapshot.result.saldoRetidoCents !== '0';
  const hasTotal = BigInt(snapshot.result.totalCents) > 0n;
  const [symbol, amount] = FormatAdapter.centsToBRL(snapshot.result.totalCents).split(' ');

  return (
    <section aria-labelledby="result-title" aria-busy={busy !== null}>
      <div className="flex items-start justify-between gap-4">
        <h2
          id="result-title"
          className="text-muted-foreground text-[12px] font-medium tracking-[0.08em] uppercase"
        >
          Total estimado
        </h2>
        {(saved || stale) && <Badge>{stale ? 'Dados mudaram' : 'Resultado guardado'}</Badge>}
      </div>

      <p className="mt-4 flex items-baseline gap-2.5">
        <span className="text-muted-foreground text-[clamp(20px,2.4vw,26px)] font-normal tracking-normal">
          {symbol}
        </span>
        <span className="num text-[clamp(48px,6.4vw,72px)] leading-[0.9] font-semibold tracking-[-0.04em]">
          {amount}
        </span>
      </p>

      <p className="mt-4 text-[13.5px]">
        {hasTotal ? totalCaption(snapshot.result) : 'Nenhuma parcela a receber neste cenário.'}
      </p>
      <p className="text-muted-foreground mt-1 text-[12.5px]">
        {describe(snapshot)} · estimativa bruta, sem descontos.
      </p>

      {retained && (
        <p className="text-muted-foreground mt-2 text-[12.5px]">
          {FormatAdapter.centsToBRL(snapshot.result.saldoRetidoCents)} ficam retidos no FGTS e não
          entram no total.
        </p>
      )}

      {stale && (
        <p className="notice bg-warn-bg text-warn-ink mt-6" role="status">
          Os dados mudaram. Calcule de novo para guardar ou salvar o PDF.
        </p>
      )}

      <div className="border-border mt-9 grid gap-7 border-t pt-6 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-border">
        <div className="sm:pr-8">
          <h3 className="text-muted-foreground text-[11px] font-medium tracking-[0.08em] uppercase">
            FGTS
          </h3>
          <dl className="mt-3.5 space-y-2.5 text-[13.5px]">
            <Row label="Saldo total no FGTS" cents={snapshot.result.saldoBaseCents} />
            <Row label="Disponível para saque" cents={snapshot.result.saldoDisponivelCents} />
            <Row label="Retido no FGTS" cents={snapshot.result.saldoRetidoCents} />
          </dl>
        </div>
        <div className="sm:pl-8">
          <h3 className="text-muted-foreground text-[11px] font-medium tracking-[0.08em] uppercase">
            Rescisão
          </h3>
          <dl className="mt-3.5 space-y-2.5 text-[13.5px]">
            <Row label="Multa rescisória" cents={snapshot.result.multaCents} />
            <Row label="13º proporcional" cents={snapshot.result.decimoTerceiroCents} />
            <Row label="Férias + 1/3" cents={snapshot.result.feriasCents} />
          </dl>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="flex-1"
          onClick={onSave}
          disabled={stale || busy !== null || saved || (sensitive && !consentStorage)}
        >
          <BookmarkIcon className="size-4" aria-hidden="true" />
          {busy === 'save' ? 'Guardando…' : saved ? 'Guardado' : 'Guardar resultado'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={onExportPdf}
          disabled={stale || busy !== null}
        >
          <ArrowDownTrayIcon className="size-4" aria-hidden="true" />
          {busy === 'pdf' ? 'Preparando…' : 'Baixar PDF'}
        </Button>
      </div>

      {sensitive && (
        <div className="notice bg-muted mt-4">
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

      <p className="help mt-3 min-h-4" role="status" aria-live="polite">
        {status}
      </p>

      <details className="border-border group mt-8 border-t">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-[13.5px] font-medium">
          Como chegamos nesses valores
          <ChevronDownIcon
            className="text-muted-foreground size-4 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <dl className="mt-1">
          {(Object.keys(PLAIN) as Array<keyof SimulationSnapshot['result']>)
            .filter((key) => key !== 'totalCents')
            .map((key) => (
              <div key={key} className="row-value">
                <dt className="text-muted-foreground">{PLAIN[key]}</dt>
                <dd className="num text-right whitespace-nowrap">
                  {FormatAdapter.centsToBRL(snapshot.result[key])}
                </dd>
              </div>
            ))}
        </dl>
        {snapshot.warnings.length > 0 && (
          <div className="notice bg-warn-bg text-warn-ink my-3">
            <strong className="font-medium">Antes de interpretar</strong>
            <ul className="mt-1 list-disc pl-5">
              {snapshot.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
          {inputRows(snapshot.input).map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right break-words">{value}</dd>
            </div>
          ))}
        </dl>
        <ul className="text-muted-foreground mt-4 list-disc pl-5 text-[12.5px] leading-relaxed">
          {snapshot.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
        <p className="help mt-3 break-all">
          Aplicativo {snapshot.appVersion} · Regra {snapshot.calculationVersion} · Formato{' '}
          {snapshot.formatVersion} · ID {snapshot.id}
        </p>
      </details>
    </section>
  );
}
