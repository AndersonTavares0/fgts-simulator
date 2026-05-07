/**
 * Entity: ContratoTrabalho
 * Encapsula dados e validação do contrato de trabalho
 */

import { TipoContrato, TipoRescisao, Money, ValidationResult } from '../types';

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

  /** Calcula meses trabalhados com regra CLT (15+ dias = mês completo) */
  get mesesTrabalhados(): number {
    return ContratoTrabalho.calcularMesesTrabalhados(this.dataInicio, this.dataTermino);
  }

  /** Alíquota FGTS conforme tipo de contrato */
  get aliquotaFGTS(): number {
    return this.tipoContrato === TipoContrato.APRENDIZ ? 2 : 8;
  }

  /** Validação estática reutilizável */
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
      Math.abs(params.dataTermino.getTime() - params.dataInicio.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays > MAX_ANOS_CONTRATO * 365) {
      return { valid: false, error: `Período máximo permitido: ${MAX_ANOS_CONTRATO} anos.` };
    }

    return { valid: true };
  }

  /** Calcula meses trabalhados com regra CLT dos 15 dias */
  static calcularMesesTrabalhados(inicio: Date, termino: Date): number {
    if (!inicio || !termino || termino < inicio) return 0;

    const y1 = inicio.getFullYear();
    const m1 = inicio.getMonth();
    const d1 = inicio.getDate();
    const y2 = termino.getFullYear();
    const m2 = termino.getMonth();
    const d2 = termino.getDate();

    let mesesCompletos = (y2 - y1) * 12 + (m2 - m1);

    if (d2 < d1) {
      mesesCompletos--;
    }

    if (d2 >= DIAS_MINIMO_MES_COMPLETO && d2 < d1) {
      mesesCompletos++;
    } else if (d2 < DIAS_MINIMO_MES_COMPLETO && d2 < d1) {
      const fracaoMes = this.calcularFracaoMes(d2, m2, y2);
      return Math.max(0, parseFloat((mesesCompletos + 1 + fracaoMes).toFixed(2)));
    }

    return Math.max(0, mesesCompletos);
  }

  /** Calcula fração do mês baseada no dia e mês */
  private static calcularFracaoMes(dia: number, mes: number, ano: number): number {
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    return dia / diasNoMes;
  }
}
