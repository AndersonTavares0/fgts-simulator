import Decimal from 'decimal.js';
import packageInfo from '../../package.json';
import { parseCivilDate } from '../core/CivilDate';
import { FGTSCalculatorService } from '../core/services/FGTSCalculatorService';
import { Money, TipoContrato, TipoRescisao } from '../core/types';

export type SimulationInput = {
  salaryCents: string;
  startDate: string;
  endDate: string;
  terminationType: TipoRescisao;
  contractType: TipoContrato;
  include13: boolean;
  includeVacation: boolean;
  thirteenthMonths: number;
  vacationMonths: number;
  birthdayWithdrawal: boolean;
  trMonthly: string;
  ipcaMonthly: string;
  scenario: 'TR' | 'IPCA';
};

export interface SimulationSnapshot {
  formatVersion: 1;
  calculationVersion: string;
  appVersion: string;
  id: string;
  createdAt: string;
  input: SimulationInput;
  result: {
    saldoBaseCents: string;
    depositosCents: string;
    /** Pode ser negativo no cenário comparativo de deflação. */
    rendimentoCents: string;
    saldoDisponivelCents: string;
    saldoRetidoCents: string;
    multaCents: string;
    decimoTerceiroCents: string;
    feriasCents: string;
    totalCents: string;
  };
  timeline: Array<{
    competencia: string;
    depositosCents: string;
    trCents: string;
    ipcaCents: string;
  }>;
  assumptions: string[];
  warnings: string[];
}

const INPUT_KEYS = [
  'salaryCents',
  'startDate',
  'endDate',
  'terminationType',
  'contractType',
  'include13',
  'includeVacation',
  'thirteenthMonths',
  'vacationMonths',
  'birthdayWithdrawal',
  'trMonthly',
  'ipcaMonthly',
  'scenario',
] as const;
const RESULT_KEYS = [
  'saldoBaseCents',
  'depositosCents',
  'rendimentoCents',
  'saldoDisponivelCents',
  'saldoRetidoCents',
  'multaCents',
  'decimoTerceiroCents',
  'feriasCents',
  'totalCents',
] as const;
const MAX_CENTS = BigInt(Number.MAX_SAFE_INTEGER);
const MAX_POINTS = 602;
const DAY_MS = 86_400_000;
const CALCULATION_VERSION = '2.1.0';

function hasKeys(value: object, keys: readonly string[]): boolean {
  return (
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key))
  );
}

function isCents(value: unknown, signed = false): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 17 &&
    (signed ? /^(?:0|-?[1-9]\d*)$/ : /^(?:0|[1-9]\d*)$/).test(value) &&
    BigInt(value) <= MAX_CENTS &&
    BigInt(value) >= (signed ? -MAX_CENTS : 0n)
  );
}

function validateInput(candidate: unknown): asserts candidate is SimulationInput {
  if (
    typeof candidate !== 'object' ||
    candidate === null ||
    Array.isArray(candidate) ||
    !hasKeys(candidate, INPUT_KEYS)
  )
    throw new Error('Entradas da simulação inválidas.');
  const value = candidate as Partial<SimulationInput>;
  if (
    !isCents(value.salaryCents) ||
    BigInt(value.salaryCents) <= 0n ||
    BigInt(value.salaryCents) > 100_000_000n
  ) {
    throw new Error('Salário deve ser informado em centavos, entre R$ 0,01 e R$ 1.000.000,00.');
  }
  const start = typeof value.startDate === 'string' ? parseCivilDate(value.startDate) : null;
  const end = typeof value.endDate === 'string' ? parseCivilDate(value.endDate) : null;
  if (!start || !end) throw new Error('Informe datas civis válidas no formato AAAA-MM-DD.');
  if (end <= start) throw new Error('Data de término deve ser posterior à data de início.');
  const limit = new Date(start);
  limit.setUTCFullYear(start.getUTCFullYear() + 50);
  if (limit.getUTCMonth() !== start.getUTCMonth()) limit.setUTCDate(0);
  if (end > limit) throw new Error('Período máximo permitido: 50 anos.');
  if (
    !Object.values(TipoRescisao).some((tipo) => tipo === value.terminationType) ||
    !Object.values(TipoContrato).some((tipo) => tipo === value.contractType)
  ) {
    throw new Error('Modalidade de contrato ou de saída inválida.');
  }
  if (
    typeof value.include13 !== 'boolean' ||
    typeof value.includeVacation !== 'boolean' ||
    typeof value.birthdayWithdrawal !== 'boolean'
  )
    throw new Error('Opções da simulação inválidas.');
  for (const key of ['thirteenthMonths', 'vacationMonths'] as const) {
    const avos = value[key];
    if (typeof avos !== 'number' || !Number.isInteger(avos) || avos < 0 || avos > 12) {
      throw new Error('Avos pendentes devem ser inteiros entre 0 e 12.');
    }
  }
  for (const key of ['trMonthly', 'ipcaMonthly'] as const) {
    const text = value[key];
    if (typeof text !== 'string' || text.length > 24 || !/^-?\d+(?:\.\d+)?$/.test(text)) {
      throw new Error('Índices devem ser decimais fracionários válidos, sem expoente.');
    }
    const rate = new Decimal(text);
    if (
      !rate.isFinite() ||
      rate.greaterThan('0.1') ||
      (key === 'trMonthly' ? rate.lessThan(0) : rate.lessThanOrEqualTo(-1))
    ) {
      throw new Error(
        'TR deve estar entre 0 e 10% ao mês; IPCA deve ser maior que -100% e até 10% ao mês.',
      );
    }
  }
  if (value.scenario !== 'TR' && value.scenario !== 'IPCA')
    throw new Error('Selecione o cenário TR ou IPCA.');
}

