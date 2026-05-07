/**
 * Service: MultaService
 * Cálculo de multa rescisória do FGTS conforme modalidade de rescisão.
 *
 * Base legal:
 *  - 40% — Art. 18, §1º, Lei 8.036/1990 (dispensa sem justa causa)
 *  - 20% — Art. 484-A, §1º, CLT (acordo comum / Reforma 2017)
 *  - 20% — Art. 484 CLT (culpa recíproca)
 *  -  0% — Demissão voluntária, justa causa
 */

import { TipoRescisao, Money, ResultadoMulta } from '../types';

/** Mapeamento exaustivo: TipoRescisao → percentual de multa e base legal */
const REGRAS_MULTA: Record<
  TipoRescisao,
  { percentual: number; fundamento: string }
> = {
  [TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA]: {
    percentual: 40,
    fundamento: 'Art. 18, §1º, Lei 8.036/1990',
  },
  [TipoRescisao.ACORDO_COMUM]: {
    percentual: 20,
    fundamento: 'Art. 484-A, §1º, CLT (Reforma Trabalhista 2017)',
  },
  [TipoRescisao.CULPA_RECIPROCA]: {
    percentual: 20,
    fundamento: 'Art. 484, CLT — Súmula 14 TST',
  },
  [TipoRescisao.DOENCA_GRAVE]: {
    percentual: 40,
    fundamento: 'Art. 18, §1º c/c Art. 20, XIII, Lei 8.036/1990',
  },
  [TipoRescisao.APOSENTADORIA]: {
    percentual: 40,
    fundamento: 'Art. 18, §1º, Lei 8.036/1990',
  },
  [TipoRescisao.FALECIMENTO]: {
    percentual: 40,
    fundamento: 'Art. 18, §1º c/c Art. 20, IV, Lei 8.036/1990',
  },
  [TipoRescisao.DEMISSAO_VOLUNTARIA]: {
    percentual: 0,
    fundamento: 'Art. 477, CLT — Pedido do empregado',
  },
  [TipoRescisao.JUSTA_CAUSA]: {
    percentual: 0,
    fundamento: 'Art. 482, CLT — Falta grave do empregado',
  },
};

export class MultaService {
  /**
   * Calcula multa rescisória sobre o saldo do FGTS
   *
   * @param saldoFGTS Saldo total (corrigido) do FGTS
   * @param tipoRescisao Modalidade da rescisão contratual
   */
  static calcular(saldoFGTS: Money, tipoRescisao: TipoRescisao): ResultadoMulta {
    const regra = REGRAS_MULTA[tipoRescisao];

    if (!regra) {
      return {
        percentualAplicado: 0,
        valorMulta: Money.zero(),
        baseCalculo: saldoFGTS,
        fundamentoLegal: 'Tipo de rescisão não reconhecido',
      };
    }

    const valorMulta =
      regra.percentual > 0 ? saldoFGTS.percentage(regra.percentual) : Money.zero();

    return {
      percentualAplicado: regra.percentual,
      valorMulta,
      baseCalculo: saldoFGTS,
      fundamentoLegal: regra.fundamento,
    };
  }

  /** Verifica se o tipo de rescisão dá direito à multa */
  static temDireitoMulta(tipoRescisao: TipoRescisao): boolean {
    return (REGRAS_MULTA[tipoRescisao]?.percentual ?? 0) > 0;
  }

  /** Retorna o percentual de multa para um tipo de rescisão */
  static getPercentual(tipoRescisao: TipoRescisao): number {
    return REGRAS_MULTA[tipoRescisao]?.percentual ?? 0;
  }
}
