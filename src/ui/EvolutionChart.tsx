import { useId, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { FormatAdapter } from '../adapters/FormatAdapter';
import { Button } from './components/ui/button';
import { chartMax } from './chartScale';
import type { SimulationSnapshot } from '../application/Simulation';

type Point = SimulationSnapshot['timeline'][number];
type Series = 'tr' | 'ipca' | 'depositos';

// Depósitos são lineares e redundantes no gráfico; ficam na tabela mensal.
const SERIES: Array<{ key: Series; label: string; dashed: boolean; color: string }> = [
  { key: 'tr', label: 'Saldo acumulado (TR + 3%)', dashed: false, color: 'var(--chart-1)' },
  { key: 'ipca', label: 'Referência IPCA', dashed: true, color: 'var(--chart-2)' },
];

const FIELD: Record<Series, 'trCents' | 'ipcaCents' | 'depositosCents'> = {
  tr: 'trCents',
  ipca: 'ipcaCents',
  depositos: 'depositosCents',
};

const cents = (point: Point, key: Series): number => Number(point[FIELD[key]]) / 100;
const xAt = (index: number, total: number): number => (total < 2 ? 50 : (index / (total - 1)) * 100);
const yAt = (value: number, max: number): number => 98 - (value / max) * 94;

export function EvolutionChart({ snapshot }: { snapshot: SimulationSnapshot }) {
  const [active, setActive] = useState<number | null>(null);
  const plotSvg = useRef<SVGSVGElement>(null);
  const areaId = `area-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const data = snapshot.timeline;
  const total = data.length;
  const rawMax = chartMax(data);
  // Round the axis to a readable step so labels are "3 mil", not "2,9 mil".
  const step = 10 ** Math.max(0, Math.floor(Math.log10(rawMax)) - 1);
  const max = Math.ceil(rawMax / step) * step;
  const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

  // Geometry lives in a 0..100 box; the SVG stretches to the container. The strings are
  // rebuilt only when the snapshot changes: hovering sets state and would otherwise
  // recompute two 602-point paths on every pointer move.
  const { paths, area } = useMemo(() => {
    const path = (key: Series): string =>
      data
        .map((point, index) => `${index ? 'L' : 'M'}${xAt(index, total)} ${yAt(cents(point, key), max)}`)
        .join(' ');
    return {
      paths: { tr: path('tr'), ipca: path('ipca') },
      area: `${path('tr')} L${xAt(total - 1, total)} 98 L${xAt(0, total)} 98 Z`,
    };
  }, [data, total, max]);

  if (total === 0) return null;
  const shown = active === null ? data[total - 1] : data[active];
  const activeX = active === null ? 0 : total < 2 ? 50 : (active / (total - 1)) * 100;

  // Measured on the plot itself: the container includes the axis gutter, which
  // would shift every hover towards the labels.
  function trackPointer(event: PointerEvent<HTMLDivElement>): void {
    const rect = plotSvg.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    setActive(Math.min(total - 1, Math.max(0, Math.round(ratio * (total - 1)))));
  }

  return (
    <section className="border-border mt-10 border-t pt-6" aria-labelledby="evolution-title">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div>
          <h2
            id="evolution-title"
            className="text-muted-foreground text-[12px] font-medium tracking-[-0.01em]"
          >
            Saldo acumulado em {FormatAdapter.civilDate(data[total - 1]!.competencia)}
          </h2>
          <p className="num mt-1.5 text-[26px] leading-none font-semibold tracking-[-0.03em]">
            {FormatAdapter.centsToBRL(snapshot.result.saldoBaseCents)}
          </p>
          <p className="text-muted-foreground mt-2 text-[13px]">
            {total} competências ·{' '}
            {snapshot.input.scenario === 'TR' ? 'TR + 3% ao ano' : 'IPCA comparativo'} · valores em
            R$
            {snapshot.result.saldoRetidoCents !== '0' && ' · inclui saldo retido'}
          </p>
        </div>
        <ul className="text-muted-foreground flex flex-col gap-1.5 text-[12px]">
          {SERIES.map((serie) => (
            <li key={serie.key} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-[3px] w-4 rounded-full"
                style={
                  serie.dashed
                    ? {
                        height: 0,
                        borderTop: `3px ${serie.key === 'depositos' ? 'dotted' : 'dashed'} ${serie.color}`,
                      }
                    : { background: serie.color }
                }
              />
              {serie.label}
            </li>
          ))}
        </ul>
      </div>

      <div
        className="relative h-[210px] w-full touch-pan-y select-none"
        role="img"
        aria-label={`Evolução mensal do saldo simulado em ${total} competências. Os mesmos valores estão na tabela abaixo.`}
        onPointerLeave={() => setActive(null)}
        onPointerDown={trackPointer}
        onPointerMove={trackPointer}
      >
        <div className="absolute inset-0 flex flex-col justify-between pb-5 pl-10">
          {[1, 0.5, 0].map((share) => (
            <div key={share} className="relative h-0">
              <span className="text-muted-foreground absolute -top-1.5 -left-10 w-9 text-right text-[12px]">
                {compact.format(max * share)}
              </span>
              <div className="border-border h-px border-t" />
            </div>
          ))}
        </div>

        <svg
          ref={plotSvg}
          className="absolute inset-y-0 right-0 bottom-5 left-10 h-[calc(100%-1.25rem)] w-[calc(100%-2.5rem)]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.07" />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${areaId})`} />
          {SERIES.map((serie) => (
            <path
              key={serie.key}
              d={paths[serie.key]}
              fill="none"
              stroke={serie.color}
              strokeWidth={serie.key === 'tr' ? 2.5 : 1.5}
              strokeDasharray={
                serie.dashed ? (serie.key === 'depositos' ? '2 3' : '5 4') : undefined
              }
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
          ))}
          {active !== null && (
            <line
              x1={activeX}
              x2={activeX}
              y1="0"
              y2="100"
              stroke="var(--input)"
              strokeDasharray="2 3"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {total > 0 && (
          <span
            aria-hidden="true"
            className="bg-foreground absolute size-2 rounded-full"
            style={{
              left: `calc(2.5rem + (100% - 2.5rem) * 1 - 8px)`,
              top: `calc((100% - 1.25rem) * ${yAt(cents(data[total - 1]!, 'tr'), max) / 100} - 4px)`,
            }}
          />
        )}

        {active !== null &&
          SERIES.map((serie) => (
            <span
              key={serie.key}
              aria-hidden="true"
              className="border-background pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{
                background: serie.color,
                left: `calc(2.5rem + (100% - 2.5rem) * ${activeX / 100})`,
                top: `calc((100% - 1.25rem) * ${yAt(cents(data[active]!, serie.key), max) / 100})`,
              }}
            />
          ))}

        <div
          className="text-muted-foreground pointer-events-none absolute bottom-0 left-10 flex w-[calc(100%-2.5rem)] justify-between text-[12px]"
          aria-hidden="true"
        >
          <span>{FormatAdapter.civilDate(data[0]!.competencia)}</span>
          <span>{FormatAdapter.civilDate(data[total - 1]!.competencia)}</span>
        </div>

        {active !== null && (
          <span
            aria-hidden="true"
            className="text-foreground num pointer-events-none absolute bottom-0 text-[12px] font-semibold"
            style={{
              left: `calc(2.5rem + (100% - 2.5rem) * ${activeX / 100})`,
              transform:
                activeX > 85
                  ? 'translateX(-100%)'
                  : activeX < 15
                    ? 'translateX(0)'
                    : 'translateX(-50%)',
            }}
          >
            {FormatAdapter.civilDate(data[active]!.competencia)}
          </span>
        )}

        {active !== null && (
          <div
            className="bg-foreground text-background pointer-events-none absolute top-1 z-10 w-max max-w-[240px] rounded-lg px-2.5 py-1.5 text-[12px] shadow-lg"
            style={{
              left: `calc(2.5rem + (100% - 2.5rem) * ${activeX / 100})`,
              // Flip to the other side near the right edge so the box never overflows.
              transform: activeX > 60 ? 'translateX(calc(-100% - 8px))' : 'translateX(8px)',
            }}
          >
            <p className="font-medium whitespace-nowrap">
              {FormatAdapter.civilDate(shown!.competencia)}
            </p>
            {SERIES.map((serie) => (
              <p key={serie.key} className="num whitespace-nowrap opacity-90">
                {serie.label}: {FormatAdapter.centsToBRL(shown![FIELD[serie.key]])}
              </p>
            ))}
          </div>
        )}
      </div>

      <TableToggle snapshot={snapshot} />
    </section>
  );
}

