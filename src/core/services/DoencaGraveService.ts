/**
 * Service: DoencaGraveService
 * Saque integral do FGTS por doença grave do trabalhador ou dependente.
 *
 * Regras:
 *  - Liberação de 100% do saldo da conta vinculada
 *  - Condições qualificadoras: câncer, HIV/AIDS, doença terminal
 *  - Extensível a doenças graves conforme portaria ministerial
 *
 * Base legal: Lei 8.036/1990, Art. 20, inciso XIII
 */

import { Money, TipoDoencaGrave, ResultadoDoencaGrave } from '../types';

/** Mapeamento de doenças graves com fundamentação legal específica */
const DOENCAS_QUALIFICADAS: Record<
  TipoDoencaGrave,
  { descricao: string; fundamento: string }
> = {
  [TipoDoencaGrave.CANCER]: {
    descricao: 'Neoplasia maligna (Câncer)',
    fundamento: 'Lei 8.036/90, Art. 20, XIII — Portaria Interministerial MPAS/MS nº 2.998/2001',
  },
  [TipoDoencaGrave.HIV_AIDS]: {
    descricao: 'HIV/AIDS (Portador do vírus)',
    fundamento: 'Lei 8.036/90, Art. 20, XIII — comprovação por laudo médico pericial',
  },
  [TipoDoencaGrave.DOENCA_TERMINAL]: {
    descricao: 'Doença em estágio terminal',
    fundamento: 'Lei 8.036/90, Art. 20, XIII — laudo de junta médica oficial',
  },
  [TipoDoencaGrave.OUTRA_GRAVE]: {
    descricao: 'Outra doença grave conforme rol ministerial',
    fundamento: 'Lei 8.036/90, Art. 20, XIII — conforme portaria vigente',
  },
};

export class DoencaGraveService {
  /**
   * Calcula o saque integral por doença grave.
   * O trabalhador tem direito a 100% do saldo do FGTS.
   *
   * @param saldoFGTS Saldo total do FGTS
   * @param tipoDoenca Tipo da doença grave qualificadora
   */
  static calcular(saldoFGTS: Money, tipoDoenca: TipoDoencaGrave): ResultadoDoencaGrave {
    const info = DOENCAS_QUALIFICADAS[tipoDoenca];

    return {
      saldoDisponivel: saldoFGTS, // 100% liberado
      percentualLiberado: 100,
      tipoDoenca,
      fundamentoLegal: info?.fundamento ?? 'Lei 8.036/90, Art. 20, XIII',
    };
  }

  /** Verifica se o tipo de doença é qualificada para saque */
  static isDoencaQualificada(tipo: TipoDoencaGrave): boolean {
    return tipo in DOENCAS_QUALIFICADAS;
  }

  /** Retorna a descrição da doença */
  static getDescricao(tipo: TipoDoencaGrave): string {
    return DOENCAS_QUALIFICADAS[tipo]?.descricao ?? 'Doença grave não especificada';
  }
}
