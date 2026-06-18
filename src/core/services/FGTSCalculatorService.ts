/**
 * Service: FGTSCalculatorService
 * Orquestrador central — coordena todos os serviços de domínio para produzir
 * o resultado completo da rescisão trabalhista.
 *
 * Este é o ponto de entrada principal para todo cálculo financeiro.
 */

import { Money, TipoContrato, TipoRescisao } from '../types';
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
  [TipoContrato.DOMESTICO]: 8,
} satisfies Record<TipoContrato, number>;

const ALIQUOTA_MULTA_DOMESTICO = 3.2;

const PERCENTUAL_SALDO_DISPONIVEL = {
  [TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA]: 100,
  [TipoRescisao.ACORDO_COMUM]: 80,
  [TipoRescisao.CULPA_RECIPROCA]: 100,
  [TipoRescisao.DOENCA_GRAVE]: 100,
  [TipoRescisao.APOSENTADORIA]: 100,
  [TipoRescisao.FALECIMENTO]: 100,
  [TipoRescisao.DEMISSAO_VOLUNTARIA]: 0,
  [TipoRescisao.JUSTA_CAUSA]: 0,
} satisfies Record<TipoRescisao, number>;

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
   * Calcula 13º salário proporcional (Lei 4.090/62, Art. 146 CLT).
   *
   * IMPORTANTE: O parâmetro `mesesTrabalhados` deve ser pré-processado com a
   * regra dos 15 dias (fração ≥ 15 dias = 1 avo adicional), conforme
   * ContratoTrabalho.calcularMesesTrabalhados().
   *
   * @param salarioBruto Salário bruto
   * @param mesesTrabalhados Meses trabalhados no ano, já ajustados pela regra dos 15 dias (máximo 12)
   */
  static calcularDecimoTerceiro(salarioBruto: Money, mesesTrabalhados: number): Money {
    if (!salarioBruto.isPositive() || mesesTrabalhados <= 0) return Money.zero();
    const mesesBase = Math.min(mesesTrabalhados, 12);
    return salarioBruto.multiply(mesesBase).divide(12);
  }

  /**
   * Calcula férias proporcionais + 1/3 constitucional (Art. 146 CLT, Art. 7º, XVII CF/88).
   *
   * IMPORTANTE: O parâmetro `mesesTrabalhados` deve ser pré-processado com a
   * regra dos 15 dias (fração ≥ 15 dias = 1 avo adicional), conforme
   * ContratoTrabalho.calcularMesesTrabalhados().
   *
   * @param salarioBruto Salário bruto
   * @param mesesTrabalhados Meses trabalhados, já ajustados pela regra dos 15 dias (máximo 12)
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

    // 3. Multa rescisória
    let multa: import('../types').ResultadoMulta;
    if (tipoContrato === TipoContrato.DOMESTICO) {
      const valorAcumuladoMulta = salarioBruto
        .percentage(ALIQUOTA_MULTA_DOMESTICO)
        .multiply(mesesTrabalhados);

      // Art. 22, LC 150/2015: reserva de indenização (3,2% mensal).
      // Culpa recíproca usa interpretação analógica do Art. 484 CLT: 50% da indenização.
      let valorMultaDomestico: Money;
      let fundamentoDomestico: string;

      if (tipoRescisao === TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA) {
        valorMultaDomestico = valorAcumuladoMulta;
        fundamentoDomestico = 'Art. 22, LC 150/2015 — 100% da reserva de indenização';
      } else if (tipoRescisao === TipoRescisao.ACORDO_COMUM) {
        valorMultaDomestico = valorAcumuladoMulta.percentage(50);
        fundamentoDomestico = 'Art. 22 c/c Art. 484-A CLT — 50% da reserva de indenização';
      } else if (tipoRescisao === TipoRescisao.CULPA_RECIPROCA) {
        valorMultaDomestico = valorAcumuladoMulta.percentage(50);
        fundamentoDomestico =
          'Art. 22, LC 150/2015 c/c Art. 484, CLT — 50% da reserva de indenização (interpretação analógica)';
      } else {
        valorMultaDomestico = Money.zero();
        fundamentoDomestico = 'Art. 22, §2º, LC 150/2015 — Reserva retorna ao empregador';
      }

      multa = {
        percentualAplicado: 0,
        valorMulta: valorMultaDomestico,
        baseCalculo: valorAcumuladoMulta,
        fundamentoLegal: fundamentoDomestico,
      };
    } else {
      const baseCalculoMulta = params.depositoHistoricoTotal ?? saldoBase;
      multa = MultaService.calcular(baseCalculoMulta, tipoRescisao);
    }

    // 4. Verbas proporcionais
    const decimoTerceiro = incluirDecimoTerceiro
      ? this.calcularDecimoTerceiro(salarioBruto, mesesTrabalhados)
      : Money.zero();

    const ferias = incluirFerias
      ? this.calcularFeriasProporcionais(salarioBruto, mesesTrabalhados)
      : Money.zero();

    // 5. Saldo disponível para saque conforme modalidade de rescisão.
    const percentualSaldoDisponivel = PERCENTUAL_SALDO_DISPONIVEL[tipoRescisao];
    let saldoFinal = saldoBase.percentage(percentualSaldoDisponivel);
    let saldoRetido = saldoBase.subtract(saldoFinal);

    // 6. Saque-Aniversário
    let resultadoSaqueAniversario: ResultadoSaqueAniversario | null = null;
    let multaFinal = multa.valorMulta;

    if (saqueAniversario) {
      resultadoSaqueAniversario = SaqueAniversarioService.calcularParcela(saldoBase);
      const impacto = SaqueAniversarioService.calcularImpactoRescisao(saldoBase, multa.valorMulta);
      saldoFinal = impacto.saldoFinal;
      saldoRetido = saldoBase;
      multaFinal = impacto.multaFinal;
    }

    // 7. Doença Grave
    let resultadoDoencaGrave: ResultadoDoencaGrave | null = null;
    if (doencaGrave) {
      resultadoDoencaGrave = DoencaGraveService.calcular(saldoBase, doencaGrave);
      // Doença grave libera 100% do saldo independente de saque-aniversário
      saldoFinal = saldoBase;
      saldoRetido = Money.zero();
    }

    // 8. Total
    const total = saldoFinal.add(multaFinal).add(decimoTerceiro).add(ferias);

    // 9. Correção estimada (diferença entre saldo corrigido e depósitos brutos)
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
      saldoRetido,
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
