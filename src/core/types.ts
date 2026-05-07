/**
 * Domain Types — FGTS Calculator
 * Enums exaustivos, Value Objects e Interfaces do domínio trabalhista
 *
 * Base legal: CLT, Lei 8.036/1990, ADIs 5090 (STF)
 */

import Decimal from 'decimal.js';

// ─── Configuração global do Decimal.js para precisão financeira ─────────────
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_EVEN, // Banker's rounding (norma contábil)
  toExpNeg: -9,
  toExpPos: 9,
});

// ─── Formatters em cache para performance ────────────────────────────────────
const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

// ─── Enums ──────────────────────────────────────────────────────────────────

/**
 * Tipo de Rescisão — Enum exaustivo conforme CLT e jurisprudência
 */
export enum TipoRescisao {
  /** Dispensa sem justa causa — Art. 477 CLT */
  DISPENSA_SEM_JUSTA_CAUSA = 'dispensa_sem_causa',
  /** Demissão voluntária — Pedido do empregado */
  DEMISSAO_VOLUNTARIA = 'demissao_voluntaria',
  /** Justa causa — Art. 482 CLT */
  JUSTA_CAUSA = 'justa_causa',
  /** Acordo comum — Art. 484-A CLT (Reforma Trabalhista 2017) */
  ACORDO_COMUM = 'acordo_comum',
  /** Doença grave — Lei 8.036/90, Art. 20, inciso XIII */
  DOENCA_GRAVE = 'doenca_grave',
  /** Aposentadoria — Lei 8.036/90, Art. 20, inciso III */
  APOSENTADORIA = 'aposentadoria',
  /** Falecimento do trabalhador — Lei 8.036/90, Art. 20, inciso IV */
  FALECIMENTO = 'falecimento',
  /** Culpa recíproca — Art. 484 CLT */
  CULPA_RECIPROCA = 'culpa_reciproca',
}

/** Tipo de Contrato de Trabalho */
export enum TipoContrato {
  /** CLT padrão — alíquota de 8% */
  CLT_PADRAO = 'clt_padrao',
  /** Contrato de Aprendizagem — alíquota de 2% (Lei 10.097/2000) */
  APRENDIZ = 'aprendiz',
  /** Trabalhador doméstico — alíquota de 3,2% (Lei 5.859/1972) */
  DOMESTICO = 'domestico',
}

/** Doenças graves que permitem saque integral (Lei 8.036/90, Art. 20, XIII) */
export enum TipoDoencaGrave {
  CANCER = 'cancer',
  HIV_AIDS = 'hiv_aids',
  DOENCA_TERMINAL = 'doenca_terminal',
  OUTRA_GRAVE = 'outra_grave',
}

// ─── Value Object: Money ────────────────────────────────────────────────────

/**
 * Value Object imutável para representação monetária com precisão centesimal.
 * Utiliza Decimal.js internamente para eliminar erros de IEEE 754.
 */
export class Money {
  private readonly _value: Decimal;

  private constructor(cents: Decimal) {
    this._value = cents;
  }

  /** Cria Money a partir de centavos (inteiro) */
  static fromCents(cents: number | string | Decimal): Money {
    return new Money(new Decimal(cents).round());
  }

  /** Cria Money a partir de reais (ex: 3000.50) */
  static fromReais(reais: number | string | Decimal): Money {
    return new Money(new Decimal(reais).times(100).round());
  }

  /** Valor zero */
  static zero(): Money {
    return new Money(new Decimal(0));
  }

  /** Retorna o valor em centavos (inteiro) */
  get cents(): number {
    return this._value.toNumber();
  }

  /** Retorna o valor em reais (float — usar apenas para exibição) */
  get reais(): number {
    return this._value.dividedBy(100).toNumber();
  }

  /** Retorna o Decimal interno para operações de alta precisão */
  get decimal(): Decimal {
    return this._value;
  }

  add(other: Money): Money {
    return new Money(this._value.plus(other._value));
  }