/** Frações por competência: dias inclusivos do vínculo / dias reais do mês. */
function calendarPeriods(
  startText: string,
  endText: string,
): Array<{ competencia: string; fraction: Decimal }> {
  const start = parseCivilDate(startText)!;
  const end = parseCivilDate(endText)!;
  const month = new Date(start);
  month.setUTCDate(1);
  const periods: Array<{ competencia: string; fraction: Decimal }> = [];
  while (month <= end) {
    const next = new Date(month);
    next.setUTCMonth(next.getUTCMonth() + 1);
    const firstDay = Math.max(month.getTime(), start.getTime());
    const lastDay = Math.min(next.getTime() - DAY_MS, end.getTime());
    const days = (lastDay - firstDay) / DAY_MS + 1;
    const daysInMonth = (next.getTime() - month.getTime()) / DAY_MS;
    periods.push({
      competencia: month.toISOString().slice(0, 7),
      fraction: new Decimal(days).dividedBy(daysInMonth),
    });
    month.setTime(next.getTime());
  }
  return periods;
}

function cents(value: Money): string {
  const text = value.decimal.toFixed(0);
  if (!isCents(text, true))
    throw new Error('Projeção excede o limite técnico. Reduza o período ou os índices.');
  return text;
}

/** randomUUID exige contexto seguro (HTTPS/localhost); http://<ip> cai no fallback. */
function simulationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function simulate(input: SimulationInput): SimulationSnapshot {
  validateInput(input);
  const periods = calendarPeriods(input.startDate, input.endDate);
  const fractions = periods.map((period) => period.fraction);
  const months = fractions.reduce((sum, fraction) => sum.plus(fraction), new Decimal(0));
  const result = FGTSCalculatorService.calcularRescisao({
    salarioBruto: Money.fromCents(input.salaryCents),
    mesesTrabalhados: months.toNumber(),
    tipoRescisao: input.terminationType,
    tipoContrato: input.contractType,
    incluirDecimoTerceiro: input.include13,
    incluirFerias: input.includeVacation,
    avosDecimoTerceiro: input.thirteenthMonths,
    avosFerias: input.vacationMonths,
    saqueAniversario: input.birthdayWithdrawal,
    cenarioCorrecao: input.scenario,
    periodosDeposito: fractions,
    indicesCorrecao: {
      trMensal: new Decimal(input.trMonthly),
      ipcaMensal: new Decimal(input.ipcaMonthly),
    },
  });
  const warnings = [
    'Estimativa educativa: não substitui o extrato da CAIXA nem orientação profissional.',
    'Não inclui FGTS do 13º, lucros, aumentos, saques anteriores ou antecipações.',
    '13º e férias são valores brutos; o total não é rescisão completa nem valor líquido.',
    'IPCA é só comparação econômica, não piso automático da ADI 5090.',
  ];
  if (input.birthdayWithdrawal)
    warnings.push(
      'Saque-aniversário: parte do saldo fica retida; antecipações não são calculadas.',
    );
  if (input.terminationType === TipoRescisao.DOENCA_GRAVE)
    warnings.push('Doença grave exige documentos e análise da CAIXA; não é autorização.');
  if (input.contractType === TipoContrato.DOMESTICO)
    warnings.push('Trabalho doméstico: reserva de 3,2% ao mês, sem correção.');
  const snapshot: SimulationSnapshot = {
    formatVersion: 1,
    calculationVersion: CALCULATION_VERSION,
    appVersion: packageInfo.version,
    id: simulationId(),
    createdAt: new Date().toISOString(),
    input: { ...input },
    result: {
      saldoBaseCents: cents(result.saldoBase),
      depositosCents: cents(result.correcao.serie.at(-1)?.depositos ?? Money.zero()),
      rendimentoCents: cents(result.correcao.rendimentoTotal),
      saldoDisponivelCents: cents(result.saldoFinal),
      saldoRetidoCents: cents(result.saldoRetido),
      multaCents: cents(result.multaFinal),
      decimoTerceiroCents: cents(result.decimoTerceiro),
      feriasCents: cents(result.ferias),
      totalCents: cents(result.total),
    },
    timeline: result.correcao.serie.map((point, index) => ({
      competencia: periods[index]!.competencia,
      depositosCents: cents(point.depositos),
      trCents: cents(point.tr),
      ipcaCents: cents(point.ipca),
    })),
    assumptions: [
      'Salário fixo no período; depósito de 8% ao mês (2% para aprendiz).',
      'Meses incompletos contam pelos dias trabalhados; sem rendimento no mês do depósito.',
      'TR + 3% ao ano ou IPCA, com índices mensais fixos que você informou.',
      '13º e férias contados pelos meses que faltam receber, informados por você.',
      'Multa sobre o saldo corrigido, sem saques anteriores; centavos arredondados.',
    ],
    warnings,
  };
  return snapshot;
}

