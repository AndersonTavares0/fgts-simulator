import Decimal from 'decimal.js';
import { FormatAdapter } from '../adapters/FormatAdapter';
import { TipoContrato, TipoRescisao } from '../core/types';
import type { SimulationInput } from '../application/Simulation';

export interface Draft {
  salary: string;
  startDate: string;
  endDate: string;
  contractType: TipoContrato;
  terminationType: TipoRescisao;
  include13: boolean;
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
  includeVacation: false,
  thirteenthMonths: '0',
  vacationMonths: '0',
  birthdayWithdrawal: false,
  trMonthly: '0,08',
  ipcaMonthly: '0,4',
  scenario: 'TR',
};

export const exampleDraft: Draft = {
  ...emptyDraft,
  salary: '3.000,00',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
};

export function draftFromInput(input: SimulationInput): Draft {
  return {
    salary: new Decimal(input.salaryCents).div(100).toFixed(2).replace('.', ','),
    startDate: input.startDate,
    endDate: input.endDate,
    contractType: input.contractType,
    terminationType: input.terminationType,
    include13: input.include13,
    includeVacation: input.includeVacation,
    thirteenthMonths: String(input.thirteenthMonths),
    vacationMonths: String(input.vacationMonths),
    birthdayWithdrawal: input.birthdayWithdrawal,
    trMonthly: FormatAdapter.rateToPercent(input.trMonthly),
    ipcaMonthly: FormatAdapter.rateToPercent(input.ipcaMonthly),
    scenario: input.scenario,
  };
}

export function toInput(
  draft: Draft,
  consentProcessing: boolean,
): { input: SimulationInput } | { errors: FieldErrors } {
  const errors: FieldErrors = {};
  const salary = FormatAdapter.parseMonetaryInput(draft.salary);
  if (!salary) errors.salary = 'Informe um salário maior que zero, como 2.500,00.';
  const start = FormatAdapter.parseDate(draft.startDate);
  const end = FormatAdapter.parseDate(draft.endDate);
  if (!start) errors.startDate = 'Informe uma data de início válida.';
  if (!end) errors.endDate = 'Informe uma data final válida.';
  if (start && end && draft.endDate < draft.startDate)
    errors.endDate = 'A data final deve ser igual ou posterior ao início.';
  const tr = FormatAdapter.rateFromPercent(draft.trMonthly);
  const ipca = FormatAdapter.rateFromPercent(draft.ipcaMonthly);
  if (tr === null || new Decimal(tr).isNegative() || new Decimal(tr).gt('0.1'))
    errors.trMonthly = 'Informe uma TR entre 0% e 10% ao mês.';
  if (ipca === null || new Decimal(ipca).lte(-1) || new Decimal(ipca).gt('0.1'))
    errors.ipcaMonthly = 'Informe um IPCA maior que −100% e até 10% ao mês.';
  for (const [toggle, field] of [
    [draft.include13, 'thirteenthMonths'],
    [draft.includeVacation, 'vacationMonths'],
  ] as const) {
    if (toggle && !/^(?:[0-9]|1[0-2])$/.test(draft[field]))
      errors[field] = 'Informe um número inteiro de avos entre 0 e 12.';
  }
  if (draft.terminationType === TipoRescisao.DOENCA_GRAVE && !consentProcessing)
    errors.consentProcessing =
      'Autorize o uso desta informação sensível para calcular ou escolha outro motivo.';

  if (Object.keys(errors).length || !salary || tr === null || ipca === null) return { errors };
  return {
    input: {
      salaryCents: salary.decimal.toFixed(0),
      startDate: draft.startDate,
      endDate: draft.endDate,
      terminationType: draft.terminationType,
      contractType: draft.contractType,
      include13: draft.include13,
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
