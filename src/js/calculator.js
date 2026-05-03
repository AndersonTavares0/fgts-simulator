/**
 * Módulo de Cálculo FGTS - FGTS Simulator
 * Responsável por todos os cálculos relacionados ao FGTS e verbas rescisórias
 * Projeto de Extensão Universitária - UNINTER
 *
 * Base legal: Lei 8.036/1990 e alterações posteriores
 */

const FGTSCalculator = (function() {
  'use strict';

  // Constantes legais
  const PERCENTUAL_FGTS = 8; // 8% do salário
  const PERCENTUAL_MULTA = 40; // 40% sobre saldo para dispensa sem justa causa
  const PERCENTUAL_SAUDE_EDUCACAO = 10; // Adicional para dispensa sem justa causa

  // NOTA: FGTS não possui teto de contribuição
  // Diferente do INSS, o FGTS incide sobre a totalidade da remuneração (Art. 15 da Lei 8.036/1990)
  // Mesmo executivos com salários elevados têm depósito integral de 8%

  /**
   * Calcula depósito mensal do FGTS com precisão de centavos
   * @param {number} salarioCents - Salário em centavos
   * @returns {number} - Depósito mensal em centavos
   */
  function calcularDepositoMensal(salarioCents) {
    if (!isValidSalario(salarioCents)) {
      return 0;
    }

    // FGTS incide sobre 100% do salário (sem teto)
    // Art. 15 da Lei 8.036/1990: base de cálculo é a totalidade da remuneração
    const salarioBase = salarioCents;

    // 8% do salário, arredondado para centavos
    return Math.round((salarioBase * PERCENTUAL_FGTS) / 100);
  }

  /**
   * Calcula total acumulado do FGTS considerando meses trabalhados
   * @param {number} salarioCents - Salário em centavos
   * @param {number} meses - Número de meses (pode ser fracionado)
   * @returns {number} - Total acumulado em centavos
   */
  function calcularSaldoFGTS(salarioCents, meses) {
    if (!isValidSalario(salarioCents) || meses <= 0) {
      return 0;
    }

    const depositoMensal = calcularDepositoMensal(salarioCents);

    // Para precisão máxima, calculamos mês a mês se for fracionado
    const mesesInteiros = Math.floor(meses);
    const fracaoMes = meses - mesesInteiros;

    const saldoMesesInteiros = depositoMensal * mesesInteiros;
    const saldoFracao = Math.round(depositoMensal * fracaoMes);

    return saldoMesesInteiros + saldoFracao;
  }

  /**
   * Calcula multa rescisória de 40% sobre o saldo do FGTS
   * @param {number} saldoCents - Saldo do FGTS em centavos
   * @param {string} motivo - Motivo da rescisão
   * @returns {number} - Multa em centavos
   */
  function calcularMultaRescisoria(saldoCents, motivo) {
    if (saldoCents <= 0) {
      return 0;
    }

    // Multa apenas para dispensa sem justa causa
    if (motivo !== 'dispensa_sem_causa') {
      return 0;
    }

    // 40% do saldo, arredondado para centavos
    return Math.round((saldoCents * PERCENTUAL_MULTA) / 100);
  }

  /**
   * Calcula 13º salário proporcional
   * @param {number} salarioCents - Salário em centavos
   * @param {number} mesesTrabalhados - Meses trabalhados no ano
   * @returns {number} - 13º proporcional em centavos
   */
  function calcularDecimoTerceiro(salarioCents, mesesTrabalhados) {
    if (!isValidSalario(salarioCents) || mesesTrabalhados <= 0) {
      return 0;
    }

    // Limite de 12 meses
    const mesesBase = Math.min(mesesTrabalhados, 12);

    // 13º = salário × (meses / 12)
    return Math.round((salarioCents * mesesBase) / 12);
  }

  /**
   * Calcula férias proporcionais + 1/3 constitucional
   * @param {number} salarioCents - Salário em centavos
   * @param {number} mesesTrabalhados - Meses trabalhados
   * @returns {number} - Férias + 1/3 em centavos
   */
  function calcularFeriasProporcionais(salarioCents, mesesTrabalhados) {
    if (!isValidSalario(salarioCents) || mesesTrabalhados <= 0) {
      return 0;
    }

    // Limite de 12 meses
    const mesesBase = Math.min(mesesTrabalhados, 12);

    // Férias proporcionais = salário × (meses / 12)
    const feriasProporcionais = Math.round((salarioCents * mesesBase) / 12);

    // 1/3 constitucional = férias / 3
    const tercoConstitucional = Math.round(feriasProporcionais / 3);

    return feriasProporcionais + tercoConstitucional;
  }

  /**
   * Calcula valores para modalidade Saque Aniversário
   * @param {number} saldoBaseCents - Saldo base do FGTS em centavos
   * @param {number} multaBaseCents - Multa base em centavos
   * @returns {{saldoFinal: number, multaFinal: number, valorSaque: number}}
   */
  function calcularSaqueAniversario(saldoBaseCents, multaBaseCents) {
    // No saque aniversário, mantém-se 60% do saldo na conta
    const saldoFinal = Math.round((saldoBaseCents * 60) / 100);
    const valorSaque = saldoBaseCents - saldoFinal;

    // Multa reduzida (aplica-se percentual diferente conforme regra Caixa)
    const multaFinal = Math.round((multaBaseCents * 50) / 100);

    return {
      saldoFinal,
      multaFinal,
      valorSaque
    };
  }

  /**
   * Valida se salário está dentro dos limites aceitáveis
   * @param {number} salarioCents - Salário em centavos
   * @returns {boolean}
   */
  function isValidSalario(salarioCents) {
    return typeof salarioCents === 'number' &&
           !isNaN(salarioCents) &&
           isFinite(salarioCents) &&
           salarioCents > 0;
  }

  /**
   * Calcula resumo completo da rescisão
   * @param {Object} params - Parâmetros do cálculo
   * @param {number} params.salarioCents - Salário em centavos
   * @param {number} params.mesesTrabalhados - Meses trabalhados
   * @param {string} params.motivo - Motivo da rescisão
   * @param {boolean} params.incluirDecimoTerceiro - Incluir 13º salário
   * @param {boolean} params.incluirFerias - Incluir férias proporcionais
   * @param {boolean} params.saqueAniversario - Usar modalidade saque aniversário
   * @returns {{
   *   saldoBase: number,
   *   multaBase: number,
   *   decimoTerceiro: number,
   *   ferias: number,
   *   saldoFinal: number,
   *   multaFinal: number,
   *   total: number,
   *   detalhes: Object
   * }}
   */
  function calcularRescisaoCompleta(params) {
    const {
      salarioCents,
      mesesTrabalhados,
      motivo,
      incluirDecimoTerceiro = false,
      incluirFerias = false,
      saqueAniversario = false
    } = params;

    // Cálculos base
    const saldoBase = calcularSaldoFGTS(salarioCents, mesesTrabalhados);
    const multaBase = calcularMultaRescisoria(saldoBase, motivo);

    // Verbas proporcionais
    const decimoTerceiro = incluirDecimoTerceiro
      ? calcularDecimoTerceiro(salarioCents, mesesTrabalhados)
      : 0;

    const ferias = incluirFerias
      ? calcularFeriasProporcionais(salarioCents, mesesTrabalhados)
      : 0;

    // Aplicar regras do saque aniversário se aplicável
    let saldoFinal = saldoBase;
    let multaFinal = multaBase;

    if (saqueAniversario) {
      const saqueCalc = calcularSaqueAniversario(saldoBase, multaBase);
      saldoFinal = saqueCalc.saldoFinal;
      multaFinal = saqueCalc.multaFinal;
    }

    // Total geral
    const total = saldoFinal + multaFinal + decimoTerceiro + ferias;

    return {
      saldoBase,
      multaBase,
      decimoTerceiro,
      ferias,
      saldoFinal,
      multaFinal,
      total,
      detalhes: {
        mesesTrabalhados,
        motivo,
        saqueAniversario,
        depositoMensalFGTS: calcularDepositoMensal(salarioCents),
        tetoAplicado: false // FGTS não possui teto de contribuição
      }
    };
  }

  // API pública do módulo
  return {
    calcularDepositoMensal,
    calcularSaldoFGTS,
    calcularMultaRescisoria,
    calcularDecimoTerceiro,
    calcularFeriasProporcionais,
    calcularSaqueAniversario,
    calcularRescisaoCompleta,
    isValidSalario,
    // Constantes exportadas
    PERCENTUAL_FGTS,
    PERCENTUAL_MULTA
  };
})();

// Export para ambientes que suportam modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FGTSCalculator;
}