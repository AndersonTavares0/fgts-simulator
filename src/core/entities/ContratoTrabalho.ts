/**
 * Entity: ContratoTrabalho
 * Encapsulates employment contract data and validation
 */

import { TipoContrato, TipoRescisao, Money } from '../types';
import type { ValidationResult } from '../types';

const DIAS_MINIMO_MES_COMPLETO = 15;
const MAX_ANOS_CONTRATO = 50;

export class ContratoTrabalho {
  readonly salarioBruto: Money;
  readonly dataInicio: Date;
  readonly dataTermino: Date;
  readonly tipoContrato: TipoContrato;
  readonly tipoRescisao: TipoRescisao;

  constructor(params: {
    salarioBruto: Money;
    dataInicio: Date;
    dataTermino: Date;
    tipoContrato: TipoContrato;
    tipoRescisao: TipoRescisao;
  }) {
    const validation = ContratoTrabalho.validar(params);
    if (!validation.valid) {
      throw new Error(`ContratoTrabalho inválido: ${validation.error}`);
    }

    this.salarioBruto = params.salarioBruto;
    this.dataInicio = params.dataInicio;
    this.dataTermino = params.dataTermino;
    this.tipoContrato = params.tipoContrato;
    this.tipoRescisao = params.tipoRescisao;
  }

  /** Calculates worked months using CLT rule (15+ days = full month) */
  get mesesTrabalhados(): number {
    return ContratoTrabalho.calcularMesesTrabalhados(this.dataInicio, this.dataTermino);
  }

  /** Reusable static validation */
  static validar(params: {
    salarioBruto: Money;
    dataInicio: Date;
    dataTermino: Date;
  }): ValidationResult {
    if (!params.salarioBruto.isPositive()) {
      return { valid: false, error: 'Salário deve ser maior que zero.' };
    }

    if (params.salarioBruto.reais > 1_000_000) {
      return {
        valid: false,
        error: 'Valor excede limite técnico de R$ 1.000.000,00.',
      };
    }

    if (!(params.dataInicio instanceof Date) || isNaN(params.dataInicio.getTime())) {
      return { valid: false, error: 'Data de início inválida.' };
    }

    if (!(params.dataTermino instanceof Date) || isNaN(params.dataTermino.getTime())) {
      return { valid: false, error: 'Data de término inválida.' };
    }

    if (params.dataTermino <= params.dataInicio) {
      return {
        valid: false,
        error: 'Data de término deve ser posterior à data de início.',
      };
    }

    const diffDays = Math.ceil(
      (params.dataTermino.getTime() - params.dataInicio.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays > MAX_ANOS_CONTRATO * 365) {
      return { valid: false, error: `Período máximo permitido: ${MAX_ANOS_CONTRATO} anos.` };
    }

    return { valid: true };
  }

  /** Calculates worked months using the 15-day CLT rule */
  static calcularMesesTrabalhados(inicio: Date, termino: Date): number {
    if (!inicio || !termino || termino < inicio) return 0;

    const diffTime = Math.abs(termino.getTime() - inicio.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const meses = Math.floor(totalDays / 30);
    const diasRestantes = totalDays % 30;
    
    return diasRestantes >= DIAS_MINIMO_MES_COMPLETO ? meses + 1 : Math.max(1, meses);
  }

}
