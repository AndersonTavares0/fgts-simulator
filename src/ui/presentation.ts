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