function TableToggle({ snapshot }: { snapshot: SimulationSnapshot }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-primary mt-1 h-auto min-h-10 px-0 text-[13px] hover:bg-transparent print:hidden"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? 'Ocultar dados mensais' : 'Ver dados mensais em tabela'}
      </Button>
      {open && (
        <div
          className="mt-1 max-h-[320px] overflow-auto"
          tabIndex={0}
          role="region"
          aria-label="Dados mensais do gráfico"
        >
          <table className="w-full border-collapse text-left text-[13px]">
            <caption className="text-muted-foreground pb-2 text-left">
              Valores acumulados por competência
            </caption>
            <thead>
              <tr>
                {['Competência', 'Depósitos', 'TR + 3% a.a.', 'IPCA'].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="bg-muted border-border sticky top-0 border-b px-2 py-2 font-medium"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snapshot.timeline.map((point) => (
                <tr key={point.competencia}>
                  <th
                    scope="row"
                    className="border-border border-b px-2 py-2 font-normal whitespace-nowrap"
                  >
                    {FormatAdapter.civilDate(point.competencia)}
                  </th>
                  {(['depositosCents', 'trCents', 'ipcaCents'] as const).map((key) => (
                    <td
                      key={key}
                      className="num border-border border-b px-2 py-2 whitespace-nowrap"
                    >
                      {FormatAdapter.centsToBRL(point[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
