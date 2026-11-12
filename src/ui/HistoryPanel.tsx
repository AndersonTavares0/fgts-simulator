import type { SimulationSnapshot } from '../application/Simulation';
import { FormatAdapter } from '../adapters/FormatAdapter';
import { comparisonRows } from './presentation';
import { Button, buttonVariants } from './components/ui/button';
import { Checkbox } from './components/ui/checkbox';
import { Label } from './components/ui/label';

interface Props {
  history: SimulationSnapshot[];
  selected: string[];
  status: string;
  onToggle: (id: string) => void;
  onReload: (snapshot: SimulationSnapshot) => void;
  onDelete: (snapshot: SimulationSnapshot) => void;
  onClear: () => void;
  onRefresh: () => void;
}

function timestamp(snapshot: SimulationSnapshot): string {
  return new Date(snapshot.createdAt).toLocaleString('pt-BR');
}

export function HistoryPanel({
  history,
  selected,
  status,
  onToggle,
  onReload,
  onDelete,
  onClear,
  onRefresh,
}: Props) {
  const [firstId, secondId] = selected;
  const first = history.find((snapshot) => snapshot.id === firstId);
  const second = history.find((snapshot) => snapshot.id === secondId);

  return (
    <section aria-labelledby="history-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            id="history-title"
            className="text-[30px] leading-[1.1] font-semibold tracking-[-0.025em] md:text-[38px]"
          >
            Resultados
          </h1>
          <p className="text-muted-foreground mt-3 text-[14px] leading-relaxed">
            Guardados só neste aparelho. Marque dois para comparar.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onRefresh}>
            Atualizar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onClear}
            disabled={history.length === 0}
          >
            Apagar tudo
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground mt-5 text-[13px]" role="status">
        {status}
      </p>

      {history.length === 0 ? (
        <div className="border-border mt-6 border-t pt-8">
          <p className="text-[16px] font-medium">Nada guardado ainda</p>
          <p className="text-muted-foreground mt-2 max-w-[46ch] text-[14px] leading-relaxed">
            Calcule e toque em “Guardar” para ver depois neste aparelho.
          </p>
          <a href="#simular" className={buttonVariants({ className: 'mt-5' })}>
            Calcular agora
          </a>
        </div>
      ) : (
        <ul className="border-border mt-4 divide-y divide-border border-y">
          {history.map((snapshot) => {
            const checked = selected.includes(snapshot.id);
            return (
              <li
                key={snapshot.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <Checkbox
                    id={`compare-${snapshot.id}`}
                    className="mt-1"
                    checked={checked}
                    disabled={selected.length === 2 && !checked}
                    onCheckedChange={() => onToggle(snapshot.id)}
                  />
                  <Label
                    htmlFor={`compare-${snapshot.id}`}
                    className="grid gap-1 text-[16px] font-normal"
                  >
                    <span className="num font-medium">
                      {FormatAdapter.centsToBRL(snapshot.result.totalCents)}
                    </span>
                    <span className="text-muted-foreground text-[13px]">
                      {FormatAdapter.civilDate(snapshot.input.startDate)} a{' '}
                      {FormatAdapter.civilDate(snapshot.input.endDate)} ·{' '}
                      {snapshot.input.scenario === 'TR' ? 'TR + 3% ao ano' : 'IPCA comparativo'}
                    </span>
                    <span className="text-muted-foreground text-[11.5px]">
                      {timestamp(snapshot)} · Regra {snapshot.calculationVersion}
                    </span>
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onReload(snapshot)}
                  >
                    Reabrir
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    aria-label={`Excluir simulação de ${timestamp(snapshot)}`}
                    onClick={() => onDelete(snapshot)}
                  >
                    Excluir
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {first && second && (
        <div className="mt-12">
          <h2 className="text-[18px] font-semibold tracking-[-0.01em]">Comparação</h2>
          <p className="text-muted-foreground mt-2 mb-4 text-[14px] leading-relaxed">
            Os valores são os originais. O que mudou entre um resultado e outro aparece destacado.
          </p>
          <div
            className="border-border overflow-auto rounded-lg border"
            tabIndex={0}
            role="region"
            aria-label="Comparação das simulações selecionadas"
          >
            <table className="w-full min-w-[660px] border-collapse text-left text-[13px]">
              <caption className="sr-only">
                Entradas originais e diferenças entre a segunda e a primeira seleção
              </caption>
              <thead>
                <tr>
                  {[
                    'Entrada ou parcela',
                    `1ª: ${timestamp(first)}`,
                    `2ª: ${timestamp(second)}`,
                    'Diferença (2ª − 1ª)',
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="bg-muted border-border border-b px-3 py-2.5 font-medium"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows(first, second).map(([label, a, b, delta]) => (
                  <tr key={label} className={a !== b ? 'bg-muted/60' : undefined}>
                    <th scope="row" className="border-border border-b px-3 py-2.5 font-normal">
                      {label}
                    </th>
                    <td className="num border-border border-b px-3 py-2.5">{a}</td>
                    <td className="num border-border border-b px-3 py-2.5">{b}</td>
                    <td className="num border-border border-b px-3 py-2.5">{delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="help mt-8">
        Sem sincronização ou backup. Limpar os dados do navegador pode apagar o histórico. PDFs já
        baixados não são excluídos.
      </p>
    </section>
  );
}
