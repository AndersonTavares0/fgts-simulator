import { Money } from '../types';
import type { ResultadoINSS } from '../types';

/**
 * INSS 2026 faixas com parcela a deduzir (alíquota sobre o total - dedução)
 * Fonte: Portaria Interministerial MPS/MF Nº 13, de 09/01/2026
 * Vigência: janeiro de 2026
 */
interface FaixaINSS {
  limiteInferior: number;
  limiteSuperior: number;
  aliquota: number;
  parcelaDeduzir: number;
  descricao: string;
}

const FAIXAS_INSS_2026: FaixaINSS[] = [
  {
    limiteInferior: 0,
    limiteSuperior: 1621.0,
    aliquota: 0.075,
    parcelaDeduzir: 0,
    descricao: '1ª faixa (7,5%)',
  },
  {
    limiteInferior: 1621.01,
    limiteSuperior: 2902.84,
    aliquota: 0.09,
    parcelaDeduzir: 24.32,
    descricao: '2ª faixa (9%)',
  },
  {
    limiteInferior: 2902.85,
    limiteSuperior: 4354.27,
    aliquota: 0.12,
    parcelaDeduzir: 111.4,
    descricao: '3ª faixa (12%)',
  },
  {
    limiteInferior: 4354.28,
    limiteSuperior: 8475.55,
    aliquota: 0.14,
    parcelaDeduzir: 198.49,
    descricao: '4ª faixa (14%)',
  },
];

const TETO_INSS_2026 = 8475.55;
const FUNDAMENTO_LEGAL = 'Art. 20, Lei 8.212/91 c/c Portaria Interministerial MPS/MF Nº 13/2026';

export class INSSService {
  /**
   * Calcula a contribuição INSS sobre o salário bruto usando tabela progressiva 2026.
   *
   * Método: aliquota máxima da faixa × salário - parcela a deduzir
   *
   * @param salarioBruto Salário bruto mensal
   */
  static calcular(salarioBruto: Money): ResultadoINSS {
    if (!salarioBruto.isPositive()) {
      return {
        salarioBruto: Money.zero(),
        aliquotaEfetiva: 0,
        valorINSS: Money.zero(),
        baseCalculo: Money.zero(),
        salarioLiquido: Money.zero(),
        faixaDescricao: 'Sem contribuição',
        fundamentoLegal: FUNDAMENTO_LEGAL,
      };
    }

    // Cap at teto do INSS
    const baseCalculoReais = Math.min(salarioBruto.reais, TETO_INSS_2026);
    const baseCalculo = Money.fromReais(baseCalculoReais);

    // Find applicable faixa
    const faixa = FAIXAS_INSS_2026.find(
      (f) => baseCalculoReais >= f.limiteInferior && baseCalculoReais <= f.limiteSuperior,
    );

    // Fallback to last faixa (teto)
    const faixaEfetiva = faixa ?? FAIXAS_INSS_2026[FAIXAS_INSS_2026.length - 1]!;

    // INSS = salário × aliquota - parcelaDeduzir
    const valorBruto = baseCalculo.multiply(faixaEfetiva.aliquota);
    const deducao = Money.fromReais(faixaEfetiva.parcelaDeduzir);
    const valorINSS = valorBruto.subtract(deducao);

    const aliquotaEfetiva = baseCalculoReais > 0
      ? valorINSS.reais / baseCalculoReais
      : 0;

    const salarioLiquido = salarioBruto.subtract(valorINSS);

    return {
      salarioBruto,
      aliquotaEfetiva: Math.round(aliquotaEfetiva * 10000) / 10000,
      valorINSS,
      baseCalculo,
      salarioLiquido,
      faixaDescricao: faixaEfetiva.descricao,
      fundamentoLegal: FUNDAMENTO_LEGAL,
    };
  }
}
