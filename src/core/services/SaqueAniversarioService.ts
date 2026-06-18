/**
 * Service: SaqueAniversarioService
 * Cálculo do Saque-Aniversário conforme tabela oficial da Caixa Econômica Federal.
 *
 * Regras:
 *  - Parcela = (Saldo × Alíquota) + Parcela Adicional Fixa
 *  - Na rescisão, optante do Saque-Aniversário NÃO saca o saldo, mas recebe multa integral
 *
 * Base legal: Lei 13.932/2019
 */

import { Money, TipoRescisao } from '../types';
import type { ResultadoSaqueAniversario } from '../types';

const HIPOTESES_SAQUE_INTEGRAL = new Set<TipoRescisao>([
  TipoRescisao.DOENCA_GRAVE,
  TipoRescisao.APOSENTADORIA,
  TipoRescisao.FALECIMENTO,
]);

interface FaixaSaque {
  limiteInferior: number;
  limiteSuperior: number;
  aliquota: number;
  parcelaAdicional: number;
  descricao: string;
}

/** Tabela oficial de faixas do Saque-Aniversário (valores em reais) */
const FAIXAS_SAQUE = [
  {
    limiteInferior: 0,
    limiteSuperior: 500,
    aliquota: 0.5,
    parcelaAdicional: 0,
    descricao: 'Até R$ 500,00',
  },
  {
    limiteInferior: 500.01,
    limiteSuperior: 1000,
    aliquota: 0.4,
    parcelaAdicional: 50,
    descricao: 'R$ 500,01 a R$ 1.000,00',
  },
  {
    limiteInferior: 1000.01,
    limiteSuperior: 5000,
    aliquota: 0.3,
    parcelaAdicional: 150,
    descricao: 'R$ 1.000,01 a R$ 5.000,00',
  },
  {
    limiteInferior: 5000.01,
    limiteSuperior: 10000,
    aliquota: 0.2,
    parcelaAdicional: 650,
    descricao: 'R$ 5.000,01 a R$ 10.000,00',
  },
  {
    limiteInferior: 10000.01,
    limiteSuperior: 15000,
    aliquota: 0.15,
    parcelaAdicional: 1150,
    descricao: 'R$ 10.000,01 a R$ 15.000,00',
  },
  {
    limiteInferior: 15000.01,
    limiteSuperior: 20000,
    aliquota: 0.1,
    parcelaAdicional: 1900,
    descricao: 'R$ 15.000,01 a R$ 20.000,00',
  },
  {
    limiteInferior: 20000.01,
    limiteSuperior: Infinity,
    aliquota: 0.05,
    parcelaAdicional: 2900,
    descricao: 'Acima de R$ 20.000,00',
  },
] satisfies Array<FaixaSaque>;

export class SaqueAniversarioService {
  /**
   * Calcula o valor da parcela anual do Saque-Aniversário
   *
   * @param saldoFGTS Saldo base do FGTS
   */
  static calcularParcela(saldoFGTS: Money): ResultadoSaqueAniversario {
    const saldoReais = saldoFGTS.reais;

    const faixa = FAIXAS_SAQUE.find(
      (f) => saldoReais >= f.limiteInferior && saldoReais <= f.limiteSuperior,
    );

    // Fallback para última faixa (saldo muito alto)
    const faixaEfetiva = faixa ?? FAIXAS_SAQUE[FAIXAS_SAQUE.length - 1]!;

    const valorPercentual = saldoFGTS.multiply(faixaEfetiva.aliquota);
    const parcelaFixa = Money.fromReais(faixaEfetiva.parcelaAdicional);
    const valorSaque = valorPercentual.add(parcelaFixa);

    return {
      aliquota: faixaEfetiva.aliquota * 100,
      parcelaAdicional: parcelaFixa,
      valorSaque,
      faixaSaldo: faixaEfetiva.descricao,
    };
  }

  /**
   * Calcula o impacto do Saque-Aniversário na rescisão.
   *
   * No Saque-Aniversário, em regra, o trabalhador:
   *  - NÃO saca o saldo principal (fica retido para saques anuais futuros)
   *  - RECEBE a multa rescisória integralmente (40% ou 20%)
   *
   * Hipóteses de saque integral (aposentadoria, falecimento e doença grave)
   * preservam a liberação do saldo mesmo com Saque-Aniversário ativo.
   *
   * @param saldoFGTS Saldo do FGTS
   * @param multaRescisoria Valor da multa rescisória
   */
  static calcularImpactoRescisao(
    saldoFGTS: Money,
    multaRescisoria: Money,
    tipoRescisao: TipoRescisao,
  ): { saldoFinal: Money; multaFinal: Money; valorSaqueImediato: Money } {
    if (HIPOTESES_SAQUE_INTEGRAL.has(tipoRescisao)) {
      return {
        saldoFinal: saldoFGTS,
        multaFinal: multaRescisoria,
        valorSaqueImediato: saldoFGTS.add(multaRescisoria),
      };
    }

    return {
      saldoFinal: Money.zero(), // Saldo fica retido
      multaFinal: multaRescisoria, // Multa paga integralmente
      valorSaqueImediato: multaRescisoria, // Apenas multa é sacada na hora
    };
  }
}