/** Valida o documento persistido e suas identidades contábeis, sem refazer o cálculo histórico. */
export function isSimulationSnapshot(candidate: unknown): candidate is SimulationSnapshot {
  try {
    if (
      typeof candidate !== 'object' ||
      candidate === null ||
      Array.isArray(candidate) ||
      !hasKeys(candidate, [
        'formatVersion',
        'calculationVersion',
        'appVersion',
        'id',
        'createdAt',
        'input',
        'result',
        'timeline',
        'assumptions',
        'warnings',
      ])
    )
      return false;
    const value = candidate as Partial<SimulationSnapshot>;
    if (value.formatVersion !== 1) return false;
    for (const key of ['calculationVersion', 'appVersion', 'id'] as const) {
      const text = value[key];
      if (typeof text !== 'string' || !text.trim() || text.length > 128) return false;
    }
    if (
      typeof value.createdAt !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.createdAt) ||
      new Date(value.createdAt).toISOString() !== value.createdAt
    )
      return false;
    validateInput(value.input);
    const input = value.input;
    const result = value.result;
    if (
      typeof result !== 'object' ||
      result === null ||
      Array.isArray(result) ||
      !hasKeys(result, RESULT_KEYS) ||
      !RESULT_KEYS.every((key) => isCents(result[key], key === 'rendimentoCents'))
    )
      return false;
    if (
      !Array.isArray(value.timeline) ||
      value.timeline.length < 1 ||
      value.timeline.length > MAX_POINTS
    )
      return false;
    const start = parseCivilDate(input.startDate)!;
    const end = parseCivilDate(input.endDate)!;
    const firstMonth = start.getUTCFullYear() * 12 + start.getUTCMonth();
    const lastMonth = end.getUTCFullYear() * 12 + end.getUTCMonth();
    if (lastMonth - firstMonth + 1 !== value.timeline.length) return false;
    let lastDeposits = 0n;
    for (const [index, point] of value.timeline.entries()) {
      const month = firstMonth + index;
      const expected = `${String(Math.floor(month / 12)).padStart(4, '0')}-${String((month % 12) + 1).padStart(2, '0')}`;
      if (
        typeof point !== 'object' ||
        point === null ||
        Array.isArray(point) ||
        !hasKeys(point, ['competencia', 'depositosCents', 'trCents', 'ipcaCents']) ||
        point.competencia !== expected ||
        !isCents(point.depositosCents) ||
        !isCents(point.trCents) ||
        !isCents(point.ipcaCents) ||
        BigInt(point.depositosCents) < lastDeposits
      )
        return false;
      lastDeposits = BigInt(point.depositosCents);
    }
    const last = value.timeline.at(-1)!;
    if (
      last.depositosCents !== result.depositosCents ||
      last[input.scenario === 'TR' ? 'trCents' : 'ipcaCents'] !== result.saldoBaseCents
    )
      return false;
    if (
      BigInt(result.saldoBaseCents) !==
        BigInt(result.depositosCents) + BigInt(result.rendimentoCents) ||
      BigInt(result.saldoBaseCents) !==
        BigInt(result.saldoDisponivelCents) + BigInt(result.saldoRetidoCents) ||
      BigInt(result.totalCents) !==
        BigInt(result.saldoDisponivelCents) +
          BigInt(result.multaCents) +
          BigInt(result.decimoTerceiroCents) +
          BigInt(result.feriasCents)
    )
      return false;
    for (const key of ['assumptions', 'warnings'] as const) {
      const texts = value[key];
      if (
        !Array.isArray(texts) ||
        texts.length < 1 ||
        texts.length > 30 ||
        texts.some((text) => typeof text !== 'string' || !text.trim() || text.length > 2000)
      )
        return false;
    }
    return true;
  } catch {
    return false;
  }
}
