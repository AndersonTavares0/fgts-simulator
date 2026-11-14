import Decimal from 'decimal.js';
import { FormatAdapter } from '../adapters/FormatAdapter';
import { TipoContrato, TipoRescisao } from '../core/types';
import { parseCivilDate } from '../core/CivilDate';
import { LIMITES } from '../core/limites';
import type { SimulationInput } from '../application/Simulation';

export interface Draft {
  salary: string;
  startDate: string;
  endDate: string;
  contractType: TipoContrato;
  terminationType: TipoRescisao;
  include13: boolean;
  thirteenthMode: 'estimate' | 'actual';
  thirteenthEntries: Array<{ competencia: string; remuneracao: string }>;
  includeVacation: boolean;
  thirteenthMonths: string;
  vacationMonths: string;
  birthdayWithdrawal: boolean;
  trMonthly: string;
  ipcaMonthly: string;
  scenario: 'TR' | 'IPCA';
}

export type FieldErrors = Partial<Record<keyof Draft | 'consentProcessing' | 'form', string>>;

export const emptyDraft: Draft = {
  salary: '',
  startDate: '',
  endDate: '',
  contractType: TipoContrato.CLT_PADRAO,
  terminationType: TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA,
  include13: false,
  thirteenthMode: 'estimate',
  thirteenthEntries: [],
  includeVacation: false,
  thirteenthMonths: '0',
  vacationMonths: '0',
  birthdayWithdrawal: false,
  trMonthly: '0,16',
  ipcaMonthly: '0,37',
  scenario: 'TR',
};

/** Data de hoje (calendário local) no formato AAAA-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Formulário novo: "Saiu em" já vem com a data de hoje; a pessoa escolhe a dela. */
export function initialDraft(): Draft {
  return { ...emptyDraft, endDate: todayIso() };
}

/**
 * Antes de 01/02/1991 a correção do FGTS não era a TR (Lei 8.177/1991), e quem optou antes de
 * 22/09/1971 pode ter juros progressivos de 3% a 6% (Lei 5.107/1966; Lei 8.036/1990, art. 13).
 */
export const isLegacyStart = (startDate: string): boolean =>
  startDate >= LIMITES.inicioFgts && startDate < '1991-02-01';

function isSalaryTooHigh(value: string): boolean {
  const text = value.trim().replace(/^R\$\s*/, '');
  if (value.length > 32 || !/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text)) return false;
  return new Decimal(text.replace(/\./g, '').replace(',', '.')).gt(
    Number(LIMITES.salarioMaxCentavos) / 100,
  );
}

/**
 * Máscara de dinheiro ao digitar: separa os milhares com ponto e aceita vírgula e até duas casas
 * ("1559" vira "1.559", "1559,5" vira "1.559,5"). Pontos digitados são ignorados porque a máscara
 * já os coloca.
 */
export function formatMoneyInput(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, '');
  const comma = cleaned.indexOf(',');
  const integerPart = (comma < 0 ? cleaned : cleaned.slice(0, comma)).replace(/^0+(?=\d)/, '');
  const decimals =
    comma < 0
      ? null
      : cleaned
          .slice(comma + 1)
          .replace(/,/g, '')
          .slice(0, 2);
  const grouped = integerPart.slice(0, 9).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decimals === null ? grouped : `${grouped || '0'},${decimals}`;
}

/** Ao sair do campo completa as casas: "1.559" vira "1.559,00" e "1.559,5" vira "1.559,50". */
export function padMoneyInput(value: string): string {
  if (!value.trim()) return '';
  const masked = formatMoneyInput(value);
  const [integerPart = '0', decimals = ''] = masked.split(',');
  return `${integerPart || '0'},${decimals.padEnd(2, '0')}`;
}

/** Última data de saída aceita para uma data de entrada, no formato AAAA-MM-DD. */
export function maxEndDate(startDate: string): string | null {
  const start = parseCivilDate(startDate);
  if (!start) return null;
  const limit = new Date(start);
  limit.setUTCFullYear(start.getUTCFullYear() + LIMITES.anosMax);
  if (limit.getUTCMonth() !== start.getUTCMonth()) limit.setUTCDate(0);
  return limit.toISOString().slice(0, 10);
}

export const exampleDraft: Draft = {
  ...emptyDraft,
  salary: '3.000,00',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
};

export function draftFromInput(input: SimulationInput): Draft {
  return {
    salary: padMoneyInput(new Decimal(input.salaryCents).div(100).toFixed(2).replace('.', ',')),
    startDate: input.startDate,
    endDate: input.endDate,
    contractType: input.contractType,
    terminationType: input.terminationType,
    include13: input.include13,
    thirteenthMode: input.thirteenthMode ?? 'estimate',
    thirteenthEntries: (input.thirteenthEntries ?? []).map((entry) => ({
      competencia: entry.competencia,
      remuneracao: padMoneyInput(
        new Decimal(entry.remuneracaoCents).div(100).toFixed(2).replace('.', ','),
      ),
    })),
    includeVacation: input.includeVacation,
    thirteenthMonths: String(input.thirteenthMonths),
    vacationMonths: String(input.vacationMonths),
    birthdayWithdrawal: input.birthdayWithdrawal,
    trMonthly: FormatAdapter.rateToPercent(input.trMonthly),
    ipcaMonthly: FormatAdapter.rateToPercent(input.ipcaMonthly),
    scenario: input.scenario,
  };
}

