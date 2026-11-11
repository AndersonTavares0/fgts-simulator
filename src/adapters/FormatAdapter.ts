/**
 * Adapter: FormatAdapter
 * Única fonte de formatação (dinheiro, datas, percentuais) para UI e relatório.
 */

import Decimal from 'decimal.js';
import { Money, TipoRescisao } from '../core/types';
import { parseCivilDate } from '../core/CivilDate';

const LABELS_RESCISAO: Record<TipoRescisao, string> = {
  [TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA]: 'Dispensa sem justa causa',
  [TipoRescisao.DEMISSAO_VOLUNTARIA]: 'Demissão voluntária',
  [TipoRescisao.JUSTA_CAUSA]: 'Justa causa',
  [TipoRescisao.ACORDO_COMUM]: 'Acordo comum',
  [TipoRescisao.DOENCA_GRAVE]: 'Saque por doença grave',
  [TipoRescisao.APOSENTADORIA]: 'Saque por aposentadoria',
  [TipoRescisao.FALECIMENTO]: 'Saque por falecimento',
  [TipoRescisao.CULPA_RECIPROCA]: 'Culpa recíproca',
};

export class FormatAdapter {
  /** Centavos em string (ex.: "-123456") para "R$ 1.234,56". */
  static centsToBRL(cents: string): string {
    const negative = cents.startsWith('-');
    const digits = (negative ? cents.slice(1) : cents).padStart(3, '0');
    const whole = digits.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${negative ? '-' : ''}R$ ${whole},${digits.slice(-2)}`;
  }

  /** "2025-01-31" para "31/01/2025"; "2025-01" para "01/2025". */
  static civilDate(value: string): string {
    return value.split('-').reverse().join('/');
  }

  /** Percentual informado pelo usuário ("0,08") para taxa decimal ("0.0008"). */
  static rateFromPercent(value: string): string | null {
    const normalized = value.trim().replace(',', '.');
    if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
    return new Decimal(normalized).div(100).toFixed();
  }

  /** Taxa decimal ("0.0008") para percentual legível ("0,08"). */
  static rateToPercent(value: string): string {
    return new Decimal(value).times(100).toFixed().replace('.', ',');
  }

  static getRescisaoLabel(tipo: TipoRescisao): string {
    return LABELS_RESCISAO[tipo] ?? 'Outra saída';
  }

  /** Parse seguro de data no formato YYYY-MM-DD. */
  static parseDate(dateString: string): Date | null {
    const civil = parseCivilDate(dateString);
    if (!civil) return null;
    const date = new Date(0);
    date.setFullYear(civil.getUTCFullYear(), civil.getUTCMonth(), civil.getUTCDate());
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /** Sanitiza valor monetário de string para Money. */
  static parseMonetaryInput(value: string): Money | null {
    if (typeof value !== 'string' || value.length > 32) return null;
    const text = value.trim().replace(/^R\$\s*/, '');
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text)) return null;
    const money = Money.fromReais(text.replace(/\./g, '').replace(',', '.'));
    return money.isPositive() && money.decimal.lessThanOrEqualTo(100_000_000) ? money : null;
  }
}
