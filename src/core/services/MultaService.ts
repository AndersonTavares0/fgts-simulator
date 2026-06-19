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

import { TipoRescisao, Money } from '../types';
import type { ResultadoMulta } from '../types';

/** Mapeamento exaustivo: TipoRescisao → percentual de multa e base legal */
const REGRAS_MULTA = {
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
    percentual: 0,
    fundamento: 'Art. 20, XI/XIII/XIV, Lei 8.036/90 — Saque integral (isento de multa patronal)',
  },
  [TipoRescisao.APOSENTADORIA]: {
    percentual: 0,
    fundamento: 'Art. 20, III, Lei 8.036/90 — Saque integral (isento de multa patronal)',
  },
  [TipoRescisao.FALECIMENTO]: {
    percentual: 0,
    fundamento: 'Art. 20, IV, Lei 8.036/90 — Saque por dependentes (isento de multa patronal)',
  },
  [TipoRescisao.DEMISSAO_VOLUNTARIA]: {
    percentual: 0,
    fundamento: 'Art. 477, CLT — Pedido do empregado',
  },
  [TipoRescisao.JUSTA_CAUSA]: {
    percentual: 0,
    fundamento: 'Art. 482, CLT — Falta grave do empregado',
  },
} satisfies Record<TipoRescisao, { percentual: number; fundamento: string }>;

export class MultaService {
  /**
   * Calcula multa rescisória sobre o saldo do FGTS
   *
   * @param saldoFGTS Saldo total (corrigido) do FGTS
   * @param tipoRescisao Modalidade da rescisão contratual
   */
  static calcular(saldoFGTS: Money, tipoRescisao: TipoRescisao): ResultadoMulta {
    const regra = REGRAS_MULTA[tipoRescisao];
    const valorMulta = regra.percentual > 0 ? saldoFGTS.percentage(regra.percentual) : Money.zero();

    return {
      percentualAplicado: regra.percentual,
      valorMulta,
      baseCalculo: saldoFGTS,
      fundamentoLegal: regra.fundamento,
    };
  }
}