function parseThirteenthAmount(value: string): bigint | null {
  if (value.length > 32) return null;
  const text = value.trim().replace(/^R\$\s*/, '');
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text)) return null;
  const cents = new Decimal(text.replace(/\./g, '').replace(',', '.')).times(100);
  if (cents.gt(Number.MAX_SAFE_INTEGER)) return null;
  return BigInt(cents.toFixed(0));
}

export function toInput(
  draft: Draft,
  consentProcessing: boolean,
): { input: SimulationInput } | { errors: FieldErrors } {
  const errors: FieldErrors = {};
  const salary = FormatAdapter.parseMonetaryInput(draft.salary);
  if (!salary)
    errors.salary = isSalaryTooHigh(draft.salary)
      ? `Valor muito alto. O máximo é ${FormatAdapter.centsToBRL(String(LIMITES.salarioMaxCentavos))}.`
      : 'Digite seu salário, por exemplo 2.500,00.';
  const start = FormatAdapter.parseDate(draft.startDate);
  const end = FormatAdapter.parseDate(draft.endDate);
  if (!start) errors.startDate = 'Escolha a data em que você começou.';
  else if (draft.startDate < LIMITES.inicioFgts)
    errors.startDate = `O FGTS começou em ${FormatAdapter.civilDate(LIMITES.inicioFgts).slice(6)}. Escolha uma data a partir de ${FormatAdapter.civilDate(LIMITES.inicioFgts)}.`;
  if (!end) errors.endDate = 'Escolha a data em que você saiu.';
  if (start && end && draft.endDate <= draft.startDate)
    errors.endDate = 'A saída precisa ser depois da data em que você começou.';
  else if (start && end && draft.startDate >= LIMITES.inicioFgts) {
    const limit = maxEndDate(draft.startDate);
    if (limit && draft.endDate > limit)
      errors.endDate = `O máximo é ${LIMITES.anosMax} anos de trabalho. Escolha uma saída até ${FormatAdapter.civilDate(limit)}.`;
  }
  const tr = FormatAdapter.rateFromPercent(draft.trMonthly);
  const ipca = FormatAdapter.rateFromPercent(draft.ipcaMonthly);
  if (tr === null || new Decimal(tr).isNegative() || new Decimal(tr).gt('0.1'))
    errors.trMonthly = 'Use uma TR entre 0% e 10% ao mês.';
  if (ipca === null || new Decimal(ipca).lte(-1) || new Decimal(ipca).gt('0.1'))
    errors.ipcaMonthly = 'Use um IPCA acima de −100% e até 10% ao mês.';
  for (const [toggle, field] of [
    [draft.include13, 'thirteenthMonths'],
    [draft.includeVacation, 'vacationMonths'],
  ] as const) {
    if (toggle && !/^(?:[0-9]|1[0-2])$/.test(draft[field]))
      errors[field] = 'Use um número de 0 a 12.';
  }
  const entries = new Map<string, bigint>();
  if (draft.thirteenthMode === 'actual') {
    for (const entry of draft.thirteenthEntries) {
      const amount = parseThirteenthAmount(entry.remuneracao);
      if (
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(entry.competencia) ||
        (start && entry.competencia < draft.startDate.slice(0, 7)) ||
        (end && entry.competencia > draft.endDate.slice(0, 7))
      ) {
        errors.thirteenthEntries = 'Use meses entre a entrada e a saída.';
      } else if (amount === null) {
        errors.thirteenthEntries = 'Confira o valor de cada parcela do 13º.';
      } else {
        const total = (entries.get(entry.competencia) ?? 0n) + amount;
        if (total > BigInt(Number.MAX_SAFE_INTEGER))
          errors.thirteenthEntries = 'A soma das parcelas da competência é muito alta.';
        entries.set(entry.competencia, total);
      }
    }
  }
  if (draft.terminationType === TipoRescisao.DOENCA_GRAVE && !consentProcessing)
    errors.consentProcessing = 'Marque a caixinha para continuar, ou escolha outra situação.';

  if (Object.keys(errors).length || !salary || tr === null || ipca === null) return { errors };
  return {
    input: {
      salaryCents: salary.decimal.toFixed(0),
      startDate: draft.startDate,
      endDate: draft.endDate,
      terminationType: draft.terminationType,
      contractType: draft.contractType,
      include13: draft.include13,
      thirteenthMode: draft.thirteenthMode,
      thirteenthEntries: [...entries]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([competencia, remuneracaoCents]) => ({
          competencia,
          remuneracaoCents: remuneracaoCents.toString(),
        })),
      includeVacation: draft.includeVacation,
      thirteenthMonths: draft.include13 ? Number(draft.thirteenthMonths) : 0,
      vacationMonths: draft.includeVacation ? Number(draft.vacationMonths) : 0,
      birthdayWithdrawal: draft.birthdayWithdrawal,
      trMonthly: tr,
      ipcaMonthly: ipca,
      scenario: draft.scenario,
    },
  };
}
