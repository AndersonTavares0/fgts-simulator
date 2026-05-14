/**
 * Service: FGTSCalculatorService
 * Orquestrador central — coordena todos os serviços de domínio para produzir
 * o resultado completo da rescisão trabalhista.
 *
 * Este é o ponto de entrada principal para todo cálculo financeiro.
 */

import { Money, TipoContrato } from '../types';
import type {
  ParametrosCalculo,
  ResultadoRescisao,
  ResultadoSaqueAniversario,
  ResultadoDoencaGrave,
} from '../types';
import { CorrecaoMonetariaService } from './CorrecaoMonetariaService';
import { MultaService } from './MultaService';
import { SaqueAniversarioService } from './SaqueAniversarioService';
import { DoencaGraveService } from './DoencaGraveService';

/** Alíquotas FGTS por tipo de contrato */
const ALIQUOTA = {
  [TipoContrato.CLT_PADRAO]: 8,
  [TipoContrato.APRENDIZ]: 2,
  [TipoContrato.DOMESTICO]: 3.2,
} satisfies Record<TipoContrato, number>;

export class FGTSCalculatorService {
  /**
   * Calcula o depósito mensal do FGTS
   *
   * @param salarioBruto Salário bruto do trabalhador
   * @param tipoContrato Tipo de contrato (CLT ou Aprendiz)
   * @returns Depósito mensal do FGTS
   */
  static calcularDepositoMensal(
    salarioBruto: Money,
    tipoContrato: TipoContrato = TipoContrato.CLT_PADRAO,
  ): Money {
    if (!salarioBruto.isPositive()) return Money.zero();

    const aliquota = ALIQUOTA[tipoContrato] ?? ALIQUOTA[TipoContrato.CLT_PADRAO];
    return salarioBruto.percentage(aliquota);
  }

  /**
   * Calcula 13º salário proporcional
   *
   * @param salarioBruto Salário bruto
   * @param mesesTrabalhados Meses trabalhados no ano (máximo 12)
   */
  static calcularDecimoTerceiro(salarioBruto: Money, mesesTrabalhados: number): Money {
    if (!salarioBruto.isPositive() || mesesTrabalhados <= 0) return Money.zero();
    const mesesBase = Math.min(mesesTrabalhados, 12);
    return salarioBruto.multiply(mesesBase).divide(12);
  }

  /**
   * Calcula férias proporcionais + 1/3 constitucional
   *
   * @param salarioBruto Salário bruto
   * @param mesesTrabalhados Meses trabalhados (máximo 12)
   */
  static calcularFeriasProporcionais(salarioBruto: Money, mesesTrabalhados: number): Money {
    if (!salarioBruto.isPositive() || mesesTrabalhados <= 0) return Money.zero();
    const mesesBase = Math.min(mesesTrabalhados, 12);
    const ferias = salarioBruto.multiply(mesesBase).divide(12);
    const terco = ferias.divide(3);
    return ferias.add(terco);
  }

  /**
   * Cálculo completo da rescisão trabalhista.
   * Orquestra todos os serviços do domínio.
   *
   * @param params Parâmetros completos do cálculo
   */
  static calcularRescisao(params: ParametrosCalculo): ResultadoRescisao {
    const {
      salarioBruto,
      mesesTrabalhados,
      tipoRescisao,
      tipoContrato,
      incluirDecimoTerceiro,
      incluirFerias,
      saqueAniversario,
      doencaGrave,
      indicesCorrecao,
    } = params;

    // 1. Depósito mensal
    const depositoMensal = this.calcularDepositoMensal(salarioBruto, tipoContrato);

    // 2. Saldo com correção monetária (TR/IPCA + 3% a.a.)
    const correcao = CorrecaoMonetariaService.calcularSaldoComCorrecao(
      depositoMensal,
      mesesTrabalhados,
      indicesCorrecao,
    );

    const saldoBase = correcao.saldoCorrigido;

    // 3. Multa rescisória (must be 40% of TOTAL HISTORICAL DEPOSITS - Art. 18, Lei 8.036/1990)
    const baseCalculoMulta = params.depositoHistoricoTotal ?? saldoBase;
    const multa = MultaService.calcular(baseCalculoMulta, tipoRescisao);

    // 4. Verbas proporcionais
    const decimoTerceiro = incluirDecimoTerceiro
      ? this.calcularDecimoTerceiro(salarioBruto, mesesTrabalhados)
      : Money.zero();

    const ferias = incluirFerias
      ? this.calcularFeriasProporcionais(salarioBruto, mesesTrabalhados)
      : Money.zero();

    // 5. Saque-Aniversário
    let resultadoSaqueAniversario: ResultadoSaqueAniversario | null = null;
    let saldoFinal = saldoBase;
    let multaFinal = multa.valorMulta;

    if (saqueAniversario) {
      resultadoSaqueAniversario = SaqueAniversarioService.calcularParcela(saldoBase);
      const impacto = SaqueAniversarioService.calcularImpactoRescisao(saldoBase, multa.valorMulta);
      saldoFinal = impacto.saldoFinal;
      multaFinal = impacto.multaFinal;
    }

    // 6. Doença Grave
    let resultadoDoencaGrave: ResultadoDoencaGrave | null = null;
    if (doencaGrave) {
      resultadoDoencaGrave = DoencaGraveService.calcular(saldoBase, doencaGrave);
      // Doença grave libera 100% do saldo independente de saque-aniversário
      saldoFinal = saldoBase;
    }

    // 7. Total
    const total = saldoFinal.add(multaFinal).add(decimoTerceiro).add(ferias);

    // 8. Correção estimada (diferença entre saldo corrigido e depósitos brutos)
    const depositosBrutos = depositoMensal.multiply(mesesTrabalhados);
    const correcaoEstimada = saldoBase.subtract(depositosBrutos);

    return {
      saldoBase,
      correcao,
      multa,
      decimoTerceiro,
      ferias,
      saqueAniversario: resultadoSaqueAniversario,
      doencaGrave: resultadoDoencaGrave,
      saldoFinal,
      multaFinal,
      total,
      detalhes: {
        depositoMensal,
        mesesTrabalhados,
        tipoRescisao,
        tipoContrato,
        saqueAniversarioAtivo: saqueAniversario,
        correcaoEstimada,
      },
    };
  }
}
