/**
 * Adapter: FormatAdapter
 * Funções de formatação monetária e de datas para a camada de UI.
 */

import { Money, TipoRescisao } from '../core/types';

/** Labels legíveis para cada tipo de rescisão */
const LABELS_RESCISAO: Record<TipoRescisao, { label: string; cssClass: string }> = {
  [TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA]: {
    label: 'Dispensa sem justa causa',
    cssClass: 'dispensa',
  },
  [TipoRescisao.DEMISSAO_VOLUNTARIA]: {
    label: 'Demissão voluntária',
    cssClass: 'voluntaria',
  },
  [TipoRescisao.JUSTA_CAUSA]: {
    label: 'Justa causa',
    cssClass: 'justa-causa',
  },
  [TipoRescisao.ACORDO_COMUM]: {
    label: 'Acordo comum',
    cssClass: 'acordo',
  },
  [TipoRescisao.DOENCA_GRAVE]: {
    label: 'Doença grave',
    cssClass: 'doenca',
  },
  [TipoRescisao.APOSENTADORIA]: {
    label: 'Aposentadoria',
    cssClass: 'aposentadoria',
  },
  [TipoRescisao.FALECIMENTO]: {
    label: 'Falecimento',
    cssClass: 'falecimento',
  },
  [TipoRescisao.CULPA_RECIPROCA]: {
    label: 'Culpa recíproca',
    cssClass: 'culpa-reciproca',
  },
};

export class FormatAdapter {
  /** Formata Money para string BRL (R$ 1.234,56) */
  static formatBRL(money: Money): string {
    return money.toBRL();
  }

  /** Formata centavos brutos para BRL */
  static formatCentsBRL(cents: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  }

  /** Calcula percentual formatado (ex: "45.2%") */
  static formatPercent(part: number, total: number): string {
    if (total <= 0) return '0%';
    return ((part / total) * 100).toFixed(1) + '%';
  }

  /** Formata data para exibição em pt-BR */
  static formatDateFull(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  /** Retorna label e classe CSS para um tipo de rescisão */
  static getRescisaoLabel(tipo: TipoRescisao): { label: string; cssClass: string } {
    return LABELS_RESCISAO[tipo] ?? { label: 'Outra saída', cssClass: 'outra' };
  }

  /** Parse seguro de data no formato YYYY-MM-DD */
  static parseDate(dateString: string): Date | null {
    if (!dateString || typeof dateString !== 'string') return null;

    const parts = dateString.split('-');
    if (parts.length !== 3) return null;

    const year = parseInt(parts[0]!, 10);
    const month = parseInt(parts[1]!, 10);
    const day = parseInt(parts[2]!, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  /** Sanitiza valor monetário de string para Money */
  static parseMonetaryInput(value: string): Money | null {
    if (!value || typeof value !== 'string') return null;

    const cleaned = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);

    if (isNaN(parsed) || !isFinite(parsed) || parsed <= 0) return null;

    return Money.fromReais(parsed);
  }
}
