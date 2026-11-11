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

  /** Avos pendentes informados; não derivar da duração total do vínculo. */
  static calcularDecimoTerceiro(salarioBruto: Money, avos: number): Money {
    this.validarAvos(avos);
    return salarioBruto.isPositive() ? salarioBruto.multiply(avos).divide(12) : Money.zero();
  }

  /** Férias proporcionais + 1/3, sem férias vencidas ou outras verbas. */
  static calcularFeriasProporcionais(salarioBruto: Money, avos: number): Money {
    this.validarAvos(avos);
    if (!salarioBruto.isPositive()) return Money.zero();
    const ferias = salarioBruto.multiply(avos).divide(12);
    return ferias.add(ferias.divide(3));
  }

  private static validarAvos(avos: number): void {
    if (!Number.isInteger(avos) || avos < 0 || avos > 12) {
      throw new Error('Avos pendentes devem ser inteiros entre 0 e 12.');
    }
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
      avosDecimoTerceiro,
      avosFerias,
      cenarioCorrecao,
      periodosDeposito,
      remuneracoesDecimoTerceiro,
      saqueAniversario,
      doencaGrave,
      indicesCorrecao,
    } = params;

    this.validarAvos(avosDecimoTerceiro);
    this.validarAvos(avosFerias);
    // 1. Depósito mensal
    const depositoMensal = this.calcularDepositoMensal(salarioBruto, tipoContrato);

    // 2. Saldo com correção monetária (TR/IPCA + 3% a.a.)
    const correcao = CorrecaoMonetariaService.calcularSaldoComCorrecao(
      depositoMensal,
      mesesTrabalhados,
      indicesCorrecao,
      cenarioCorrecao,
      periodosDeposito,
      remuneracoesDecimoTerceiro?.map((remuneracao) =>
        this.calcularDepositoMensal(remuneracao, tipoContrato),
      ),
    );

    const saldoBase = correcao.saldoCorrigido;

    // 3. Multa rescisória
    let multa: import('../types').ResultadoMulta;
    if (tipoContrato === TipoContrato.DOMESTICO) {
      // Art. 22, §4º, LC 150/2015: a reserva segue a Lei 8.036/90, inclusive a
      // correção monetária e os juros do art. 13. Por isso não é soma nominal.
      const correcaoReserva = CorrecaoMonetariaService.calcularSaldoComCorrecao(
        salarioBruto.percentage(ALIQUOTA_MULTA_DOMESTICO),
        mesesTrabalhados,
        indicesCorrecao,
        cenarioCorrecao,
        periodosDeposito,
        remuneracoesDecimoTerceiro?.map((remuneracao) =>
          remuneracao.percentage(ALIQUOTA_MULTA_DOMESTICO),
        ),
      );
      const valorAcumuladoMulta = correcaoReserva.saldoCorrigido;

      // O eSocial orienta liberar metade da reserva no acordo e na culpa recíproca.
      let valorMultaDomestico: Money;
      let fundamentoDomestico: string;

      if (tipoRescisao === TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA) {
        valorMultaDomestico = valorAcumuladoMulta;
        fundamentoDomestico = 'Art. 22, LC 150/2015 — 100% da reserva de indenização';
      } else if (tipoRescisao === TipoRescisao.CULPA_RECIPROCA) {
        valorMultaDomestico = valorAcumuladoMulta.percentage(50);
        fundamentoDomestico = 'Art. 22, §2º, LC 150/2015 — metade da reserva';
      } else if (tipoRescisao === TipoRescisao.ACORDO_COMUM) {
        valorMultaDomestico = valorAcumuladoMulta.percentage(50);
        fundamentoDomestico = 'Art. 484-A, CLT — acordo doméstico; metade da reserva';
      } else {
        valorMultaDomestico = Money.zero();
        fundamentoDomestico =
          'Art. 22, LC 150/2015 — hipótese não prevista; reserva não liberada ao empregado';
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

    // 4. Verbas proporcionais. Justa causa não gera 13º nem férias proporcionais
    // (Súmula 171/TST; CLT 146, parágrafo único). Doença grave é hipótese de saque,
    // não de rescisão: as verbas só entram se o vínculo realmente terminou.
    const verbasRescisorias =
      tipoRescisao !== TipoRescisao.JUSTA_CAUSA && tipoRescisao !== TipoRescisao.DOENCA_GRAVE;
    const decimoTerceiro =
      verbasRescisorias && incluirDecimoTerceiro
        ? this.calcularDecimoTerceiro(salarioBruto, avosDecimoTerceiro)
        : Money.zero();

    const ferias =
      verbasRescisorias && incluirFerias
        ? this.calcularFeriasProporcionais(salarioBruto, avosFerias)
        : Money.zero();

    // 5. Saldo disponível conforme modalidade de rescisão.
    const percentualSaldoDisponivel = PERCENTUAL_SALDO_DISPONIVEL[tipoRescisao];
    let saldoFinal = saldoBase.percentage(percentualSaldoDisponivel);
    let saldoRetido = saldoBase.subtract(saldoFinal);

    // 6. Saque-Aniversário
    let resultadoSaqueAniversario: ResultadoSaqueAniversario | null = null;
    let multaFinal = multa.valorMulta;

    if (saqueAniversario) {
      resultadoSaqueAniversario = SaqueAniversarioService.calcularParcela(saldoBase);
      const impacto = SaqueAniversarioService.calcularImpactoRescisao(
        saldoBase,
        multa.valorMulta,
        tipoRescisao,
      );
      saldoFinal = impacto.saldoFinal;
      saldoRetido = saldoBase.subtract(saldoFinal);
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

    const correcaoEstimada = correcao.rendimentoTotal;

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
