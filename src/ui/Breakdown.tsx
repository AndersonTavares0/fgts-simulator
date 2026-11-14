import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import type { SimulationSnapshot } from '../application/Simulation';
import { FormatAdapter } from '../adapters/FormatAdapter';
import { breakdownSteps, compositionParts, inputRows } from './presentation';

type Result = SimulationSnapshot['result'];

function Step({
  n,
  label,
  hint,
  cents,
}: {
  n: number;
  label: string;
  hint: string;
  cents: string;
}) {
  return (
    <li className="bg-muted/60 rounded-2xl p-3">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="bg-accent text-accent-foreground grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold"
        >
          {n}
        </span>
        <p className="min-w-0 flex-1 text-[14px] font-medium">{label}</p>
        <p className="num shrink-0 text-[14.5px] font-semibold">
          {FormatAdapter.centsToBRL(cents)}
        </p>
      </div>
      <p className="help mt-1 pl-[34px] leading-snug">{hint}</p>
    </li>
  );
}

/** Where the total comes from: one bar, six short steps, then the data behind them. */
export function Breakdown({ snapshot }: { snapshot: SimulationSnapshot }) {
  const [panel, setPanel] = useState<'warn' | 'data' | 'tech' | null>(null);
  const [hover, setHover] = useState<keyof Result | null>(null);
  const { input, result } = snapshot;
  const total = Number(result.totalCents);
  const SHADES = [1, 0.65, 0.4, 0.22];
  const parts = compositionParts.map((part, index) => ({ ...part, shade: SHADES[index] ?? 0.2 }));
  const shown = parts.filter((part) => Number(result[part.key]) > 0);
  const retained = result.saldoRetidoCents !== '0';

  const panels: Array<['warn' | 'data' | 'tech', string]> = [
    ...(snapshot.warnings.length > 0
      ? ([['warn', `Antes de interpretar (${snapshot.warnings.length})`]] as Array<
          ['warn', string]
        >)
      : []),
    ['data', 'O que você informou'],
    ['tech', 'Como assumimos'],
  ];
  const row = new Map(inputRows(input));
  const get = (label: string): string => row.get(label) ?? '—';
  const facts: Array<[string, string]> = [
    ['Salário', get('Salário bruto mensal')],
    ['Período', `${get('Início do vínculo')} a ${get('Fim do período')}`],
    ['Contrato', get('Contrato')],
    ['Motivo', get('Motivo')],
    ['13º', get('13º proporcional')],
    ['Férias', get('Férias proporcionais')],
    ['Saque-aniversário', get('Saque-aniversário')],
    [
      'Correção',
      `${get('Cenário selecionado')} · TR ${get('TR estimada mensal')}, IPCA ${get('IPCA estimado mensal')}`,
    ],
    ['FGTS do 13º', get('FGTS sobre 13º')],
    ...(input.thirteenthMode === 'actual'
      ? ([['13º informado', get('Remunerações de 13º informadas')]] as Array<[string, string]>)
      : []),
  ];

  return (
    <section
      aria-labelledby="breakdown-title"
      className="border-border bg-card rounded-3xl border p-5"
    >
      <h3 id="breakdown-title" className="text-[18px] font-semibold tracking-[-0.02em]">
        Como chegamos nesses valores
      </h3>

      {total > 0 && shown.length > 0 && (
        <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
          <div className="relative size-[156px] shrink-0" onPointerLeave={() => setHover(null)}>
            <svg viewBox="-1.5 -1.5 39 39" className="size-full -rotate-90" aria-hidden="true">
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                strokeWidth="4"
                className="stroke-muted"
              />
              {(() => {
                let done = 0;
                return shown.map((part) => {
                  const pct = (Number(result[part.key]) / total) * 100;
                  const start = done;
                  done += pct;
                  const active = hover === part.key;
                  return (
                    <circle
                      key={part.key}
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke="var(--primary)"
                      strokeOpacity={hover && !active ? 0.25 : part.shade}
                      strokeWidth={active ? 5.2 : 4}
                      strokeDasharray={`${Math.max(pct - (shown.length > 1 ? 0.8 : 0), 0.1)} ${100 - pct + (shown.length > 1 ? 0.8 : 0)}`}
                      strokeDashoffset={-start}
                      className="cursor-pointer transition-all duration-300"
                      onPointerEnter={() => setHover(part.key)}
                    />
                  );
                });
              })()}
            </svg>
            <div className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center">
              {(() => {
                const part = shown.find((item) => item.key === hover);
                return part ? (
                  <div>
                    <p className="text-muted-foreground text-[11.5px] leading-tight">
                      {part.label}
                    </p>
                    <p className="num text-[16px] font-semibold tracking-[-0.02em]">
                      {FormatAdapter.centsToBRL(result[part.key])}
                    </p>
                    <p className="text-muted-foreground text-[11.5px]">
                      {Math.round((Number(result[part.key]) / total) * 100)}% do total
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-muted-foreground text-[11.5px]">Total</p>
                    <p className="num text-[17px] font-semibold tracking-[-0.02em]">
                      {FormatAdapter.centsToBRL(result.totalCents)}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
          <ul className="w-full min-w-0 flex-1 space-y-1">
            {shown.map((part) => (
              <li key={part.key}>
                <button
                  type="button"
                  onPointerEnter={() => setHover(part.key)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(part.key)}
                  onBlur={() => setHover(null)}
                  className={`flex w-full cursor-default items-start gap-2.5 rounded-xl px-3 py-2 text-left transition-colors ${hover === part.key ? 'bg-muted' : ''}`}
                >
                  <span
                    aria-hidden="true"
                    className="bg-primary mt-1.5 size-2.5 shrink-0 rounded-full"
                    style={{ opacity: part.shade }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-3 text-[14px] font-medium">
                      {part.label}
                      <span className="num">{FormatAdapter.centsToBRL(result[part.key])}</span>
                    </span>
                    <span className="help block leading-snug">{part.desc}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ol className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {breakdownSteps(snapshot).map((step, index) => (
          <Step
            key={step.key}
            n={index + 1}
            label={step.label}
            hint={step.hint}
            cents={result[step.key]}
          />
        ))}
      </ol>

      <div className="bg-accent text-accent-foreground mt-2.5 flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <div>
          <p className="text-[14.5px] font-semibold">Total estimado</p>
          <p className="text-[12.5px] opacity-80">
            {retained ? 'Disponível, multa, 13º e férias.' : 'Saldo, multa, 13º e férias.'}
          </p>
        </div>
        <p className="num text-[20px] font-semibold tracking-[-0.02em]">
          {FormatAdapter.centsToBRL(result.totalCents)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {panels.map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-expanded={panel === id}
            onClick={() => setPanel((open) => (open === id ? null : id))}
            className={`flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors ${
              id === 'warn'
                ? 'bg-warn-bg text-warn-ink'
                : panel === id
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
            } ${panel === id ? 'ring-primary/40 ring-2' : ''}`}
          >
            {id === 'warn' && <ExclamationTriangleIcon className="size-4" aria-hidden="true" />}
            {label}
          </button>
        ))}
      </div>

      {panel === 'warn' && (
        <ul className="bg-warn-bg text-warn-ink settle mt-2 max-h-48 list-disc space-y-1 overflow-y-auto rounded-2xl py-3 pr-4 pl-8 text-[13px]">
          {snapshot.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      {panel === 'data' && (
        <dl className="bg-muted/60 settle mt-2 grid gap-x-6 rounded-2xl px-4 py-2.5 text-[13px] sm:grid-cols-2">
          {facts.map(([label, value]) => (
            <div
              key={label}
              className="border-border flex justify-between gap-3 border-b py-1.5 last:border-0"
            >
              <dt className="text-muted-foreground shrink-0">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {panel === 'tech' && (
        <div className="bg-muted/60 settle mt-2 rounded-2xl px-4 py-3 text-[13px]">
          <ul className="space-y-1.5">
            {[
              'É uma projeção com salário fixo e as taxas mensais que você informou.',
              'Valor bruto: não desconta IRRF/INSS nem inclui aviso-prévio e outras verbas.',
              'Não substitui o extrato da Caixa nem orientação profissional.',
            ].map((text) => (
              <li key={text} className="flex items-start gap-2">
                <CheckCircleIcon
                  className="text-primary mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                {text}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-3 mb-1 text-[12px] font-medium">
            Premissas técnicas ({snapshot.assumptions.length})
          </p>
          <ul className="text-muted-foreground max-h-36 list-disc space-y-1 overflow-y-auto pl-5 text-[12.5px] leading-snug">
            {snapshot.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
          <p className="help mt-2 break-all text-[11.5px]">
            Aplicativo {snapshot.appVersion} · Regra {snapshot.calculationVersion} · Formato{' '}
            {snapshot.formatVersion} · ID {snapshot.id}
          </p>
        </div>
      )}
    </section>
  );
}
