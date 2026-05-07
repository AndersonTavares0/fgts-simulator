/**
 * Service: CorrecaoMonetariaService
 * Motor de correção monetária com suporte a TR/IPCA e conformidade ADI 5090 (STF)
 *
 * Regras:
 *  - Rendimento legal: 3% a.a. + TR (Art. 13 da Lei 8.036/1990)
 *  - Piso ADI 5090: Se (TR + 3% a.a.) < IPCA, aplica-se o IPCA como indexador
 *
 * Base legal: Lei 8.036/1990, Art. 13; ADIs 5090 (STF)
 */

import Decimal from 'decimal.js';
import { Money, IndicesCorrecao, ResultadoCorrecao } from '../types';

/** Constantes legais de rendimento do FGTS */
const JUROS_ANUAL = new Decimal(3); // 3% ao ano
const JUROS_MENSAL = new Decimal(1)
  .plus(JUROS_ANUAL.dividedBy(100))
  .pow(new Decimal(1).dividedBy(12))
  .minus(1);

/** TR estimada conservadora quando não há dados reais */
const TR_ESTIMADA_MENSAL = new Decimal('0.0008'); // 0.08% ao mês

/** IPCA estimado conservador quando não há dados reais */
const IPCA_ESTIMADO_MENSAL = new Decimal('0.004'); // ~0.4% ao mês (~4.9% a.a.)

export class CorrecaoMonetariaService {
  /**
   * Calcula o saldo FGTS acumulado com depósitos mensais e correção monetária.
   * Aplica juros compostos mensais sobre série de pagamentos.
   *
   * Fórmula: Cada depósito rende (1 + taxa)^(meses_restantes)
   * O resultado é a soma de todos os depósitos capitalizados.
   *
   * @param depositoMensal Valor do depósito mensal do FGTS
   * @param meses Número de meses do contrato
   * @param indices Índices TR/IPCA (usa estimativas se não fornecidos)
   */
  static calcularSaldoComCorrecao(
    depositoMensal: Money,
    meses: number,
    indices?: IndicesCorrecao,
  ): ResultadoCorrecao {
    if (meses <= 0 || !depositoMensal.isPositive()) {
      return {
        saldoCorrigido: Money.zero(),
        rendimentoTotal: Money.zero(),
        indexadorUtilizado: 'TR',
        taxaEfetivaAnual: new Decimal(0),
      };
    }

    const trMensal = indices?.trMensal ?? TR_ESTIMADA_MENSAL;
    const ipcaMensal = indices?.ipcaMensal ?? IPCA_ESTIMADO_MENSAL;

    // Taxa legal: juros 3% a.a. (mensal) + TR
    const taxaTRMensal = JUROS_MENSAL.plus(trMensal);

    // Taxa anual efetiva de cada indexador
    const taxaAnualTR = new Decimal(1).plus(taxaTRMensal).pow(12).minus(1);
    const taxaAnualIPCA = new Decimal(1).plus(ipcaMensal).pow(12).minus(1);

    // ADI 5090: Se rendimento TR+3% < IPCA, aplica IPCA
    let taxaMensalEfetiva: Decimal;
    let indexadorUtilizado: 'TR' | 'IPCA';

    if (taxaAnualTR.lessThan(taxaAnualIPCA)) {
      // IPCA é maior — aplica IPCA como piso (ADI 5090)
      taxaMensalEfetiva = ipcaMensal;
      indexadorUtilizado = 'IPCA';
    } else {
      taxaMensalEfetiva = taxaTRMensal;
      indexadorUtilizado = 'TR';
    }

    // Cálculo de juros compostos sobre série de pagamentos (FV de anuidade)
    // FV = P × [((1 + i)^n - 1) / i]
    const depositoDecimal = depositoMensal.decimal;
    let saldoAcumulado: Decimal;

    if (taxaMensalEfetiva.greaterThan(0)) {
      const fator = new Decimal(1)
        .plus(taxaMensalEfetiva)
        .pow(meses)
        .minus(1)
        .dividedBy(taxaMensalEfetiva);
      saldoAcumulado = depositoDecimal.times(fator);
    } else {
      saldoAcumulado = depositoDecimal.times(meses);
    }

    const saldoSemCorrecao = depositoDecimal.times(meses);
    const rendimento = saldoAcumulado.minus(saldoSemCorrecao);

    const taxaEfetiva = new Decimal(1).plus(taxaMensalEfetiva).pow(12).minus(1);

    return {
      saldoCorrigido: Money.fromCents(saldoAcumulado.round()),
      rendimentoTotal: Money.fromCents(rendimento.round()),
      indexadorUtilizado,
      taxaEfetivaAnual: taxaEfetiva,
    };
  }

  /** Retorna a taxa mensal de juros legais (3% a.a. convertida) */
  static get jurosMensal(): Decimal {
    return JUROS_MENSAL;
  }

  /** Retorna a TR estimada mensal padrão */
  static get trEstimadaMensal(): Decimal {
    return TR_ESTIMADA_MENSAL;
  }
}