  subtract(other: Money): Money {
    return new Money(this._value.minus(other._value));
  }

  multiply(factor: number | Decimal): Money {
    return new Money(this._value.times(factor).round());
  }

  divide(divisor: number | Decimal): Money {
    return new Money(this._value.dividedBy(divisor).round());
  }

  /** Calcula percentual (ex: percentage(40) → 40% do valor) */
  percentage(pct: number | Decimal): Money {
    return this.multiply(new Decimal(pct).dividedBy(100));
  }

  isPositive(): boolean {
    return this._value.greaterThan(0);
  }

  isZero(): boolean {
    return this._value.isZero();
  }

  greaterThan(other: Money): boolean {
    return this._value.greaterThan(other._value);
  }

  equals(other: Money): boolean {
    return this._value.equals(other._value);
  }

  /** Formata para BRL (R$ 1.234,56) */
  toBRL(): string {
    return brlFormatter.format(this.reais);
  }
}

// ─── Template Literal Types para validação de formato ─────────────────────
export type YYYYMMDD = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

export type DataISO = YYYYMMDD;

// ─── Type Guards ──────────────────────────────────────────────────────────────
export function isDataISO(value: unknown): value is DataISO {
  if (typeof value !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(value)) return false;

  const parts = value.split('-');
  const year = parseInt(parts[0]!, 10);
  const month = parseInt(parts[1]!, 10);
  const day = parseInt(parts[2]!, 10);

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function isTipoRescisao(value: unknown): value is TipoRescisao {
  return (value as TipoRescisao) in Object.values(TipoRescisao).reduce((acc, curr) => ({ ...acc, [curr]: true }), {} as Record<string, boolean>);
}

export interface IndicesCorrecao {
  /** Taxa Referencial mensal (ex: 0.0008 = 0.08%) */
  trMensal: Decimal;
  /** IPCA mensal (ex: 0.005 = 0.5%) */
  ipcaMensal: Decimal;
}

export interface ResultadoCorrecao {
  saldoCorrigido: Money;
  rendimentoTotal: Money;
  indexadorUtilizado: 'TR' | 'IPCA';
  taxaEfetivaAnual: Decimal;
}

export interface ResultadoMulta {
  percentualAplicado: number;
  valorMulta: Money;
  baseCalculo: Money;
  fundamentoLegal: string;
}

export interface ResultadoSaqueAniversario {
  aliquota: number;
  parcelaAdicional: Money;
  valorSaque: Money;
  faixaSaldo: string;
}

export interface ResultadoDoencaGrave {
  saldoDisponivel: Money;
  percentualLiberado: number;
  tipoDoenca: TipoDoencaGrave;
  fundamentoLegal: string;
}

export interface ResultadoRescisao {
  saldoBase: Money;
  correcao: ResultadoCorrecao;
  multa: ResultadoMulta;
  decimoTerceiro: Money;
  ferias: Money;
  saqueAniversario: ResultadoSaqueAniversario | null;
  doencaGrave: ResultadoDoencaGrave | null;
  saldoFinal: Money;
  multaFinal: Money;
  total: Money;
  detalhes: {
    depositoMensal: Money;
    mesesTrabalhados: number;
    tipoRescisao: TipoRescisao;
    tipoContrato: TipoContrato;
    saqueAniversarioAtivo: boolean;
    correcaoEstimada: Money;
  };
}

export interface ParametrosCalculo {
  salarioBruto: Money;
  mesesTrabalhados: number;
  tipoRescisao: TipoRescisao;
  tipoContrato: TipoContrato;
  incluirDecimoTerceiro: boolean;
  incluirFerias: boolean;
  saqueAniversario: boolean;
  /** Total historical deposits (for fine calculation - Art. 18, Lei 8.036/1990) */
  depositoHistoricoTotal?: Money;
  doencaGrave?: TipoDoencaGrave;
  indicesCorrecao?: IndicesCorrecao;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
