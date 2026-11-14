import Decimal from 'decimal.js';
import { FormatAdapter } from '../adapters/FormatAdapter';
import { TipoContrato } from '../core/types';
import type { SimulationInput, SimulationSnapshot } from '../application/Simulation';

const contractLabels: Record<TipoContrato, string> = {
  [TipoContrato.CLT_PADRAO]: 'CLT padrão',
  [TipoContrato.APRENDIZ]: 'Aprendiz',
  [TipoContrato.DOMESTICO]: 'Doméstico',
};

export const resultLabels: Record<keyof SimulationSnapshot['result'], string> = {
  saldoBaseCents: 'Saldo acumulado simulado',
  depositosCents: 'Depósitos estimados',
  rendimentoCents: 'Rendimento estimado',
  saldoDisponivelCents: 'FGTS disponível estimado',
  saldoRetidoCents: 'FGTS retido estimado',
  multaCents: 'Multa / indenização estimada',
  decimoTerceiroCents: '13º proporcional',
  feriasCents: 'Férias proporcionais + 1/3',
  totalCents: 'Total estimado das parcelas',
};

export function inputRows(input: SimulationInput): Array<[string, string]> {
  return [
    ['Salário bruto mensal', FormatAdapter.centsToBRL(input.salaryCents)],
    ['Início do vínculo', FormatAdapter.civilDate(input.startDate)],
    ['Fim do período', FormatAdapter.civilDate(input.endDate)],
    ['Contrato', contractLabels[input.contractType]],
    ['Motivo', FormatAdapter.getRescisaoLabel(input.terminationType)],
    [
      'FGTS sobre 13º',
      input.thirteenthMode === 'actual'
        ? 'Remunerações informadas por competência'
        : input.thirteenthMode === 'estimate'
          ? 'Estimativa pelo salário fixo'
          : 'Histórico anterior: sem dados de FGTS sobre 13º',
    ],
    [
      'Remunerações de 13º informadas',
      input.thirteenthMode === 'actual'
        ? (input.thirteenthEntries ?? [])
            .map(
              (entry) =>
                `${FormatAdapter.civilDate(entry.competencia)}: ${FormatAdapter.centsToBRL(entry.remuneracaoCents)}`,
            )
            .join('; ') || 'Nenhuma informada'
        : 'Não informadas',
    ],
    [
      'Limite das remunerações informadas',
      'Não comprovam depósitos nem reproduzem índices históricos ou extrato.',
    ],
    [
      '13º proporcional',
      input.include13 ? `${input.thirteenthMonths} avos ainda devidos` : 'Não incluído',
    ],
    [
      'Férias proporcionais',
      input.includeVacation ? `${input.vacationMonths} avos ainda devidos` : 'Não incluídas',
    ],
    ['Saque-aniversário', input.birthdayWithdrawal ? 'Sim' : 'Não'],
    ['TR estimada mensal', `${FormatAdapter.rateToPercent(input.trMonthly)}%`],
    ['IPCA estimado mensal', `${FormatAdapter.rateToPercent(input.ipcaMonthly)}%`],
    ['Cenário selecionado', input.scenario === 'TR' ? 'TR + 3% ao ano' : 'IPCA (comparativo)'],
  ];
}

/** Legenda do total: o saldo retido nunca entra no valor estimado. */
export function totalCaption(
  result: Pick<
    SimulationSnapshot['result'],
    | 'saldoRetidoCents'
    | 'saldoDisponivelCents'
    | 'multaCents'
    | 'decimoTerceiroCents'
    | 'feriasCents'
  >,
): string {
  const temVerbas =
    result.multaCents !== '0' || result.decimoTerceiroCents !== '0' || result.feriasCents !== '0';
  if (!temVerbas) return 'Saldo do FGTS para saque.';
  if (result.saldoDisponivelCents === '0') {
    return 'Verbas rescisórias; saldo retido no FGTS.';
  }
  return result.saldoRetidoCents !== '0'
    ? 'Disponível para saque + verbas da rescisão.'
    : 'Saldo do FGTS + verbas da rescisão.';
}

export function comparisonRows(
  first: SimulationSnapshot,
  second: SimulationSnapshot,
): Array<[string, string, string, string]> {
  const rows: Array<[string, string, string, string]> = [
    [
      'Aplicativo',
      first.appVersion,
      second.appVersion,
      first.appVersion === second.appVersion ? 'Igual' : 'Versões diferentes',
    ],
    [
      'Regra de cálculo',
      first.calculationVersion,
      second.calculationVersion,
      first.calculationVersion === second.calculationVersion ? 'Igual' : 'Versões diferentes',
    ],
  ];
  const secondInputs = inputRows(second.input);
  inputRows(first.input).forEach(([label, value], index) => {
    const other = secondInputs[index]?.[1] ?? '';
    rows.push([label, value, other, value === other ? 'Igual' : 'Alterado']);
  });
  for (const key of Object.keys(resultLabels) as Array<keyof SimulationSnapshot['result']>) {
    const delta = new Decimal(second.result[key]).minus(first.result[key]);
    rows.push([
      resultLabels[key],
      FormatAdapter.centsToBRL(first.result[key]),
      FormatAdapter.centsToBRL(second.result[key]),
      `${delta.isPositive() ? '+' : ''}${FormatAdapter.centsToBRL(delta.toFixed(0))}`,
    ]);
  }
  return rows;
}

type ResultKey = keyof SimulationSnapshot['result'];

/** De onde vem o total: mesmas partes, rótulos e explicações na tela e no PDF. */
export const compositionParts: Array<{ key: ResultKey; label: string; desc: string }> = [
  {
    key: 'saldoDisponivelCents',
    label: 'FGTS disponível',
    desc: 'Dinheiro do FGTS que você pode sacar.',
  },
  {
    key: 'multaCents',
    label: 'Multa rescisória',
    desc: 'Paga pela empresa quando o motivo da saída dá direito.',
  },
  {
    key: 'decimoTerceiroCents',
    label: '13º proporcional',
    desc: 'Parte do 13º que ainda não foi paga.',
  },
  { key: 'feriasCents', label: 'Férias + 1/3', desc: 'Férias proporcionais mais um terço.' },
];

/** Os seis passos da conta em linguagem simples, na ordem em que acontecem. */
export function breakdownSteps(
  snapshot: SimulationSnapshot,
): Array<{ key: ResultKey; label: string; hint: string }> {
  const { input, result } = snapshot;
  const rate = input.contractType === TipoContrato.APRENDIZ ? '2%' : '8%';
  const retained = result.saldoRetidoCents !== '0';
  return [
    { key: 'depositosCents', label: 'A empresa depositou', hint: `${rate} do salário por mês.` },
    {
      key: 'rendimentoCents',
      label: 'O saldo rendeu',
      hint: input.scenario === 'TR' ? 'TR + 3% ao ano.' : 'Referência pelo IPCA.',
    },
    {
      key: 'saldoBaseCents',
      label: 'Saldo total no FGTS',
      hint: retained
        ? `${FormatAdapter.centsToBRL(result.saldoRetidoCents)} ficam retidos.`
        : 'Depósitos + rendimento.',
    },
    {
      key: 'multaCents',
      label: 'Multa rescisória',
      hint:
        input.contractType === TipoContrato.DOMESTICO ? 'Reserva de 3,2%.' : 'Paga pela empresa.',
    },
    {
      key: 'decimoTerceiroCents',
      label: '13º proporcional',
      hint: input.include13 ? `${input.thirteenthMonths} avos a receber.` : 'Não incluído.',
    },
    {
      key: 'feriasCents',
      label: 'Férias + 1/3',
      hint: input.includeVacation ? `${input.vacationMonths} avos a receber.` : 'Não incluídas.',
    },
  ];
}
